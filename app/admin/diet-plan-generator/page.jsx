'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import {
    FileText, Download, Send, Sparkles, Plus, Trash2,
    User, Target, Scale, Eye,
    CheckCircle, AlertCircle, RefreshCw, ArrowLeft, Clock,
    RotateCcw, BookmarkPlus, Database, Save,
    Info, ChefHat, Utensils, Search, X,
    ShieldAlert, ChevronDown, ChevronUp, Edit3, Undo2,
    Maximize2, Minimize2, Sliders,
    Dumbbell, Calculator, Ruler, Lock, Unlock, ArrowLeftRight, Users
} from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { createClient } from '@/utils/supabase/client';
import DietPlanPdfDocument from '@/components/admin/pdf/DietPlanPdfDocument';

// Dynamic import for React-PDF Viewer to prevent SSR issues
const PDFViewer = dynamic(() => import('@react-pdf/renderer').then(mod => mod.PDFViewer), {
    ssr: false,
    loading: () => (
        <div className="h-[650px] w-full flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-200">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium text-para">Rendering Live PDF Preview...</p>
        </div>
    )
});



const DIET_PLAN_DRAFT_STORAGE_KEY = 'tdc_diet_plan_form_draft_v1';
const AUTO_SAVE_DELAY_MS = 2000;

const DEFAULT_CALC_CONFIG = {
    heightCm: '',
    heightInches: '',
    heightFeet: '',
    heightRemInches: '',
    ibwOffset: 105, // 100 (Male) | 105 (Female) | custom in range
    calMultiplier: 25, // 20-30 kcal per kg IBW (or custom)
    proteinPct: 20, // 15-25% of calories / 4
    carbsPct: 60, // 40-60% of calories / 4
    fatsPct: 20, // 12-20% (or up to 30%) of calories / 9
    fieldsLocked: false, // Editable by default, optional lock toggle
    showCalculator: false,
};

const EMPTY_NEW_RECIPE = {
    name: '',
    category: 'Breakfast',
    prep_time: '',
    cook_time: '',
    servings: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    fiber: '',
    ingredients: [''],
    instructions: [''],
    dietitian_tip: '',
};

const roundOne = (num) => Math.round(num * 10) / 10;

