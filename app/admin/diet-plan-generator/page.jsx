'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';
import {
    Download,
    Send,
    User,
    Utensils,
    Sparkles,
    Eye,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    ArrowLeft,
    ArrowRight,
    RotateCcw,
    Users,
    Layers,
    Columns,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import DietPlanPdfDocument from '@/components/admin/pdf/DietPlanPdfDocument';
import {
    DIET_PLAN_DRAFT_STORAGE_KEY,
    AUTO_SAVE_DELAY_MS,
    DEFAULT_CALC_CONFIG,
    EMPTY_NEW_RECIPE,
    EMPTY_FORM_STATE,
    roundOne,
    parseNumericValue,
    computeMacrosFromCalories,
    computeChainFromHeightCm,
    hasDietDraftContent,
    addDaysToIsoDate,
    escapeHtmlText,
} from '@/components/admin/diet-generator/dietGeneratorUtils';
import StepClientBasics from '@/components/admin/diet-generator/StepClientBasics';
import StepTargetsAndMeals from '@/components/admin/diet-generator/StepTargetsAndMeals';
import StepExtrasAndRecipes from '@/components/admin/diet-generator/StepExtrasAndRecipes';
import StepReviewAndShare from '@/components/admin/diet-generator/StepReviewAndShare';
import NewRecipeModal from '@/components/admin/diet-generator/NewRecipeModal';
import { cleanMultilineItems } from '@/components/admin/recipes/RecipeFormModal';

// Dynamic import for React-PDF Viewer to prevent SSR issues
const PDFViewer = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFViewer), {
    ssr: false,
    loading: () => (
        <div className="h-[600px] w-full flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-200">
            <RefreshCw className="w-7 h-7 text-primary animate-spin mb-2.5" />
            <p className="text-xs font-medium text-para">Rendering Live PDF Preview...</p>
        </div>
    ),
});

const STEPS = [
    { id: 1, shortLabel: 'Client & Dates', fullLabel: '1. Client & Basics', icon: User },
    { id: 2, shortLabel: 'Meals & Targets', fullLabel: '2. Targets & Meals', icon: Utensils },
    { id: 3, shortLabel: 'Add-Ons & Recipes', fullLabel: '3. Optional Extras', icon: Sparkles },
    { id: 4, shortLabel: 'Preview & Share', fullLabel: '4. Preview & Share', icon: Eye },
];

