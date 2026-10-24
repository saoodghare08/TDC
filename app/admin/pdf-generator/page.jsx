'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
    FileText, Download, Send, Sparkles, Plus, Trash2,
    Calendar, User, Target, Scale, Droplet, Flame, Eye,
    CheckCircle, AlertCircle, RefreshCw, ArrowLeft, Clock,
    Share2, Printer, RotateCcw, BookmarkPlus, Database,
    Info, Copy, ChefHat, Utensils, Search, X, Palette,
    ShieldAlert, ChevronDown, ChevronUp, Edit3, Undo2,
    Maximize2, Minimize2, Check, ExternalLink, Sliders,
    Dumbbell, Activity
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
    special_instructions_verified: true
};

export default function AdminPdfGeneratorPage() {
    const supabase = createClient();

    // Form State (Starts Empty On Load)
    const [formData, setFormData] = useState(EMPTY_FORM_STATE);

    // Collapsible Sections State
    const [collapsed, setCollapsed] = useState({
        presets: false,       // Presets (open by default, collapsible)
        profile: false,       // 1. Client Profile (open by default)
        targets: false,       // 2. Targets (open by default)
        measurements: false,  // 3. Body Measurements (open by default)
        meals: false,         // 4. Meals (open by default)
        supplements: true,    // 5. Supplements (collapsed by default)
        workouts: false,      // 6. Workouts (open by default)
        special: true,        // 7. Special Directives (collapsed by default)
        rules: true,          // 8. Rules (collapsed by default)
        recipes: false        // 9. Recipes (open by default)
    });

    const toggleSection = (key) => {
        setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const expandAll = () => {
        setCollapsed({
            presets: false,
            profile: false,
            targets: false,
            measurements: false,
            meals: false,
            supplements: false,
            workouts: false,
            special: false,
            rules: false,
            recipes: false
        });
    };

    const collapseAll = () => {
        setCollapsed({
            presets: true,
            profile: true,
            targets: true,
            measurements: true,
            meals: true,
            supplements: true,
            workouts: true,
            special: true,
            rules: true,
            recipes: true
        });
    };

    // Soft-Editing State for Attached Recipes
    const [editingRecipeId, setEditingRecipeId] = useState(null);

    // Dynamic Database Templates State
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [dbAvailable, setDbAvailable] = useState(true);

    // Dynamic Recipes State (On-demand Search)
    const [availableRecipes, setAvailableRecipes] = useState([]);
    const [loadingRecipes, setLoadingRecipes] = useState(false);
    const [recipeSearch, setRecipeSearch] = useState('');
    const [recipeCategoryFilter, setRecipeCategoryFilter] = useState('All');

    // UI state
    const [activeView, setActiveView] = useState('editor'); // 'editor' | 'preview' | 'split'
    const [generating, setGenerating] = useState(false);
    const [previewKey, setPreviewKey] = useState(1);

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
                setDbAvailable(false);
                setTemplates([]);
            } else {
                setDbAvailable(true);
                setTemplates(data || []);
            }
        } catch (err) {
            console.error('Error connecting to database templates:', err);
            setDbAvailable(false);
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
                setFormData(EMPTY_FORM_STATE);
                setEditingRecipeId(null);
                setPreviewKey(k => k + 1);
            }
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
                    water: formData.water,
                    steps: formData.steps,
                    dietitian_name: formData.dietitian_name,
                    dietitian_note: formData.dietitian_note,
                    meals: formData.meals,
                    supplements: formData.supplements,
                    workouts: formData.workouts,
                    guidelines: formData.guidelines,
                    donts: formData.donts,
                    recipes: formData.recipes,
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

    // ─── Attached Recipes Helpers ───
    const handleToggleRecipe = (recipe) => {
        const currentRecipes = formData.recipes || [];
        const exists = currentRecipes.some(r => r.id === recipe.id);
        const updated = exists
            ? currentRecipes.filter(r => r.id !== recipe.id)
            : [...currentRecipes, JSON.parse(JSON.stringify(recipe))];

        setFormData(prev => ({ ...prev, recipes: updated }));
        if (exists && editingRecipeId === recipe.id) {
            setEditingRecipeId(null);
        }
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
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-heading">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

                {/* ── Header (Styled like Clients page) ── */}
                <div className="flex items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-heading flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <FileText size={22} className="text-primary" />
                            </div>
                            Diet Plan Generator
                        </h1>
                        <p className="text-gray-400 text-sm mt-1 ml-1">Create clinical diet plans with live vector PDF export</p>
                    </div>
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 text-heading font-bold rounded-xl hover:bg-gray-100 transition shadow-xs text-xs sm:text-sm shrink-0"
                    >
                        <ArrowLeft size={16} />
                        <span className="hidden sm:inline">Back to Dashboard</span>
                        <span className="sm:hidden">Dashboard</span>
                    </Link>
                </div>

                {/* ════════════════ TOP ACTION TOOLBAR ════════════════ */}
                <div className="bg-white rounded-2xl p-2.5 sm:p-3 mb-4 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    {/* Mode switcher tabs */}
                    <div className="bg-gray-100 p-1 rounded-xl flex items-center w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setActiveView('editor')}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeView === 'editor' ? 'bg-white text-heading shadow-xs font-bold' : 'text-gray-500 hover:text-heading'
                                }`}
                        >
                            <FileText size={13} />
                            <span>Edit Form</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setActiveView('preview'); setPreviewKey(k => k + 1); }}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeView === 'preview' ? 'bg-white text-heading shadow-xs font-bold' : 'text-gray-500 hover:text-heading'
                                }`}
                        >
                            <Eye size={13} className="text-primary" />
                            <span>Preview</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setActiveView('split'); setPreviewKey(k => k + 1); }}
                            className={`hidden lg:flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeView === 'split' ? 'bg-white text-heading shadow-xs font-bold' : 'text-gray-500 hover:text-heading'
                                }`}
                        >
                            <Sliders size={13} />
                            <span>Split View</span>
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {/* Reset Form */}
                        <button
                            type="button"
                            onClick={handleClearForm}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600 hover:text-red-600 font-semibold text-xs rounded-xl shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
                            title="Reset all fields"
                        >
                            <RotateCcw size={12} />
                            <span>Reset</span>
                        </button>

                        {/* WhatsApp Quick Share */}
                        <button
                            type="button"
                            onClick={handleOpenWhatsApp}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-semibold text-xs rounded-xl transition active:scale-95 cursor-pointer shrink-0"
                            title="Share on WhatsApp"
                        >
                            <Send size={12} />
                            <span>WhatsApp</span>
                        </button>

                        {/* Download PDF */}
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={generating}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-xs shadow-primary/20 transition active:scale-95 disabled:opacity-50 cursor-pointer min-w-0"
                        >
                            {generating ? <RefreshCw size={13} className="animate-spin text-white shrink-0" /> : <Download size={13} className="text-white shrink-0" />}
                            <span className="truncate">Download PDF</span>
                        </button>
                    </div>
                </div>

                {/* ════════════════ THEME & PRESETS ════════════════ */}
                <div className="bg-white rounded-2xl p-4 sm:p-4.5 mb-5 border border-gray-200/80 shadow-xs">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 items-start">

                        {/* Theme Picker */}
                        <div className="md:col-span-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-heading uppercase tracking-wider flex items-center gap-1.5">
                                    <Palette size={13} className="text-primary" />
                                    <span>Theme</span>
                                </label>
                                <span className="text-[10px] text-gray-400 font-medium">
                                    {formData.pdf_theme === 'senior' ? 'Senior Large-Print' : 'Clinical Precision'}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, pdf_theme: 'clinical' }));
                                        setPreviewKey(k => k + 1);
                                    }}
                                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${formData.pdf_theme !== 'senior'
                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600/30 shadow-2xs'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 bg-white'
                                        }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${formData.pdf_theme !== 'senior' ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                                    <span>Clinical</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, pdf_theme: 'senior' }));
                                        setPreviewKey(k => k + 1);
                                    }}
                                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${formData.pdf_theme === 'senior'
                                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-400 shadow-2xs'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 bg-white'
                                        }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${formData.pdf_theme === 'senior' ? 'bg-amber-500' : 'bg-gray-300'}`} />
                                    <span>Senior</span>
                                </button>
                            </div>
                        </div>

                        {/* Presets: Vertical scroll & Collapsible */}
                        <div className="md:col-span-8 space-y-2">
                            <div
                                onClick={() => toggleSection('presets')}
                                className="flex items-center justify-between cursor-pointer select-none"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-accent" />
                                    <span className="text-xs font-bold text-heading uppercase tracking-wider">Presets</span>
                                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2 py-0.2 rounded-full">
                                        {templates.length}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSaveCurrentAsTemplate();
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white font-bold text-[11px] rounded-lg hover:bg-primary-hover shadow-2xs transition cursor-pointer active:scale-95"
                                        title="Save current form values as a new preset"
                                    >
                                        <BookmarkPlus size={11} />
                                        <span>Save As Preset</span>
                                    </button>
                                    <span className="text-gray-400">
                                        {collapsed.presets ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
                                    </span>
                                </div>
                            </div>

                            {!collapsed.presets && (
                                <div className="p-2 rounded-xl bg-gray-50/80 border border-gray-200/80">
                                    {loadingTemplates ? (
                                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 py-3">
                                            <RefreshCw size={12} className="animate-spin text-primary" />
                                            <span>Loading presets...</span>
                                        </div>
                                    ) : templates.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic text-center py-2.5">
                                            No presets saved yet. Build a plan below and click Save As Preset.
                                        </p>
                                    ) : (
                                        <div className="overflow-y-auto max-h-48 space-y-1.5 pr-1">
                                            {templates.map((preset) => (
                                                <div
                                                    key={preset.id || preset.label}
                                                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200 hover:border-primary/40 hover:bg-emerald-50/40 transition shadow-2xs"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApplyTemplate(preset)}
                                                        className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
                                                        title={`Click to load: ${preset.label}`}
                                                    >
                                                        <span className="font-semibold text-xs text-heading truncate">{preset.label}</span>
                                                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0">
                                                            {preset.badge || (preset.calories ? `${preset.calories} kcal` : 'Preset')}
                                                        </span>
                                                    </button>
                                                    {preset.id && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleDeleteTemplate(preset.id, preset.label, e)}
                                                            className="p-1 text-gray-400 hover:text-red-500 rounded transition ml-2 cursor-pointer"
                                                            title="Delete preset"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* ════════════════ GLOBAL COLLAPSE / EXPAND TOGGLE ════════════════ */}
                <div className="flex items-center justify-between mb-3 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-heading text-sm">Form Blueprint Sections</span>
                        <span className="text-para text-[11px] hidden sm:inline">Tap any section to expand or collapse</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={expandAll}
                            className="inline-flex items-center gap-1 text-[11px] text-gray-600 hover:text-primary font-semibold px-2 py-1 rounded-md bg-white border border-gray-200 shadow-2xs transition cursor-pointer"
                        >
                            <Maximize2 size={11} />
                            <span>Expand All</span>
                        </button>
                        <button
                            type="button"
                            onClick={collapseAll}
                            className="inline-flex items-center gap-1 text-[11px] text-gray-600 hover:text-primary font-semibold px-2 py-1 rounded-md bg-white border border-gray-200 shadow-2xs transition cursor-pointer"
                        >
                            <Minimize2 size={11} />
                            <span>Collapse All</span>
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
                                    className="p-4 sm:p-4.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 select-none border-b border-gray-100"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                            <User size={15} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xs sm:text-sm text-heading flex items-center gap-2">
                                                <span>1. Client Information & Timeline</span>
                                                {formData.client_name && (
                                                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.2 rounded-full font-bold">
                                                        {formData.client_name}
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-[11px] text-para line-clamp-1">
                                                {formData.client_name
                                                    ? `${formData.client_name} • ${formData.client_age || 'Age —'} • ${formData.start_weight || '—'} → ${formData.target_weight || '—'}`
                                                    : 'Client demographics, measurements, habits and dates'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        {collapsed.profile ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                    </div>
                                </div>

                                {!collapsed.profile && (
                                    <div className="p-4 sm:p-5 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {/* Client Name */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Client Full Name *</label>
                                                <input
                                                    type="text"
                                                    value={formData.client_name}
                                                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                                    placeholder="e.g., Fatima Al-Zahra"
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                    required
                                                />
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
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Height</label>
                                                <input
                                                    type="text"
                                                    value={formData.client_height}
                                                    onChange={(e) => setFormData({ ...formData, client_height: e.target.value })}
                                                    placeholder="e.g., 165 cm or 5'5&quot;"
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>

                                            {/* Target Weight */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Weight (kg)</label>
                                                <input
                                                    type="text"
                                                    value={formData.target_weight}
                                                    onChange={(e) => setFormData({ ...formData, target_weight: e.target.value })}
                                                    placeholder="e.g., 62.0 kg"
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>

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
                                    className="p-4 sm:p-4.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 select-none border-b border-gray-100"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                            <Target size={15} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xs sm:text-sm text-heading flex items-center gap-2">
                                                <span>2. Nutritional Targets & Daily Quotas</span>
                                                {formData.calories && (
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">
                                                        {formData.calories} kcal
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-[11px] text-para line-clamp-1">
                                                {formData.calories
                                                    ? `${formData.calories} kcal • P: ${formData.protein || '—'} • C: ${formData.carbs || '—'} • F: ${formData.fats || '—'}${formData.fibre ? ` • Fib: ${formData.fibre}` : ''} • ${formData.water || '—'}L Water`
                                                    : 'Calories, Protein, Carbs, Fats, Fibre, Water and Step goals'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        {collapsed.targets ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                    </div>
                                </div>

                                {!collapsed.targets && (
                                    <div className="p-4 sm:p-5">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                                            <div>
                                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Calories (kcal)</label>
                                                <input
                                                    type="text"
                                                    value={formData.calories}
                                                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                                                    placeholder="e.g. 1500"
                                                    className="w-full text-xs font-bold text-emerald-800 px-2.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Protein (g)</label>
                                                <input
                                                    type="text"
                                                    value={formData.protein}
                                                    onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                                                    placeholder="e.g. 85g"
                                                    className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Carbs (g)</label>
                                                <input
                                                    type="text"
                                                    value={formData.carbs}
                                                    onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                                                    placeholder="e.g. 145g"
                                                    className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Fats (g)</label>
                                                <input
                                                    type="text"
                                                    value={formData.fats}
                                                    onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                                                    placeholder="e.g. 42g"
                                                    className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20"
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
                                            <div>
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
                                    className="p-4 sm:p-4.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 select-none border-b border-gray-100"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                                            <Clock size={15} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xs sm:text-sm text-heading flex items-center gap-2">
                                                <span>4. Daily Meal Schedule Blueprint</span>
                                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.2 rounded-full">
                                                    {formData.meals.length} Slots
                                                </span>
                                            </h3>
                                            <p className="text-[11px] text-para line-clamp-1">
                                                {formData.meals.length > 0
                                                    ? formData.meals.map(m => m.name).join(' → ')
                                                    : 'Meal timings, options, and chef cooking notes'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
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
                                                                        <span className="text-[9px] font-normal text-gray-400 normal-case">(client can choose to have or skip in addition to options)</span>
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
                                        {/* Quick Presets Bar */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
                                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                Quick Presets:
                                            </span>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleApplyWorkoutPreset('3day')}
                                                    className="px-2 py-0.5 text-[11px] bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 rounded-md font-medium transition cursor-pointer"
                                                >
                                                    3-Day Split
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleApplyWorkoutPreset('cardio')}
                                                    className="px-2 py-0.5 text-[11px] bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 rounded-md font-medium transition cursor-pointer"
                                                >
                                                    Cardio & Steps
                                                </button>
                                                {formData.workouts && formData.workouts.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApplyWorkoutPreset('clear')}
                                                        className="px-2 py-0.5 text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md font-medium transition cursor-pointer"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
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
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1/3 min-w-[120px]">
                                                            <input
                                                                type="text"
                                                                value={workout.day}
                                                                onChange={(e) => handleWorkoutChange(wIdx, 'day', e.target.value)}
                                                                placeholder="Day (e.g. Day 1 (Mon))"
                                                                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary/20 bg-white"
                                                            />
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
                                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer transition shrink-0"
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
                                            <h3 className="font-bold text-xs sm:text-sm text-heading flex items-center gap-2 truncate">
                                                <span className="truncate">9. Attached Recipes</span>
                                                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.2 rounded-full shrink-0">
                                                    {formData.recipes?.length || 0} Attached
                                                </span>
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

                                                        return (
                                                            <div
                                                                key={recipe.id || rIdx}
                                                                className={`rounded-xl border transition ${isEditing
                                                                    ? 'bg-white border-primary shadow-sm ring-2 ring-primary/10'
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
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <h4 className="font-bold text-xs sm:text-sm text-heading">
                                                                                    {recipe.name}
                                                                                </h4>
                                                                                <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.2 rounded-md">
                                                                                    {recipe.category || 'General'}
                                                                                </span>
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
                                            <div className="flex flex-col sm:flex-row gap-2">
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
                                                            onClick={() => setRecipeSearch('')}
                                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        >
                                                            <X size={13} />
                                                        </button>
                                                    )}
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
                                                    <div className="col-span-full py-8 text-center text-xs text-gray-400">
                                                        No recipes found matching &ldquo;{recipeSearch}&rdquo;. Try another term or clear filter.
                                                    </div>
                                                ) : (
                                                    availableRecipes.map(recipe => {
                                                        const isSelected = (formData.recipes || []).some(r => r.id === recipe.id);
                                                        return (
                                                            <div
                                                                key={recipe.id}
                                                                onClick={() => handleToggleRecipe(recipe)}
                                                                className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between select-none ${isSelected
                                                                    ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-300 shadow-2xs'
                                                                    : 'bg-white border-gray-200/80 hover:border-primary/40 hover:bg-gray-50/50'
                                                                    }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-1.5 mb-1">
                                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                                                                        {recipe.category || 'General'}
                                                                    </span>
                                                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-primary text-white' : 'border border-gray-300 text-transparent'
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
                        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 shadow-xs flex flex-col h-full sticky top-20">
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Eye size={16} className="text-primary" />
                                    <h3 className="font-heading font-bold text-heading text-xs sm:text-sm">
                                        Live Vector PDF Preview
                                    </h3>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${formData.pdf_theme === 'senior' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                        {formData.pdf_theme === 'senior' ? '🎨 Senior Large-Print' : '🌿 Clinical Standard'}
                                    </span>
                                    <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded-full">
                                        {formData.pdf_theme === 'senior'
                                            ? (formData.recipes?.length > 0 ? '4 Pages' : '3 Pages')
                                            : (formData.recipes?.length > 0 ? '3 Pages' : '2 Pages')}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setPreviewKey(k => k + 1)}
                                    className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                                    title="Refresh Preview"
                                >
                                    <RefreshCw size={13} />
                                    <span>Refresh</span>
                                </button>
                            </div>

                            <div className="flex-1 w-full min-h-[580px] sm:min-h-[680px] rounded-xl overflow-hidden border border-gray-200">
                                <PDFViewer key={previewKey} width="100%" height="100%" showToolbar={true}>
                                    <DietPlanPdfDocument plan={formData} />
                                </PDFViewer>
                            </div>

                            <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400">
                                <span>The Diet Cascade Engine • {formData.pdf_theme === 'senior' ? 'Large Print Theme' : 'Clinical Precision Theme'}</span>
                                <span>{formData.pdf_theme === 'senior' ? '3-4 Pages' : '2-3 Pages'}</span>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