const parseNumericValue = (val) => {
    if (val === null || val === undefined || val === '') return NaN;
    const cleaned = String(val).replace(/,/g, '');
    const match = cleaned.match(/-?\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : NaN;
};

const computeMacrosFromCalories = (caloriesNum, pPct, cPct, fPct) => {
    if (!Number.isFinite(caloriesNum) || caloriesNum <= 0) return null;
    const pNum = Number(pPct) || 0;
    const cNum = Number(cPct) || 0;
    const fNum = Number(fPct) || 0;
    return {
        protein: `${Math.max(0, Math.round((caloriesNum * (pNum / 100)) / 4))}g`,
        carbs: `${Math.max(0, Math.round((caloriesNum * (cNum / 100)) / 4))}g`,
        fats: `${Math.max(0, Math.round((caloriesNum * (fNum / 100)) / 9))}g`,
    };
};

const computeChainFromHeightCm = (cmNum, cfg) => {
    if (!Number.isFinite(cmNum) || cmNum <= 0) return {};
    const totalIn = roundOne(cmNum / 2.54);
    const updates = {
        client_height: `${roundOne(cmNum)} cm (${totalIn} in)`,
    };
    const offset = Number(cfg.ibwOffset);
    if (Number.isFinite(offset)) {
        const ibw = roundOne(cmNum - offset);
        if (ibw >= 15) {
            updates.target_weight = `${ibw} kg`;
            const mult = Number(cfg.calMultiplier);
            if (Number.isFinite(mult) && mult > 0) {
                const cals = Math.round(ibw * mult);
                updates.calories = String(cals);
                const macros = computeMacrosFromCalories(
                    cals,
                    cfg.proteinPct,
                    cfg.carbsPct,
                    cfg.fatsPct
                );
                if (macros) {
                    updates.protein = macros.protein;
                    updates.carbs = macros.carbs;
                    updates.fats = macros.fats;
                }
            }
        }
    }
    return updates;
};

const hasDietDraftContent = (data) => {
    if (!data || typeof data !== 'object') return false;
    const textFields = [
        'client_name',
        'client_age',
        'start_weight',
        'client_height',
        'food_habits',
        'lifestyle',
        'medical_conditions',
        'medication',
        'health_abuses',
        'client_phone',
        'plan_title',
        'goal',
        'target_weight',
        'end_date',
        'next_review_date',
        'calories',
        'protein',
        'carbs',
        'fats',
        'fibre',
        'water',
        'steps',
        'dietitian_note',
        'special_instructions',
        'special_instructions_warning',
    ];
    if (textFields.some((key) => String(data[key] || '').trim() !== '')) return true;
    if (
        String(data?.calc_config?.heightCm || '').trim() !== '' ||
        String(data?.calc_config?.heightInches || '').trim() !== ''
    ) {
        return true;
    }
    const arrayFields = [
        'measurements',
        'meals',
        'supplements',
        'workouts',
        'guidelines',
        'donts',
        'recipes',
    ];
    if (arrayFields.some((key) => Array.isArray(data[key]) && data[key].length > 0)) return true;
    if (data.show_special_instructions || data.pdf_theme === 'senior') return true;
    return false;
};

const EMPTY_FORM_STATE = {
    client_name: '',
    client_age: '',
    start_weight: '',
    client_height: '',
    food_habits: '',
    lifestyle: '',
    medical_conditions: '',
    medication: '',
    health_abuses: '',
    client_phone: '',
    plan_title: '',
    goal: '',
    target_weight: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    next_review_date: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    fibre: '',
    water: '',
    steps: '',
    measurements: [],
    dietitian_name: 'Dt. Sabah Ghare',
    dietitian_note: '',
    meals: [],
    supplements: [],
    workouts: [],
    guidelines: [],
    donts: [],
    recipes: [],
    pdf_theme: 'clinical',
    show_special_instructions: false,
    special_instructions_title: 'Special Clinical Instructions & Edge-Case Directives',
    special_instructions_badge: 'EDGE CASE ADVISORY',
    special_instructions_theme: 'emerald',
    special_instructions_style: 'callout',
    special_instructions: '',
    special_instructions_warning: '',
    special_instructions_verified: true,
    calc_config: DEFAULT_CALC_CONFIG,
};

function AdminDietPlanGeneratorContent() {
    const supabase = useMemo(() => createClient(), []);
    const searchParams = useSearchParams();

    // Form State (Starts Empty On Load)
    const [formData, setFormData] = useState(EMPTY_FORM_STATE);

    // Collapsible Sections State (Core sections open; optional sections collapsed until needed)
    const [collapsed, setCollapsed] = useState({
        profile: false,       // 1. Client Profile (open)
        targets: false,       // 2. Targets (open)
        measurements: true,   // 3. Body Measurements (optional)
        meals: false,         // 4. Meals (open)
        supplements: true,    // 5. Supplements (optional)
        workouts: true,       // 6. Workouts (optional)
        special: true,        // 7. Special Directives (optional)
        rules: true,          // 8. Rules (optional)
        recipes: true         // 9. Recipes (optional)
    });

    const [allExpanded, setAllExpanded] = useState(false);
    const [showHeightConverter, setShowHeightConverter] = useState(false);

    const toggleSection = (key) => {
        setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleAllSections = () => {
        const nextOpen = !allExpanded;
        setAllExpanded(nextOpen);
        setCollapsed({
            profile: !nextOpen,
            targets: !nextOpen,
            measurements: !nextOpen,
            meals: !nextOpen,
            supplements: !nextOpen,
            workouts: !nextOpen,
            special: !nextOpen,
            rules: !nextOpen,
            recipes: !nextOpen,
        });
    };

    // Soft-Editing State for Attached Recipes
    const [editingRecipeId, setEditingRecipeId] = useState(null);

    // Dynamic Database Templates State + Popover
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [showPresetsPopover, setShowPresetsPopover] = useState(false);
    const presetsMenuRef = useRef(null);

    // Dynamic Recipes State (On-demand Search)
    const [availableRecipes, setAvailableRecipes] = useState([]);
    const [loadingRecipes, setLoadingRecipes] = useState(false);
    const [recipeSearch, setRecipeSearch] = useState('');
    const [recipeCategoryFilter, setRecipeCategoryFilter] = useState('All');

    // Inline Create New Recipe Modal State
    const [isNewRecipeModalOpen, setIsNewRecipeModalOpen] = useState(false);
    const [newRecipeForm, setNewRecipeForm] = useState(EMPTY_NEW_RECIPE);
    const [savingNewRecipe, setSavingNewRecipe] = useState(false);
    const [saveNewRecipeToBank, setSaveNewRecipeToBank] = useState(true);
    const [newRecipeBulkIngOpen, setNewRecipeBulkIngOpen] = useState(false);
    const [newRecipeBulkIngText, setNewRecipeBulkIngText] = useState('');
    const [newRecipeBulkInstOpen, setNewRecipeBulkInstOpen] = useState(false);
    const [newRecipeBulkInstText, setNewRecipeBulkInstText] = useState('');

    // UI state
    const [activeView, setActiveView] = useState('editor'); // 'editor' | 'preview' | 'split'
    const [generating, setGenerating] = useState(false);
    const [previewKey, setPreviewKey] = useState(1);

    // ─── Client 1-to-Many DB State ───
    const [allClients, setAllClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [loadedPlanRecord, setLoadedPlanRecord] = useState(null);
    const [savingToClientDb, setSavingToClientDb] = useState(false);
    const [showSaveMenu, setShowSaveMenu] = useState(false);
    const saveMenuRef = useRef(null);
    const mobileSaveMenuRef = useRef(null);
    const dbMetaRef = useRef({ selectedClient: null, loadedPlanRecord: null });

    useEffect(() => {
        dbMetaRef.current = { selectedClient, loadedPlanRecord };
    }, [selectedClient, loadedPlanRecord]);

    // Close popovers on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (presetsMenuRef.current && !presetsMenuRef.current.contains(e.target)) {
                setShowPresetsPopover(false);
            }
            const inDesktopSave = saveMenuRef.current?.contains(e.target);
            const inMobileSave = mobileSaveMenuRef.current?.contains(e.target);
            if (!inDesktopSave && !inMobileSave) {
                setShowSaveMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ─── Delayed LocalStorage Auto-Save & Restore ───
    const isDraftHydratedRef = useRef(false);
    const pendingHydratedDataRef = useRef(null);
    const lastSavedDataRef = useRef(EMPTY_FORM_STATE);
    const latestFormDataRef = useRef(EMPTY_FORM_STATE);
    const hasPendingSaveRef = useRef(false);
    const autoSaveTimerRef = useRef(null);

    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'restored' | 'error'
    const [lastSavedAt, setLastSavedAt] = useState(null);

    const lastSavedTimeLabel = useMemo(() => {
        if (!lastSavedAt) return '';
        const parsedDate = new Date(lastSavedAt);
        if (Number.isNaN(parsedDate.getTime())) return '';
        return parsedDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    }, [lastSavedAt]);

    const persistDietDraft = useCallback((dataToSave) => {
        try {
            const savedAt = new Date().toISOString();
            window.localStorage.setItem(
                DIET_PLAN_DRAFT_STORAGE_KEY,
                JSON.stringify({
                    version: 1,
                    savedAt,
                    data: dataToSave,
                    dbMeta: dbMetaRef.current,
                })
            );
            lastSavedDataRef.current = dataToSave;
            hasPendingSaveRef.current = false;
            return { ok: true, savedAt };
        } catch (err) {
            console.warn('Unable to auto-save diet plan draft to localStorage:', err);
            return { ok: false, savedAt: null };
        }
    }, []);

    // Load saved diet plan draft on form reopen / page reload (unless opening a specific client/plan from URL)
    useEffect(() => {
        const hasUrlTarget = Boolean(
            searchParams?.get('planId') || searchParams?.get('clientId')
        );

        if (!hasUrlTarget) {
            try {
                const raw = window.localStorage.getItem(DIET_PLAN_DRAFT_STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    const draft =
                        parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed;
                    if (parsed?.dbMeta && typeof parsed.dbMeta === 'object') {
                        if (parsed.dbMeta.selectedClient) {
                            setSelectedClient(parsed.dbMeta.selectedClient);
                        }
                        if (parsed.dbMeta.loadedPlanRecord) {
                            setLoadedPlanRecord(parsed.dbMeta.loadedPlanRecord);
                        }
                    }
                    if (draft && typeof draft === 'object' && hasDietDraftContent(draft)) {
                        const restored = {
                            ...EMPTY_FORM_STATE,
                            ...draft,
                            measurements: Array.isArray(draft.measurements)
                                ? draft.measurements
                                : [],
                            meals: Array.isArray(draft.meals) ? draft.meals : [],
                            supplements: Array.isArray(draft.supplements)
                                ? draft.supplements
                                : [],
                            workouts: Array.isArray(draft.workouts) ? draft.workouts : [],
                            guidelines: Array.isArray(draft.guidelines)
                                ? draft.guidelines
                                : [],
                            donts: Array.isArray(draft.donts) ? draft.donts : [],
                            recipes: Array.isArray(draft.recipes) ? draft.recipes : [],
                            calc_config: {
                                ...DEFAULT_CALC_CONFIG,
                                ...(draft.calc_config &&
                                typeof draft.calc_config === 'object'
                                    ? draft.calc_config
                                    : {}),
                            },
                        };

                        lastSavedDataRef.current = restored;
                        latestFormDataRef.current = restored;
                        pendingHydratedDataRef.current = restored;

                        setFormData(restored);
                        setCollapsed((prev) => ({
                            ...prev,
                            measurements:
                                restored.measurements.length > 0 ? false : prev.measurements,
                            supplements:
                                restored.supplements.length > 0 ? false : prev.supplements,
                            workouts:
                                restored.workouts.length > 0 ? false : prev.workouts,
                            special: restored.show_special_instructions
                                ? false
                                : prev.special,
                            rules:
                                restored.guidelines.length > 0 || restored.donts.length > 0
                                    ? false
                                    : prev.rules,
                            recipes:
                                restored.recipes.length > 0 ? false : prev.recipes,
                        }));
                        setPreviewKey((k) => k + 1);
                        if (parsed?.savedAt) {
                            setLastSavedAt(parsed.savedAt);
                        }
                        setSaveStatus('restored');
                    }
                }
            } catch (err) {
                console.warn('Failed to restore diet plan draft from localStorage:', err);
            }
        }

        isDraftHydratedRef.current = true;

        const flushPendingSave = () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
                autoSaveTimerRef.current = null;
            }
            if (hasPendingSaveRef.current) {
                persistDietDraft(latestFormDataRef.current);
            }
        };

        window.addEventListener('beforeunload', flushPendingSave);
        window.addEventListener('pagehide', flushPendingSave);

        return () => {
            window.removeEventListener('beforeunload', flushPendingSave);
            window.removeEventListener('pagehide', flushPendingSave);
            flushPendingSave();
        };
    }, [persistDietDraft, searchParams]);

    // Save form details with a 2-second time delay between consecutive saves
    useEffect(() => {
        if (!isDraftHydratedRef.current) return;

        if (pendingHydratedDataRef.current !== null) {
            if (formData === pendingHydratedDataRef.current) {
                pendingHydratedDataRef.current = null;
            }
            return;
        }

        if (formData === lastSavedDataRef.current) return;

        latestFormDataRef.current = formData;
        hasPendingSaveRef.current = true;
        setSaveStatus('saving');

        if (!autoSaveTimerRef.current) {
            autoSaveTimerRef.current = setTimeout(() => {
                autoSaveTimerRef.current = null;
                const result = persistDietDraft(latestFormDataRef.current);
                if (result.ok) {
                    setLastSavedAt(result.savedAt);
                    setSaveStatus('saved');
                } else {
                    setSaveStatus('error');
                }
            }, AUTO_SAVE_DELAY_MS);
        }
    }, [formData, persistDietDraft]);

    // ─── Fetch Clients for Autocomplete & Hydrate ?clientId / ?planId from Client Details Page ───
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const { data } = await supabase
                    .from('clients')
                    .select('id, full_name, phone, age, height, initial_goals')
                    .order('updated_at', { ascending: false })
                    .limit(300);
                if (active && Array.isArray(data)) {
                    setAllClients(data);
                }
            } catch {
                // Ignore silently
            }
        })();
        return () => {
            active = false;
        };
    }, [supabase]);

    const applyRecordToForm = useCallback((record, ownerClient) => {
        const snap =
            record?.plan_data && typeof record.plan_data === 'object'
                ? record.plan_data
                : {};
        const hydrated = {
            ...EMPTY_FORM_STATE,
            ...snap,
            client_name: snap.client_name || ownerClient?.full_name || '',
            client_phone: snap.client_phone || ownerClient?.phone || '',
            plan_title: snap.plan_title || record?.plan_title || '',
            goal: snap.goal ?? record?.goal ?? '',
            calories: snap.calories ?? record?.calories ?? '',
            start_date:
                snap.start_date ||
                record?.start_date ||
                new Date().toISOString().split('T')[0],
            end_date: snap.end_date || record?.end_date || '',
            pdf_theme: snap.pdf_theme || record?.pdf_theme || 'clinical',
            measurements: Array.isArray(snap.measurements)
                ? JSON.parse(JSON.stringify(snap.measurements))
                : [],
            meals: Array.isArray(snap.meals)
                ? JSON.parse(JSON.stringify(snap.meals))
                : [],
            supplements: Array.isArray(snap.supplements)
                ? JSON.parse(JSON.stringify(snap.supplements))
                : [],
            workouts: Array.isArray(snap.workouts)
                ? JSON.parse(JSON.stringify(snap.workouts))
                : [],
            guidelines: Array.isArray(snap.guidelines)
                ? JSON.parse(JSON.stringify(snap.guidelines))
                : [],
            donts: Array.isArray(snap.donts)
                ? JSON.parse(JSON.stringify(snap.donts))
                : [],
            recipes: Array.isArray(snap.recipes)
                ? JSON.parse(JSON.stringify(snap.recipes))
                : [],
            calc_config: {
                ...DEFAULT_CALC_CONFIG,
                ...(snap.calc_config && typeof snap.calc_config === 'object'
                    ? snap.calc_config
                    : {}),
            },
        };

        setFormData(hydrated);
        setEditingRecipeId(null);
        setCollapsed({
            profile: false,
            targets: false,
            meals: false,
            measurements: hydrated.measurements.length === 0,
            supplements: hydrated.supplements.length === 0,
            workouts: hydrated.workouts.length === 0,
            special: !hydrated.show_special_instructions,
            rules: hydrated.guidelines.length === 0 && hydrated.donts.length === 0,
            recipes: hydrated.recipes.length === 0,
        });
        setPreviewKey((k) => k + 1);
    }, []);

    useEffect(() => {
        const urlPlanId = searchParams?.get('planId');
        const urlClientId = searchParams?.get('clientId');
        if (!urlPlanId && !urlClientId) return;

        let active = true;
        (async () => {
            try {
                if (urlPlanId) {
                    const { data: planRow, error } = await supabase
                        .from('client_diet_plans')
                        .select('*, clients(*)')
                        .eq('id', urlPlanId)
                        .single();

                    if (!active || error || !planRow) return;

                    const owner = planRow.clients || null;
                    setSelectedClient(owner);
                    setLoadedPlanRecord(planRow);
                    applyRecordToForm(planRow, owner);
                } else if (urlClientId) {
                    const { data: clientRow, error } = await supabase
                        .from('clients')
                        .select('*')
                        .eq('id', urlClientId)
                        .single();

                    if (!active || error || !clientRow) return;

                    setSelectedClient(clientRow);
                    setLoadedPlanRecord(null);
                    const freshForClient = {
                        ...EMPTY_FORM_STATE,
                        client_name: clientRow.full_name || '',
                        client_phone: clientRow.phone || '',
                        client_age: clientRow.age || '',
                        client_height: clientRow.height || '',
                        goal: clientRow.initial_goals || '',
                        start_date: new Date().toISOString().split('T')[0],
                    };
                    setFormData(freshForClient);
                    setEditingRecipeId(null);
                    setPreviewKey((k) => k + 1);
                }

                // Clean query params so browser reload preserves unsaved draft edits
                if (typeof window !== 'undefined') {
                    window.history.replaceState({}, '', '/admin/diet-plan-generator');
                }
            } catch (err) {
                console.warn('Error hydrating diet plan from URL params:', err);
            }
        })();

        return () => {
            active = false;
        };
    }, [searchParams, supabase, applyRecordToForm]);

    // ─── Fetch Templates from Supabase ───
    const fetchTemplates = useCallback(async () => {
        setLoadingTemplates(true);
        try {
            const { data, error } = await supabase
                .from('diet_plan_templates')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) {
                console.warn('diet_plan_templates query error:', error.message);
                setTemplates([]);
            } else {
                setTemplates(data || []);
            }
        } catch (err) {
            console.error('Error connecting to database templates:', err);
            setTemplates([]);
        } finally {
            setLoadingTemplates(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    // ─── Pure Search-Based Recipe Fetching (Supabase On-Demand) ───
    useEffect(() => {
        const queryText = recipeSearch.trim();
        const hasCategory = recipeCategoryFilter && recipeCategoryFilter !== 'All';

        // Only query when search keyword or category filter is active
        if (!queryText && !hasCategory) {
            setAvailableRecipes([]);
            setLoadingRecipes(false);
            return;
        }

        let isMounted = true;
        setLoadingRecipes(true);

        const timer = setTimeout(async () => {
            try {
                let query = supabase.from('recipes').select('*');

                if (hasCategory) {
                    query = query.ilike('category', `%${recipeCategoryFilter}%`);
                }

                if (queryText) {
                    query = query.ilike('name', `%${queryText}%`);
                }

                const { data, error } = await query
                    .order('name', { ascending: true })
                    .limit(30);

                if (isMounted) {
                    if (!error && data) {
                        setAvailableRecipes(data);
                    } else {
                        setAvailableRecipes([]);
                    }
                }
            } catch (err) {
                console.warn('Error searching recipes:', err);
                if (isMounted) setAvailableRecipes([]);
            } finally {
                if (isMounted) setLoadingRecipes(false);
            }
        }, 250);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [recipeSearch, recipeCategoryFilter, supabase]);

    // ─── Clear Form ───
    const handleClearForm = () => {
        Swal.fire({
            title: 'Clear Form?',
            text: 'This will reset all fields, meals, and targets back to an empty state.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, clear all'
        }).then((res) => {
            if (res.isConfirmed) {
                if (autoSaveTimerRef.current) {
                    clearTimeout(autoSaveTimerRef.current);
                    autoSaveTimerRef.current = null;
                }
                hasPendingSaveRef.current = false;
                try {
                    window.localStorage.removeItem(DIET_PLAN_DRAFT_STORAGE_KEY);
                } catch {
                    // Ignore storage removal errors
                }

                const freshEmpty = {
                    ...EMPTY_FORM_STATE,
                    start_date: new Date().toISOString().split('T')[0],
                };
                lastSavedDataRef.current = freshEmpty;
                latestFormDataRef.current = freshEmpty;
                pendingHydratedDataRef.current = freshEmpty;

                setFormData(freshEmpty);
                setLoadedPlanRecord(null);
                setEditingRecipeId(null);
                setLastSavedAt(null);
                setSaveStatus('idle');
                setPreviewKey(k => k + 1);
            }
        });
    };

    // ─── Client Name Autocomplete, Past Recipe History & Single Unified DB Save ───
    const [clientPastPlans, setClientPastPlans] = useState([]);

    const effectiveClient = useMemo(() => {
        const typedName = (formData.client_name || '').trim().toLowerCase();
        const typedPhoneDigits = String(formData.client_phone || '').replace(/\D/g, '');

        if (selectedClient?.id) {
            const selName = (selectedClient.full_name || '').trim().toLowerCase();
            const selDigits = String(selectedClient.phone || '').replace(/\D/g, '');
            if (
                !typedName ||
                typedName === selName ||
                (typedPhoneDigits.length >= 7 &&
                    selDigits.length >= 7 &&
                    typedPhoneDigits === selDigits)
            ) {
                return selectedClient;
            }
        }

        if (typedName || typedPhoneDigits.length >= 7) {
            const matched = allClients.find((c) => {
                const cDigits = String(c.phone || '').replace(/\D/g, '');
                if (
                    typedPhoneDigits.length >= 7 &&
                    cDigits.length >= 7 &&
                    cDigits === typedPhoneDigits
                ) {
                    return true;
                }
                return Boolean(typedName && c.full_name?.trim().toLowerCase() === typedName);
            });
            if (matched) return matched;
        }

        return null;
    }, [selectedClient, formData.client_name, formData.client_phone, allClients]);

    const fetchClientPastPlans = useCallback(
        async (targetClientId) => {
            if (!targetClientId) {
                setClientPastPlans([]);
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('client_diet_plans')
                    .select(
                        'id, client_id, revision_number, plan_title, start_date, end_date, updated_at, plan_data'
                    )
                    .eq('client_id', targetClientId)
                    .order('revision_number', { ascending: false });

                if (!error && Array.isArray(data)) {
                    setClientPastPlans(data);
                } else {
                    setClientPastPlans([]);
                }
            } catch (err) {
                console.warn('Error loading client past plans for recipe check:', err);
                setClientPastPlans([]);
            }
        },
        [supabase]
    );

    useEffect(() => {
        fetchClientPastPlans(effectiveClient?.id || null);
    }, [effectiveClient?.id, fetchClientPastPlans]);

    const handleClientNameChange = (typedVal) => {
        const matched = allClients.find(
            (c) => c.full_name?.trim().toLowerCase() === typedVal.trim().toLowerCase()
        );
        if (matched) {
            if (loadedPlanRecord && loadedPlanRecord.client_id !== matched.id) {
                setLoadedPlanRecord(null);
            }
            setSelectedClient(matched);
            setFormData((prev) => ({
                ...prev,
                client_name: typedVal,
                client_phone: prev.client_phone?.trim() ? prev.client_phone : matched.phone || '',
                client_age: prev.client_age?.trim() ? prev.client_age : matched.age || '',
                client_height: prev.client_height?.trim() ? prev.client_height : matched.height || '',
                goal: prev.goal?.trim() ? prev.goal : matched.initial_goals || '',
            }));
        } else {
            setFormData((prev) => ({ ...prev, client_name: typedVal }));
        }
    };

    const handleSavePlanToDb = async (requestedAction = 'auto') => {
        setShowSaveMenu(false);
        const action =
            requestedAction === 'auto'
                ? loadedPlanRecord?.id
                    ? 'update'
                    : 'create'
                : requestedAction;

        const typedName = (formData.client_name || '').trim();
        const typedPhone = (formData.client_phone || '').trim();
        const phoneDigits = typedPhone.replace(/\D/g, '');

        if (!typedName && !selectedClient) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Client Name',
                text: 'Please enter the Client Full Name in Section 1 before saving.',
                confirmButtonColor: '#2d6a4f',
            });
            return;
        }

        setSavingToClientDb(true);
        try {
            let targetClient = selectedClient;

            // If a client is selected AND user typed a different name, ask which client owns this plan
            if (
                targetClient &&
                typedName &&
                targetClient.full_name?.trim().toLowerCase() !== typedName.toLowerCase()
            ) {
                const choice = await Swal.fire({
                    icon: 'question',
                    title: 'Different Client Name Entered',
                    html: `Save under <strong>${typedName}</strong> or keep under <strong>${targetClient.full_name}</strong>?`,
                    showDenyButton: true,
                    showCancelButton: true,
                    confirmButtonText: `Save under "${typedName}"`,
                    denyButtonText: `Keep "${targetClient.full_name}"`,
                    confirmButtonColor: '#2d6a4f',
                    denyButtonColor: '#0f766e',
                });
                if (choice.isDismissed) {
                    setSavingToClientDb(false);
                    return;
                }
                if (choice.isConfirmed) {
                    targetClient = null;
                }
            }

            if (!targetClient) {
                const existing = allClients.find((c) => {
                    const cDigits = String(c.phone || '').replace(/\D/g, '');
                    if (phoneDigits.length >= 7 && cDigits.length >= 7 && cDigits === phoneDigits) {
                        return true;
                    }
                    return c.full_name?.trim().toLowerCase() === typedName.toLowerCase();
                });

                if (existing) {
                    targetClient = existing;
                } else {
                    const { data: createdClient, error: createErr } = await supabase
                        .from('clients')
                        .insert([
                            {
                                full_name: typedName,
                                phone: typedPhone || '',
                                age: formData.client_age?.trim() || null,
                                height: formData.client_height?.trim() || null,
                                initial_goals: formData.goal?.trim() || null,
                                status: 'active',
                                updated_at: new Date().toISOString(),
                            },
                        ])
                        .select()
                        .single();

                    if (createErr) throw createErr;
                    targetClient = createdClient;
                    setAllClients((prev) => [
                        createdClient,
                        ...prev.filter((c) => c.id !== createdClient.id),
                    ]);
                }
            }

            // Update parent client timestamp & profile metadata
            const clientPatch = { updated_at: new Date().toISOString() };
            if (typedPhone) clientPatch.phone = typedPhone;
            if (formData.client_age?.trim()) clientPatch.age = formData.client_age.trim();
            if (formData.client_height?.trim()) clientPatch.height = formData.client_height.trim();
            if (formData.goal?.trim()) clientPatch.initial_goals = formData.goal.trim();
            await supabase.from('clients').update(clientPatch).eq('id', targetClient.id);

            const cleanSnapshot = {
                ...formData,
                client_name: typedName || targetClient.full_name,
            };

            if (action === 'update' && loadedPlanRecord?.id && loadedPlanRecord.client_id === targetClient.id) {
                const resolvedTitle =
                    formData.plan_title?.trim() ||
                    loadedPlanRecord.plan_title ||
                    `Phase ${loadedPlanRecord.revision_number || 1} Diet Plan`;

                const { data: updatedPlan, error: updErr } = await supabase
                    .from('client_diet_plans')
                    .update({
                        plan_title: resolvedTitle,
                        goal: formData.goal?.trim() || null,
                        calories: formData.calories?.trim() || null,
                        start_date: formData.start_date || null,
                        end_date: formData.end_date || null,
                        pdf_theme: formData.pdf_theme || 'clinical',
                        plan_data: { ...cleanSnapshot, plan_title: resolvedTitle },
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', loadedPlanRecord.id)
                    .select()
                    .single();

                if (updErr) throw updErr;

                setSelectedClient(targetClient);
                setLoadedPlanRecord(updatedPlan);
                fetchClientPastPlans(targetClient.id);

                Swal.fire({
                    icon: 'success',
                    title: `Updated Rev ${updatedPlan.revision_number}`,
                    text: `Saved changes for ${targetClient.full_name}.`,
                    timer: 1600,
                    showConfirmButton: false,
                });
            } else {
                const { data: latestRows, error: revErr } = await supabase
                    .from('client_diet_plans')
                    .select('revision_number')
                    .eq('client_id', targetClient.id)
                    .order('revision_number', { ascending: false })
                    .limit(1);

                if (revErr) throw revErr;

                const maxRev =
                    Array.isArray(latestRows) && latestRows.length > 0
                        ? Number(latestRows[0].revision_number) || 0
                        : 0;
                const nextRev = maxRev + 1;
                const resolvedTitle =
                    formData.plan_title?.trim() || `Phase ${nextRev} Diet Plan`;

                const { data: insertedPlan, error: insErr } = await supabase
                    .from('client_diet_plans')
                    .insert([
                        {
                            client_id: targetClient.id,
                            revision_number: nextRev,
                            plan_title: resolvedTitle,
                            goal: formData.goal?.trim() || null,
                            calories: formData.calories?.trim() || null,
                            start_date: formData.start_date || null,
                            end_date: formData.end_date || null,
                            pdf_theme: formData.pdf_theme || 'clinical',
                            plan_data: { ...cleanSnapshot, plan_title: resolvedTitle },
                            updated_at: new Date().toISOString(),
                        },
                    ])
                    .select()
                    .single();

                if (insErr) throw insErr;

                setSelectedClient(targetClient);
                setLoadedPlanRecord(insertedPlan);
                fetchClientPastPlans(targetClient.id);
                if (!formData.plan_title?.trim()) {
                    setFormData((prev) => ({ ...prev, plan_title: resolvedTitle }));
                }

                Swal.fire({
                    icon: 'success',
                    title: `Saved Rev ${nextRev}`,
                    text: `"${resolvedTitle}" saved under ${targetClient.full_name}.`,
                    timer: 1700,
                    showConfirmButton: false,
                });
            }
        } catch (err) {
            console.error('Error saving diet plan:', err);
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: err.message || 'Unable to save diet plan.',
                confirmButtonColor: '#2d6a4f',
            });
        } finally {
            setSavingToClientDb(false);
        }
    };

    // ─── Clinical Auto-Calculation Helpers (Height ↔ Inches → IBW → Calories → Macros) ───
    const calcConfig = formData.calc_config || DEFAULT_CALC_CONFIG;
    const fieldsLocked = Boolean(calcConfig.fieldsLocked);

    const activeIbwNum = useMemo(() => {
        const fromTarget = parseNumericValue(formData.target_weight);
        if (Number.isFinite(fromTarget) && fromTarget > 0) return fromTarget;
        const cmNum = parseFloat(calcConfig.heightCm);
        const offsetNum = parseFloat(calcConfig.ibwOffset);
        if (Number.isFinite(cmNum) && cmNum > 0 && Number.isFinite(offsetNum)) {
            const computed = roundOne(cmNum - offsetNum);
            if (computed > 0) return computed;
        }
        return NaN;
    }, [formData.target_weight, calcConfig.heightCm, calcConfig.ibwOffset]);

    const activeCaloriesNum = useMemo(
        () => parseNumericValue(formData.calories),
        [formData.calories]
    );

    const macroPctSum = useMemo(() => {
        const p = parseFloat(calcConfig.proteinPct) || 0;
        const c = parseFloat(calcConfig.carbsPct) || 0;
        const f = parseFloat(calcConfig.fatsPct) || 0;
        return roundOne(p + c + f);
    }, [calcConfig.proteinPct, calcConfig.carbsPct, calcConfig.fatsPct]);

    const proteinPerKgIbw = useMemo(() => {
        const pGrams = parseNumericValue(formData.protein);
        if (Number.isFinite(activeIbwNum) && activeIbwNum > 0 && Number.isFinite(pGrams) && pGrams > 0) {
            return (pGrams / activeIbwNum).toFixed(2);
        }
        return null;
    }, [formData.protein, activeIbwNum]);

    const handleHeightCmChange = (rawCm) => {
        setFormData((prev) => {
            const baseCfg = prev.calc_config || DEFAULT_CALC_CONFIG;
            if (rawCm === '') {
                return {
                    ...prev,
                    client_height: '',
                    calc_config: {
                        ...baseCfg,
                        heightCm: '',
                        heightInches: '',
                        heightFeet: '',
                        heightRemInches: '',
                    },
                };
            }
            const cmNum = parseFloat(rawCm);
            if (!Number.isFinite(cmNum) || cmNum <= 0) {
                return {
                    ...prev,
                    calc_config: { ...baseCfg, heightCm: rawCm },
                };
            }
            const totalIn = cmNum / 2.54;
            const roundedIn = roundOne(totalIn);
            let feet = Math.floor(totalIn / 12);
            let remIn = roundOne(totalIn - feet * 12);
            if (remIn >= 12) {
                feet += 1;
                remIn = 0;
            }
            const nextCfg = {
                ...baseCfg,
                heightCm: rawCm,
                heightInches: String(roundedIn),
                heightFeet: String(feet),
                heightRemInches: String(remIn),
            };
            const chainUpdates = computeChainFromHeightCm(cmNum, nextCfg);
            return {
                ...prev,
                ...chainUpdates,
                calc_config: nextCfg,
            };
        });
    };

    const handleHeightInchesChange = (rawInches) => {
        setFormData((prev) => {
            const baseCfg = prev.calc_config || DEFAULT_CALC_CONFIG;
            if (rawInches === '') {
                return {
                    ...prev,
                    client_height: '',
                    calc_config: {
                        ...baseCfg,
                        heightCm: '',
                        heightInches: '',
                        heightFeet: '',
                        heightRemInches: '',
                    },
                };
            }
            const inNum = parseFloat(rawInches);
            if (!Number.isFinite(inNum) || inNum <= 0) {
                return {
                    ...prev,
                    calc_config: { ...baseCfg, heightInches: rawInches },
                };
            }
            const cmNum = roundOne(inNum * 2.54);
            let feet = Math.floor(inNum / 12);
            let remIn = roundOne(inNum - feet * 12);
            if (remIn >= 12) {
                feet += 1;
                remIn = 0;
            }
            const nextCfg = {
                ...baseCfg,
                heightInches: rawInches,
                heightCm: String(cmNum),
                heightFeet: String(feet),
                heightRemInches: String(remIn),
            };
            const chainUpdates = computeChainFromHeightCm(cmNum, nextCfg);
            return {
                ...prev,
                ...chainUpdates,
                client_height: `${cmNum} cm (${roundOne(inNum)} in)`,
                calc_config: nextCfg,
            };
        });
    };

    const handleHeightFeetInchesChange = (rawFeet, rawRemIn) => {
        setFormData((prev) => {
            const baseCfg = prev.calc_config || DEFAULT_CALC_CONFIG;
            if (rawFeet === '' && rawRemIn === '') {
                return {
                    ...prev,
                    client_height: '',
                    calc_config: {
                        ...baseCfg,
                        heightCm: '',
                        heightInches: '',
                        heightFeet: '',
                        heightRemInches: '',
                    },
                };
            }
            const ftNum = parseFloat(rawFeet) || 0;
            const remInNum = parseFloat(rawRemIn) || 0;
            const totalIn = roundOne(ftNum * 12 + remInNum);
            if (totalIn <= 0) {
                return {
                    ...prev,
                    calc_config: {
                        ...baseCfg,
                        heightFeet: rawFeet,
                        heightRemInches: rawRemIn,
                    },
                };
            }
            const cmNum = roundOne(totalIn * 2.54);
            const nextCfg = {
                ...baseCfg,
                heightFeet: rawFeet,
                heightRemInches: rawRemIn,
                heightInches: String(totalIn),
                heightCm: String(cmNum),
            };
            const chainUpdates = computeChainFromHeightCm(cmNum, nextCfg);
            return {
                ...prev,
                ...chainUpdates,
                calc_config: nextCfg,
            };
        });
    };

    const handleIbwOffsetChange = (rawOffset) => {
        setFormData((prev) => {
            const baseCfg = prev.calc_config || DEFAULT_CALC_CONFIG;
            const nextCfg = { ...baseCfg, ibwOffset: rawOffset };
            const cmNum = parseFloat(nextCfg.heightCm);
            const offsetNum = parseFloat(rawOffset);
            if (Number.isFinite(cmNum) && cmNum > 0 && Number.isFinite(offsetNum)) {
                const chainUpdates = computeChainFromHeightCm(cmNum, nextCfg);
                return {
                    ...prev,
                    ...chainUpdates,
                    calc_config: nextCfg,
                };
            }
            return {
                ...prev,
                calc_config: nextCfg,
            };
        });
    };

    const handleManualIbwChange = (rawVal) => {
        setFormData((prev) => {
            const baseCfg = prev.calc_config || DEFAULT_CALC_CONFIG;
            const updates = { target_weight: rawVal };
            const ibwNum = parseNumericValue(rawVal);
            const mult = parseFloat(baseCfg.calMultiplier);
            if (Number.isFinite(ibwNum) && ibwNum >= 15 && Number.isFinite(mult) && mult > 0) {
                const cals = Math.round(ibwNum * mult);
                updates.calories = String(cals);
                const macros = computeMacrosFromCalories(
                    cals,
                    baseCfg.proteinPct,
                    baseCfg.carbsPct,
                    baseCfg.fatsPct
                );
                if (macros) {
                    updates.protein = macros.protein;
                    updates.carbs = macros.carbs;
                    updates.fats = macros.fats;
                }
            }
            return { ...prev, ...updates };
        });
    };

    const handleCalMultiplierChange = (rawMult) => {
        setFormData((prev) => {
            const baseCfg = prev.calc_config || DEFAULT_CALC_CONFIG;
            const nextCfg = { ...baseCfg, calMultiplier: rawMult };
            const multNum = parseFloat(rawMult);
            let ibwNum = parseNumericValue(prev.target_weight);
            if (!Number.isFinite(ibwNum) || ibwNum <= 0) {
                const cmNum = parseFloat(nextCfg.heightCm);
                const offsetNum = parseFloat(nextCfg.ibwOffset);
                if (Number.isFinite(cmNum) && cmNum > 0 && Number.isFinite(offsetNum)) {
                    ibwNum = roundOne(cmNum - offsetNum);
                }
            }
            if (Number.isFinite(ibwNum) && ibwNum > 0 && Number.isFinite(multNum) && multNum > 0) {
                const cals = Math.round(ibwNum * multNum);
                const macros = computeMacrosFromCalories(
                    cals,
                    nextCfg.proteinPct,
                    nextCfg.carbsPct,
                    nextCfg.fatsPct
                );
                return {
                    ...prev,
                    calories: String(cals),
                    ...(macros || {}),
                    calc_config: nextCfg,
                };
            }
            return {
                ...prev,
                calc_config: nextCfg,
            };
        });
    };

    const handleManualCaloriesChange = (rawVal) => {
        setFormData((prev) => {
            const baseCfg = prev.calc_config || DEFAULT_CALC_CONFIG;
            const calsNum = parseNumericValue(rawVal);
            if (Number.isFinite(calsNum) && calsNum >= 200) {
                const macros = computeMacrosFromCalories(
                    calsNum,
                    baseCfg.proteinPct,
                    baseCfg.carbsPct,
                    baseCfg.fatsPct
                );
                return {
                    ...prev,
                    calories: rawVal,
                    ...(macros || {}),
                };
            }
            return {
                ...prev,
                calories: rawVal,
            };
        });
    };

    const handleMacroPctChange = (pctKey, rawPct) => {
        setFormData((prev) => {
            const baseCfg = prev.calc_config || DEFAULT_CALC_CONFIG;
            const nextCfg = { ...baseCfg, [pctKey]: rawPct };
            const calsNum = parseNumericValue(prev.calories);
            if (Number.isFinite(calsNum) && calsNum > 0) {
                const macros = computeMacrosFromCalories(
                    calsNum,
                    nextCfg.proteinPct,
                    nextCfg.carbsPct,
                    nextCfg.fatsPct
                );
                return {
                    ...prev,
                    ...(macros || {}),
                    calc_config: nextCfg,
                };
            }
            return {
                ...prev,
                calc_config: nextCfg,
            };
        });
    };

    const handleApplyMacroPreset = (pPct, cPct, fPct) => {
        setFormData((prev) => {
            const baseCfg = prev.calc_config || DEFAULT_CALC_CONFIG;
            const nextCfg = {
                ...baseCfg,
                proteinPct: pPct,
                carbsPct: cPct,
                fatsPct: fPct,
            };
            const calsNum = parseNumericValue(prev.calories);
            const macros =
                Number.isFinite(calsNum) && calsNum > 0
                    ? computeMacrosFromCalories(calsNum, pPct, cPct, fPct)
                    : null;
            return {
                ...prev,
                ...(macros || {}),
                calc_config: nextCfg,
            };
        });
    };

    const handleBalanceMacrosTo100 = () => {
        setFormData((prev) => {
            const baseCfg = prev.calc_config || DEFAULT_CALC_CONFIG;
            const pNum = parseFloat(baseCfg.proteinPct) || 0;
            let cNum = parseFloat(baseCfg.carbsPct) || 0;
            let fNum = parseFloat(baseCfg.fatsPct) || 0;

            // Adjust Fats% first if it keeps Fats in a healthy 12-35% range; otherwise adjust Carbs%
            const candidateFat = roundOne(100 - pNum - cNum);
            if (candidateFat >= 12 && candidateFat <= 35) {
                fNum = candidateFat;
            } else {
                cNum = Math.max(0, roundOne(100 - pNum - fNum));
                fNum = Math.max(0, roundOne(100 - pNum - cNum));
            }

            const nextCfg = {
                ...baseCfg,
                proteinPct: pNum,
                carbsPct: cNum,
                fatsPct: fNum,
            };
            const calsNum = parseNumericValue(prev.calories);
            const macros =
                Number.isFinite(calsNum) && calsNum > 0
                    ? computeMacrosFromCalories(calsNum, pNum, cNum, fNum)
                    : null;
            return {
                ...prev,
                ...(macros || {}),
                calc_config: nextCfg,
            };
        });
    };

    const handleToggleLockFields = () => {
        setFormData((prev) => {
            const baseCfg = prev.calc_config || DEFAULT_CALC_CONFIG;
            return {
                ...prev,
                calc_config: {
                    ...baseCfg,
                    fieldsLocked: !baseCfg.fieldsLocked,
                },
            };
        });
    };

    const handleToggleCalculatorPanel = () => {
        setFormData((prev) => {
            const baseCfg = prev.calc_config || DEFAULT_CALC_CONFIG;
            return {
                ...prev,
                calc_config: {
                    ...baseCfg,
                    showCalculator: baseCfg.showCalculator === false ? true : false,
                },
            };
        });
    };

    // ─── Apply Template from DB ───
    const handleApplyTemplate = (template) => {
        if (!template) return;

        Swal.fire({
            title: `Load ${template.label}?`,
            text: 'This will populate the meal schedule, nutritional targets, and clinical rules from this preset.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2d6a4f',
            confirmButtonText: 'Yes, load preset'
        }).then((result) => {
            if (result.isConfirmed) {
                setFormData(prev => ({
                    ...prev,
                    plan_title: template.plan_title || template.label || prev.plan_title,
                    goal: template.goal || '',
                    calories: template.calories || '',
                    protein: template.protein || '',
                    carbs: template.carbs || '',
                    fats: template.fats || '',
                    fibre: template.fibre || '',
                    water: template.water || '',
                    steps: template.steps || '',
                    measurements: Array.isArray(template.measurements) ? JSON.parse(JSON.stringify(template.measurements)) : (prev.measurements || []),
                    dietitian_name: template.dietitian_name || prev.dietitian_name,
                    dietitian_note: template.dietitian_note || '',
                    meals: Array.isArray(template.meals) ? JSON.parse(JSON.stringify(template.meals)) : [],
                    supplements: Array.isArray(template.supplements) ? JSON.parse(JSON.stringify(template.supplements)) : [],
                    workouts: Array.isArray(template.workouts) ? JSON.parse(JSON.stringify(template.workouts)) : [],
                    guidelines: Array.isArray(template.guidelines) ? JSON.parse(JSON.stringify(template.guidelines)) : [],
                    donts: Array.isArray(template.donts) ? JSON.parse(JSON.stringify(template.donts)) : [],
                    recipes: Array.isArray(template.recipes) ? JSON.parse(JSON.stringify(template.recipes)) : (prev.recipes || []),
                    show_special_instructions: Boolean(template.show_special_instructions),
                    special_instructions_title: template.special_instructions_title || 'Special Clinical Instructions & Edge-Case Directives',
                    special_instructions_badge: template.special_instructions_badge || 'EDGE CASE ADVISORY',
                    special_instructions_theme: template.special_instructions_theme || 'emerald',
                    special_instructions_style: template.special_instructions_style || 'callout',
                    special_instructions: template.special_instructions || '',
                    special_instructions_warning: template.special_instructions_warning || '',
                    special_instructions_verified: template.special_instructions_verified !== false
                }));
                setPreviewKey(k => k + 1);
                Swal.fire({
                    icon: 'success',
                    title: 'Preset Loaded!',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    };

    // ─── Save Current Form As New DB Preset ───
    const handleSaveCurrentAsTemplate = async () => {
        if (formData.meals.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Meals Added',
                text: 'Please add at least 1 meal slot before saving this plan as a preset template.',
                confirmButtonColor: '#2d6a4f'
            });
            return;
        }

        const { value: formValues } = await Swal.fire({
            title: 'Save Plan as Preset',
            html: `
                <div style="text-align: left; font-size: 13px;">
                    <label style="display:block; font-weight: 600; margin-bottom: 4px; color: #1e293b;">Preset Label *</label>
                    <input id="swal-template-label" class="swal2-input" placeholder="e.g. Thyroid Support Protocol" value="${formData.plan_title || ''}" style="margin: 0 0 14px 0; width: 100%; font-size: 13px; box-sizing: border-box;">
                    
                    <label style="display:block; font-weight: 600; margin-bottom: 4px; color: #1e293b;">Calorie Tag *</label>
                    <input id="swal-template-badge" class="swal2-input" placeholder="e.g. 1,450 kcal" value="${formData.calories ? `${formData.calories} kcal` : ''}" style="margin: 0; width: 100%; font-size: 13px; box-sizing: border-box;">
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Save to Database',
            confirmButtonColor: '#2d6a4f',
            preConfirm: () => {
                const label = document.getElementById('swal-template-label').value.trim();
                const badge = document.getElementById('swal-template-badge').value.trim();
                if (!label || !badge) {
                    Swal.showValidationMessage('Please provide both preset label and calorie badge');
                    return false;
                }
                return { label, badge };
            }
        });

        if (!formValues) return;

        try {
            const { error } = await supabase
                .from('diet_plan_templates')
                .insert([{
                    label: formValues.label,
                    badge: formValues.badge,
                    plan_title: formData.plan_title || formValues.label,
                    goal: formData.goal,
                    calories: formData.calories,
                    protein: formData.protein,
                    carbs: formData.carbs,
                    fats: formData.fats,
                    fibre: formData.fibre,
                    fiber: formData.fibre,
                    water: formData.water,
                    steps: formData.steps,
                    measurements: formData.measurements,
                    dietitian_name: formData.dietitian_name,
                    dietitian_note: formData.dietitian_note,
                    meals: formData.meals,
                    supplements: formData.supplements,
                    workouts: formData.workouts,
                    guidelines: formData.guidelines,
                    donts: formData.donts,
                    recipes: formData.recipes,
                    show_special_instructions: formData.show_special_instructions,
                    special_instructions_title: formData.special_instructions_title,
                    special_instructions_badge: formData.special_instructions_badge,
                    special_instructions_theme: formData.special_instructions_theme,
                    special_instructions_style: formData.special_instructions_style,
                    special_instructions: formData.special_instructions,
                    special_instructions_warning: formData.special_instructions_warning,
                    special_instructions_verified: formData.special_instructions_verified,
                    is_preset: false
                }]);

            if (error) throw error;

            Swal.fire({
                icon: 'success',
                title: 'Preset Saved!',
                text: `"${formValues.label}" has been saved to the database.`,
                confirmButtonColor: '#2d6a4f',
                timer: 2000
            });

            fetchTemplates();
        } catch (err) {
            console.error('Error saving template to DB:', err);
            Swal.fire({
                icon: 'error',
                title: 'Database Save Failed',
                text: err.message,
                confirmButtonColor: '#2d6a4f'
            });
        }
    };

    // ─── Delete Custom Template ───
    const handleDeleteTemplate = (templateId, templateLabel, e) => {
        e.stopPropagation();
        Swal.fire({
            title: `Delete "${templateLabel}"?`,
            text: 'This will permanently remove this preset from the database.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const { error } = await supabase
                        .from('diet_plan_templates')
                        .delete()
                        .eq('id', templateId);

                    if (error) throw error;

                    setTemplates(prev => prev.filter(t => t.id !== templateId));
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } catch (err) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Delete Failed',
                        text: err.message,
                        confirmButtonColor: '#2d6a4f'
                    });
                }
            }
        });
    };

    // ─── Measurements Helpers ───
    const handleAddMeasurement = () => {
        const today = new Date().toISOString().split('T')[0];
        setFormData(prev => ({
            ...prev,
            measurements: [
                ...(prev.measurements || []),
                {
                    date: today,
                    weight: (prev.measurements && prev.measurements.length > 0)
                        ? prev.measurements[prev.measurements.length - 1].weight || ''
                        : (prev.start_weight || ''),
                    belly_button: '',
                    hip: '',
                    thigh: '',
                    neck: '',
                    bicep: ''
                }
            ]
        }));
    };

    const handleMeasurementChange = (index, field, value) => {
        const updated = [...(formData.measurements || [])];
        updated[index] = { ...updated[index], [field]: value };
        setFormData(prev => ({ ...prev, measurements: updated }));
    };

    const handleRemoveMeasurement = (index) => {
        setFormData(prev => ({
            ...prev,
            measurements: (prev.measurements || []).filter((_, i) => i !== index)
        }));
    };

    const handleClearMeasurements = () => {
        setFormData(prev => ({ ...prev, measurements: [] }));
    };

    const activeMeasurementColsCount = useMemo(() => {
        const rows = formData.measurements || [];
        const cols = ['date', 'weight', 'belly_button', 'hip', 'thigh', 'neck', 'bicep'];
        return cols.filter(c => rows.some(r => r && r[c] && String(r[c]).trim() !== '' && String(r[c]).trim() !== '-')).length;
    }, [formData.measurements]);

    // ─── Meals Helpers ───
    const getMealOptions = (meal) => {
        if (Array.isArray(meal?.options) && meal.options.length > 0) {
            return meal.options;
        }
        const opts = [];
        if (meal?.option1 !== undefined && meal?.option1 !== null && meal?.option1 !== '') opts.push(meal.option1);
        if (meal?.option2 !== undefined && meal?.option2 !== null && meal?.option2 !== '') opts.push(meal.option2);
        return opts.length > 0 ? opts : [''];
    };

    const handleMealChange = (index, field, value) => {
        const updated = [...formData.meals];
        updated[index] = { ...updated[index], [field]: value };
        setFormData(prev => ({ ...prev, meals: updated }));
    };

    const handleMealOptionChange = (mealIndex, optionIndex, value) => {
        const updated = [...formData.meals];
        const currentOptions = [...getMealOptions(updated[mealIndex])];
        currentOptions[optionIndex] = value;
        updated[mealIndex] = {
            ...updated[mealIndex],
            options: currentOptions,
            option1: currentOptions[0] || '',
            option2: currentOptions[1] || ''
        };
        setFormData(prev => ({ ...prev, meals: updated }));
    };

    const handleAddMealOption = (mealIndex) => {
        const updated = [...formData.meals];
        const currentOptions = [...getMealOptions(updated[mealIndex]), ''];
        updated[mealIndex] = {
            ...updated[mealIndex],
            options: currentOptions,
            option1: currentOptions[0] || '',
            option2: currentOptions[1] || ''
        };
        setFormData(prev => ({ ...prev, meals: updated }));
    };

    const handleRemoveMealOption = (mealIndex, optionIndex) => {
        const updated = [...formData.meals];
        const currentOptions = getMealOptions(updated[mealIndex]).filter((_, idx) => idx !== optionIndex);
        const finalOptions = currentOptions.length > 0 ? currentOptions : [''];
        updated[mealIndex] = {
            ...updated[mealIndex],
            options: finalOptions,
            option1: finalOptions[0] || '',
            option2: finalOptions[1] || ''
        };
        setFormData(prev => ({ ...prev, meals: updated }));
    };

    const handleAddMeal = () => {
        const defaultNames = [
            'Early Morning Detox',
            'Breakfast',
            'Mid-Morning Snack',
            'Lunch',
            'Evening Snack',
            'Dinner',
            'Bedtime Soother'
        ];
        const nextName = defaultNames[formData.meals.length] || `Meal ${formData.meals.length + 1}`;
        const newMeal = {
            name: nextName,
            time: '',
            options: ['', ''],
            option1: '',
            option2: '',
            optional: '',
            notes: ''
        };
        setFormData(prev => ({ ...prev, meals: [...prev.meals, newMeal] }));
    };

    const handleRemoveMeal = (index) => {
        const updated = formData.meals.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, meals: updated }));
    };

    // ─── Supplements Helpers ───
    const handleSuppChange = (index, field, value) => {
        const updated = [...(formData.supplements || [])];
        if (updated[index]) {
            updated[index] = { ...updated[index], [field]: value };
            setFormData(prev => ({ ...prev, supplements: updated }));
        }
    };

    const handleAddSupp = () => {
        setFormData(prev => ({
            ...prev,
            supplements: [...(prev.supplements || []), { name: '', dosage: '', timing: 'Post-Meal' }]
        }));
    };

    const handleRemoveSupp = (index) => {
        setFormData(prev => ({
            ...prev,
            supplements: (prev.supplements || []).filter((_, i) => i !== index)
        }));
    };

    // ─── Workout Plan Helpers ───
    const handleWorkoutChange = (index, field, value) => {
        const updated = [...(formData.workouts || [])];
        if (updated[index]) {
            updated[index] = { ...updated[index], [field]: value };
            setFormData(prev => ({ ...prev, workouts: updated }));
        }
    };

    const handleAddWorkout = () => {
        setFormData(prev => ({
            ...prev,
            workouts: [
                ...(prev.workouts || []),
                {
                    day: `Day ${(prev.workouts?.length || 0) + 1}`,
                    focus: '',
                    exercises: '',
                    cardio: '',
                    notes: ''
                }
            ]
        }));
    };

    const handleRemoveWorkout = (index) => {
        setFormData(prev => ({
            ...prev,
            workouts: (prev.workouts || []).filter((_, i) => i !== index)
        }));
    };

    const handleApplyWorkoutPreset = (type) => {
        let preset = [];
        if (type === '3day') {
            preset = [
                {
                    day: 'Day 1 (Mon)',
                    focus: 'Upper Body & Core',
                    exercises: 'Incline Push-ups (3x12), Dumbbell Rows (3x10), Plank (3x45s)',
                    cardio: '20 min brisk walk (Zone 2) / 8,000 steps',
                    notes: 'Rest 60s between sets, controlled tempo'
                },
                {
                    day: 'Day 2 (Wed)',
                    focus: 'Lower Body & Posture',
                    exercises: 'Bodyweight Squats (3x15), Glute Bridges (3x12), Calf Raises (3x20)',
                    cardio: '25 min brisk walk / 8,500 steps',
                    notes: 'Keep core braced, full range of motion'
                },
                {
                    day: 'Day 3 (Fri)',
                    focus: 'Full Body & Functional Mobility',
                    exercises: 'Walking Lunges (3x10/side), Wall Angels (3x12), Deadbug (3x10/side)',
                    cardio: '30 min brisk walk / 10,000 steps',
                    notes: 'Dynamic warm-up and deep hamstring stretches'
                }
            ];
        } else if (type === 'cardio') {
            preset = [
                {
                    day: 'Mon / Wed / Fri',
                    focus: 'Zone-2 Steady State Cardio',
                    exercises: 'Incline treadmill walk or outdoor brisk walking',
                    cardio: '35-45 min continuous pace @ 110-125 bpm',
                    notes: 'Nasal breathing pace, hydrate before & after'
                },
                {
                    day: 'Tue / Thu / Sat',
                    focus: 'Mobility, Core & Active Steps',
                    exercises: 'Cat-Cow (3x10), Bird-Dog (3x10), Hip Flexor Stretch (60s)',
                    cardio: 'Daily 10,000 cumulative steps',
                    notes: 'Post-meal 10-min walks recommended'
                }
            ];
        } else if (type === 'clear') {
            preset = [];
        }
        setFormData(prev => ({ ...prev, workouts: preset }));
    };

    // ─── Special Directives Presets ───
    const handleApplySpecialPreset = (type) => {
        if (type === 'diabetes') {
            setFormData(prev => ({
                ...prev,
                show_special_instructions: true,
                special_instructions_title: 'Type 2 Diabetes & Glycemic Control Directives',
                special_instructions_badge: 'GLYCEMIC CARE',
                special_instructions_theme: 'emerald',
                special_instructions_style: 'callout',
                special_instructions: [
                    'Strict 3 to 4-hour meal timing intervals to prevent reactive glycemic volatility.',
                    'Always combine complex carbohydrates with soluble dietary fibre and high-BV protein.',
                    'Morning blood sugar testing: record fasting and 2-hour post-prandial readings 3x/week.',
                    'Zero refined sugars, white flour (maida), commercial fruit syrups, or packaged juices.',
                    'Engage in a 15-20 minute light post-meal brisk stroll to accelerate muscular glucose uptake.'
                ].join('\n'),
                special_instructions_warning: 'If blood glucose drops < 70 mg/dL (hypoglycemia), consume 15g fast-acting carbs (3 glucose tablets or 1/2 cup fruit juice) immediately and recheck in 15 minutes.'
            }));
        } else if (type === 'cardiac') {
            setFormData(prev => ({
                ...prev,
                show_special_instructions: true,
                special_instructions_title: 'Cardiac Health & Low-Sodium Hypertension Protocol',
                special_instructions_badge: 'CARDIAC CARE',
                special_instructions_theme: 'amber',
                special_instructions_style: 'framed',
                special_instructions: [
                    'Strict daily sodium ceiling: limit total intake to < 1,500mg daily (~1/2 tsp total salt).',
                    'Strictly avoid papads, commercial pickles, salted snacks, canned broths, and packaged sauces.',
                    'Enhance plate palatability using fresh lime, kokum, roasted jeera powder, garlic, and fresh herbs.',
                    'Emphasize natural potassium & magnesium: tender coconut water, steamed drumstick, and gourd sabzis.',
                    'Record resting blood pressure twice weekly in the morning before caffeine or breakfast.'
                ].join('\n'),
                special_instructions_warning: 'Contact supervising cardiologist immediately if resting systolic BP exceeds 160 mmHg, or if experiencing unexplained chest tightness, dizziness, or shortness of breath.'
            }));
        } else if (type === 'gerd') {
            setFormData(prev => ({
                ...prev,
                show_special_instructions: true,
                special_instructions_title: 'Acid Reflux (GERD) & Gut Mucosa Healing Directives',
                special_instructions_badge: 'GUT HEALTH',
                special_instructions_theme: 'amber',
                special_instructions_style: 'banner',
                special_instructions: [
                    'Finish dinner at least 3 to 3.5 hours before lying down to sleep at night.',
                    'Elevate the head of your bed by 6 inches if nighttime reflux or coughing episodes occur.',
                    'Strictly avoid raw onion/garlic, excessive black pepper, citrus juices on an empty stomach, mint, and cocoa.',
                    'Mindful chewing: chew each bite 25-30 times to saturate bolus with alkaline salivary enzymes.',
                    'Sip warm cumin-fennel infusion 30 minutes post-meals; do not chug cold liquids during meals.'
                ].join('\n'),
                special_instructions_warning: 'Avoid prolonged fasting or skipping prescribed meal intervals; accumulated gastric acid in an empty stomach accelerates esophageal mucosal erosion.'
            }));
        } else if (type === 'fatty_liver') {
            setFormData(prev => ({
                ...prev,
                show_special_instructions: true,
                special_instructions_title: 'Non-Alcoholic Fatty Liver (NAFLD) & Lipid Optimization',
                special_instructions_badge: 'LIVER RECOVERY',
                special_instructions_theme: 'emerald',
                special_instructions_style: 'callout',
                special_instructions: [
                    'Zero tolerance for refined high-fructose corn syrups, alcohol, and reheated cooking oils.',
                    'Limit visible cooking fats to measured cold-pressed oils (maximum 2-3 tsp daily total).',
                    'Incorporate cruciferous vegetables (broccoli, cabbage, radishes) to support hepatic phase-2 detox.',
                    'Daily soluble prebiotic fiber target (> 35g/day) via soaked chia seeds, flaxseeds, and jowar/nachni.',
                    'Minimum 30-40 minutes of daily Zone-2 continuous brisk walking to oxidize hepatic triglycerides.'
                ].join('\n'),
                special_instructions_warning: 'Do not consume over-the-counter NSAIDs, paracetamol in excess, or unverified fat-loss herbal powders without clinical authorization.'
            }));
        } else if (type === 'pcos') {
            setFormData(prev => ({
                ...prev,
                show_special_instructions: true,
                special_instructions_title: 'PCOS Hormonal Balance & Anti-Inflammatory Directives',
                special_instructions_badge: 'HORMONAL CARE',
                special_instructions_theme: 'rose',
                special_instructions_style: 'callout',
                special_instructions: [
                    'Strict low-glycemic load plate composition to prevent insulin-driven androgen surges.',
                    'Seed cycling protocol: 1 tbsp flax + pumpkin seeds (Follicular phase); sunflower + sesame (Luteal phase).',
                    'Prioritize 7.5 to 8 hours of uninterrupted sleep in a cool, pitch-dark bedroom.',
                    'Drink 1-2 cups of organic spearmint tea daily to aid free testosterone modulation.',
                    'Morning cortisol hygiene: 10 minutes of direct morning sunlight exposure and gentle breathwork.'
                ].join('\n'),
                special_instructions_warning: 'Avoid severe caloric deficits (> 500 kcal) or intense fasting; endocrine pathways require nutritional stability for regular ovulatory signaling.'
            }));
        } else if (type === 'clear') {
            setFormData(prev => ({
                ...prev,
                show_special_instructions: false,
                special_instructions_title: 'Special Clinical Instructions & Edge-Case Directives',
                special_instructions_badge: 'EDGE CASE ADVISORY',
                special_instructions_theme: 'emerald',
                special_instructions_style: 'callout',
                special_instructions: '',
                special_instructions_warning: ''
            }));
        }
    };

    // ─── Guidelines Helpers ───
    const handleAddRule = () => {
        setFormData(prev => ({ ...prev, guidelines: [...prev.guidelines, ''] }));
    };
    const handleRuleChange = (index, value) => {
        const updated = [...formData.guidelines];
        updated[index] = value;
        setFormData(prev => ({ ...prev, guidelines: updated }));
    };
    const handleRemoveRule = (index) => {
        setFormData(prev => ({
            ...prev,
            guidelines: prev.guidelines.filter((_, i) => i !== index)
        }));
    };

    // ─── Don'ts Helpers ───
    const handleAddDont = () => {
        setFormData(prev => ({ ...prev, donts: [...prev.donts, ''] }));
    };
    const handleDontChange = (index, value) => {
        const updated = [...formData.donts];
        updated[index] = value;
        setFormData(prev => ({ ...prev, donts: updated }));
    };
    const handleRemoveDont = (index) => {
        setFormData(prev => ({
            ...prev,
            donts: prev.donts.filter((_, i) => i !== index)
        }));
    };

    // ─── Attached Recipes Helpers & Past-Plan Repeat Detection ───
    const escapeHtmlText = (str) =>
        String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

    const { previousRecipeById, previousRecipeByName, pastPlansCheckedCount } = useMemo(() => {
        const byId = new Map();
        const byName = new Map();
        let checkedCount = 0;

        for (const plan of clientPastPlans) {
            if (!plan) continue;
            // Exclude the plan currently being edited so revising a plan doesn't warn against itself
            if (loadedPlanRecord?.id && plan.id === loadedPlanRecord.id) continue;

            checkedCount += 1;
            const pastRecipes = Array.isArray(plan.plan_data?.recipes)
                ? plan.plan_data.recipes
                : [];

            const usageMeta = {
                planId: plan.id,
                revisionNumber: plan.revision_number,
                planTitle: plan.plan_title || `Revision ${plan.revision_number || ''}`.trim(),
                startDate: plan.start_date || null,
            };

            for (const r of pastRecipes) {
                if (!r) continue;
                const rawId = r.id !== undefined && r.id !== null ? String(r.id).trim() : '';
                const normName = String(r.name || '').trim().toLowerCase();

                if (rawId && !rawId.startsWith('custom_')) {
                    const list = byId.get(rawId) || [];
                    if (!list.some((u) => u.planId === plan.id)) {
                        list.push(usageMeta);
                        byId.set(rawId, list);
                    }
                }

                if (normName) {
                    const list = byName.get(normName) || [];
                    if (!list.some((u) => u.planId === plan.id)) {
                        list.push(usageMeta);
                        byName.set(normName, list);
                    }
                }
            }
        }

        return {
            previousRecipeById: byId,
            previousRecipeByName: byName,
            pastPlansCheckedCount: checkedCount,
        };
    }, [clientPastPlans, loadedPlanRecord?.id]);

    const getPreviousRecipeUsages = useCallback(
        (recipe) => {
            if (!recipe) return [];
            const rawId =
                recipe.id !== undefined && recipe.id !== null ? String(recipe.id).trim() : '';
            const normName = String(recipe.name || '').trim().toLowerCase();

            const merged = new Map();
            if (rawId && previousRecipeById.has(rawId)) {
                for (const u of previousRecipeById.get(rawId)) {
                    merged.set(u.planId, u);
                }
            }
            if (normName && previousRecipeByName.has(normName)) {
                for (const u of previousRecipeByName.get(normName)) {
                    merged.set(u.planId, u);
                }
            }

            return Array.from(merged.values()).sort(
                (a, b) => (Number(b.revisionNumber) || 0) - (Number(a.revisionNumber) || 0)
            );
        },
        [previousRecipeById, previousRecipeByName]
    );

    const formatPastUsageBadge = (usages) => {
        if (!Array.isArray(usages) || usages.length === 0) return '';
        const revLabels = usages
            .slice(0, 2)
            .map((u) => (u.revisionNumber ? `Rev ${u.revisionNumber}` : u.planTitle));
        const extra = usages.length > 2 ? ` +${usages.length - 2}` : '';
        return `Used in ${revLabels.join(', ')}${extra}`;
    };

    const formatPastUsageTooltip = (usages) => {
        if (!Array.isArray(usages) || usages.length === 0) return '';
        return usages
            .map(
                (u) =>
                    `Rev ${u.revisionNumber || '—'}: ${u.planTitle}${
                        u.startDate ? ` (${u.startDate})` : ''
                    }`
            )
            .join(' • ');
    };

    const repeatedAttachedCount = useMemo(() => {
        return (formData.recipes || []).filter((r) => getPreviousRecipeUsages(r).length > 0)
            .length;
    }, [formData.recipes, getPreviousRecipeUsages]);

    const confirmRepeatRecipeAttachment = async (recipeName, pastUsages) => {
        const clientLabel = escapeHtmlText(
            effectiveClient?.full_name || formData.client_name || 'this client'
        );
        const safeDish = escapeHtmlText(recipeName || 'This recipe');
        const itemsHtml = pastUsages
            .map((u) => {
                const revTag = u.revisionNumber ? `Rev ${escapeHtmlText(u.revisionNumber)}` : 'Plan';
                const titleTag = escapeHtmlText(u.planTitle || 'Saved Diet Plan');
                const dateTag = u.startDate ? ` <span style="color:#6b7280;">(${escapeHtmlText(u.startDate)})</span>` : '';
                return `<li style="margin:4px 0;"><strong>${revTag}</strong> &mdash; ${titleTag}${dateTag}</li>`;
            })
            .join('');

        const res = await Swal.fire({
            icon: 'warning',
            title: 'Used in Previous Diet Plan',
            html: `<div style="text-align:left;font-size:13px;line-height:1.5;color:#374151;">
                <p style="margin-bottom:8px;"><strong>&ldquo;${safeDish}&rdquo;</strong> was already prescribed to <strong>${clientLabel}</strong> in:</p>
                <ul style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:8px 12px 8px 26px;margin:0 0 10px 0;color:#92400e;">${itemsHtml}</ul>
                <p style="margin:0;color:#6b7280;font-size:12px;">Do you want to attach this recipe again anyway?</p>
            </div>`,
            showCancelButton: true,
            confirmButtonText: 'Attach Anyway',
            cancelButtonText: 'Choose Another',
            confirmButtonColor: '#d97706',
            reverseButtons: true,
        });

        return Boolean(res.isConfirmed);
    };

    const handleToggleRecipe = async (recipe) => {
        const currentRecipes = formData.recipes || [];
        const exists = currentRecipes.some(r => r.id === recipe.id);

        if (exists) {
            setFormData(prev => ({
                ...prev,
                recipes: (prev.recipes || []).filter(r => r.id !== recipe.id)
            }));
            if (editingRecipeId === recipe.id) {
                setEditingRecipeId(null);
            }
            return;
        }

        const pastUsages = getPreviousRecipeUsages(recipe);
        if (pastUsages.length > 0) {
            const proceed = await confirmRepeatRecipeAttachment(recipe.name, pastUsages);
            if (!proceed) return;
        }

        setFormData(prev => {
            const latest = prev.recipes || [];
            if (latest.some(r => r.id === recipe.id)) return prev;
            return {
                ...prev,
                recipes: [...latest, JSON.parse(JSON.stringify(recipe))]
            };
        });
    };

    const handleRemoveSelectedRecipe = (recipeId) => {
        setFormData(prev => ({
            ...prev,
            recipes: (prev.recipes || []).filter(r => r.id !== recipeId)
        }));
        if (editingRecipeId === recipeId) {
            setEditingRecipeId(null);
        }
    };

    const handleClearAllRecipes = () => {
        setFormData(prev => ({ ...prev, recipes: [] }));
        setEditingRecipeId(null);
    };

    // ─── Soft-Edit Recipe Functions (Specific to this Diet Plan) ───
    const handleSoftEditRecipe = (recipeId, field, value) => {
        setFormData(prev => ({
            ...prev,
            recipes: (prev.recipes || []).map(r => {
                if (r.id !== recipeId) return r;
                return {
                    ...r,
                    [field]: value,
                    is_soft_edited: true
                };
            })
        }));
    };

    const handleSoftEditIngredientsText = (recipeId, text) => {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        handleSoftEditRecipe(recipeId, 'ingredients', lines);
    };

    const handleSoftEditInstructionsText = (recipeId, text) => {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        handleSoftEditRecipe(recipeId, 'instructions', lines);
    };

    const handleResetRecipeToMaster = async (recipeId) => {
        let master = availableRecipes.find(r => r.id === recipeId);
        if (!master) {
            try {
                const { data } = await supabase.from('recipes').select('*').eq('id', recipeId).single();
                if (data) master = data;
            } catch (err) {
                console.warn('Error fetching master recipe:', err);
            }
        }
        if (!master) {
            Swal.fire({
                icon: 'warning',
                title: 'Master Recipe Not Found',
                text: 'Could not load original master recipe from clinic database.',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }
        setFormData(prev => ({
            ...prev,
            recipes: (prev.recipes || []).map(r => {
                if (r.id !== recipeId) return r;
                return JSON.parse(JSON.stringify(master));
            })
        }));
        Swal.fire({
            icon: 'info',
            title: 'Reset to Master',
            text: 'Recipe has been restored to the original clinic master version.',
            timer: 1500,
            showConfirmButton: false
        });
    };

    // ─── Create & Attach New Recipe Inline Modal Helpers ───
    const handleOpenNewRecipeModal = () => {
        const prefilledCategory =
            recipeCategoryFilter && recipeCategoryFilter !== 'All'
                ? recipeCategoryFilter
                : 'Breakfast';
        setNewRecipeForm({
            ...EMPTY_NEW_RECIPE,
            name: recipeSearch.trim(),
            category: prefilledCategory,
            ingredients: [''],
            instructions: [''],
        });
        setSaveNewRecipeToBank(true);
        setNewRecipeBulkIngOpen(false);
        setNewRecipeBulkIngText('');
        setNewRecipeBulkInstOpen(false);
        setNewRecipeBulkInstText('');
        setIsNewRecipeModalOpen(true);
    };

    const handleAddNewRecipeIngredient = () => {
        setNewRecipeForm((prev) => ({
            ...prev,
            ingredients: [...prev.ingredients, ''],
        }));
    };

    const handleNewRecipeIngredientChange = (index, value) => {
        setNewRecipeForm((prev) => {
            const updated = [...prev.ingredients];
            updated[index] = value;
            return { ...prev, ingredients: updated };
        });
    };

    const handleRemoveNewRecipeIngredient = (index) => {
        setNewRecipeForm((prev) => {
            const updated = prev.ingredients.filter((_, i) => i !== index);
            return { ...prev, ingredients: updated.length > 0 ? updated : [''] };
        });
    };

    const handleApplyNewRecipeBulkIngredients = () => {
        const lines = newRecipeBulkIngText
            .split('\n')
            .map((l) => l.replace(/^(?:[-*•✓·–—\u2022]\s*|\(?\d+[.)]\s+)/, '').trim())
            .filter(Boolean);
        if (lines.length > 0) {
            setNewRecipeForm((prev) => ({ ...prev, ingredients: lines }));
        }
        setNewRecipeBulkIngOpen(false);
        setNewRecipeBulkIngText('');
    };

    const handleAddNewRecipeInstruction = () => {
        setNewRecipeForm((prev) => ({
            ...prev,
            instructions: [...prev.instructions, ''],
        }));
    };

    const handleNewRecipeInstructionChange = (index, value) => {
        setNewRecipeForm((prev) => {
            const updated = [...prev.instructions];
            updated[index] = value;
            return { ...prev, instructions: updated };
        });
    };

    const handleRemoveNewRecipeInstruction = (index) => {
        setNewRecipeForm((prev) => {
            const updated = prev.instructions.filter((_, i) => i !== index);
            return { ...prev, instructions: updated.length > 0 ? updated : [''] };
        });
    };

    const handleApplyNewRecipeBulkInstructions = () => {
        const lines = newRecipeBulkInstText
            .split('\n')
            .map((l) => l.replace(/^(?:Step\s*\d+[:.]?\s*|[-*•✓·–—\u2022]\s*|\(?\d+[.)]\s+)/i, '').trim())
            .filter(Boolean);
        if (lines.length > 0) {
            setNewRecipeForm((prev) => ({ ...prev, instructions: lines }));
        }
        setNewRecipeBulkInstOpen(false);
        setNewRecipeBulkInstText('');
    };

    const handleCreateAndAttachRecipe = async (e) => {
        e.preventDefault();
        if (!newRecipeForm.name.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Dish Name',
                text: 'Please specify the recipe name.',
            });
            return;
        }

        const cleanIngredients = (newRecipeForm.ingredients || [])
            .map((i) => String(i || '').trim())
            .filter(Boolean);

        const cleanInstructions = (newRecipeForm.instructions || [])
            .map((i) => String(i || '').trim())
            .filter(Boolean);

        if (cleanIngredients.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Ingredients',
                text: 'Please add at least one ingredient.',
            });
            return;
        }

        const pastUsages = getPreviousRecipeUsages({ name: newRecipeForm.name.trim() });
        if (pastUsages.length > 0) {
            const proceed = await confirmRepeatRecipeAttachment(
                newRecipeForm.name.trim(),
                pastUsages
            );
            if (!proceed) return;
        }

        setSavingNewRecipe(true);
        try {
            const payload = {
                name: newRecipeForm.name.trim(),
                category: newRecipeForm.category || 'Breakfast',
                prep_time: newRecipeForm.prep_time?.trim() || '10 mins',
                cook_time: newRecipeForm.cook_time?.trim() || '15 mins',
                servings: newRecipeForm.servings?.trim() || '1 serving',
                calories: newRecipeForm.calories?.trim() || '',
                protein: newRecipeForm.protein?.trim() || '',
                carbs: newRecipeForm.carbs?.trim() || '',
                fats: newRecipeForm.fats?.trim() || '',
                fiber: newRecipeForm.fiber?.trim() || '',
                ingredients: cleanIngredients,
                instructions:
                    cleanInstructions.length > 0 ? cleanInstructions : ['Cook as directed.'],
                dietitian_tip: newRecipeForm.dietitian_tip?.trim() || '',
                updated_at: new Date().toISOString(),
            };

            let attachedRecipe = null;

            if (saveNewRecipeToBank) {
                const { data, error } = await supabase
                    .from('recipes')
                    .insert([payload])
                    .select()
                    .single();

                if (error) throw error;
                attachedRecipe = data;
                setAvailableRecipes((prev) => [
                    data,
                    ...prev.filter((r) => r.id !== data.id),
                ]);
            } else {
                attachedRecipe = {
                    id: `custom_${Date.now()}`,
                    ...payload,
                    is_soft_edited: true,
                };
            }

            setFormData((prev) => ({
                ...prev,
                recipes: [
                    ...(prev.recipes || []),
                    JSON.parse(JSON.stringify(attachedRecipe)),
                ],
            }));

            setIsNewRecipeModalOpen(false);
            Swal.fire({
                icon: 'success',
                title: saveNewRecipeToBank ? 'Recipe Saved & Attached!' : 'Recipe Attached!',
                text: saveNewRecipeToBank
                    ? `"${attachedRecipe.name}" was saved to the Clinic Recipe Bank and attached to this plan.`
                    : `"${attachedRecipe.name}" was attached to this diet plan.`,
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (err) {
            console.error('Error creating recipe:', err);
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: err.message,
                confirmButtonColor: '#2d6a4f',
            });
        } finally {
            setSavingNewRecipe(false);
        }
    };

    // ─── Download PDF Client-Side ───
    const handleDownloadPdf = async () => {
        if (!formData.client_name) {
            Swal.fire({ icon: 'warning', title: 'Missing Client Name', text: 'Please specify the client name before downloading.' });
            return;
        }
        setGenerating(true);
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(<DietPlanPdfDocument plan={formData} />).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const safeName = formData.client_name.replace(/[^a-zA-Z0-9_-]/g, '_');
            a.download = `${safeName}_Diet_Plan_TDC.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            Swal.fire({
                icon: 'success',
                title: 'PDF Downloaded!',
                text: 'The diet plan document has been saved to your downloads.',
                confirmButtonColor: '#2d6a4f',
                timer: 2500
            });
        } catch (error) {
            console.error('Error generating PDF:', error);
            Swal.fire({ icon: 'error', title: 'Generation Failed', text: error.message });
        } finally {
            setGenerating(false);
        }
    };

    // ─── WhatsApp Direct Link ───
    const handleOpenWhatsApp = () => {
        const phone = (formData.client_phone || '').replace(/[^0-9]/g, '');
        const greeting = `Hello ${formData.client_name || ''}! 👋\n\nYour personalized nutrition protocol is ready: *${formData.plan_title}*.\n\nValidity: ${formData.start_date} to ${formData.end_date}\nDaily Target: ${formData.calories} kcal | ${formData.water}L Water | ${formData.steps} Steps.\n\nBest regards,\n*Dt. Sabah Ghare*\nThe Diet Cascade`;

        const encoded = encodeURIComponent(greeting);
        const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
        window.open(url, '_blank');
    };

    return (
        <div className="bg-gray-50 pb-24 md:pb-16 font-sans text-heading">
            <div className="max-w-7xl mx-auto px-0.5 sm:px-2 py-1 sm:py-4">

                {/* ── Clean Contextual Page Header ── */}
                <div className="mb-3 sm:mb-4 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
                            <Link
                                href={selectedClient ? `/admin/clients/${selectedClient.id}` : '/admin/clients'}
                                className="inline-flex items-center gap-1 font-semibold text-gray-500 hover:text-primary transition min-w-0"
                            >
                                <ArrowLeft size={13} className="shrink-0" />
                                <span className="truncate max-w-[170px] sm:max-w-xs">
                                    {selectedClient ? selectedClient.full_name : 'All Clients'}
                                </span>
                            </Link>
                            {loadedPlanRecord && (
                                <>
                                    <span className="text-gray-300 shrink-0">/</span>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] sm:text-[11px] shrink-0">
                                        Rev {loadedPlanRecord.revision_number}
                                    </span>
                                </>
                            )}
                        </div>

                        <Link
                            href="/admin/clients"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-[11px] sm:text-xs font-semibold text-heading transition shrink-0"
                        >
                            <Users size={13} className="text-primary shrink-0" />
                            <span className="sm:hidden">Clients</span>
                            <span className="hidden sm:inline">Client Directory</span>
                        </Link>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <h1 className="text-lg sm:text-2xl font-bold text-heading truncate leading-tight">
                            Diet Plan Generator
                        </h1>

                        {/* Subtle Mobile/Tablet Draft Indicator */}
                        <span className="text-[11px] text-gray-400 xl:hidden inline-flex items-center gap-1 shrink-0">
                            {saveStatus === 'saving' && (
                                <>
                                    <RefreshCw size={10} className="animate-spin text-amber-600" />
                                    <span>Saving…</span>
                                </>
                            )}
                            {(saveStatus === 'saved' || saveStatus === 'restored') && (
                                <>
                                    <CheckCircle size={11} className="text-emerald-600" />
                                    <span>Saved{lastSavedTimeLabel ? ` ${lastSavedTimeLabel}` : ''}</span>
                                </>
                            )}
                            {saveStatus === 'error' && (
                                <>
                                    <AlertCircle size={11} className="text-red-500" />
                                    <span className="text-red-500">Storage full</span>
                                </>
                            )}
                        </span>
                    </div>
                </div>

                {/* ════════════════ SINGLE UNIFIED STICKY WORKSPACE BAR ════════════════ */}
                <div className="sticky top-[3.75rem] md:top-2 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 mb-4 sm:mb-5 border border-gray-200/90 shadow-sm flex flex-wrap items-center gap-x-2 gap-y-2">
                    {/* 1. View Switcher (Mobile Row 1 Left | Desktop Left) */}
                    <div className="order-1 bg-gray-100 p-0.5 rounded-xl flex items-center">
                        <button
                            type="button"
                            onClick={() => setActiveView('editor')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                                activeView === 'editor'
                                    ? 'bg-white text-heading shadow-2xs font-bold'
                                    : 'text-gray-500 hover:text-heading'
                            }`}
                        >
                            <FileText size={13} />
                            <span>Form</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveView('split');
                                setPreviewKey((k) => k + 1);
                            }}
                            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                                activeView === 'split'
                                    ? 'bg-white text-heading shadow-2xs font-bold'
                                    : 'text-gray-500 hover:text-heading'
                            }`}
                        >
                            <Sliders size={13} />
                            <span>Split</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveView('preview');
                                setPreviewKey((k) => k + 1);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                                activeView === 'preview'
                                    ? 'bg-white text-heading shadow-2xs font-bold'
                                    : 'text-gray-500 hover:text-heading'
                            }`}
                        >
                            <Eye size={13} />
                            <span>Preview</span>
                        </button>
                    </div>

                    {/* 2. Compact Print Theme Switch (Mobile Row 2 Left | Desktop Left) */}
                    <div
                        className="order-4 md:order-2 bg-gray-100 p-0.5 rounded-xl flex items-center"
                        title="PDF Typography & Print Layout Theme"
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setFormData((prev) => ({ ...prev, pdf_theme: 'clinical' }));
                                setPreviewKey((k) => k + 1);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                                formData.pdf_theme !== 'senior'
                                    ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                                    : 'text-gray-500 hover:text-heading'
                            }`}
                        >
                            Clinical
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setFormData((prev) => ({ ...prev, pdf_theme: 'senior' }));
                                setPreviewKey((k) => k + 1);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                                formData.pdf_theme === 'senior'
                                    ? 'bg-white text-amber-900 shadow-2xs font-bold'
                                    : 'text-gray-500 hover:text-heading'
                            }`}
                        >
                            <span className="sm:hidden">Senior</span>
                            <span className="hidden sm:inline">Senior Print</span>
                        </button>
                    </div>

                    {/* 3. Subtle Draft Status Text (Wide Desktop) */}
                    <span className="order-3 text-[11px] text-gray-400 hidden xl:inline-flex items-center gap-1 pl-1">
                        {saveStatus === 'saving' && (
                            <>
                                <RefreshCw size={10} className="animate-spin text-amber-600" />
                                <span>Saving draft…</span>
                            </>
                        )}
                        {(saveStatus === 'saved' || saveStatus === 'restored') && (
                            <>
                                <CheckCircle size={11} className="text-emerald-600" />
                                <span>
                                    Draft saved{lastSavedTimeLabel ? ` ${lastSavedTimeLabel}` : ''}
                                </span>
                            </>
                        )}
                        {saveStatus === 'error' && (
                            <>
                                <AlertCircle size={11} className="text-red-500" />
                                <span className="text-red-500">Local draft full</span>
                            </>
                        )}
                    </span>

                    {/* Mobile Row Divider between Row 1 and Row 2 */}
                    <div className="order-3 w-full border-t border-gray-100 md:hidden" />

                    {/* 4. Presets Popover Menu (Mobile Row 2 Right | Desktop Right) */}
                    <div className="order-5 md:order-4 relative ml-auto" ref={presetsMenuRef}>
                        <button
                            type="button"
                            onClick={() => setShowPresetsPopover((o) => !o)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-gray-50 text-heading border border-gray-200 text-xs font-semibold whitespace-nowrap transition cursor-pointer"
                        >
                            <Sparkles size={13} className="text-amber-500 shrink-0" />
                            <span>Presets</span>
                            <ChevronDown size={13} className="text-gray-400 shrink-0" />
                        </button>

                        {showPresetsPopover && (
                            <div className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-xl border border-gray-200 p-2.5 z-50 space-y-2">
                                <div className="flex items-center justify-between px-1 pb-1.5 border-b border-gray-100">
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Clinical Templates ({templates.length})
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPresetsPopover(false);
                                            handleSaveCurrentAsTemplate();
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                                    >
                                        <BookmarkPlus size={12} />
                                        <span>Save Current</span>
                                    </button>
                                </div>

                                {loadingTemplates ? (
                                    <div className="py-4 text-center text-xs text-gray-400">
                                        <RefreshCw size={13} className="animate-spin inline mr-1 text-primary" />
                                        Loading...
                                    </div>
                                ) : templates.length === 0 ? (
                                    <p className="py-3 text-center text-xs text-gray-400">
                                        No templates saved yet.
                                    </p>
                                ) : (
                                    <div className="max-h-56 overflow-y-auto space-y-1">
                                        {templates.map((preset) => (
                                            <div
                                                key={preset.id || preset.label}
                                                className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-emerald-50/60 transition group"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowPresetsPopover(false);
                                                        handleApplyTemplate(preset);
                                                    }}
                                                    className="flex-1 text-left min-w-0 cursor-pointer"
                                                >
                                                    <p className="text-xs font-semibold text-heading truncate">
                                                        {preset.label}
                                                    </p>
                                                    <p className="text-[10px] text-emerald-700 font-medium">
                                                        {preset.badge ||
                                                            (preset.calories
                                                                ? `${preset.calories} kcal`
                                                                : 'Template')}
                                                    </p>
                                                </button>
                                                {preset.id && !preset.is_preset && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) =>
                                                            handleDeleteTemplate(
                                                                preset.id,
                                                                preset.label,
                                                                e
                                                            )
                                                        }
                                                        className="p-1.5 text-gray-400 hover:text-red-500 rounded cursor-pointer"
                                                        title="Delete preset"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 5. Desktop Primary Actions: Save Plan + Download PDF (Hidden on < md, moved to Mobile Bottom Thumb Bar) */}
                    <div className="hidden md:flex md:order-5 items-center gap-2">
                        <div className="relative inline-flex items-center" ref={saveMenuRef}>
                            <button
                                type="button"
                                disabled={savingToClientDb}
                                onClick={() => handleSavePlanToDb('auto')}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 font-bold text-xs whitespace-nowrap transition active:scale-[0.98] cursor-pointer disabled:opacity-50 ${
                                    loadedPlanRecord ? 'rounded-l-xl border-r-0' : 'rounded-xl'
                                }`}
                            >
                                {savingToClientDb ? (
                                    <RefreshCw size={13} className="animate-spin shrink-0" />
                                ) : (
                                    <Save size={13} className="shrink-0" />
                                )}
                                <span>
                                    {loadedPlanRecord
                                        ? `Update Rev ${loadedPlanRecord.revision_number}`
                                        : 'Save Plan'}
                                </span>
                            </button>

                            {loadedPlanRecord && (
                                <button
                                    type="button"
                                    disabled={savingToClientDb}
                                    onClick={() => setShowSaveMenu((o) => !o)}
                                    className="px-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 rounded-r-xl transition cursor-pointer disabled:opacity-50"
                                    title="More save options"
                                >
                                    <ChevronDown size={13} />
                                </button>
                            )}

                            {loadedPlanRecord && showSaveMenu && (
                                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => handleSavePlanToDb('create')}
                                        className="w-full px-3.5 py-2 text-left font-semibold text-heading hover:bg-emerald-50 hover:text-primary flex items-center gap-2 cursor-pointer"
                                    >
                                        <Plus size={13} className="text-primary" />
                                        <span>Save as New Revision</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLoadedPlanRecord(null);
                                            setShowSaveMenu(false);
                                        }}
                                        className="w-full px-3.5 py-2 text-left text-gray-500 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                    >
                                        <X size={13} />
                                        <span>Detach from Rev {loadedPlanRecord.revision_number}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={generating}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-xs whitespace-nowrap transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                            {generating ? (
                                <RefreshCw size={13} className="animate-spin shrink-0" />
                            ) : (
                                <Download size={13} className="shrink-0" />
                            )}
                            <span>Download PDF</span>
                        </button>
                    </div>

                    {/* 6. Quiet Secondary Icon Actions: WhatsApp, Expand/Collapse, Reset (Mobile Row 1 Right | Desktop Far Right) */}
                    <div className="order-2 md:order-6 flex items-center gap-0.5 sm:gap-1 ml-auto md:ml-0 md:pl-1 md:border-l md:border-gray-200 shrink-0">
                        <button
                            type="button"
                            onClick={handleOpenWhatsApp}
                            className="p-2 rounded-xl text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                            title="Share summary on WhatsApp"
                            aria-label="Share summary on WhatsApp"
                        >
                            <Send size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={toggleAllSections}
                            className="p-2 rounded-xl text-gray-500 hover:text-heading hover:bg-gray-100 transition cursor-pointer"
                            title={allExpanded ? 'Collapse all sections' : 'Expand all sections'}
                            aria-label={allExpanded ? 'Collapse all sections' : 'Expand all sections'}
                        >
                            {allExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                        </button>
                        <button
                            type="button"
                            onClick={handleClearForm}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Reset form"
                            aria-label="Reset form"
                        >
                            <RotateCcw size={15} />
                        </button>
                    </div>
                </div>

                {/* ════════════════ SPLIT / SINGLE VIEW LAYOUT ════════════════ */}
                <div className={`grid gap-6 ${activeView === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>

                    {/* ════════════════ FORM EDITOR COLUMN ════════════════ */}
                    {(activeView === 'editor' || activeView === 'split') && (
                        <div className="space-y-4">

                            {/* ── SECTION 1: Client Profile & Timeline ──────────────────── */}
                            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition">
                                <div
                                    onClick={() => toggleSection('profile')}
                                    className="p-3.5 sm:p-4.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-gray-50/60 select-none border-b border-gray-100"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                            <User size={15} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-xs sm:text-sm text-heading flex items-center gap-1.5 min-w-0">
                                                <span className="truncate">1. Client Information &amp; Timeline</span>
                                                {formData.client_name && (
                                                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.2 rounded-full font-bold max-w-[110px] sm:max-w-[180px] truncate shrink-0">
                                                        {formData.client_name}
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-[11px] text-para truncate">
                                                {formData.client_name
                                                    ? `${formData.client_name} • ${formData.client_age || 'Age —'} • ${formData.start_weight || '—'} → ${formData.target_weight || '—'}`
                                                    : 'Client demographics, measurements, habits and dates'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 shrink-0">
                                        {collapsed.profile ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                    </div>
                                </div>

                                {!collapsed.profile && (
                                    <div className="p-4 sm:p-5 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {/* Client Name */}
                                            <div>
                                                <label className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                                                    <span>Client Full Name *</span>
                                                    {selectedClient && (
                                                        <Link
                                                            href={`/admin/clients/${selectedClient.id}`}
                                                            className="text-[10px] font-bold text-primary hover:underline"
                                                        >
                                                            View Profile →
                                                        </Link>
                                                    )}
                                                </label>
                                                <input
                                                    type="text"
                                                    list="admin-clients-datalist"
                                                    value={formData.client_name}
                                                    onChange={(e) => handleClientNameChange(e.target.value)}
                                                    placeholder="e.g., Fatima Al-Zahra"
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                    required
                                                />
                                                <datalist id="admin-clients-datalist">
                                                    {allClients.map((c) => (
                                                        <option key={c.id} value={c.full_name} />
                                                    ))}
                                                </datalist>
                                            </div>

                                            {/* Age */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Age</label>
                                                <input
                                                    type="text"
                                                    value={formData.client_age}
                                                    onChange={(e) => setFormData({ ...formData, client_age: e.target.value })}
                                                    placeholder="e.g., 29 yrs"
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>

                                            {/* Phone */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone / WhatsApp</label>
                                                <input
                                                    type="text"
                                                    value={formData.client_phone}
                                                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                                                    placeholder="+971 50 123 4567 or +91 9876543210"
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>

                                            {/* Current Weight */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Current Weight (kg)</label>
                                                <input
                                                    type="text"
                                                    value={formData.start_weight}
                                                    onChange={(e) => setFormData({ ...formData, start_weight: e.target.value })}
                                                    placeholder="e.g., 68.5 kg"
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>

                                            {/* Height */}
                                            <div>
                                                <label className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                                                    <span>Height</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowHeightConverter((o) => !o)}
                                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline cursor-pointer"
                                                    >
                                                        <Ruler size={10} />
                                                        <span>
                                                            {showHeightConverter ? 'Hide Calc' : 'cm ↔ in & IBW'}
                                                        </span>
                                                    </button>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.client_height}
                                                    readOnly={fieldsLocked}
                                                    onChange={(e) => setFormData({ ...formData, client_height: e.target.value })}
                                                    placeholder="e.g., 165 cm (65 in)"
                                                    className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none ${
                                                        fieldsLocked
                                                            ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                                                            : 'border-gray-200 focus:ring-2 focus:ring-primary/20'
                                                    }`}
                                                />
                                            </div>

                                            {/* Ideal Body Weight (IBW) */}
                                            <div>
                                                <label className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                                                    <span>Ideal Body Weight / IBW (kg)</span>
                                                    {fieldsLocked && (
                                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 font-bold">
                                                            <Lock size={10} /> Locked
                                                        </span>
                                                    )}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.target_weight}
                                                    readOnly={fieldsLocked}
                                                    onChange={(e) => handleManualIbwChange(e.target.value)}
                                                    placeholder="e.g., 60 kg"
                                                    className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none ${
                                                        fieldsLocked
                                                            ? 'bg-gray-50 border-gray-200 text-emerald-800 cursor-not-allowed'
                                                            : 'border-gray-200 text-emerald-900 focus:ring-2 focus:ring-primary/20'
                                                    }`}
                                                />
                                            </div>

                                            {/* ── Collapsible Height (cm ↔ inches) & IBW Auto-Calculator ── */}
                                            {showHeightConverter && (
                                                <div className="sm:col-span-2 lg:col-span-3 rounded-xl bg-gray-50/90 border border-gray-200 p-3 space-y-2.5">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {/* Height Converter (cm <-> inches + ft/in) */}
                                                        <div className="bg-white rounded-xl border border-gray-200/80 p-2.5 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-bold text-gray-700">
                                                                    Height Converter (cm ↔ in)
                                                                </span>
                                                                {calcConfig.heightFeet !== '' && Number(calcConfig.heightCm) > 0 && (
                                                                    <span className="text-[10px] font-semibold text-primary">
                                                                        ≈ {calcConfig.heightFeet}&apos;{calcConfig.heightRemInches}&quot;
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.1"
                                                                    value={calcConfig.heightCm}
                                                                    onChange={(e) => handleHeightCmChange(e.target.value)}
                                                                    placeholder="cm (165)"
                                                                    className="flex-1 min-w-0 text-xs font-semibold text-heading px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                                                />
                                                                <ArrowLeftRight size={12} className="text-gray-400 shrink-0" />
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.1"
                                                                    value={calcConfig.heightInches}
                                                                    onChange={(e) => handleHeightInchesChange(e.target.value)}
                                                                    placeholder="in (65)"
                                                                    className="flex-1 min-w-0 text-xs font-semibold text-heading px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100">
                                                                <span className="text-[10px] text-gray-400">Feet &amp; In:</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="8"
                                                                    step="1"
                                                                    value={calcConfig.heightFeet}
                                                                    onChange={(e) =>
                                                                        handleHeightFeetInchesChange(
                                                                            e.target.value,
                                                                            calcConfig.heightRemInches
                                                                        )
                                                                    }
                                                                    placeholder="5"
                                                                    className="w-12 text-[11px] font-semibold text-heading px-2 py-1 rounded-md border border-gray-200 focus:outline-none focus:border-primary"
                                                                />
                                                                <span className="text-[10px] text-gray-500">ft</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="11.9"
                                                                    step="0.5"
                                                                    value={calcConfig.heightRemInches}
                                                                    onChange={(e) =>
                                                                        handleHeightFeetInchesChange(
                                                                            calcConfig.heightFeet,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    placeholder="5"
                                                                    className="w-14 text-[11px] font-semibold text-heading px-2 py-1 rounded-md border border-gray-200 focus:outline-none focus:border-primary"
                                                                />
                                                                <span className="text-[10px] text-gray-500">in</span>
                                                            </div>
                                                        </div>

                                                        {/* IBW Auto-Calculator */}
                                                        <div className="bg-white rounded-xl border border-gray-200/80 p-2.5 space-y-2">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-[11px] font-bold text-gray-700">
                                                                    IBW (Height cm &minus; Offset)
                                                                </span>
                                                                <select
                                                                    value={
                                                                        Number(calcConfig.ibwOffset) === 100
                                                                            ? '100'
                                                                            : Number(calcConfig.ibwOffset) === 105
                                                                                ? '105'
                                                                                : 'custom'
                                                                    }
                                                                    onChange={(e) => {
                                                                        if (e.target.value !== 'custom') {
                                                                            handleIbwOffsetChange(Number(e.target.value));
                                                                        }
                                                                    }}
                                                                    className="text-[11px] font-semibold px-2 py-0.5 rounded-lg border border-gray-200 bg-gray-50 text-heading focus:outline-none"
                                                                >
                                                                    <option value="100">Male (−100)</option>
                                                                    <option value="105">Female (−105)</option>
                                                                    <option value="custom">Custom Offset</option>
                                                                </select>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="range"
                                                                    min="95"
                                                                    max="115"
                                                                    step="0.5"
                                                                    value={
                                                                        Number.isFinite(Number(calcConfig.ibwOffset))
                                                                            ? Math.min(115, Math.max(95, Number(calcConfig.ibwOffset)))
                                                                            : 105
                                                                    }
                                                                    onChange={(e) => handleIbwOffsetChange(e.target.value)}
                                                                    className="flex-1 accent-primary cursor-pointer h-1.5"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    step="0.5"
                                                                    value={calcConfig.ibwOffset}
                                                                    onChange={(e) => handleIbwOffsetChange(e.target.value)}
                                                                    className="w-16 text-xs font-bold text-heading text-center px-1.5 py-1 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                                                />
                                                            </div>

                                                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-100">
                                                                <span className="text-gray-500">
                                                                    {Number(calcConfig.heightCm) > 0
                                                                        ? `${calcConfig.heightCm} cm − ${calcConfig.ibwOffset}`
                                                                        : 'Enter height on left'}
                                                                </span>
                                                                <span className="font-bold text-primary">
                                                                    {Number.isFinite(activeIbwNum)
                                                                        ? `IBW = ${activeIbwNum} kg`
                                                                        : '—'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Food Habits */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Food Habits</label>
                                                <input
                                                    type="text"
                                                    list="food-habits-list"
                                                    value={formData.food_habits}
                                                    onChange={(e) => setFormData({ ...formData, food_habits: e.target.value })}
                                                    placeholder="e.g., Vegetarian, Non-Vegetarian"
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                                <datalist id="food-habits-list">
                                                    <option value="Vegetarian" />
                                                    <option value="Non-Vegetarian" />
                                                    <option value="Eggetarian" />
                                                    <option value="Vegan" />
                                                    <option value="Jain Vegetarian" />
                                                    <option value="Pescatarian" />
                                                </datalist>
                                            </div>

                                            {/* Lifestyle */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Lifestyle</label>
                                                <input
                                                    type="text"
                                                    list="lifestyle-list"
                                                    value={formData.lifestyle}
                                                    onChange={(e) => setFormData({ ...formData, lifestyle: e.target.value })}
                                                    placeholder="e.g., Sedentary Desk Job, Active"
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                                <datalist id="lifestyle-list">
                                                    <option value="Sedentary (Desk Job)" />
                                                    <option value="Lightly Active" />
                                                    <option value="Moderately Active" />
                                                    <option value="Very Active (Athlete)" />
                                                    <option value="Irregular / Night Shifts" />
                                                </datalist>
                                            </div>

                                            {/* Plan Title */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Plan Title / Phase *</label>
                                                <input
                                                    type="text"
                                                    value={formData.plan_title}
                                                    onChange={(e) => setFormData({ ...formData, plan_title: e.target.value })}
                                                    placeholder="e.g., Phase 1: Metabolic Reset"
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>

                                            {/* Target Goal */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Goal</label>
                                                <input
                                                    type="text"
                                                    value={formData.goal}
                                                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                                                    placeholder="e.g., Fat Loss, Thyroid Support"
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>

                                            {/* Start Date */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Plan Start Date</label>
                                                <input
                                                    type="date"
                                                    value={formData.start_date}
                                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>

                                            {/* End / Review Date */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Plan End / Review Date</label>
                                                <input
                                                    type="date"
                                                    value={formData.end_date}
                                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value, next_review_date: e.target.value })}
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                        </div>

                                        {/* Clinical History Row */}
                                        <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Medical Conditions</label>
                                                <input
                                                    type="text"
                                                    value={formData.medical_conditions}
                                                    onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                                                    placeholder="e.g., PCOS, Hypothyroidism"
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Medication</label>
                                                <input
                                                    type="text"
                                                    value={formData.medication}
                                                    onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
                                                    placeholder="e.g., Thyronorm 50mcg"
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Health Abuses / Habits</label>
                                                <input
                                                    type="text"
                                                    value={formData.health_abuses}
                                                    onChange={(e) => setFormData({ ...formData, health_abuses: e.target.value })}
                                                    placeholder="e.g., Late Night Eating, Excess Caffeine"
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── SECTION 2: Macro & Daily Targets ──────────────────────── */}
                            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition">
                                <div
                                    onClick={() => toggleSection('targets')}
                                    className="p-3.5 sm:p-4.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-gray-50/60 select-none border-b border-gray-100"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                                            <Target size={15} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-xs sm:text-sm text-heading flex items-center gap-1.5 min-w-0">
                                                <span className="truncate">2. Nutritional Targets &amp; Daily Quotas</span>
                                                {formData.calories && (
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full shrink-0">
                                                        {formData.calories} kcal
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-[11px] text-para truncate">
                                                {formData.calories
                                                    ? `${formData.calories} kcal • P: ${formData.protein || '—'} • C: ${formData.carbs || '—'} • F: ${formData.fats || '—'}${formData.fibre ? ` • Fib: ${formData.fibre}` : ''} • ${formData.water || '—'}L Water`
                                                    : 'Calories, Protein, Carbs, Fats, Fibre, Water and Step goals'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 shrink-0">
                                        {collapsed.targets ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                    </div>
                                </div>

                                {!collapsed.targets && (
                                    <div className="p-4 sm:p-5 space-y-3.5">
                                        {/* 7 Clean Target Input Fields FIRST */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                                            <div>
                                                <label className="flex items-center justify-between text-[11px] font-semibold text-gray-600 mb-1">
                                                    <span>Calories (kcal)</span>
                                                    {fieldsLocked && <Lock size={10} className="text-amber-600" />}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.calories}
                                                    readOnly={fieldsLocked}
                                                    onChange={(e) => handleManualCaloriesChange(e.target.value)}
                                                    placeholder="e.g. 1500"
                                                    className={`w-full text-xs font-bold text-emerald-800 px-2.5 py-2 rounded-xl border focus:outline-none ${
                                                        fieldsLocked
                                                            ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                                                            : 'border-gray-200 focus:ring-2 focus:ring-primary/20'
                                                    }`}
                                                />
                                            </div>
                                            <div>
                                                <label className="flex items-center justify-between text-[11px] font-semibold text-gray-600 mb-1">
                                                    <span>Protein (g)</span>
                                                    {fieldsLocked && <Lock size={10} className="text-amber-600" />}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.protein}
                                                    readOnly={fieldsLocked}
                                                    onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                                                    placeholder="e.g. 85g"
                                                    className={`w-full text-xs font-semibold px-2.5 py-2 rounded-xl border focus:outline-none ${
                                                        fieldsLocked
                                                            ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                                                            : 'border-gray-200 focus:ring-2 focus:ring-primary/20'
                                                    }`}
                                                />
                                            </div>
                                            <div>
                                                <label className="flex items-center justify-between text-[11px] font-semibold text-gray-600 mb-1">
                                                    <span>Carbs (g)</span>
                                                    {fieldsLocked && <Lock size={10} className="text-amber-600" />}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.carbs}
                                                    readOnly={fieldsLocked}
                                                    onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                                                    placeholder="e.g. 145g"
                                                    className={`w-full text-xs font-semibold px-2.5 py-2 rounded-xl border focus:outline-none ${
                                                        fieldsLocked
                                                            ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                                                            : 'border-gray-200 focus:ring-2 focus:ring-primary/20'
                                                    }`}
                                                />
                                            </div>
                                            <div>
                                                <label className="flex items-center justify-between text-[11px] font-semibold text-gray-600 mb-1">
                                                    <span>Fats (g)</span>
                                                    {fieldsLocked && <Lock size={10} className="text-amber-600" />}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.fats}
                                                    readOnly={fieldsLocked}
                                                    onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                                                    placeholder="e.g. 42g"
                                                    className={`w-full text-xs font-semibold px-2.5 py-2 rounded-xl border focus:outline-none ${
                                                        fieldsLocked
                                                            ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                                                            : 'border-gray-200 focus:ring-2 focus:ring-primary/20'
                                                    }`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Fibre (g)</label>
                                                <input
                                                    type="text"
                                                    value={formData.fibre}
                                                    onChange={(e) => setFormData({ ...formData, fibre: e.target.value })}
                                                    placeholder="e.g. 30g"
                                                    className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Water (Litres)</label>
                                                <input
                                                    type="text"
                                                    value={formData.water}
                                                    onChange={(e) => setFormData({ ...formData, water: e.target.value })}
                                                    placeholder="e.g. 3.5L"
                                                    className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Steps Target</label>
                                                <input
                                                    type="text"
                                                    value={formData.steps}
                                                    onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                                                    placeholder="e.g. 10,000"
                                                    className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                        </div>

                                        {/* Streamlined Collapsible Auto-Calculator Tray (Zero button clutter) */}
                                        <div className="rounded-xl bg-gray-50/90 border border-gray-200/90 overflow-hidden">
                                            <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleToggleCalculatorPanel}
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-primary transition cursor-pointer text-left min-w-0"
                                                >
                                                    <Calculator size={13} className="text-primary shrink-0" />
                                                    <span className="sm:hidden">Auto-Calc from IBW</span>
                                                    <span className="hidden sm:inline">Auto-Calculate Calories &amp; Macros from IBW</span>
                                                    {Number.isFinite(activeIbwNum) && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                                                            IBW: {activeIbwNum} kg
                                                        </span>
                                                    )}
                                                    {calcConfig.showCalculator ? (
                                                        <ChevronUp size={14} className="text-gray-400 shrink-0" />
                                                    ) : (
                                                        <ChevronDown size={14} className="text-gray-400 shrink-0" />
                                                    )}
                                                </button>

                                                <div className="flex items-center gap-2">
                                                    {calcConfig.showCalculator && macroPctSum !== 100 && (
                                                        <button
                                                            type="button"
                                                            onClick={handleBalanceMacrosTo100}
                                                            className="text-[10px] font-bold text-amber-700 hover:underline cursor-pointer"
                                                        >
                                                            Split {macroPctSum}% → Balance 100%
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={handleToggleLockFields}
                                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-heading cursor-pointer"
                                                        title={
                                                            fieldsLocked
                                                                ? 'Unlock auto-filled target fields'
                                                                : 'Lock auto-filled target fields'
                                                        }
                                                    >
                                                        {fieldsLocked ? (
                                                            <>
                                                                <Lock size={11} className="text-amber-600" />
                                                                <span>Locked</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Unlock size={11} className="text-gray-400" />
                                                                <span>Editable</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {calcConfig.showCalculator && (
                                                <div className="p-3 pt-2 border-t border-gray-200/70 space-y-3 bg-white">
                                                    {/* Single Clean Macro Split Dropdown */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 text-xs">
                                                        <span className="text-[11px] text-gray-500">
                                                            Macro Ratio Preset:
                                                        </span>
                                                        <select
                                                            value={`${calcConfig.proteinPct}/${calcConfig.carbsPct}/${calcConfig.fatsPct}`}
                                                            onChange={(e) => {
                                                                if (e.target.value === 'custom') return;
                                                                const [p, c, f] = e.target.value
                                                                    .split('/')
                                                                    .map(Number);
                                                                handleApplyMacroPreset(p, c, f);
                                                            }}
                                                            className="w-full sm:w-auto text-xs font-semibold px-2.5 py-1.5 sm:py-1 rounded-lg border border-gray-200 bg-gray-50 text-heading focus:outline-none"
                                                        >
                                                            <option value="20/60/20">
                                                                Balanced (20% P / 60% C / 20% F)
                                                            </option>
                                                            <option value="25/55/20">
                                                                High-Protein (25% P / 55% C / 20% F)
                                                            </option>
                                                            <option value="25/60/15">
                                                                Low-Fat (25% P / 60% C / 15% F)
                                                            </option>
                                                            <option value="25/50/25">
                                                                Moderate-Carb (25% P / 50% C / 25% F)
                                                            </option>
                                                            <option value="custom">
                                                                Custom ({calcConfig.proteinPct}% / {calcConfig.carbsPct}% / {calcConfig.fatsPct}%)
                                                            </option>
                                                        </select>
                                                    </div>

                                                    {/* 2x2 Clean Sliders + Direct Inputs */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                        {/* Calories */}
                                                        <div className="p-2.5 rounded-xl border border-gray-200/80 space-y-1.5">
                                                            <div className="flex items-center justify-between text-[11px]">
                                                                <span className="font-bold text-gray-700">
                                                                    Calories (IBW &times; 20&ndash;30)
                                                                </span>
                                                                <span className="font-bold text-emerald-800">
                                                                    {Number.isFinite(activeCaloriesNum)
                                                                        ? `${activeCaloriesNum} kcal`
                                                                        : '—'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="range"
                                                                    min="20"
                                                                    max="30"
                                                                    step="0.5"
                                                                    value={
                                                                        Number.isFinite(Number(calcConfig.calMultiplier))
                                                                            ? Math.min(30, Math.max(20, Number(calcConfig.calMultiplier)))
                                                                            : 25
                                                                    }
                                                                    onChange={(e) => handleCalMultiplierChange(e.target.value)}
                                                                    className="flex-1 accent-primary cursor-pointer h-1.5"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    min="10"
                                                                    max="50"
                                                                    step="0.5"
                                                                    value={calcConfig.calMultiplier}
                                                                    onChange={(e) => handleCalMultiplierChange(e.target.value)}
                                                                    className="w-14 text-xs font-bold text-heading text-center px-1.5 py-1 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Protein */}
                                                        <div className="p-2.5 rounded-xl border border-gray-200/80 space-y-1.5">
                                                            <div className="flex items-center justify-between text-[11px]">
                                                                <span className="font-bold text-gray-700">
                                                                    Protein % (15&ndash;25% &divide; 4)
                                                                </span>
                                                                <span className="font-bold text-primary">
                                                                    {formData.protein || '—'}
                                                                    {proteinPerKgIbw ? ` (${proteinPerKgIbw} g/kg)` : ''}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="range"
                                                                    min="15"
                                                                    max="25"
                                                                    step="0.5"
                                                                    value={
                                                                        Number.isFinite(Number(calcConfig.proteinPct))
                                                                            ? Math.min(25, Math.max(15, Number(calcConfig.proteinPct)))
                                                                            : 20
                                                                    }
                                                                    onChange={(e) => handleMacroPctChange('proteinPct', e.target.value)}
                                                                    className="flex-1 accent-primary cursor-pointer h-1.5"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    min="5"
                                                                    max="50"
                                                                    step="0.5"
                                                                    value={calcConfig.proteinPct}
                                                                    onChange={(e) => handleMacroPctChange('proteinPct', e.target.value)}
                                                                    className="w-14 text-xs font-bold text-heading text-center px-1.5 py-1 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Carbs */}
                                                        <div className="p-2.5 rounded-xl border border-gray-200/80 space-y-1.5">
                                                            <div className="flex items-center justify-between text-[11px]">
                                                                <span className="font-bold text-gray-700">
                                                                    Carbs % (40&ndash;60% &divide; 4)
                                                                </span>
                                                                <span className="font-bold text-primary">
                                                                    {formData.carbs || '—'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="range"
                                                                    min="40"
                                                                    max="60"
                                                                    step="0.5"
                                                                    value={
                                                                        Number.isFinite(Number(calcConfig.carbsPct))
                                                                            ? Math.min(60, Math.max(40, Number(calcConfig.carbsPct)))
                                                                            : 60
                                                                    }
                                                                    onChange={(e) => handleMacroPctChange('carbsPct', e.target.value)}
                                                                    className="flex-1 accent-primary cursor-pointer h-1.5"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    min="10"
                                                                    max="75"
                                                                    step="0.5"
                                                                    value={calcConfig.carbsPct}
                                                                    onChange={(e) => handleMacroPctChange('carbsPct', e.target.value)}
                                                                    className="w-14 text-xs font-bold text-heading text-center px-1.5 py-1 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Fats */}
                                                        <div className="p-2.5 rounded-xl border border-gray-200/80 space-y-1.5">
                                                            <div className="flex items-center justify-between text-[11px]">
                                                                <span className="font-bold text-gray-700">
                                                                    Fats % (12&ndash;20% &divide; 9)
                                                                </span>
                                                                <span className="font-bold text-primary">
                                                                    {formData.fats || '—'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="range"
                                                                    min="12"
                                                                    max="30"
                                                                    step="0.5"
                                                                    value={
                                                                        Number.isFinite(Number(calcConfig.fatsPct))
                                                                            ? Math.min(30, Math.max(12, Number(calcConfig.fatsPct)))
                                                                            : 20
                                                                    }
                                                                    onChange={(e) => handleMacroPctChange('fatsPct', e.target.value)}
                                                                    className="flex-1 accent-primary cursor-pointer h-1.5"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    min="5"
                                                                    max="50"
                                                                    step="0.5"
                                                                    value={calcConfig.fatsPct}
                                                                    onChange={(e) => handleMacroPctChange('fatsPct', e.target.value)}
                                                                    className="w-14 text-xs font-bold text-heading text-center px-1.5 py-1 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── SECTION 3: Body Measurements & Progress Tracker ────────── */}
                            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition">
                                <div
                                    onClick={() => toggleSection('measurements')}
                                    className="p-4 sm:p-4.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 select-none border-b border-gray-100"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                                            <Scale size={15} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-xs sm:text-sm text-heading flex items-center gap-2 truncate">
                                                <span>3. Body Measurements</span>
                                                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.2 rounded-full shrink-0">
                                                    {(formData.measurements || []).length} Records
                                                </span>
                                                {activeMeasurementColsCount > 0 && (
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full shrink-0 hidden sm:inline-block">
                                                        {activeMeasurementColsCount} Active Cols in PDF
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-[11px] text-para truncate">
                                                {(formData.measurements || []).length > 0
                                                    ? `${(formData.measurements || []).length} checkpoint(s) logged • Dynamic PDF columns auto-format`
                                                    : 'Track weight, belly button, hip, thigh, neck, bicep circumferences over time'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddMeasurement();
                                                if (collapsed.measurements) toggleSection('measurements');
                                            }}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition cursor-pointer"
                                        >
                                            <Plus size={13} />
                                        </button>
                                        <span className="text-gray-400">
                                            {collapsed.measurements ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                        </span>
                                    </div>
                                </div>

                                {!collapsed.measurements && (
                                    <div className="p-3.5 sm:p-5 space-y-3">
                                        {(formData.measurements || []).length === 0 ? (
                                            <div className="text-center py-7 px-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
                                                <Scale className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-xs font-semibold text-gray-600 mb-1">No Measurement Checkpoints Logged Yet</p>
                                                <p className="text-[11px] text-gray-400 max-w-md mx-auto mb-3">
                                                    Record periodic client measurements (weight, belly button, hip, thigh, neck, bicep). Only columns with entered values will appear on the generated PDF.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={handleAddMeasurement}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition shadow-xs cursor-pointer"
                                                >
                                                    <Plus size={13} />
                                                    <span>Add First Measurement Row</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-2xs">
                                                    <table className="w-full text-left text-xs border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-50 text-[11px] font-bold text-gray-700 border-b border-gray-200">
                                                                <th className="py-2.5 px-3 w-10 text-center">#</th>
                                                                <th className="py-2.5 px-3 min-w-[130px]">
                                                                    <div className="flex items-center gap-1">
                                                                        <span>Date</span>
                                                                    </div>
                                                                </th>
                                                                <th className="py-2.5 px-2.5 min-w-[105px]">
                                                                    <div className="flex items-center gap-1">
                                                                        <span>Weight</span>
                                                                        <span className="text-[10px] text-gray-400 font-normal">(kg)</span>
                                                                    </div>
                                                                </th>
                                                                <th className="py-2.5 px-2.5 min-w-[115px]">
                                                                    <div className="flex items-center gap-1">
                                                                        <span>Belly Button</span>
                                                                        <span className="text-[10px] text-gray-400 font-normal">(in/cm)</span>
                                                                    </div>
                                                                </th>
                                                                <th className="py-2.5 px-2.5 min-w-[105px]">
                                                                    <div className="flex items-center gap-1">
                                                                        <span>Hip</span>
                                                                        <span className="text-[10px] text-gray-400 font-normal">(in/cm)</span>
                                                                    </div>
                                                                </th>
                                                                <th className="py-2.5 px-2.5 min-w-[105px]">
                                                                    <div className="flex items-center gap-1">
                                                                        <span>Thigh</span>
                                                                        <span className="text-[10px] text-gray-400 font-normal">(in/cm)</span>
                                                                    </div>
                                                                </th>
                                                                <th className="py-2.5 px-2.5 min-w-[105px]">
                                                                    <div className="flex items-center gap-1">
                                                                        <span>Neck</span>
                                                                        <span className="text-[10px] text-gray-400 font-normal">(in/cm)</span>
                                                                    </div>
                                                                </th>
                                                                <th className="py-2.5 px-2.5 min-w-[105px]">
                                                                    <div className="flex items-center gap-1">
                                                                        <span>Bicep</span>
                                                                        <span className="text-[10px] text-gray-400 font-normal">(in/cm)</span>
                                                                    </div>
                                                                </th>
                                                                <th className="py-2.5 px-2 w-10 text-center"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100 bg-white">
                                                            {formData.measurements.map((row, idx) => (
                                                                <tr key={idx} className="hover:bg-gray-50/60 transition">
                                                                    <td className="py-2 px-2 text-center text-gray-400 font-bold text-[11px]">
                                                                        {idx + 1}
                                                                    </td>
                                                                    <td className="py-2 px-2">
                                                                        <input
                                                                            type="date"
                                                                            value={row.date || ''}
                                                                            onChange={(e) => handleMeasurementChange(idx, 'date', e.target.value)}
                                                                            className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary/30 font-medium bg-white"
                                                                        />
                                                                    </td>
                                                                    <td className="py-2 px-2">
                                                                        <input
                                                                            type="text"
                                                                            value={row.weight || ''}
                                                                            onChange={(e) => handleMeasurementChange(idx, 'weight', e.target.value)}
                                                                            placeholder="e.g. 68.5 kg"
                                                                            className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary/30 font-semibold text-emerald-800 bg-white"
                                                                        />
                                                                    </td>
                                                                    <td className="py-2 px-2">
                                                                        <input
                                                                            type="text"
                                                                            value={row.belly_button || ''}
                                                                            onChange={(e) => handleMeasurementChange(idx, 'belly_button', e.target.value)}
                                                                            placeholder="e.g. 34 in"
                                                                            className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                                                                        />
                                                                    </td>
                                                                    <td className="py-2 px-2">
                                                                        <input
                                                                            type="text"
                                                                            value={row.hip || ''}
                                                                            onChange={(e) => handleMeasurementChange(idx, 'hip', e.target.value)}
                                                                            placeholder="e.g. 38 in"
                                                                            className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                                                                        />
                                                                    </td>
                                                                    <td className="py-2 px-2">
                                                                        <input
                                                                            type="text"
                                                                            value={row.thigh || ''}
                                                                            onChange={(e) => handleMeasurementChange(idx, 'thigh', e.target.value)}
                                                                            placeholder="e.g. 22 in"
                                                                            className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                                                                        />
                                                                    </td>
                                                                    <td className="py-2 px-2">
                                                                        <input
                                                                            type="text"
                                                                            value={row.neck || ''}
                                                                            onChange={(e) => handleMeasurementChange(idx, 'neck', e.target.value)}
                                                                            placeholder="e.g. 14 in"
                                                                            className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary/30 bg-white"
                                                                        />
                                                                    </td>
                                                                    <td className="py-2 px-2">
                                                                        <input
                                                                            type="text"
                                                                            value={row.bicep || ''}
                                                                            onChange={(e) => handleMeasurementChange(idx, 'bicep', e.target.value)}
                                                                            placeholder="e.g. 12 in"
                                                                            className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary/30 bg-white"
                                                                        />
                                                                    </td>
                                                                    <td className="py-2 px-2 text-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveMeasurement(idx)}
                                                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer transition"
                                                                            title="Delete Row"
                                                                        >
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-gray-500">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={handleAddMeasurement}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition cursor-pointer text-xs"
                                                        >
                                                            <Plus size={13} />
                                                            <span>Add Next Checkpoint</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleClearMeasurements}
                                                            className="text-gray-400 hover:text-red-500 hover:underline px-2 py-1 cursor-pointer"
                                                        >
                                                            Clear All Rows
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                                                        <Info size={12} className="text-primary shrink-0" />
                                                        <span>Dynamic columns: only columns with entered data appear in the PDF report.</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── SECTION 4: Daily Meal Schedule Blueprint ──────────────── */}
                            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition">
                                <div
                                    onClick={() => toggleSection('meals')}
                                    className="p-3.5 sm:p-4.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-gray-50/60 select-none border-b border-gray-100"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                                            <Clock size={15} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-xs sm:text-sm text-heading flex items-center gap-1.5 min-w-0">
                                                <span className="truncate">4. Daily Meal Schedule Blueprint</span>
                                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.2 rounded-full shrink-0">
                                                    {formData.meals.length} Slots
                                                </span>
                                            </h3>
                                            <p className="text-[11px] text-para truncate">
                                                {formData.meals.length > 0
                                                    ? formData.meals.map(m => m.name).join(' → ')
                                                    : 'Meal timings, options, and chef cooking notes'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddMeal();
                                                if (collapsed.meals) toggleSection('meals');
                                            }}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition cursor-pointer"
                                        >
                                            <Plus size={13} />
                                        </button>
                                        <span className="text-gray-400">
                                            {collapsed.meals ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                        </span>
                                    </div>
                                </div>

                                {!collapsed.meals && (
                                    <div className="p-4 sm:p-5 space-y-3.5">
                                        {formData.meals.length === 0 ? (
                                            <div className="text-center py-8 px-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                                <Clock size={24} className="mx-auto mb-2 text-gray-400" />
                                                <p className="text-xs font-bold text-heading">No meal slots configured</p>
                                                <p className="text-[11px] text-para mb-3">Add meal timings and food options or load a preset above.</p>
                                                <button
                                                    type="button"
                                                    onClick={handleAddMeal}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover shadow-xs"
                                                >
                                                    <Plus size={14} />
                                                    Add First Meal
                                                </button>
                                            </div>
                                        ) : (
                                            formData.meals.map((meal, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-gray-50/80 border border-gray-200/90 rounded-xl p-3 sm:p-4 hover:border-primary/40 transition"
                                                >
                                                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 mb-2.5">
                                                        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                                                            <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                                                {index + 1}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={meal.name}
                                                                onChange={(e) => handleMealChange(index, 'name', e.target.value)}
                                                                placeholder="Meal Name (e.g. Breakfast)"
                                                                className="font-bold text-heading text-xs px-2 py-1 rounded-lg border border-transparent hover:border-gray-300 focus:border-primary focus:bg-white bg-transparent flex-1 min-w-0"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                                                            <input
                                                                type="text"
                                                                value={meal.time}
                                                                onChange={(e) => handleMealChange(index, 'time', e.target.value)}
                                                                placeholder="8:30 AM"
                                                                className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 w-20 sm:w-28 text-center"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveMeal(index)}
                                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition cursor-pointer shrink-0"
                                                                title="Delete Meal"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {getMealOptions(meal).map((opt, optIndex) => (
                                                            <div key={optIndex} className="relative">
                                                                <div className="flex items-center justify-between mb-0.5">
                                                                    <label className={`text-[10px] font-bold uppercase ${optIndex === 0 ? 'text-primary' : 'text-amber-700'}`}>
                                                                        Option {optIndex + 1} {optIndex === 0 ? '(Primary Choice)' : '(Alternative / Swap)'}
                                                                    </label>
                                                                    {getMealOptions(meal).length > 1 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveMealOption(index, optIndex)}
                                                                            className="text-[10px] text-gray-400 hover:text-red-500 px-1"
                                                                        >
                                                                            Remove Option
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <textarea
                                                                    rows={2}
                                                                    value={opt}
                                                                    onChange={(e) => handleMealOptionChange(index, optIndex, e.target.value)}
                                                                    placeholder={optIndex === 0 ? "e.g. 2 Moong Dal Chillas + 2 tbsp Mint Chutney" : "e.g. 1 Bowl Vegetable Oats with 40g Paneer"}
                                                                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary/20 bg-white"
                                                                />
                                                            </div>
                                                        ))}

                                                        <div className="flex items-center justify-between pt-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddMealOption(index)}
                                                                className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <Plus size={12} />
                                                                <span>Add Option {getMealOptions(meal).length + 1}</span>
                                                            </button>
                                                        </div>

                                                        <div className="space-y-1.5 pt-1">
                                                            <div className="relative">
                                                                <div className="flex items-center justify-between mb-0.5">
                                                                    <label className="text-[10px] font-bold uppercase text-purple-700 flex items-center gap-1">
                                                                        <span>Optional Dish (Add-on)</span>
                                                                        <span className="hidden sm:inline text-[9px] font-normal text-gray-400 normal-case">(client can choose to have or skip in addition to options)</span>
                                                                    </label>
                                                                    {meal.optional && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleMealChange(index, 'optional', '')}
                                                                            className="text-[10px] text-gray-400 hover:text-red-500 cursor-pointer"
                                                                        >
                                                                            Clear
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={meal.optional || ''}
                                                                    onChange={(e) => handleMealChange(index, 'optional', e.target.value)}
                                                                    placeholder="e.g. 1 Boiled Egg / 1 Bowl Cucumber Salad (optional add-on)"
                                                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-purple-200/80 bg-purple-50/20 focus:bg-white focus:border-purple-400 text-purple-950 placeholder:text-gray-400 transition"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="text-[10px] font-bold uppercase text-gray-500 mb-0.5 block">
                                                                    Chef Note / Preparation
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={meal.notes || ''}
                                                                    onChange={(e) => handleMealChange(index, 'notes', e.target.value)}
                                                                    placeholder="Chef Note (e.g. Cook with 1/2 tsp ghee; chew thoroughly)"
                                                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-para placeholder:text-gray-400 focus:border-primary transition"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>


                            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition">
                                <div
                                    onClick={() => toggleSection('supplements')}
                                    className="p-3.5 sm:p-4.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 select-none border-b border-gray-100 gap-2"
                                >
                                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                                            <Sparkles size={15} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-xs sm:text-sm text-heading flex items-center gap-1.5 whitespace-nowrap">
                                                <span>5. Supplements</span>
                                                <span className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                                                    {formData.supplements.length}
                                                </span>
                                            </h3>
                                            <p className="text-[11px] text-para line-clamp-1 truncate">
                                                {formData.supplements.filter(s => s.name).map(s => s.name).join(', ') || 'Nutraceuticals, vitamins & timings'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddSupp();
                                                if (collapsed.supplements) toggleSection('supplements');
                                            }}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold rounded-lg transition cursor-pointer"
                                        >
                                            <Plus size={13} />
                                        </button>
                                        <span className="text-gray-400">
                                            {collapsed.supplements ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                        </span>
                                    </div>
                                </div>

                                {!collapsed.supplements && (
                                    <div className="p-3.5 sm:p-5 space-y-2.5">
                                        {formData.supplements.length === 0 ? (
                                            <div className="py-4 px-4 border border-dashed border-gray-200 rounded-xl bg-gray-50 text-center">
                                                <p className="text-xs text-gray-500">No supplements prescribed. Click &quot;Add&quot; to prescribe vitamins or minerals.</p>
                                            </div>
                                        ) : (
                                            formData.supplements.map((supp, sIdx) => (
                                                <div
                                                    key={sIdx}
                                                    className="bg-gray-50/70 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-gray-200/80 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2"
                                                >
                                                    {/* Mobile Top Row: Supplement Name + Delete */}
                                                    <div className="flex items-center gap-2 flex-1 sm:flex-2 min-w-0">
                                                        <input
                                                            type="text"
                                                            value={supp.name}
                                                            onChange={(e) => handleSuppChange(sIdx, 'name', e.target.value)}
                                                            placeholder="Supplement (e.g. Omega-3)"
                                                            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:ring-1 focus:ring-primary/20 bg-white min-w-0"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveSupp(sIdx)}
                                                            className="sm:hidden text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg cursor-pointer shrink-0 transition"
                                                            title="Delete Supplement"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>

                                                    {/* Mobile Bottom Row: Dosage & Timing / Desktop Inline */}
                                                    <div className="flex items-center gap-2 sm:flex-2 min-w-0">
                                                        <input
                                                            type="text"
                                                            value={supp.dosage}
                                                            onChange={(e) => handleSuppChange(sIdx, 'dosage', e.target.value)}
                                                            placeholder="Dosage (e.g. 1000mg)"
                                                            className="flex-1 text-xs px-2.5 py-2 rounded-xl border border-gray-200 focus:ring-1 focus:ring-primary/20 bg-white min-w-0"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={supp.timing}
                                                            onChange={(e) => handleSuppChange(sIdx, 'timing', e.target.value)}
                                                            placeholder="Timing (e.g. Post-Lunch)"
                                                            className="flex-1 text-xs px-2.5 py-2 rounded-xl border border-gray-200 focus:ring-1 focus:ring-primary/20 bg-white min-w-0"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveSupp(sIdx)}
                                                            className="hidden sm:block text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer shrink-0 transition"
                                                            title="Delete Supplement"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── SECTION 6: Prescribed Workout Regimen ───────────────────────── */}
                            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition">
                                <div
                                    onClick={() => toggleSection('workouts')}
                                    className="p-3.5 sm:p-4.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 select-none border-b border-gray-100 gap-2"
                                >
                                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                                            <Dumbbell size={15} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-xs sm:text-sm text-heading flex items-center gap-1.5 whitespace-nowrap">
                                                <span>6. Workout & Movement Regimen</span>
                                                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                                                    {formData.workouts?.length || 0}
                                                </span>
                                            </h3>
                                            <p className="text-[11px] text-para line-clamp-1 truncate">
                                                {formData.workouts && formData.workouts.length > 0
                                                    ? formData.workouts.map(w => w.day || 'Day').join(', ')
                                                    : 'Day-by-day split, exercises, cardio & notes'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddWorkout();
                                                if (collapsed.workouts) toggleSection('workouts');
                                            }}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg transition cursor-pointer hover:bg-emerald-100"
                                        >
                                            <Plus size={13} />
                                            <span className="hidden sm:inline">Add Day</span>
                                        </button>
                                        <span className="text-gray-400">
                                            {collapsed.workouts ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                        </span>
                                    </div>
                                </div>

                                {!collapsed.workouts && (
                                    <div className="p-3.5 sm:p-5 space-y-3">
                                        {/* Workout Preset Dropdown */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 pb-2 border-b border-gray-100">
                                            <span className="text-[11px] font-semibold text-gray-500">
                                                Routine Template:
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    defaultValue=""
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            handleApplyWorkoutPreset(e.target.value);
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                    className="w-full sm:w-auto text-xs font-semibold px-2.5 py-1.5 sm:py-1 rounded-lg border border-gray-200 bg-gray-50 text-heading focus:outline-none"
                                                >
                                                    <option value="">Load Workout Preset…</option>
                                                    <option value="3day">3-Day Full Body &amp; Strength Split</option>
                                                    <option value="cardio">Zone-2 Cardio &amp; Daily Steps</option>
                                                    {formData.workouts?.length > 0 && (
                                                        <option value="clear">Clear Workout Days</option>
                                                    )}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Workout Days List */}
                                        {(!formData.workouts || formData.workouts.length === 0) ? (
                                            <div className="py-6 px-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/70 text-center space-y-2">
                                                <p className="text-xs text-gray-500">No workout routine prescribed yet.</p>
                                                <button
                                                    type="button"
                                                    onClick={handleAddWorkout}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-xs font-medium text-gray-700 rounded-lg hover:border-emerald-500 hover:text-emerald-700 transition shadow-xs cursor-pointer"
                                                >
                                                    <Plus size={13} />
                                                    Add Workout Day
                                                </button>
                                            </div>
                                        ) : (
                                            formData.workouts.map((workout, wIdx) => (
                                                <div
                                                    key={wIdx}
                                                    className="p-3 sm:p-3.5 rounded-xl border border-gray-200/90 bg-gray-50/40 hover:bg-white hover:border-emerald-200 transition space-y-2.5 shadow-2xs"
                                                >
                                                    {/* Header: Day/Split + Focus + Remove */}
                                                    <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                                                        <div className="flex items-center gap-2 sm:w-1/3 sm:min-w-[130px]">
                                                            <input
                                                                type="text"
                                                                value={workout.day}
                                                                onChange={(e) => handleWorkoutChange(wIdx, 'day', e.target.value)}
                                                                placeholder="Day (e.g. Day 1 (Mon))"
                                                                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary/20 bg-white min-w-0"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveWorkout(wIdx)}
                                                                className="sm:hidden text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer transition shrink-0"
                                                                title="Delete Workout Day"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <input
                                                                type="text"
                                                                value={workout.focus}
                                                                onChange={(e) => handleWorkoutChange(wIdx, 'focus', e.target.value)}
                                                                placeholder="Focus (e.g. Upper Body & Core)"
                                                                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary/20 bg-white"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveWorkout(wIdx)}
                                                            className="hidden sm:block text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer transition shrink-0"
                                                            title="Delete Workout Day"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Exercises / Routine Textarea/Input */}
                                                    <div>
                                                        <input
                                                            type="text"
                                                            value={workout.exercises}
                                                            onChange={(e) => handleWorkoutChange(wIdx, 'exercises', e.target.value)}
                                                            placeholder="Exercises (e.g. Push-ups 3x12, DB Rows 3x10, Plank 3x45s)"
                                                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary/20 bg-white"
                                                        />
                                                    </div>

                                                    {/* Cardio & Steps + Directives / Notes */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        <input
                                                            type="text"
                                                            value={workout.cardio}
                                                            onChange={(e) => handleWorkoutChange(wIdx, 'cardio', e.target.value)}
                                                            placeholder="Cardio & Steps (e.g. 20m brisk walk / 8k steps)"
                                                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary/20 bg-white"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={workout.notes}
                                                            onChange={(e) => handleWorkoutChange(wIdx, 'notes', e.target.value)}
                                                            placeholder="Notes / Rest (e.g. Rest 60s, stay hydrated)"
                                                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary/20 bg-white"
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── SECTION 7: Special Clinical Directives (Edge-Case Page) ── */}
                            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition">
                                <div
                                    onClick={() => toggleSection('special')}
                                    className="p-3.5 sm:p-4.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 select-none border-b border-gray-100 gap-2"
                                >
                                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                                            <ShieldAlert size={15} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-xs sm:text-sm text-heading flex items-center gap-1.5 whitespace-nowrap">
                                                <span>7. Special Directives</span>
                                            </h3>
                                            <p className="text-[11px] text-para line-clamp-1 truncate">
                                                {formData.show_special_instructions
                                                    ? `${formData.special_instructions_title || 'Special Directives'} (${formData.special_instructions_theme})`
                                                    : 'Optional custom page for diabetes, renal, GERD'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFormData(prev => ({ ...prev, show_special_instructions: !prev.show_special_instructions }));
                                                if (collapsed.special) toggleSection('special');
                                            }}
                                            className={`text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-lg border transition cursor-pointer ${formData.show_special_instructions
                                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                                                }`}
                                        >
                                            {formData.show_special_instructions ? 'Disable' : 'Enable'}
                                        </button>
                                        <span className="text-gray-400">
                                            {collapsed.special ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                        </span>
                                    </div>
                                </div>

                                {!collapsed.special && (
                                    <div className="p-3.5 sm:p-5 space-y-4">
                                        {/* Clinical Condition Preset Dropdown */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 pb-2 border-b border-gray-100">
                                            <span className="text-[11px] font-semibold text-gray-500">
                                                Clinical Condition Protocol:
                                            </span>
                                            <select
                                                defaultValue=""
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        handleApplySpecialPreset(e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                                className="w-full sm:w-auto text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-heading focus:outline-none"
                                            >
                                                <option value="">Load Condition Protocol…</option>
                                                <option value="diabetes">Type 2 Diabetes &amp; Glycemic Control</option>
                                                <option value="cardiac">Cardiac &amp; Low-Sodium Protocol</option>
                                                <option value="gerd">GERD &amp; Gut Mucosa Healing</option>
                                                <option value="fatty_liver">Fatty Liver (NAFLD) &amp; Lipids</option>
                                                <option value="pcos">PCOS &amp; Hormonal Balance</option>
                                                {formData.show_special_instructions && (
                                                    <option value="clear">Clear &amp; Disable Directives</option>
                                                )}
                                            </select>
                                        </div>

                                        {!formData.show_special_instructions ? (
                                            <div className="py-4 px-4 border border-dashed border-gray-200 rounded-xl bg-gray-50 text-center">
                                                <p className="text-xs text-gray-500">This optional page is currently turned off for standard plans.</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, show_special_instructions: true }))}
                                                    className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer"
                                                >
                                                    + Enable Dedicated Directives Page
                                                </button>
                                            </div>
                                        ) : (
                                            <>

                                                {/* Theme and Box Style */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                                                    <div>
                                                        <label className="block text-[10.5px] font-semibold text-gray-600 mb-1">Color Accent</label>
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            {['emerald', 'amber', 'indigo', 'rose', 'slate'].map(thm => (
                                                                <button
                                                                    key={thm}
                                                                    type="button"
                                                                    onClick={() => setFormData(prev => ({ ...prev, special_instructions_theme: thm }))}
                                                                    className={`px-2 py-1 text-[10px] font-bold rounded-lg capitalize border ${formData.special_instructions_theme === thm
                                                                        ? 'bg-white border-primary shadow-xs ring-1 ring-primary/20 text-primary'
                                                                        : 'bg-gray-100 border-transparent text-gray-600'
                                                                        }`}
                                                                >
                                                                    {thm}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10.5px] font-semibold text-gray-600 mb-1">Frame Style</label>
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            {[
                                                                { key: 'callout', label: 'Callout Bar' },
                                                                { key: 'framed', label: 'Bordered' },
                                                                { key: 'banner', label: 'Top Banner' }
                                                            ].map(st => (
                                                                <button
                                                                    key={st.key}
                                                                    type="button"
                                                                    onClick={() => setFormData(prev => ({ ...prev, special_instructions_style: st.key }))}
                                                                    className={`px-2 py-1 text-[10px] font-bold rounded-lg border ${formData.special_instructions_style === st.key
                                                                        ? 'bg-white border-primary shadow-xs ring-1 ring-primary/20 text-primary'
                                                                        : 'bg-gray-100 border-transparent text-gray-600'
                                                                        }`}
                                                                >
                                                                    {st.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Title & Badge */}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                    <div className="sm:col-span-2">
                                                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">Box Title</label>
                                                        <input
                                                            type="text"
                                                            value={formData.special_instructions_title}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, special_instructions_title: e.target.value }))}
                                                            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">Badge Tag</label>
                                                        <input
                                                            type="text"
                                                            value={formData.special_instructions_badge}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, special_instructions_badge: e.target.value }))}
                                                            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 uppercase"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Textarea */}
                                                <div>
                                                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Clinical Directives (Bulleted)</label>
                                                    <textarea
                                                        rows={4}
                                                        value={formData.special_instructions}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
                                                        placeholder="- Strict 3-hour intervals\n- Avoid simple sugars"
                                                        className="w-full text-xs p-3 rounded-xl border border-gray-200 font-mono"
                                                    />
                                                </div>

                                                {/* Warning Strip */}
                                                <div>
                                                    <label className="block text-[11px] font-semibold text-rose-800 mb-1">Critical Caution / Red Flags (Optional Warning Strip)</label>
                                                    <input
                                                        type="text"
                                                        value={formData.special_instructions_warning}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, special_instructions_warning: e.target.value }))}
                                                        placeholder="e.g. If glucose drops < 70, take 15g fast carbs immediately."
                                                        className="w-full text-xs px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/30"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── SECTION 8: Rules, Don'ts & Personal Note ────────── */}
                            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition">
                                <div
                                    onClick={() => toggleSection('rules')}
                                    className="p-3.5 sm:p-4.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 select-none border-b border-gray-100 gap-2"
                                >
                                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                                            <CheckCircle size={15} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-xs sm:text-sm text-heading flex items-center gap-1.5 whitespace-nowrap">
                                                <span>8. Rules & Notes</span>
                                                <span className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                                                    {formData.guidelines.length} Do&apos;s • {formData.donts.length} Don&apos;ts
                                                </span>
                                            </h3>
                                            <p className="text-[11px] text-para line-clamp-1 truncate">
                                                {formData.guidelines.length > 0 || formData.donts.length > 0
                                                    ? `${formData.guidelines.length} Do's • ${formData.donts.length} Don'ts`
                                                    : 'Client guidelines, restrictions, and dietitian note'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 shrink-0">
                                        {collapsed.rules ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                    </div>
                                </div>

                                {!collapsed.rules && (
                                    <div className="p-3.5 sm:p-5 space-y-4">
                                        {/* Guidelines (Do's) */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-bold text-emerald-800">
                                                    ✓ Daily Rules
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={handleAddRule}
                                                    className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                                                >
                                                    + Add
                                                </button>
                                            </div>
                                            <div className="space-y-1.5">
                                                {formData.guidelines.length === 0 ? (
                                                    <p className="text-xs text-gray-400 italic">No rules added. Click &quot;+ Add&quot; to include guidelines.</p>
                                                ) : (
                                                    formData.guidelines.map((rule, rIdx) => (
                                                        <div key={rIdx} className="flex items-center gap-2">
                                                            <span className="text-emerald-600 font-bold text-xs">•</span>
                                                            <input
                                                                type="text"
                                                                value={rule}
                                                                onChange={(e) => handleRuleChange(rIdx, e.target.value)}
                                                                placeholder="e.g. Drink 3.5 litres of water evenly through the day"
                                                                className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary/20"
                                                            />
                                                            <button type="button" onClick={() => handleRemoveRule(rIdx)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* Don'ts */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-bold text-red-800">
                                                    🚫 Foods to Avoid
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={handleAddDont}
                                                    className="text-[11px] text-red-600 hover:underline font-semibold cursor-pointer"
                                                >
                                                    + Add
                                                </button>
                                            </div>
                                            <div className="space-y-1.5">
                                                {formData.donts.length === 0 ? (
                                                    <p className="text-xs text-gray-400 italic">No restrictions added.</p>
                                                ) : (
                                                    formData.donts.map((dont, dIdx) => (
                                                        <div key={dIdx} className="flex items-center gap-2">
                                                            <span className="text-red-500 font-bold text-xs">✕</span>
                                                            <input
                                                                type="text"
                                                                value={dont}
                                                                onChange={(e) => handleDontChange(dIdx, e.target.value)}
                                                                placeholder="e.g. No refined sugar, aerated drinks, or deep fried snacks"
                                                                className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary/20"
                                                            />
                                                            <button type="button" onClick={() => handleRemoveDont(dIdx)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* Dietitian Message */}
                                        <div>
                                            <label className="block text-xs font-bold text-heading mb-1">
                                                Dietitian&apos;s Note
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={formData.dietitian_note}
                                                onChange={(e) => setFormData({ ...formData, dietitian_note: e.target.value })}
                                                placeholder="e.g., Consistency is key. Reach out to me directly on WhatsApp if you experience hunger spikes."
                                                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:ring-1 focus:ring-primary/20 bg-green-50/20"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── SECTION 9: Attached Clinical Recipe Annexure ─────────── */}
                            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition">
                                <div
                                    onClick={() => toggleSection('recipes')}
                                    className="p-4 sm:p-4.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 select-none border-b border-gray-100"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                            <ChefHat size={15} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-xs sm:text-sm text-heading flex items-center gap-1.5 sm:gap-2 truncate">
                                                <span className="truncate">9. Attached Recipes</span>
                                                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.2 rounded-full shrink-0">
                                                    {formData.recipes?.length || 0} Attached
                                                </span>
                                                {repeatedAttachedCount > 0 && (
                                                    <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.2 rounded-full shrink-0">
                                                        {repeatedAttachedCount} Repeat
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-[11px] text-para truncate">
                                                {formData.recipes?.length > 0
                                                    ? formData.recipes.map(r => r.name).join(', ')
                                                    : 'Search and attach clinical recipes to this plan'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-gray-400">
                                            {collapsed.recipes ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                        </span>
                                    </div>
                                </div>

                                {!collapsed.recipes && (
                                    <div className="p-4 sm:p-5 space-y-4">
                                        {/* ── ATTACHED DISHES WITH SOFT-EDITING ── */}
                                        {formData.recipes?.length > 0 && (
                                            <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                                                        <Utensils size={13} className="text-primary" />
                                                        <span>Selected Dishes for this Plan ({formData.recipes.length})</span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={handleClearAllRecipes}
                                                        className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
                                                    >
                                                        Remove All
                                                    </button>
                                                </div>

                                                {/* Recipe Cards List with Soft-Edit Toggle */}
                                                <div className="space-y-2">
                                                    {formData.recipes.map((recipe, rIdx) => {
                                                        const isEditing = editingRecipeId === recipe.id;
                                                        const hasEdits = Boolean(recipe.is_soft_edited);
                                                        const pastUsages = getPreviousRecipeUsages(recipe);

                                                        return (
                                                            <div
                                                                key={recipe.id || rIdx}
                                                                className={`rounded-xl border transition ${isEditing
                                                                    ? 'bg-white border-primary shadow-sm ring-2 ring-primary/10'
                                                                    : pastUsages.length > 0
                                                                        ? 'bg-white border-amber-300/90 hover:border-amber-400'
                                                                        : 'bg-white border-emerald-200/80 hover:border-primary/40'
                                                                    }`}
                                                            >
                                                                {/* Summary Strip */}
                                                                <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                                                    <div className="flex items-start sm:items-center gap-2">
                                                                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                                                                            {rIdx + 1}
                                                                        </span>
                                                                        <div>
                                                                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                                                <h4 className="font-bold text-xs sm:text-sm text-heading">
                                                                                    {recipe.name}
                                                                                </h4>
                                                                                <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.2 rounded-md">
                                                                                    {recipe.category || 'General'}
                                                                                </span>
                                                                                {pastUsages.length > 0 && (
                                                                                    <span
                                                                                        className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.2 rounded-md"
                                                                                        title={formatPastUsageTooltip(pastUsages)}
                                                                                    >
                                                                                        <AlertCircle size={10} className="shrink-0" />
                                                                                        <span>{formatPastUsageBadge(pastUsages)}</span>
                                                                                    </span>
                                                                                )}
                                                                                {hasEdits && (
                                                                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.2 rounded-md">
                                                                                        Customized for Client
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                                                                                <span>{recipe.servings || '1 serving'}</span>
                                                                                <span>•</span>
                                                                                <span>{recipe.calories || 'Portion Calibrated'}</span>
                                                                                {recipe.protein && <span>• P: {recipe.protein}</span>}
                                                                                {recipe.carbs && <span>• C: {recipe.carbs}</span>}
                                                                                {recipe.fats && <span>• F: {recipe.fats}</span>}
                                                                                {recipe.fiber && <span>• Fib: {recipe.fiber}</span>}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setEditingRecipeId(isEditing ? null : recipe.id)}
                                                                            className={`${isEditing
                                                                                ? 'hidden'
                                                                                : 'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200'
                                                                                }`}
                                                                            title="Soft-edit portions, ingredients or tips for this client"
                                                                        >
                                                                            <Edit3 size={11} />
                                                                            <span>{isEditing ? 'Close Edit' : 'Soft Edit'}</span>
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveSelectedRecipe(recipe.id)}
                                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                                            title="Remove recipe from plan"
                                                                        >
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* ── EXPANDED SOFT-EDITOR FOR THIS RECIPE ── */}
                                                                {isEditing && (
                                                                    <div className="p-3.5 bg-slate-50/70 border-t border-gray-100 rounded-b-xl space-y-3">
                                                                        <div className="flex items-center justify-between text-xs">
                                                                            <div className="flex items-center gap-1.5 text-primary font-bold">
                                                                                <Sliders size={13} />
                                                                                <span>Customize Recipe</span>
                                                                            </div>
                                                                            {hasEdits && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleResetRecipeToMaster(recipe.id)}
                                                                                    className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:underline font-semibold cursor-pointer"
                                                                                >
                                                                                    <Undo2 size={11} />
                                                                                    <span>Reset to Master</span>
                                                                                </button>
                                                                            )}
                                                                        </div>

                                                                        {/* Portions, Timing, Macros */}
                                                                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                                                                            <div>
                                                                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Portions</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={recipe.servings || ''}
                                                                                    onChange={(e) => handleSoftEditRecipe(recipe.id, 'servings', e.target.value)}
                                                                                    placeholder="1 serving"
                                                                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Prep Time</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={recipe.prep_time || ''}
                                                                                    onChange={(e) => handleSoftEditRecipe(recipe.id, 'prep_time', e.target.value)}
                                                                                    placeholder="10m"
                                                                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Cook Time</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={recipe.cook_time || ''}
                                                                                    onChange={(e) => handleSoftEditRecipe(recipe.id, 'cook_time', e.target.value)}
                                                                                    placeholder="15m"
                                                                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Calories</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={recipe.calories || ''}
                                                                                    onChange={(e) => handleSoftEditRecipe(recipe.id, 'calories', e.target.value)}
                                                                                    placeholder="250 kcal"
                                                                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Protein</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={recipe.protein || ''}
                                                                                    onChange={(e) => handleSoftEditRecipe(recipe.id, 'protein', e.target.value)}
                                                                                    placeholder="15g"
                                                                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Carbs</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={recipe.carbs || ''}
                                                                                    onChange={(e) => handleSoftEditRecipe(recipe.id, 'carbs', e.target.value)}
                                                                                    placeholder="28g"
                                                                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Fats</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={recipe.fats || ''}
                                                                                    onChange={(e) => handleSoftEditRecipe(recipe.id, 'fats', e.target.value)}
                                                                                    placeholder="6g"
                                                                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Fiber</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={recipe.fiber || ''}
                                                                                    onChange={(e) => handleSoftEditRecipe(recipe.id, 'fiber', e.target.value)}
                                                                                    placeholder="4g"
                                                                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* Ingredients & Instructions Textareas */}
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                            <div>
                                                                                <label className="block text-[10px] font-bold text-gray-700 mb-1">
                                                                                    Ingredients (one per line)
                                                                                </label>
                                                                                <textarea
                                                                                    rows={4}
                                                                                    value={Array.isArray(recipe.ingredients) ? recipe.ingredients.join('\n') : (recipe.ingredients || '')}
                                                                                    onChange={(e) => handleSoftEditIngredientsText(recipe.id, e.target.value)}
                                                                                    placeholder="100g Chicken breast&#10;1 tsp Olive oil"
                                                                                    className="w-full text-xs p-2.5 rounded-lg border border-gray-200 bg-white font-mono leading-relaxed"
                                                                                />
                                                                            </div>

                                                                            <div>
                                                                                <label className="block text-[10px] font-bold text-gray-700 mb-1">
                                                                                    Instructions (one per line)
                                                                                </label>
                                                                                <textarea
                                                                                    rows={4}
                                                                                    value={Array.isArray(recipe.instructions) ? recipe.instructions.join('\n') : (recipe.instructions || '')}
                                                                                    onChange={(e) => handleSoftEditInstructionsText(recipe.id, e.target.value)}
                                                                                    placeholder="Sauté spices in olive oil.&#10;Add vegetables and simmer covered."
                                                                                    className="w-full text-xs p-2.5 rounded-lg border border-gray-200 bg-white font-mono leading-relaxed"
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* Dietitian Clinical Tip */}
                                                                        <div>
                                                                            <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                                                                Dietitian Tip
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                value={recipe.dietitian_tip || ''}
                                                                                onChange={(e) => handleSoftEditRecipe(recipe.id, 'dietitian_tip', e.target.value)}
                                                                                placeholder="e.g. Rich in prebiotic fibers. Consume within 20 mins of cooking."
                                                                                className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white"
                                                                            />
                                                                        </div>

                                                                        <div className="flex justify-end pt-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setEditingRecipeId(null)}
                                                                                className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
                                                                            >
                                                                                Done
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* ── RECIPE BANK BROWSER ── */}
                                        <div className="space-y-3 pt-1">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    {/* Search bar */}
                                                    <div className="relative flex-1">
                                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            value={recipeSearch}
                                                            onChange={(e) => setRecipeSearch(e.target.value)}
                                                            placeholder="Search recipes by name (e.g. Oats, Smoothie, Wrap)..."
                                                            className="w-full text-xs pl-8 pr-7 py-2 rounded-xl border border-gray-200 focus:ring-1 focus:ring-primary/20 bg-gray-50/50"
                                                        />
                                                        {recipeSearch && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setRecipeSearch('')}
                                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                                            >
                                                                <X size={13} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Add New Recipe Button */}
                                                    <button
                                                        type="button"
                                                        onClick={handleOpenNewRecipeModal}
                                                        className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0"
                                                        title="Create a new clinical recipe and attach it directly to this plan"
                                                    >
                                                        <Plus size={14} />
                                                        <span className="sm:hidden">New</span>
                                                        <span className="hidden sm:inline">Add New Recipe</span>
                                                    </button>
                                                </div>

                                                {/* Category pills */}
                                                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                                                    {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Beverage', 'Soup & Salad'].map(cat => (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() => setRecipeCategoryFilter(cat)}
                                                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${recipeCategoryFilter === cat
                                                                ? 'bg-primary text-white shadow-2xs font-bold'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                                                                }`}
                                                        >
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>

                                                {effectiveClient && pastPlansCheckedCount > 0 && (
                                                    <p className="text-[11px] text-gray-500 flex items-center gap-1.5 px-0.5">
                                                        <Info size={12} className="text-amber-600 shrink-0" />
                                                        <span>
                                                            Repeat check active across{' '}
                                                            <strong className="text-heading">
                                                                {pastPlansCheckedCount}
                                                            </strong>{' '}
                                                            previous {pastPlansCheckedCount === 1 ? 'plan' : 'plans'} for{' '}
                                                            <strong className="text-heading">
                                                                {effectiveClient.full_name}
                                                            </strong>
                                                        </span>
                                                    </p>
                                                )}
                                            </div>

                                            {/* Dish Cards Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                                                {loadingRecipes ? (
                                                    <div className="col-span-full py-8 text-center text-xs text-gray-400">
                                                        <RefreshCw size={14} className="animate-spin inline mr-1 text-primary" />
                                                        Searching clinic recipe bank...
                                                    </div>
                                                ) : !recipeSearch.trim() && recipeCategoryFilter === 'All' ? (
                                                    <div className="col-span-full py-6 px-4 text-center text-xs bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                                                        <Search size={18} className="mx-auto mb-1.5 text-gray-400" />
                                                        <p className="font-bold text-gray-700">Search Clinical Recipes</p>
                                                        <p className="text-[11px] text-gray-400 mt-0.5 max-w-sm mx-auto">
                                                            Type a dish name or click a category above to browse and attach recipes to this plan.
                                                        </p>
                                                        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                                                            <span className="text-[10px] text-gray-400 font-medium">Quick search:</span>
                                                            {['Oats', 'Smoothie', 'Salad', 'Wrap', 'Pancake', 'Soup', 'Chicken'].map(suggest => (
                                                                <button
                                                                    key={suggest}
                                                                    type="button"
                                                                    onClick={() => setRecipeSearch(suggest)}
                                                                    className="px-2 py-0.5 rounded-md bg-white border border-gray-200 hover:border-primary text-[10px] font-semibold text-gray-600 hover:text-primary transition cursor-pointer"
                                                                >
                                                                    + {suggest}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : availableRecipes.length === 0 ? (
                                                    <div className="col-span-full py-7 px-4 text-center text-xs bg-gray-50/60 rounded-xl border border-dashed border-gray-200 space-y-3">
                                                        <p className="text-gray-500">
                                                            No recipes found matching{' '}
                                                            {recipeSearch.trim() ? (
                                                                <>
                                                                    &ldquo;<span className="font-semibold text-heading">{recipeSearch.trim()}</span>&rdquo;
                                                                </>
                                                            ) : (
                                                                <span className="font-semibold text-heading">{recipeCategoryFilter}</span>
                                                            )}
                                                            . Try another term, clear filter, or create a new recipe.
                                                        </p>
                                                        <div>
                                                            <button
                                                                type="button"
                                                                onClick={handleOpenNewRecipeModal}
                                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm shadow-primary/20 transition cursor-pointer"
                                                            >
                                                                <Plus size={14} />
                                                                <span>
                                                                    {recipeSearch.trim()
                                                                        ? `Add "${recipeSearch.trim()}" as New Recipe`
                                                                        : 'Add New Recipe'}
                                                                </span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    availableRecipes.map(recipe => {
                                                        const isSelected = (formData.recipes || []).some(r => r.id === recipe.id);
                                                        const pastUsages = getPreviousRecipeUsages(recipe);
                                                        const wasUsedPreviously = pastUsages.length > 0;

                                                        return (
                                                            <div
                                                                key={recipe.id}
                                                                onClick={() => handleToggleRecipe(recipe)}
                                                                title={wasUsedPreviously ? formatPastUsageTooltip(pastUsages) : undefined}
                                                                className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between select-none ${isSelected
                                                                    ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-300 shadow-2xs'
                                                                    : wasUsedPreviously
                                                                        ? 'bg-amber-50/30 border-amber-300/90 hover:border-amber-400 hover:bg-amber-50/50'
                                                                        : 'bg-white border-gray-200/80 hover:border-primary/40 hover:bg-gray-50/50'
                                                                    }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-1.5 mb-1">
                                                                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                                                                            {recipe.category || 'General'}
                                                                        </span>
                                                                        {wasUsedPreviously && (
                                                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-md">
                                                                                <AlertCircle size={9} className="shrink-0" />
                                                                                <span>{formatPastUsageBadge(pastUsages)}</span>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isSelected ? 'bg-primary text-white' : 'border border-gray-300 text-transparent'
                                                                        }`}>
                                                                        ✓
                                                                    </span>
                                                                </div>
                                                                <h4 className="text-xs font-bold text-heading line-clamp-1 mb-1">
                                                                    {recipe.name}
                                                                </h4>
                                                                <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                                                                    <span>{recipe.calories || 'Portion Calibrated'}</span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {recipe.protein && <span className="font-semibold text-primary">P: {recipe.protein}</span>}
                                                                        {recipe.fiber && <span className="font-semibold text-teal-700">Fib: {recipe.fiber}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                    {/* ════════════════ LIVE PDF PREVIEW COLUMN ════════════════ */}
                    {(activeView === 'preview' || activeView === 'split') && (
                        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200/80 shadow-xs flex flex-col h-full lg:sticky lg:top-16">
                            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                                    <Eye size={15} className="text-primary shrink-0" />
                                    <h3 className="font-heading font-bold text-heading text-xs sm:text-sm">
                                        Live PDF Preview
                                    </h3>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${formData.pdf_theme === 'senior' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                        {formData.pdf_theme === 'senior' ? 'Senior Print' : 'Clinical'}
                                    </span>
                                    <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded-full">
                                        {formData.pdf_theme === 'senior'
                                            ? (formData.recipes?.length > 0 ? '4 Pages' : '3 Pages')
                                            : (formData.recipes?.length > 0 ? '3 Pages' : '2 Pages')}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setPreviewKey(k => k + 1)}
                                    className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer shrink-0"
                                    title="Refresh Preview"
                                >
                                    <RefreshCw size={13} />
                                    <span className="hidden sm:inline">Refresh</span>
                                </button>
                            </div>

                            {/* Mobile Browser PDF Helper Banner */}
                            <div className="md:hidden mb-2.5 px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-2 text-[11px] text-emerald-900">
                                <span>Some mobile browsers open PDFs externally.</span>
                                <button
                                    type="button"
                                    onClick={handleDownloadPdf}
                                    disabled={generating}
                                    className="font-bold text-primary underline shrink-0 cursor-pointer"
                                >
                                    {generating ? 'Generating…' : 'Open / Download PDF'}
                                </button>
                            </div>

                            <div className="flex-1 w-full min-h-[460px] sm:min-h-[680px] rounded-xl overflow-hidden border border-gray-200">
                                <PDFViewer key={previewKey} width="100%" height="100%" showToolbar={true}>
                                    <DietPlanPdfDocument plan={formData} />
                                </PDFViewer>
                            </div>

                            <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400">
                                <span className="truncate">The Diet Cascade • {formData.pdf_theme === 'senior' ? 'Large Print' : 'Clinical Theme'}</span>
                                <span className="shrink-0">{formData.pdf_theme === 'senior' ? '3-4 Pages' : '2-3 Pages'}</span>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* ═══════════════ MOBILE THUMB-ZONE ACTION BAR (< md) ═══════════════ */}
            <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3.5 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-2.5 max-w-lg mx-auto">
                    {/* Mobile Save / Split Update Button */}
                    <div className="relative flex-1 flex items-stretch" ref={mobileSaveMenuRef}>
                        <button
                            type="button"
                            disabled={savingToClientDb}
                            onClick={() => handleSavePlanToDb('auto')}
                            className={`flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 bg-emerald-50 active:bg-emerald-100 text-primary border border-emerald-200 font-bold text-xs whitespace-nowrap transition active:scale-[0.98] cursor-pointer disabled:opacity-50 ${
                                loadedPlanRecord ? 'rounded-l-xl border-r-0' : 'rounded-xl'
                            }`}
                        >
                            {savingToClientDb ? (
                                <RefreshCw size={14} className="animate-spin shrink-0" />
                            ) : (
                                <Save size={14} className="shrink-0" />
                            )}
                            <span className="truncate">
                                {loadedPlanRecord
                                    ? `Update Rev ${loadedPlanRecord.revision_number}`
                                    : 'Save Plan'}
                            </span>
                        </button>

                        {loadedPlanRecord && (
                            <button
                                type="button"
                                disabled={savingToClientDb}
                                onClick={() => setShowSaveMenu((o) => !o)}
                                className="min-h-[44px] px-2.5 bg-emerald-50 active:bg-emerald-100 text-primary border border-emerald-200 rounded-r-xl flex items-center justify-center transition cursor-pointer disabled:opacity-50"
                                title="More save options"
                                aria-label="More save options"
                            >
                                <ChevronUp size={14} />
                            </button>
                        )}

                        {loadedPlanRecord && showSaveMenu && (
                            <div className="absolute left-0 bottom-full mb-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 text-xs">
                                <button
                                    type="button"
                                    onClick={() => handleSavePlanToDb('create')}
                                    className="w-full px-3.5 py-2.5 text-left font-semibold text-heading hover:bg-emerald-50 hover:text-primary flex items-center gap-2 cursor-pointer"
                                >
                                    <Plus size={14} className="text-primary" />
                                    <span>Save as New Revision</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoadedPlanRecord(null);
                                        setShowSaveMenu(false);
                                    }}
                                    className="w-full px-3.5 py-2.5 text-left text-gray-500 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                >
                                    <X size={14} />
                                    <span>Detach from Rev {loadedPlanRecord.revision_number}</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Primary Download PDF Button */}
                    <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={generating}
                        className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-xs whitespace-nowrap transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                        {generating ? (
                            <RefreshCw size={14} className="animate-spin shrink-0" />
                        ) : (
                            <Download size={14} className="shrink-0" />
                        )}
                        <span>{generating ? 'Generating…' : 'Download PDF'}</span>
                    </button>
                </div>
            </div>

            {/* ═══════════════ CREATE & ATTACH NEW RECIPE MODAL ═══════════════ */}
            {isNewRecipeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-gray-100 max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <ChefHat size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold font-heading text-heading">
                                        Create &amp; Attach New Clinical Recipe
                                    </h2>
                                    <p className="text-[11px] text-para">
                                        Add measured ingredients, cooking steps, and macros — attaches immediately to this diet plan
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsNewRecipeModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAndAttachRecipe} className="space-y-4">
                            {/* Row 1: Dish Name & Category */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                        Dish Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newRecipeForm.name}
                                        onChange={(e) =>
                                            setNewRecipeForm((prev) => ({ ...prev, name: e.target.value }))
                                        }
                                        placeholder="e.g., Moong Dal & Spinach Chilla"
                                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={newRecipeForm.category}
                                        onChange={(e) =>
                                            setNewRecipeForm((prev) => ({ ...prev, category: e.target.value }))
                                        }
                                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                                    >
                                        <option value="Breakfast">Breakfast</option>
                                        <option value="Lunch">Lunch</option>
                                        <option value="Dinner">Dinner</option>
                                        <option value="Snack">Snack</option>
                                        <option value="Beverage">Beverage</option>
                                        <option value="Soup & Salad">Soup &amp; Salad</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 2: Times & Servings */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Prep Time</label>
                                    <input
                                        type="text"
                                        value={newRecipeForm.prep_time}
                                        onChange={(e) =>
                                            setNewRecipeForm((prev) => ({ ...prev, prep_time: e.target.value }))
                                        }
                                        placeholder="e.g. 10 mins"
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Cook Time</label>
                                    <input
                                        type="text"
                                        value={newRecipeForm.cook_time}
                                        onChange={(e) =>
                                            setNewRecipeForm((prev) => ({ ...prev, cook_time: e.target.value }))
                                        }
                                        placeholder="e.g. 15 mins"
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Servings</label>
                                    <input
                                        type="text"
                                        value={newRecipeForm.servings}
                                        onChange={(e) =>
                                            setNewRecipeForm((prev) => ({ ...prev, servings: e.target.value }))
                                        }
                                        placeholder="e.g. 1 serving"
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Nutrition Profile */}
                            <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-200/80">
                                <label className="block text-[10px] font-bold text-heading uppercase mb-2">
                                    Nutritional Profile (Per Serving)
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    <div>
                                        <span className="block text-[10px] text-gray-500 mb-0.5">Calories</span>
                                        <input
                                            type="text"
                                            value={newRecipeForm.calories}
                                            onChange={(e) =>
                                                setNewRecipeForm((prev) => ({ ...prev, calories: e.target.value }))
                                            }
                                            placeholder="240 kcal"
                                            className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-200 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-gray-500 mb-0.5">Protein</span>
                                        <input
                                            type="text"
                                            value={newRecipeForm.protein}
                                            onChange={(e) =>
                                                setNewRecipeForm((prev) => ({ ...prev, protein: e.target.value }))
                                            }
                                            placeholder="14g"
                                            className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-200 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-gray-500 mb-0.5">Carbs</span>
                                        <input
                                            type="text"
                                            value={newRecipeForm.carbs}
                                            onChange={(e) =>
                                                setNewRecipeForm((prev) => ({ ...prev, carbs: e.target.value }))
                                            }
                                            placeholder="28g"
                                            className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-200 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-gray-500 mb-0.5">Fats</span>
                                        <input
                                            type="text"
                                            value={newRecipeForm.fats}
                                            onChange={(e) =>
                                                setNewRecipeForm((prev) => ({ ...prev, fats: e.target.value }))
                                            }
                                            placeholder="5g"
                                            className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-200 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-gray-500 mb-0.5">Fibre</span>
                                        <input
                                            type="text"
                                            value={newRecipeForm.fiber}
                                            onChange={(e) =>
                                                setNewRecipeForm((prev) => ({ ...prev, fiber: e.target.value }))
                                            }
                                            placeholder="4g"
                                            className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-200 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Measured Ingredients */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-heading">
                                        Measured Ingredients ({newRecipeForm.ingredients.length}) *
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewRecipeBulkIngOpen(!newRecipeBulkIngOpen)}
                                            className="text-[11px] font-semibold text-gray-500 hover:text-heading cursor-pointer"
                                        >
                                            {newRecipeBulkIngOpen ? 'Close Paste Mode' : 'Bulk Paste'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAddNewRecipeIngredient}
                                            className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                                        >
                                            + Add Ingredient
                                        </button>
                                    </div>
                                </div>

                                {newRecipeBulkIngOpen ? (
                                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 mb-3">
                                        <p className="text-[11px] text-gray-500 mb-1.5">
                                            Paste ingredients list (one per line):
                                        </p>
                                        <textarea
                                            rows={4}
                                            value={newRecipeBulkIngText}
                                            onChange={(e) => setNewRecipeBulkIngText(e.target.value)}
                                            placeholder={"1/2 cup yellow moong dal\n1/2 cup chopped spinach\n1/4 tsp turmeric\n1 tsp cold pressed oil"}
                                            className="w-full text-xs p-2 rounded-xl border border-gray-200 bg-white"
                                        />
                                        <div className="mt-2 flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setNewRecipeBulkIngOpen(false)}
                                                className="px-2.5 py-1 text-xs text-gray-600 rounded-lg hover:bg-gray-200 cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleApplyNewRecipeBulkIngredients}
                                                className="px-3 py-1 text-xs bg-primary text-white font-semibold rounded-lg cursor-pointer"
                                            >
                                                Apply Lines
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                        {newRecipeForm.ingredients.map((ing, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className="text-[11px] text-gray-400 w-4 text-center font-bold">•</span>
                                                <input
                                                    type="text"
                                                    value={ing}
                                                    onChange={(e) =>
                                                        handleNewRecipeIngredientChange(idx, e.target.value)
                                                    }
                                                    placeholder="e.g. 1/2 cup rolled oats or 100g paneer"
                                                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary/20"
                                                />
                                                {newRecipeForm.ingredients.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveNewRecipeIngredient(idx)}
                                                        className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Step-by-Step Instructions */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-heading">
                                        Preparation Method / Instructions ({newRecipeForm.instructions.length})
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewRecipeBulkInstOpen(!newRecipeBulkInstOpen)}
                                            className="text-[11px] font-semibold text-gray-500 hover:text-heading cursor-pointer"
                                        >
                                            {newRecipeBulkInstOpen ? 'Close Paste Mode' : 'Bulk Paste'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAddNewRecipeInstruction}
                                            className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                                        >
                                            + Add Step
                                        </button>
                                    </div>
                                </div>

                                {newRecipeBulkInstOpen ? (
                                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 mb-3">
                                        <p className="text-[11px] text-gray-500 mb-1.5">
                                            Paste cooking steps (one per line):
                                        </p>
                                        <textarea
                                            rows={4}
                                            value={newRecipeBulkInstText}
                                            onChange={(e) => setNewRecipeBulkInstText(e.target.value)}
                                            placeholder={"Soak moong dal for 2 hours\nBlend into smooth batter with ginger and chilli\nSpread on hot pan and cook with 1/2 tsp oil"}
                                            className="w-full text-xs p-2 rounded-xl border border-gray-200 bg-white"
                                        />
                                        <div className="mt-2 flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setNewRecipeBulkInstOpen(false)}
                                                className="px-2.5 py-1 text-xs text-gray-600 rounded-lg hover:bg-gray-200 cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleApplyNewRecipeBulkInstructions}
                                                className="px-3 py-1 text-xs bg-primary text-white font-semibold rounded-lg cursor-pointer"
                                            >
                                                Apply Steps
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                        {newRecipeForm.instructions.map((step, sIdx) => (
                                            <div key={sIdx} className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                                                    {sIdx + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={step}
                                                    onChange={(e) =>
                                                        handleNewRecipeInstructionChange(sIdx, e.target.value)
                                                    }
                                                    placeholder={`Step ${sIdx + 1} preparation instructions`}
                                                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary/20"
                                                />
                                                {newRecipeForm.instructions.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveNewRecipeInstruction(sIdx)}
                                                        className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Dietitian Tip / Clinical Notes */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                    Dietitian Clinical Tip &amp; Benefits
                                </label>
                                <textarea
                                    rows={2}
                                    value={newRecipeForm.dietitian_tip}
                                    onChange={(e) =>
                                        setNewRecipeForm((prev) => ({
                                            ...prev,
                                            dietitian_tip: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g., High in bioavailable protein and soluble fiber. Ideal for PCOS and maintaining steady morning glucose."
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            {/* Save to Clinic Recipe Bank Checkbox + Actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
                                <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={saveNewRecipeToBank}
                                        onChange={(e) => setSaveNewRecipeToBank(e.target.checked)}
                                        className="w-4 h-4 rounded accent-primary cursor-pointer"
                                    />
                                    <span className="inline-flex items-center gap-1">
                                        <Database size={12} className="text-primary" />
                                        Also save to Clinic Recipe Bank for future plans
                                    </span>
                                </label>

                                <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 sm:gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setIsNewRecipeModalOpen(false)}
                                        className="w-full sm:w-auto min-h-[40px] px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={savingNewRecipe}
                                        className="w-full sm:w-auto min-h-[42px] px-5 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary-hover shadow-md shadow-primary/20 transition cursor-pointer disabled:opacity-60"
                                    >
                                        {savingNewRecipe
                                            ? 'Saving...'
                                            : saveNewRecipeToBank
                                                ? 'Save & Attach Recipe'
                                                : 'Attach to Plan Only'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminDietPlanGeneratorPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
                    <RefreshCw size={18} className="animate-spin mr-2 text-primary" />
                    Loading Diet Plan Generator...
                </div>
            }
        >
            <AdminDietPlanGeneratorContent />
        </Suspense>
    );
}