function AdminDietPlanGeneratorContent() {
    const supabase = useMemo(() => createClient(), []);
    const searchParams = useSearchParams();
    const topAnchorRef = useRef(null);

    // Core Form State
    const [formData, setFormData] = useState(EMPTY_FORM_STATE);

    // Guided Stepper vs All-in-One Scroll Mode + Optional Desktop Split Preview
    const [currentStep, setCurrentStep] = useState(1);
    const [layoutMode, setLayoutMode] = useState('guided'); // 'guided' | 'all'
    const [showSplitPreview, setShowSplitPreview] = useState(false);

    const [generating, setGenerating] = useState(false);
    const [previewKey, setPreviewKey] = useState(1);

    // Soft-Editing State for Attached Recipes
    const [editingRecipeId, setEditingRecipeId] = useState(null);

    // Templates State
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);

    // Recipes Bank State (Pre-loaded so layman never sees an empty search box)
    const [availableRecipes, setAvailableRecipes] = useState([]);
    const [loadingRecipes, setLoadingRecipes] = useState(false);
    const [recipeSearch, setRecipeSearch] = useState('');
    const [recipeCategoryFilter, setRecipeCategoryFilter] = useState('All');

    // Create New Recipe Modal State
    const [isNewRecipeModalOpen, setIsNewRecipeModalOpen] = useState(false);
    const [newRecipeForm, setNewRecipeForm] = useState(EMPTY_NEW_RECIPE);
    const [savingNewRecipe, setSavingNewRecipe] = useState(false);
    const [saveNewRecipeToBank, setSaveNewRecipeToBank] = useState(true);

    // Client DB State
    const [allClients, setAllClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [loadedPlanRecord, setLoadedPlanRecord] = useState(null);
    const [savingToClientDb, setSavingToClientDb] = useState(false);
    const [clientPastPlans, setClientPastPlans] = useState([]);
    const dbMetaRef = useRef({ selectedClient: null, loadedPlanRecord: null });

    useEffect(() => {
        dbMetaRef.current = { selectedClient, loadedPlanRecord };
    }, [selectedClient, loadedPlanRecord]);

    const jumpToStep = useCallback((stepNum) => {
        const clamped = Math.min(4, Math.max(1, stepNum));
        setCurrentStep(clamped);
        if (clamped === 4) {
            setPreviewKey((k) => k + 1);
        }
        if (typeof window !== 'undefined' && topAnchorRef.current) {
            topAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    // ─── LocalStorage Draft Auto-Save & Restore ───
    const isDraftHydratedRef = useRef(false);
    const pendingHydratedDataRef = useRef(null);
    const lastSavedDataRef = useRef(EMPTY_FORM_STATE);
    const latestFormDataRef = useRef(EMPTY_FORM_STATE);
    const hasPendingSaveRef = useRef(false);
    const autoSaveTimerRef = useRef(null);

    const [saveStatus, setSaveStatus] = useState('idle');
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
                            revision_date:
                                draft.revision_date ?? draft.next_review_date ?? '',
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

    // ─── Fetch Clients & Hydrate URL ?clientId / ?planId ───
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const { data } = await supabase
                    .from('clients')
                    .select(
                        'id, full_name, phone, age, height, initial_goals, plan_start_date, plan_end_date, next_revision_date'
                    )
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

    const applyRecordToForm = useCallback((record, ownerClient, options = { asClone: false }) => {
        const snap =
            record?.plan_data && typeof record.plan_data === 'object'
                ? record.plan_data
                : {};
        const todayIso = new Date().toISOString().split('T')[0];

        const resolvedStartDate = options.asClone
            ? todayIso
            : snap.start_date || record?.start_date || todayIso;

        const resolvedRevisionDate = options.asClone
            ? addDaysToIsoDate(todayIso, 15)
            : snap.revision_date || record?.revision_date || snap.next_review_date || '';

        const resolvedEndDate =
            snap.end_date || record?.end_date || ownerClient?.plan_end_date || '';

        const hydrated = {
            ...EMPTY_FORM_STATE,
            ...snap,
            client_name: snap.client_name || ownerClient?.full_name || '',
            client_phone: snap.client_phone || ownerClient?.phone || '',
            plan_title: options.asClone
                ? ''
                : snap.plan_title || record?.plan_title || '',
            goal: snap.goal ?? record?.goal ?? '',
            calories: snap.calories ?? record?.calories ?? '',
            start_date: resolvedStartDate,
            revision_date: resolvedRevisionDate,
            next_review_date: resolvedRevisionDate,
            end_date: resolvedEndDate,
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
                    applyRecordToForm(planRow, owner, { asClone: false });
                } else if (urlClientId) {
                    const { data: clientRow, error } = await supabase
                        .from('clients')
                        .select('*')
                        .eq('id', urlClientId)
                        .single();

                    if (!active || error || !clientRow) return;

                    const todayIso = new Date().toISOString().split('T')[0];
                    setSelectedClient(clientRow);
                    setLoadedPlanRecord(null);
                    setFormData({
                        ...EMPTY_FORM_STATE,
                        client_name: clientRow.full_name || '',
                        client_phone: clientRow.phone || '',
                        client_age: clientRow.age || '',
                        client_height: clientRow.height || '',
                        goal: clientRow.initial_goals || '',
                        start_date: todayIso,
                        revision_date: addDaysToIsoDate(todayIso, 15),
                        next_review_date: addDaysToIsoDate(todayIso, 15),
                        end_date: clientRow.plan_end_date || '',
                    });
                    setEditingRecipeId(null);
                    setPreviewKey((k) => k + 1);
                }

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

    // ─── Fetch Templates ───
    const fetchTemplates = useCallback(async () => {
        setLoadingTemplates(true);
        try {
            const { data, error } = await supabase
                .from('diet_plan_templates')
                .select('*')
                .order('created_at', { ascending: true });

            setTemplates(!error && data ? data : []);
        } catch {
            setTemplates([]);
        } finally {
            setLoadingTemplates(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    // ─── Pre-Loaded & Filtered Recipe Fetching ───
    useEffect(() => {
        const queryText = recipeSearch.trim();
        const hasCategory = recipeCategoryFilter && recipeCategoryFilter !== 'All';

        let isMounted = true;
        setLoadingRecipes(true);

        const timer = setTimeout(
            async () => {
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
                        .limit(24);

                    if (isMounted) {
                        setAvailableRecipes(!error && data ? data : []);
                    }
                } catch {
                    if (isMounted) setAvailableRecipes([]);
                } finally {
                    if (isMounted) setLoadingRecipes(false);
                }
            },
            queryText ? 220 : 40
        );

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [recipeSearch, recipeCategoryFilter, supabase]);

    // ─── Reset Form (Clean Slate) ───
    const handleClearForm = () => {
        Swal.fire({
            title: 'Reset Diet Plan Form?',
            text: 'This will unlink the current client and clear all fields, meals, and attached recipes to a blank slate.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, start fresh',
        }).then((res) => {
            if (!res.isConfirmed) return;

            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
                autoSaveTimerRef.current = null;
            }
            hasPendingSaveRef.current = false;
            dbMetaRef.current = { selectedClient: null, loadedPlanRecord: null };

            try {
                window.localStorage.removeItem(DIET_PLAN_DRAFT_STORAGE_KEY);
                window.history.replaceState({}, '', '/admin/diet-plan-generator');
            } catch {
                // Ignore storage errors
            }

            const freshEmpty = {
                ...EMPTY_FORM_STATE,
                start_date: new Date().toISOString().split('T')[0],
                measurements: [],
                meals: [],
                supplements: [],
                workouts: [],
                guidelines: [],
                donts: [],
                recipes: [],
                calc_config: { ...DEFAULT_CALC_CONFIG },
            };

            lastSavedDataRef.current = freshEmpty;
            latestFormDataRef.current = freshEmpty;
            pendingHydratedDataRef.current = freshEmpty;

            setSelectedClient(null);
            setLoadedPlanRecord(null);
            setClientPastPlans([]);
            setFormData(freshEmpty);
            setEditingRecipeId(null);
            setRecipeSearch('');
            setRecipeCategoryFilter('All');
            setCurrentStep(1);
            setLastSavedAt(null);
            setSaveStatus('idle');
            setPreviewKey((k) => k + 1);
        });
    };

    // ─── Effective Client & Past Plans Lookup ───
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
                        'id, client_id, revision_number, plan_title, start_date, revision_date, end_date, updated_at, plan_data'
                    )
                    .eq('client_id', targetClientId)
                    .order('revision_number', { ascending: false });

                setClientPastPlans(!error && Array.isArray(data) ? data : []);
            } catch {
                setClientPastPlans([]);
            }
        },
        [supabase]
    );

    useEffect(() => {
        fetchClientPastPlans(effectiveClient?.id || null);
    }, [effectiveClient?.id, fetchClientPastPlans]);

    const handleSelectClientObject = (clientObj) => {
        if (!clientObj) return;
        if (loadedPlanRecord && loadedPlanRecord.client_id !== clientObj.id) {
            setLoadedPlanRecord(null);
        }
        setSelectedClient(clientObj);
        setFormData((prev) => ({
            ...prev,
            client_name: clientObj.full_name || '',
            client_phone: clientObj.phone || prev.client_phone || '',
            client_age: clientObj.age || prev.client_age || '',
            client_height: clientObj.height || prev.client_height || '',
            goal: clientObj.initial_goals || prev.goal || '',
            end_date: prev.end_date || clientObj.plan_end_date || '',
            revision_date:
                prev.revision_date || addDaysToIsoDate(prev.start_date, 15),
            next_review_date:
                prev.revision_date || addDaysToIsoDate(prev.start_date, 15),
        }));
    };

    const handleDetachClient = () => {
        setSelectedClient(null);
        setLoadedPlanRecord(null);
        setClientPastPlans([]);
    };

    const handleClientNameChange = (typedVal) => {
        const matched = allClients.find(
            (c) => c.full_name?.trim().toLowerCase() === typedVal.trim().toLowerCase()
        );
        if (matched) {
            handleSelectClientObject(matched);
        } else {
            setFormData((prev) => ({ ...prev, client_name: typedVal }));
        }
    };

    const handleCopyPastPlan = (pastPlan) => {
        if (!pastPlan) return;
        setLoadedPlanRecord(null);
        applyRecordToForm(pastPlan, selectedClient || effectiveClient, { asClone: true });
        Swal.fire({
            icon: 'success',
            title: `Copied Rev ${pastPlan.revision_number}!`,
            text: 'Meals, targets, and rules have been loaded as a fresh revision.',
            timer: 1600,
            showConfirmButton: false,
        });
    };

    // ─── Unified Save to Client DB (Returns { ok, finalFormData, revNum, clientName }) ───
    const handleSavePlanToDb = async (requestedAction = 'auto', opts = { silentToast: false }) => {
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
            jumpToStep(1);
            Swal.fire({
                icon: 'warning',
                title: 'Missing Client Name',
                text: 'Please enter the Client Full Name in Step 1 before saving.',
                confirmButtonColor: '#2d6a4f',
            });
            return { ok: false };
        }

        setSavingToClientDb(true);
        try {
            let targetClient = selectedClient;

            if (
                targetClient &&
                typedName &&
                targetClient.full_name?.trim().toLowerCase() !== typedName.toLowerCase()
            ) {
                const choice = await Swal.fire({
                    icon: 'question',
                    title: 'Different Client Name Entered',
                    html: `Save under <strong>${escapeHtmlText(typedName)}</strong> or keep under <strong>${escapeHtmlText(targetClient.full_name)}</strong>?`,
                    showDenyButton: true,
                    showCancelButton: true,
                    confirmButtonText: `Save under "${typedName}"`,
                    denyButtonText: `Keep "${targetClient.full_name}"`,
                    confirmButtonColor: '#2d6a4f',
                    denyButtonColor: '#0f766e',
                });
                if (choice.isDismissed) {
                    setSavingToClientDb(false);
                    return { ok: false };
                }
                if (choice.isConfirmed) {
                    targetClient = null;
                }
            }

            if (!targetClient) {
                const existing = allClients.find((c) => {
                    const cDigits = String(c.phone || '').replace(/\D/g, '');
                    if (
                        phoneDigits.length >= 7 &&
                        cDigits.length >= 7 &&
                        cDigits === phoneDigits
                    ) {
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

            const cleanStartDate = formData.start_date || null;
            const cleanRevisionDate =
                formData.revision_date || formData.next_review_date || null;
            const cleanEndDate = formData.end_date || null;

            const clientPatch = {
                updated_at: new Date().toISOString(),
                next_revision_date: cleanRevisionDate,
            };
            if (cleanStartDate && !targetClient.plan_start_date) {
                clientPatch.plan_start_date = cleanStartDate;
            }
            if (cleanEndDate !== null || targetClient.plan_end_date) {
                clientPatch.plan_end_date = cleanEndDate;
            }
            if (typedPhone) clientPatch.phone = typedPhone;
            if (formData.client_age?.trim()) clientPatch.age = formData.client_age.trim();
            if (formData.client_height?.trim()) clientPatch.height = formData.client_height.trim();
            if (formData.goal?.trim()) clientPatch.initial_goals = formData.goal.trim();

            await supabase.from('clients').update(clientPatch).eq('id', targetClient.id);
            targetClient = { ...targetClient, ...clientPatch };
            setAllClients((prev) =>
                prev.map((c) => (c.id === targetClient.id ? { ...c, ...clientPatch } : c))
            );

            const cleanSnapshot = {
                ...formData,
                client_name: typedName || targetClient.full_name,
                revision_date: cleanRevisionDate || '',
                next_review_date: cleanRevisionDate || '',
                end_date: cleanEndDate || '',
            };

            if (
                action === 'update' &&
                loadedPlanRecord?.id &&
                loadedPlanRecord.client_id === targetClient.id
            ) {
                const resolvedTitle =
                    formData.plan_title?.trim() ||
                    loadedPlanRecord.plan_title ||
                    `Phase ${loadedPlanRecord.revision_number || 1} Diet Plan`;

                const finalSnapshot = { ...cleanSnapshot, plan_title: resolvedTitle };

                const { data: updatedPlan, error: updErr } = await supabase
                    .from('client_diet_plans')
                    .update({
                        plan_title: resolvedTitle,
                        goal: formData.goal?.trim() || null,
                        calories: formData.calories?.trim() || null,
                        start_date: cleanStartDate,
                        revision_date: cleanRevisionDate,
                        end_date: cleanEndDate,
                        pdf_theme: formData.pdf_theme || 'clinical',
                        plan_data: finalSnapshot,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', loadedPlanRecord.id)
                    .select()
                    .single();

                if (updErr) throw updErr;

                setSelectedClient(targetClient);
                setLoadedPlanRecord(updatedPlan);
                fetchClientPastPlans(targetClient.id);

                if (!opts.silentToast) {
                    Swal.fire({
                        icon: 'success',
                        title: `Updated Rev ${updatedPlan.revision_number}`,
                        text: `Saved changes for ${targetClient.full_name}.`,
                        timer: 1600,
                        showConfirmButton: false,
                    });
                }
                return {
                    ok: true,
                    finalFormData: finalSnapshot,
                    revNum: updatedPlan.revision_number,
                    clientName: targetClient.full_name,
                };
            }

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
            const resolvedTitle = formData.plan_title?.trim() || `Phase ${nextRev} Diet Plan`;
            const finalSnapshot = { ...cleanSnapshot, plan_title: resolvedTitle };

            const { data: insertedPlan, error: insErr } = await supabase
                .from('client_diet_plans')
                .insert([
                    {
                        client_id: targetClient.id,
                        revision_number: nextRev,
                        plan_title: resolvedTitle,
                        goal: formData.goal?.trim() || null,
                        calories: formData.calories?.trim() || null,
                        start_date: cleanStartDate,
                        revision_date: cleanRevisionDate,
                        end_date: cleanEndDate,
                        pdf_theme: formData.pdf_theme || 'clinical',
                        plan_data: finalSnapshot,
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

            if (!opts.silentToast) {
                Swal.fire({
                    icon: 'success',
                    title: `Saved Rev ${nextRev}`,
                    text: `"${resolvedTitle}" saved under ${targetClient.full_name}.`,
                    timer: 1700,
                    showConfirmButton: false,
                });
            }
            return {
                ok: true,
                finalFormData: finalSnapshot,
                revNum: nextRev,
                clientName: targetClient.full_name,
            };
        } catch (err) {
            console.error('Error saving diet plan:', err);
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: err.message || 'Unable to save diet plan.',
                confirmButtonColor: '#2d6a4f',
            });
            return { ok: false };
        } finally {
            setSavingToClientDb(false);
        }
    };

    // ─── Download PDF + Unified Save & Download PDF ───
    const generateAndDownloadPdfBlob = async (planPayload) => {
        const targetPlan = planPayload || formData;
        if (!targetPlan.client_name?.trim()) {
            jumpToStep(1);
            Swal.fire({
                icon: 'warning',
                title: 'Missing Client Name',
                text: 'Please enter the Client Full Name in Step 1 before downloading.',
                confirmButtonColor: '#2d6a4f',
            });
            return false;
        }

        setGenerating(true);
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(<DietPlanPdfDocument plan={targetPlan} />).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const safeName = targetPlan.client_name.replace(/[^a-zA-Z0-9_-]/g, '_');
            a.download = `${safeName}_Diet_Plan_TDC.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Error generating PDF:', error);
            Swal.fire({
                icon: 'error',
                title: 'PDF Generation Failed',
                text: error.message,
                confirmButtonColor: '#2d6a4f',
            });
            return false;
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadPdfOnly = async () => {
        const ok = await generateAndDownloadPdfBlob(formData);
        if (ok) {
            Swal.fire({
                icon: 'success',
                title: 'PDF Downloaded!',
                timer: 1800,
                showConfirmButton: false,
            });
        }
    };

    const handleSaveAndDownloadPdf = async (requestedAction = 'auto') => {
        const saveRes = await handleSavePlanToDb(requestedAction, { silentToast: true });
        if (!saveRes.ok) return;

        const pdfOk = await generateAndDownloadPdfBlob(saveRes.finalFormData);
        if (pdfOk) {
            Swal.fire({
                icon: 'success',
                title: `Saved Rev ${saveRes.revNum} & Downloaded PDF!`,
                text: `Stored under ${saveRes.clientName} and saved to your downloads.`,
                confirmButtonColor: '#2d6a4f',
                timer: 2200,
                showConfirmButton: false,
            });
        }
    };

    // ─── WhatsApp Share ───
    const handleOpenWhatsApp = () => {
        const phone = (formData.client_phone || '').replace(/[^0-9]/g, '');
        const dateLines = [];
        if (formData.start_date && formData.end_date) {
            dateLines.push(`Program Validity: ${formData.start_date} to ${formData.end_date}`);
        } else if (formData.start_date) {
            dateLines.push(`Start Date: ${formData.start_date}`);
        } else if (formData.end_date) {
            dateLines.push(`Program End Date: ${formData.end_date}`);
        }
        if (formData.revision_date) {
            dateLines.push(`Next Revision: ${formData.revision_date}`);
        }

        const timelineBlock = dateLines.length > 0 ? `${dateLines.join('\n')}\n` : '';
        const greeting = `Hello ${formData.client_name || ''}! 👋\n\nYour personalized nutrition protocol is ready: *${formData.plan_title || 'Diet Plan'}*.\n\n${timelineBlock}Daily Target: ${formData.calories || '—'} kcal | ${formData.water || '—'}L Water | ${formData.steps || '—'} Steps.\n\nBest regards,\n*Dt. Sabah Ghare*\nThe Diet Cascade`;

        const encoded = encodeURIComponent(greeting);
        const url = phone
            ? `https://wa.me/${phone}?text=${encoded}`
            : `https://wa.me/?text=${encoded}`;
        window.open(url, '_blank');
    };

    // ─── Clinical Auto-Calculator Handlers ───
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
        if (
            Number.isFinite(activeIbwNum) &&
            activeIbwNum > 0 &&
            Number.isFinite(pGrams) &&
            pGrams > 0
        ) {
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
                return { ...prev, calc_config: { ...baseCfg, heightCm: rawCm } };
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
            return { ...prev, ...chainUpdates, calc_config: nextCfg };
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
                return { ...prev, calc_config: { ...baseCfg, heightInches: rawInches } };
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
                    calc_config: { ...baseCfg, heightFeet: rawFeet, heightRemInches: rawRemIn },
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
            return { ...prev, ...chainUpdates, calc_config: nextCfg };
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
                return { ...prev, ...chainUpdates, calc_config: nextCfg };
            }
            return { ...prev, calc_config: nextCfg };
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
            return { ...prev, calc_config: nextCfg };
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
                return { ...prev, calories: rawVal, ...(macros || {}) };
            }
            return { ...prev, calories: rawVal };
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
                return { ...prev, ...(macros || {}), calc_config: nextCfg };
            }
            return { ...prev, calc_config: nextCfg };
        });
    };

    const handleApplyMacroPreset = (pPct, cPct, fPct) => {
        setFormData((prev) => {
            const baseCfg = prev.calc_config || DEFAULT_CALC_CONFIG;
            const nextCfg = { ...baseCfg, proteinPct: pPct, carbsPct: cPct, fatsPct: fPct };
            const calsNum = parseNumericValue(prev.calories);
            const macros =
                Number.isFinite(calsNum) && calsNum > 0
                    ? computeMacrosFromCalories(calsNum, pPct, cPct, fPct)
                    : null;
            return { ...prev, ...(macros || {}), calc_config: nextCfg };
        });
    };

    const handleBalanceMacrosTo100 = () => {
        setFormData((prev) => {
            const baseCfg = prev.calc_config || DEFAULT_CALC_CONFIG;
            const pNum = parseFloat(baseCfg.proteinPct) || 0;
            let cNum = parseFloat(baseCfg.carbsPct) || 0;
            let fNum = parseFloat(baseCfg.fatsPct) || 0;
            const candidateFat = roundOne(100 - pNum - cNum);
            if (candidateFat >= 12 && candidateFat <= 35) {
                fNum = candidateFat;
            } else {
                cNum = Math.max(0, roundOne(100 - pNum - fNum));
                fNum = Math.max(0, roundOne(100 - pNum - cNum));
            }
            const nextCfg = { ...baseCfg, proteinPct: pNum, carbsPct: cNum, fatsPct: fNum };
            const calsNum = parseNumericValue(prev.calories);
            const macros =
                Number.isFinite(calsNum) && calsNum > 0
                    ? computeMacrosFromCalories(calsNum, pNum, cNum, fNum)
                    : null;
            return { ...prev, ...(macros || {}), calc_config: nextCfg };
        });
    };

    const handleToggleLockFields = () =>
        setFormData((prev) => {
            const baseCfg = prev.calc_config || DEFAULT_CALC_CONFIG;
            return {
                ...prev,
                calc_config: { ...baseCfg, fieldsLocked: !baseCfg.fieldsLocked },
            };
        });

    const handleToggleCalculatorPanel = () =>
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

    // ─── Template Save / Load / Delete ───
    const handleApplyTemplate = (template) => {
        if (!template) return;
        Swal.fire({
            title: `Load "${template.label}"?`,
            text: 'This will fill meals, targets, and rules from this saved template.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2d6a4f',
            confirmButtonText: 'Yes, load template',
        }).then((result) => {
            if (!result.isConfirmed) return;
            setFormData((prev) => ({
                ...prev,
                plan_title: template.plan_title || template.label || prev.plan_title,
                goal: template.goal || prev.goal || '',
                calories: template.calories || '',
                protein: template.protein || '',
                carbs: template.carbs || '',
                fats: template.fats || '',
                fibre: template.fibre || '',
                water: template.water || '',
                steps: template.steps || '',
                measurements: Array.isArray(template.measurements)
                    ? JSON.parse(JSON.stringify(template.measurements))
                    : prev.measurements || [],
                dietitian_name: template.dietitian_name || prev.dietitian_name,
                dietitian_note: template.dietitian_note || '',
                meals: Array.isArray(template.meals)
                    ? JSON.parse(JSON.stringify(template.meals))
                    : [],
                supplements: Array.isArray(template.supplements)
                    ? JSON.parse(JSON.stringify(template.supplements))
                    : [],
                workouts: Array.isArray(template.workouts)
                    ? JSON.parse(JSON.stringify(template.workouts))
                    : [],
                guidelines: Array.isArray(template.guidelines)
                    ? JSON.parse(JSON.stringify(template.guidelines))
                    : [],
                donts: Array.isArray(template.donts)
                    ? JSON.parse(JSON.stringify(template.donts))
                    : [],
                recipes: Array.isArray(template.recipes)
                    ? JSON.parse(JSON.stringify(template.recipes))
                    : prev.recipes || [],
                show_special_instructions: Boolean(template.show_special_instructions),
                special_instructions_title:
                    template.special_instructions_title ||
                    'Special Clinical Instructions & Edge-Case Directives',
                special_instructions_badge:
                    template.special_instructions_badge || 'EDGE CASE ADVISORY',
                special_instructions_theme:
                    template.special_instructions_theme || 'emerald',
                special_instructions_style:
                    template.special_instructions_style || 'callout',
                special_instructions: template.special_instructions || '',
                special_instructions_warning: template.special_instructions_warning || '',
                special_instructions_verified: template.special_instructions_verified !== false,
            }));
            setPreviewKey((k) => k + 1);
            Swal.fire({
                icon: 'success',
                title: 'Template Loaded!',
                timer: 1400,
                showConfirmButton: false,
            });
        });
    };

    const handleSaveCurrentAsTemplate = async () => {
        if (formData.meals.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Meals Added',
                text: 'Add at least 1 meal slot in Step 2 before saving as a reusable template.',
                confirmButtonColor: '#2d6a4f',
            });
            return;
        }

        const { value: formValues } = await Swal.fire({
            title: 'Save as Reusable Template',
            html: `
                <div style="text-align: left; font-size: 13px;">
                    <label style="display:block; font-weight: 600; margin-bottom: 4px; color: #1e293b;">Template Name *</label>
                    <input id="swal-template-label" class="swal2-input" placeholder="e.g. PCOS 1500 kcal Vegetarian" value="${escapeHtmlText(formData.plan_title || '')}" style="margin: 0 0 14px 0; width: 100%; font-size: 13px; box-sizing: border-box;">
                    <label style="display:block; font-weight: 600; margin-bottom: 4px; color: #1e293b;">Calorie / Short Tag *</label>
                    <input id="swal-template-badge" class="swal2-input" placeholder="e.g. 1,500 kcal" value="${escapeHtmlText(formData.calories ? `${formData.calories} kcal` : '')}" style="margin: 0; width: 100%; font-size: 13px; box-sizing: border-box;">
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Save Template',
            confirmButtonColor: '#2d6a4f',
            preConfirm: () => {
                const label = document.getElementById('swal-template-label').value.trim();
                const badge = document.getElementById('swal-template-badge').value.trim();
                if (!label || !badge) {
                    Swal.showValidationMessage('Please fill both template name and tag');
                    return false;
                }
                return { label, badge };
            },
        });

        if (!formValues) return;

        try {
            const { error } = await supabase.from('diet_plan_templates').insert([
                {
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
                    is_preset: false,
                },
            ]);

            if (error) throw error;
            fetchTemplates();
            Swal.fire({
                icon: 'success',
                title: 'Template Saved!',
                timer: 1700,
                showConfirmButton: false,
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: err.message,
                confirmButtonColor: '#2d6a4f',
            });
        }
    };

    const handleDeleteTemplate = (templateId, templateLabel, e) => {
        e.stopPropagation();
        Swal.fire({
            title: `Delete "${templateLabel}"?`,
            text: 'This permanently removes the saved template.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Delete',
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const { error } = await supabase
                    .from('diet_plan_templates')
                    .delete()
                    .eq('id', templateId);
                if (error) throw error;
                setTemplates((prev) => prev.filter((t) => t.id !== templateId));
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Delete Failed', text: err.message });
            }
        });
    };

    // ─── Recipe Repeat Detection & Soft-Edit Handlers ───
    const { previousRecipeById, previousRecipeByName, pastPlansCheckedCount } = useMemo(() => {
        const byId = new Map();
        const byName = new Map();
        let checkedCount = 0;

        for (const plan of clientPastPlans) {
            if (!plan) continue;
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
                const rawId =
                    r.id !== undefined && r.id !== null ? String(r.id).trim() : '';
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
                recipe.id !== undefined && recipe.id !== null
                    ? String(recipe.id).trim()
                    : '';
            const normName = String(recipe.name || '').trim().toLowerCase();

            const merged = new Map();
            if (rawId && previousRecipeById.has(rawId)) {
                for (const u of previousRecipeById.get(rawId)) merged.set(u.planId, u);
            }
            if (normName && previousRecipeByName.has(normName)) {
                for (const u of previousRecipeByName.get(normName)) merged.set(u.planId, u);
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
                    `Rev ${u.revisionNumber || '—'}: ${u.planTitle}${u.startDate ? ` (${u.startDate})` : ''
                    }`
            )
            .join(' • ');
    };

    const repeatedAttachedCount = useMemo(
        () =>
            (formData.recipes || []).filter((r) => getPreviousRecipeUsages(r).length > 0)
                .length,
        [formData.recipes, getPreviousRecipeUsages]
    );

    const confirmRepeatRecipeAttachment = async (recipeName, pastUsages) => {
        const clientLabel = escapeHtmlText(
            effectiveClient?.full_name || formData.client_name || 'this client'
        );
        const safeDish = escapeHtmlText(recipeName || 'This recipe');
        const itemsHtml = pastUsages
            .map((u) => {
                const revTag = u.revisionNumber
                    ? `Rev ${escapeHtmlText(u.revisionNumber)}`
                    : 'Plan';
                const titleTag = escapeHtmlText(u.planTitle || 'Saved Diet Plan');
                const dateTag = u.startDate
                    ? ` <span style="color:#6b7280;">(${escapeHtmlText(u.startDate)})</span>`
                    : '';
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
        const exists = currentRecipes.some((r) => r.id === recipe.id);

        if (exists) {
            setFormData((prev) => ({
                ...prev,
                recipes: (prev.recipes || []).filter((r) => r.id !== recipe.id),
            }));
            if (editingRecipeId === recipe.id) setEditingRecipeId(null);
            return;
        }

        const pastUsages = getPreviousRecipeUsages(recipe);
        if (pastUsages.length > 0) {
            const proceed = await confirmRepeatRecipeAttachment(recipe.name, pastUsages);
            if (!proceed) return;
        }

        setFormData((prev) => {
            const latest = prev.recipes || [];
            if (latest.some((r) => r.id === recipe.id)) return prev;
            return { ...prev, recipes: [...latest, JSON.parse(JSON.stringify(recipe))] };
        });
    };

    const handleRemoveSelectedRecipe = (recipeId) => {
        setFormData((prev) => ({
            ...prev,
            recipes: (prev.recipes || []).filter((r) => r.id !== recipeId),
        }));
        if (editingRecipeId === recipeId) setEditingRecipeId(null);
    };

    const handleClearAllRecipes = () => {
        setFormData((prev) => ({ ...prev, recipes: [] }));
        setEditingRecipeId(null);
    };

    const handleSoftEditRecipe = (recipeId, field, value) => {
        setFormData((prev) => ({
            ...prev,
            recipes: (prev.recipes || []).map((r) =>
                r.id === recipeId ? { ...r, [field]: value, is_soft_edited: true } : r
            ),
        }));
    };

    const handleSoftEditIngredientsText = (recipeId, rawText) => {
        const normalized = String(rawText ?? '').replace(/\r\n/g, '\n');
        handleSoftEditRecipe(recipeId, 'ingredients', normalized.split('\n'));
    };

    const handleSoftEditInstructionsText = (recipeId, rawText) => {
        const normalized = String(rawText ?? '').replace(/\r\n/g, '\n');
        handleSoftEditRecipe(recipeId, 'instructions', normalized.split('\n'));
    };

    const handleFinishSoftEditRecipe = (recipeId) => {
        setFormData((prev) => ({
            ...prev,
            recipes: (prev.recipes || []).map((r) => {
                if (r.id !== recipeId) return r;
                const cleanIngs = Array.isArray(r.ingredients)
                    ? r.ingredients.map((l) => String(l || '').trim()).filter(Boolean)
                    : String(r.ingredients || '')
                        .split('\n')
                        .map((l) => l.trim())
                        .filter(Boolean);
                const cleanInst = Array.isArray(r.instructions)
                    ? r.instructions.map((l) => String(l || '').trim()).filter(Boolean)
                    : String(r.instructions || '')
                        .split('\n')
                        .map((l) => l.trim())
                        .filter(Boolean);
                return {
                    ...r,
                    name: String(r.name || '').trim() || 'Custom Dish',
                    category: String(r.category || '').trim() || 'General',
                    ingredients: cleanIngs,
                    instructions: cleanInst,
                };
            }),
        }));
        setEditingRecipeId(null);
    };

    const handleResetRecipeToMaster = async (recipeId) => {
        let master = availableRecipes.find((r) => r.id === recipeId);
        if (!master) {
            try {
                const { data } = await supabase
                    .from('recipes')
                    .select('*')
                    .eq('id', recipeId)
                    .single();
                if (data) master = data;
            } catch {
                // Ignore
            }
        }
        if (!master) {
            Swal.fire({
                icon: 'warning',
                title: 'Original Recipe Not Found',
                timer: 1800,
                showConfirmButton: false,
            });
            return;
        }
        setFormData((prev) => ({
            ...prev,
            recipes: (prev.recipes || []).map((r) =>
                r.id === recipeId ? JSON.parse(JSON.stringify(master)) : r
            ),
        }));
    };

    // ─── Create New Recipe Modal Handlers ───
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
        setIsNewRecipeModalOpen(true);
    };

    const handleCreateAndAttachRecipe = async (e) => {
        e.preventDefault();
        if (!newRecipeForm.name.trim()) return;

        const cleanIngredients = cleanMultilineItems(newRecipeForm.ingredients, false);
        const cleanInstructions = cleanMultilineItems(newRecipeForm.instructions, true);

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
        } catch (err) {
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

    const activeMeasurementColsCount = useMemo(() => {
        const rows = formData.measurements || [];
        const cols = ['date', 'weight', 'belly_button', 'hip', 'thigh', 'neck', 'bicep'];
        return cols.filter((c) =>
            rows.some(
                (r) =>
                    r &&
                    r[c] &&
                    String(r[c]).trim() !== '' &&
                    String(r[c]).trim() !== '-'
            )
        ).length;
    }, [formData.measurements]);

    // Step Completion Indicators for Guided Stepper
    const stepCompletion = useMemo(
        () => ({
            1: Boolean(formData.client_name?.trim()),
            2: (formData.meals?.length || 0) > 0,
            3:
                (formData.recipes?.length || 0) > 0 ||
                formData.guidelines.length > 0 ||
                formData.donts.length > 0 ||
                (formData.supplements?.length || 0) > 0 ||
                (formData.workouts?.length || 0) > 0 ||
                Boolean(formData.show_special_instructions),
            4: false,
        }),
        [
            formData.client_name,
            formData.meals,
            formData.recipes,
            formData.guidelines,
            formData.donts,
            formData.supplements,
            formData.workouts,
            formData.show_special_instructions,
        ]
    );

    const isSplitDesktopActive =
        showSplitPreview && !(layoutMode === 'guided' && currentStep === 4);

    return (
        <div
            ref={topAnchorRef}
            className="bg-gray-50 pb-24 md:pb-16 font-sans text-heading"
        >
            <div className="max-w-7xl mx-auto px-0.5 sm:px-2 py-1 sm:py-3">
                {/* ── TOP CONTEXT HEADER ── */}
                <div className="mb-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
                            <Link
                                href={
                                    selectedClient
                                        ? `/admin/clients/${selectedClient.id}`
                                        : '/admin/clients'
                                }
                                className="inline-flex items-center gap-1 font-semibold text-gray-500 hover:text-primary transition min-w-0"
                            >
                                <ArrowLeft size={13} className="shrink-0" />
                                <span className="truncate max-w-40 sm:max-w-xs">
                                    {selectedClient
                                        ? selectedClient.full_name
                                        : 'All Clients'}
                                </span>
                            </Link>
                            {loadedPlanRecord && (
                                <>
                                    <span className="text-gray-300">/</span>
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                                        Editing Rev {loadedPlanRecord.revision_number}
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            {/* Auto-Save Status */}
                            <span className="text-[11px] text-gray-400 inline-flex items-center gap-1 mr-1">
                                {saveStatus === 'saving' && (
                                    <>
                                        <RefreshCw
                                            size={10}
                                            className="animate-spin text-amber-600"
                                        />
                                        <span className="hidden sm:inline">Saving…</span>
                                    </>
                                )}
                                {(saveStatus === 'saved' || saveStatus === 'restored') && (
                                    <>
                                        <CheckCircle2
                                            size={11}
                                            className="text-emerald-600"
                                        />
                                        <span className="hidden sm:inline">
                                            Draft saved
                                            {lastSavedTimeLabel ? ` ${lastSavedTimeLabel}` : ''}
                                        </span>
                                    </>
                                )}
                                {saveStatus === 'error' && (
                                    <>
                                        <AlertCircle size={11} className="text-red-500" />
                                        <span className="text-red-500">Draft full</span>
                                    </>
                                )}
                            </span>

                            <Link
                                href="/admin/clients"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-[11px] font-semibold text-heading transition"
                            >
                                <Users size={13} className="text-primary" />
                                <span className="hidden sm:inline">Client Directory</span>
                                <span className="sm:hidden">Clients</span>
                            </Link>
                        </div>
                    </div>

                    {/* Title + Mode Switcher + Quick Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h1 className="text-lg sm:text-2xl font-bold text-heading leading-tight">
                            Diet Plan Builder
                        </h1>

                        <div className="flex items-center gap-1.5 ml-auto">
                            {/* Guided vs All-in-One Mode Switch */}
                            <div className="bg-gray-200/70 p-0.5 rounded-xl inline-flex items-center text-[11px] font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setLayoutMode('guided')}
                                    className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${layoutMode === 'guided'
                                        ? 'bg-white text-heading font-bold shadow-2xs'
                                        : 'text-gray-600 hover:text-heading'
                                        }`}
                                >
                                    Step-by-Step
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLayoutMode('all')}
                                    className={`px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition cursor-pointer ${layoutMode === 'all'
                                        ? 'bg-white text-heading font-bold shadow-2xs'
                                        : 'text-gray-600 hover:text-heading'
                                        }`}
                                >
                                    <Layers size={12} />
                                    <span>All-in-One</span>
                                </button>
                            </div>

                            {/* Optional Wide-Screen Live Split PDF Toggle */}
                            {!(layoutMode === 'guided' && currentStep === 4) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSplitPreview((o) => !o);
                                        setPreviewKey((k) => k + 1);
                                    }}
                                    className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${showSplitPreview
                                        ? 'bg-emerald-50 text-primary border-emerald-200 font-bold'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    title="Show live PDF side-by-side"
                                >
                                    <Columns size={13} />
                                    <span>Live PDF</span>
                                </button>
                            )}

                            {/* Desktop Quick Save & PDF */}
                            <button
                                type="button"
                                disabled={savingToClientDb || generating}
                                onClick={() => handleSaveAndDownloadPdf('auto')}
                                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-50"
                            >
                                {savingToClientDb || generating ? (
                                    <RefreshCw size={13} className="animate-spin" />
                                ) : (
                                    <Download size={13} />
                                )}
                                <span>Save &amp; PDF</span>
                            </button>

                            {/* Reset Clean Slate */}
                            <button
                                type="button"
                                onClick={handleClearForm}
                                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition cursor-pointer"
                                title="Reset everything to a blank form"
                                aria-label="Reset form"
                            >
                                <RotateCcw size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── STICKY 4-STEP GUIDED STEPPER BAR (Guided Mode) ── */}
                {layoutMode === 'guided' && (
                    <div className="sticky top-15 md:top-2 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-1.5 sm:p-2 mb-4 border border-gray-200/90 shadow-xs">
                        <div className="grid grid-cols-4 gap-1 sm:gap-2">
                            {STEPS.map((st) => {
                                const Icon = st.icon;
                                const isActive = currentStep === st.id;
                                const isDone = stepCompletion[st.id] && !isActive;

                                return (
                                    <button
                                        key={st.id}
                                        type="button"
                                        onClick={() => jumpToStep(st.id)}
                                        className={`min-h-11 px-2 sm:px-3 py-2 rounded-xl flex items-center justify-center sm:justify-start gap-2 text-left transition cursor-pointer ${isActive
                                            ? 'bg-primary text-white shadow-xs'
                                            : isDone
                                                ? 'bg-emerald-50/70 text-emerald-900 hover:bg-emerald-50'
                                                : 'bg-gray-50/70 text-gray-500 hover:bg-gray-100 hover:text-heading'
                                            }`}
                                    >
                                        <span
                                            className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${isActive
                                                ? 'bg-white/20 text-white'
                                                : isDone
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-200/80 text-gray-600'
                                                }`}
                                        >
                                            {isDone ? '✓' : st.id}
                                        </span>
                                        <div className="min-w-0 hidden sm:block">
                                            <p className="text-xs font-bold truncate leading-tight">
                                                {st.shortLabel}
                                            </p>
                                        </div>
                                        <Icon size={14} className="sm:hidden shrink-0" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── MAIN WORKSPACE GRID ── */}
                <div
                    className={`grid gap-5 ${isSplitDesktopActive ? 'xl:grid-cols-12 items-start' : 'grid-cols-1'
                        }`}
                >
                    <div
                        className={`space-y-5 ${isSplitDesktopActive ? 'xl:col-span-7' : ''
                            }`}
                    >
                        {/* STEP 1: CLIENT & BASICS */}
                        {(layoutMode === 'all' || currentStep === 1) && (
                            <StepClientBasics
                                formData={formData}
                                setFormData={setFormData}
                                allClients={allClients}
                                selectedClient={selectedClient}
                                onSelectClientObject={handleSelectClientObject}
                                onDetachClient={handleDetachClient}
                                onClientNameChange={handleClientNameChange}
                                clientPastPlans={clientPastPlans}
                                loadedPlanRecord={loadedPlanRecord}
                                onCopyPastPlan={handleCopyPastPlan}
                                templates={templates}
                                loadingTemplates={loadingTemplates}
                                onApplyTemplate={handleApplyTemplate}
                                onSaveCurrentAsTemplate={handleSaveCurrentAsTemplate}
                                onDeleteTemplate={handleDeleteTemplate}
                                calcConfig={calcConfig}
                                activeIbwNum={activeIbwNum}
                                onHeightCmChange={handleHeightCmChange}
                                onHeightInchesChange={handleHeightInchesChange}
                                onHeightFeetInchesChange={handleHeightFeetInchesChange}
                                onIbwOffsetChange={handleIbwOffsetChange}
                                onManualIbwChange={handleManualIbwChange}
                            />
                        )}

                        {/* STEP 2: TARGETS & DAILY MEALS */}
                        {(layoutMode === 'all' || currentStep === 2) && (
                            <StepTargetsAndMeals
                                formData={formData}
                                setFormData={setFormData}
                                calcConfig={calcConfig}
                                fieldsLocked={fieldsLocked}
                                activeIbwNum={activeIbwNum}
                                activeCaloriesNum={activeCaloriesNum}
                                macroPctSum={macroPctSum}
                                proteinPerKgIbw={proteinPerKgIbw}
                                onManualCaloriesChange={handleManualCaloriesChange}
                                onCalMultiplierChange={handleCalMultiplierChange}
                                onMacroPctChange={handleMacroPctChange}
                                onApplyMacroPreset={handleApplyMacroPreset}
                                onBalanceMacrosTo100={handleBalanceMacrosTo100}
                                onToggleLockFields={handleToggleLockFields}
                                onToggleCalculatorPanel={handleToggleCalculatorPanel}
                                onOpenTemplatesStep={
                                    layoutMode === 'guided' ? () => jumpToStep(1) : null
                                }
                            />
                        )}

                        {/* STEP 3: OPTIONAL EXTRAS & RECIPES */}
                        {(layoutMode === 'all' || currentStep === 3) && (
                            <StepExtrasAndRecipes
                                formData={formData}
                                setFormData={setFormData}
                                availableRecipes={availableRecipes}
                                loadingRecipes={loadingRecipes}
                                recipeSearch={recipeSearch}
                                setRecipeSearch={setRecipeSearch}
                                recipeCategoryFilter={recipeCategoryFilter}
                                setRecipeCategoryFilter={setRecipeCategoryFilter}
                                editingRecipeId={editingRecipeId}
                                setEditingRecipeId={setEditingRecipeId}
                                effectiveClient={effectiveClient}
                                pastPlansCheckedCount={pastPlansCheckedCount}
                                repeatedAttachedCount={repeatedAttachedCount}
                                getPreviousRecipeUsages={getPreviousRecipeUsages}
                                formatPastUsageBadge={formatPastUsageBadge}
                                formatPastUsageTooltip={formatPastUsageTooltip}
                                onToggleRecipe={handleToggleRecipe}
                                onRemoveSelectedRecipe={handleRemoveSelectedRecipe}
                                onClearAllRecipes={handleClearAllRecipes}
                                onSoftEditRecipe={handleSoftEditRecipe}
                                onSoftEditIngredientsText={handleSoftEditIngredientsText}
                                onSoftEditInstructionsText={handleSoftEditInstructionsText}
                                onFinishSoftEditRecipe={handleFinishSoftEditRecipe}
                                onResetRecipeToMaster={handleResetRecipeToMaster}
                                onOpenNewRecipeModal={handleOpenNewRecipeModal}
                                activeMeasurementColsCount={activeMeasurementColsCount}
                            />
                        )}

                        {/* STEP 4: REVIEW, SAVE & SHARE */}
                        {(layoutMode === 'all' || currentStep === 4) && (
                            <StepReviewAndShare
                                formData={formData}
                                setFormData={setFormData}
                                loadedPlanRecord={loadedPlanRecord}
                                onDetachLoadedRevision={() => setLoadedPlanRecord(null)}
                                savingToClientDb={savingToClientDb}
                                generating={generating}
                                onSaveAndDownloadPdf={handleSaveAndDownloadPdf}
                                onSavePlanToDb={handleSavePlanToDb}
                                onDownloadPdfOnly={handleDownloadPdfOnly}
                                onOpenWhatsApp={handleOpenWhatsApp}
                                onJumpToStep={
                                    layoutMode === 'guided' ? jumpToStep : null
                                }
                                previewKey={previewKey}
                                onRefreshPreview={() => setPreviewKey((k) => k + 1)}
                                PDFViewerComponent={PDFViewer}
                                DietPlanPdfDocumentComponent={DietPlanPdfDocument}
                            />
                        )}

                        {/* ── DESKTOP GUIDED STEP NAVIGATION FOOTER ── */}
                        {layoutMode === 'guided' && (
                            <div className="hidden md:flex items-center justify-between bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs">
                                <button
                                    type="button"
                                    disabled={currentStep === 1}
                                    onClick={() => jumpToStep(currentStep - 1)}
                                    className="min-h-10 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-heading text-xs font-bold disabled:opacity-40 transition cursor-pointer"
                                >
                                    <ArrowLeft size={14} />
                                    <span>Previous Step</span>
                                </button>

                                <span className="text-xs text-gray-400 font-medium">
                                    Step {currentStep} of 4 — {STEPS[currentStep - 1].shortLabel}
                                </span>

                                {currentStep < 4 ? (
                                    <button
                                        type="button"
                                        onClick={() => jumpToStep(currentStep + 1)}
                                        className="min-h-10 inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition cursor-pointer"
                                    >
                                        <span>
                                            Next: {STEPS[currentStep].shortLabel}
                                        </span>
                                        <ArrowRight size={14} />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={savingToClientDb || generating}
                                        onClick={() => handleSaveAndDownloadPdf('auto')}
                                        className="min-h-10 inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                                    >
                                        <Download size={14} />
                                        <span>Save Plan &amp; Download PDF</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── OPTIONAL WIDE-DESKTOP SPLIT LIVE PDF COLUMN ── */}
                    {isSplitDesktopActive && (
                        <div className="hidden xl:flex xl:col-span-5 bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-xs flex-col sticky top-18 h-[calc(100dvh-6rem)]">
                            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100">
                                <span className="text-xs font-bold text-heading flex items-center gap-1.5">
                                    <Eye size={14} className="text-primary" />
                                    Live PDF Preview
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPreviewKey((k) => k + 1)}
                                    className="text-[11px] font-semibold text-gray-500 hover:text-primary inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <RefreshCw size={12} />
                                    <span>Refresh</span>
                                </button>
                            </div>
                            <div className="flex-1 rounded-xl overflow-hidden border border-gray-200">
                                <PDFViewer
                                    key={previewKey}
                                    width="100%"
                                    height="100%"
                                    showToolbar={true}
                                >
                                    <DietPlanPdfDocument plan={formData} />
                                </PDFViewer>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MOBILE THUMB-ZONE NAVIGATION & SAVE BAR (< md) ── */}
            <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3.5 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-2 max-w-lg mx-auto">
                    {layoutMode === 'guided' && currentStep < 4 ? (
                        <>
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={() => jumpToStep(currentStep - 1)}
                                    className="min-h-11 px-3.5 rounded-xl bg-gray-100 active:bg-gray-200 text-heading font-bold text-xs inline-flex items-center justify-center gap-1 cursor-pointer shrink-0"
                                >
                                    <ArrowLeft size={14} />
                                    <span>Back</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => jumpToStep(currentStep + 1)}
                                className="flex-1 min-h-11 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                                <span>
                                    Next: {STEPS[currentStep].shortLabel}
                                </span>
                                <ArrowRight size={14} />
                            </button>
                        </>
                    ) : (
                        <>
                            {layoutMode === 'guided' && (
                                <button
                                    type="button"
                                    onClick={() => jumpToStep(3)}
                                    className="min-h-11 px-3 rounded-xl bg-gray-100 active:bg-gray-200 text-heading font-bold text-xs inline-flex items-center justify-center gap-1 cursor-pointer shrink-0"
                                >
                                    <ArrowLeft size={14} />
                                    <span>Back</span>
                                </button>
                            )}
                            <button
                                type="button"
                                disabled={savingToClientDb || generating}
                                onClick={() => handleSaveAndDownloadPdf('auto')}
                                className="flex-1 min-h-11 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                                {savingToClientDb || generating ? (
                                    <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                    <Download size={14} />
                                )}
                                <span>
                                    {loadedPlanRecord
                                        ? `Save Rev ${loadedPlanRecord.revision_number} & PDF`
                                        : 'Save & Download PDF'}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={handleOpenWhatsApp}
                                className="min-h-11 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs inline-flex items-center justify-center cursor-pointer shrink-0"
                                title="Send WhatsApp Summary"
                            >
                                <Send size={15} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── CREATE & ATTACH NEW RECIPE MODAL ── */}
            <NewRecipeModal
                key={isNewRecipeModalOpen ? 'new-recipe-open' : 'new-recipe-closed'}
                isOpen={isNewRecipeModalOpen}
                onClose={() => setIsNewRecipeModalOpen(false)}
                newRecipeForm={newRecipeForm}
                setNewRecipeForm={setNewRecipeForm}
                savingNewRecipe={savingNewRecipe}
                saveNewRecipeToBank={saveNewRecipeToBank}
                setSaveNewRecipeToBank={setSaveNewRecipeToBank}
                onSubmit={handleCreateAndAttachRecipe}
            />
        </div>
    );
}

export default function AdminDietPlanGeneratorPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
                    <RefreshCw size={18} className="animate-spin mr-2 text-primary" />
                    Loading Diet Plan Builder...
                </div>
            }
        >
            <AdminDietPlanGeneratorContent />
        </Suspense>
    );
}
