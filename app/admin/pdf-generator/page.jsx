'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
    FileText, Download, Send, Sparkles, Plus, Trash2,
    Calendar, User, Target, Scale, Droplet, Flame, Eye,
    CheckCircle, AlertCircle, RefreshCw, ArrowLeft, Clock,
    Share2, Printer, RotateCcw, BookmarkPlus, Database,
    Info, Copy, ChefHat, Utensils, Search, X, Palette
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
    water: '',
    steps: '',
    dietitian_name: 'Dt. Sabah Ghare',
    dietitian_note: '',
    meals: [],
    supplements: [],
    guidelines: [],
    donts: [],
    recipes: [],
    pdf_theme: 'clinical'
};

export default function AdminPdfGeneratorPage() {
    const supabase = createClient();

    // Form State (Starts Empty On Load)
    const [formData, setFormData] = useState(EMPTY_FORM_STATE);

    // Dynamic Database Templates State
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [dbAvailable, setDbAvailable] = useState(true);

    // Dynamic Recipes State
    const [availableRecipes, setAvailableRecipes] = useState([]);
    const [loadingRecipes, setLoadingRecipes] = useState(true);
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

    // ─── Fetch Recipes from Supabase ───
    const fetchAvailableRecipes = useCallback(async () => {
        setLoadingRecipes(true);
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .order('name', { ascending: true });

            if (!error && data) {
                setAvailableRecipes(data);
            }
        } catch (err) {
            console.warn('Error fetching available recipes:', err);
        } finally {
            setLoadingRecipes(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchTemplates();
        fetchAvailableRecipes();
    }, [fetchTemplates, fetchAvailableRecipes]);

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
                    water: template.water || '',
                    steps: template.steps || '',
                    dietitian_name: template.dietitian_name || prev.dietitian_name,
                    dietitian_note: template.dietitian_note || '',
                    meals: Array.isArray(template.meals) ? JSON.parse(JSON.stringify(template.meals)) : [],
                    supplements: Array.isArray(template.supplements) ? JSON.parse(JSON.stringify(template.supplements)) : [],
                    guidelines: Array.isArray(template.guidelines) ? JSON.parse(JSON.stringify(template.guidelines)) : [],
                    donts: Array.isArray(template.donts) ? JSON.parse(JSON.stringify(template.donts)) : [],
                    recipes: Array.isArray(template.recipes) ? JSON.parse(JSON.stringify(template.recipes)) : (prev.recipes || [])
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
                    water: formData.water,
                    steps: formData.steps,
                    dietitian_name: formData.dietitian_name,
                    dietitian_note: formData.dietitian_note,
                    meals: formData.meals,
                    supplements: formData.supplements,
                    guidelines: formData.guidelines,
                    donts: formData.donts,
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
                html: `
                    <p style="font-size: 13px; margin-bottom: 8px;">${err.message}</p>
                    <p style="font-size: 11px; color: #64748b;">If the table has not been created yet in Supabase, make sure to execute the migration file <code>supabase/migrations/20261019000000_create_diet_plan_templates_table.sql</code> in the Supabase SQL editor.</p>
                `,
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
        const updated = [...formData.supplements];
        updated[index] = { ...updated[index], [field]: value };
        setFormData(prev => ({ ...prev, supplements: updated }));
    };

    const handleAddSupp = () => {
        setFormData(prev => ({
            ...prev,
            supplements: [...prev.supplements, { name: '', dosage: '', timing: 'Post-Meal' }]
        }));
    };

    const handleRemoveSupp = (index) => {
        setFormData(prev => ({
            ...prev,
            supplements: prev.supplements.filter((_, i) => i !== index)
        }));
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
            : [...currentRecipes, recipe];

        setFormData(prev => ({ ...prev, recipes: updated }));
    };

    const handleRemoveSelectedRecipe = (recipeId) => {
        setFormData(prev => ({
            ...prev,
            recipes: (prev.recipes || []).filter(r => r.id !== recipeId)
        }));
    };

    const handleClearAllRecipes = () => {
        setFormData(prev => ({ ...prev, recipes: [] }));
    };

    const handleAutoMatchRecipes = () => {
        const mealTexts = (formData.meals || [])
            .flatMap(m => getMealOptions(m))
            .join(' ')
            .toLowerCase();

        const matched = availableRecipes.filter(r => {
            const words = r.name.toLowerCase().split(/[\s,&+]+/);
            return words.some(w => w.length > 3 && mealTexts.includes(w));
        });

        if (matched.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'No Matches Found',
                text: 'No dishes from your recipe bank matched the current meal options in your blueprint.',
                confirmButtonColor: '#2d6a4f'
            });
            return;
        }

        const currentIds = new Set((formData.recipes || []).map(r => r.id));
        const newMatches = matched.filter(r => !currentIds.has(r.id));
        const combined = [...(formData.recipes || []), ...newMatches];
        setFormData(prev => ({ ...prev, recipes: combined }));

        Swal.fire({
            icon: 'success',
            title: `${newMatches.length} Recipe(s) Attached`,
            text: `Matched: ${matched.map(r => r.name).join(', ')}`,
            timer: 2000,
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
        <div className="min-h-screen bg-gray-50/60 pb-20">
            {/* ── Top Header Bar ────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin"
                            className="p-2 text-gray-500 hover:text-heading hover:bg-gray-100 rounded-xl transition"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-primary/10 text-primary rounded-lg">
                                    <FileText size={18} />
                                </span>
                                <h1 className="text-xl sm:text-2xl font-heading font-bold text-heading">
                                    Diet Plan <span className="text-primary">PDF Generator</span>
                                </h1>
                            </div>
                            <p className="text-xs text-para mt-0.5">
                                Design, preview, and export fully formatted clinical nutrition plan PDFs
                            </p>
                        </div>
                    </div>

                    {/* View switcher & action buttons */}
                    <div className="flex items-center flex-wrap gap-2.5">
                        {/* View mode toggle */}
                        <div className="bg-gray-100 p-1 rounded-xl flex items-center text-xs font-semibold text-gray-600">
                            <button
                                onClick={() => setActiveView('editor')}
                                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${activeView === 'editor' ? 'bg-white text-heading shadow-xs' : 'hover:text-heading'}`}
                            >
                                Edit Form
                            </button>
                            <button
                                onClick={() => { setActiveView('preview'); setPreviewKey(k => k + 1); }}
                                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${activeView === 'preview' ? 'bg-white text-heading shadow-xs' : 'hover:text-heading'}`}
                            >
                                Live Preview
                            </button>
                            <button
                                onClick={() => { setActiveView('split'); setPreviewKey(k => k + 1); }}
                                className={`hidden lg:block px-3 py-1.5 rounded-lg transition cursor-pointer ${activeView === 'split' ? 'bg-white text-heading shadow-xs' : 'hover:text-heading'}`}
                            >
                                Split View
                            </button>
                        </div>

                        {/* Reset Form */}
                        <button
                            onClick={handleClearForm}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600 hover:text-red-600 font-semibold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                            title="Reset all fields to empty state"
                        >
                            <RotateCcw size={13} />
                            Reset
                        </button>

                        {/* Download PDF */}
                        <button
                            onClick={handleDownloadPdf}
                            disabled={generating}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-xl shadow-sm shadow-primary/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {generating ? <RefreshCw size={14} className="animate-spin text-white" /> : <Download size={14} className="text-white" />}
                            Download PDF
                        </button>

                        {/* WhatsApp Quick Share */}
                        <button
                            onClick={handleOpenWhatsApp}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold text-xs rounded-xl transition cursor-pointer"
                            title="Share message on WhatsApp"
                        >
                            <Send size={13} />
                            WhatsApp
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Content Container ─────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
                {/* Dynamic DB Preset Banner */}
                <div className="bg-linear-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 mb-6 shadow-md relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="p-2.5 bg-white/10 rounded-xl text-accent">
                                <Sparkles size={20} />
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm sm:text-base font-bold text-white">
                                        Clinical Plan Presets
                                    </h2>
                                    <span className="text-[10px] bg-white/10 text-emerald-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                        <Database size={10} />
                                        {dbAvailable ? 'Database Presets' : 'Database Offline'}
                                    </span>
                                </div>
                                <p className="text-xs text-white/70 mt-0.5">
                                    Load, customize, or save new clinical presets directly to your database.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center flex-wrap gap-2">
                            {loadingTemplates ? (
                                <div className="flex items-center gap-2 text-xs text-white/70 px-3 py-1.5">
                                    <RefreshCw size={13} className="animate-spin text-accent" />
                                    Loading presets...
                                </div>
                            ) : (
                                <>
                                    {templates.length === 0 ? (
                                        <span className="text-xs text-white/60 italic py-1">
                                            No presets in database. Build a plan below and click &quot;Save As Preset&quot;.
                                        </span>
                                    ) : (
                                        templates.map((preset) => (
                                            <div
                                                key={preset.id || preset.label}
                                                className="inline-flex items-center bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg transition overflow-hidden shadow-xs"
                                            >
                                                <button
                                                    onClick={() => handleApplyTemplate(preset)}
                                                    className="px-3 py-1.5 text-white text-xs font-medium flex items-center gap-2 cursor-pointer"
                                                    title={`Load preset: ${preset.label}`}
                                                >
                                                    <span>{preset.label}</span>
                                                    <span className="bg-accent text-heading text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                        {preset.badge || (preset.calories ? `${preset.calories} kcal` : 'Preset')}
                                                    </span>
                                                </button>
                                                {preset.id && (
                                                    <button
                                                        onClick={(e) => handleDeleteTemplate(preset.id, preset.label, e)}
                                                        className="px-2 py-1.5 text-white/40 hover:text-red-300 hover:bg-white/10 border-l border-white/10 transition cursor-pointer"
                                                        title="Delete this preset from database"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}

                                    {/* Save Current Plan as Preset */}
                                    <button
                                        onClick={handleSaveCurrentAsTemplate}
                                        className="px-3 py-1.5 bg-accent hover:bg-accent/90 text-heading font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                                        title="Save current form values as a new database preset"
                                    >
                                        <BookmarkPlus size={14} />
                                        <span>Save As Preset</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── PDF Template & Visual Theme Selector ─────────────────── */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 mb-6 border border-gray-100 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                        <div>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Document Presentation</span>
                            <h3 className="font-heading font-bold text-heading text-sm sm:text-base flex items-center gap-2">
                                <Palette size={16} className="text-primary" />
                                Select PDF Template & Theme
                            </h3>
                        </div>
                        <div className="text-xs text-para">
                            Current Style: <strong className="text-heading font-bold">{formData.pdf_theme === 'senior' ? 'Vibrant Senior Friendly (Large Print)' : 'Clinical Standard (Executive)'}</strong>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* Theme 1: Clinical Standard */}
                        <div
                            onClick={() => {
                                setFormData(prev => ({ ...prev, pdf_theme: 'clinical' }));
                                setPreviewKey(k => k + 1);
                            }}
                            className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                                formData.pdf_theme !== 'senior'
                                    ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-600/30'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🌿</span>
                                        <h4 className="font-bold text-xs sm:text-sm text-heading">
                                            Clinical Standard (2-Page Executive)
                                        </h4>
                                    </div>
                                    {formData.pdf_theme !== 'senior' && (
                                        <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <CheckCircle size={10} /> Active Theme
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-para leading-relaxed">
                                    Clean, concise, and medical executive layout. Optimized for standard 2-page print with dense typography, subtle borders, and forest emerald tones.
                                </p>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-gray-500 pt-2.5 border-t border-gray-100">
                                <span className="bg-gray-100 px-2 py-0.5 rounded">Standard 8pt-9pt</span>
                                <span className="bg-gray-100 px-2 py-0.5 rounded">2-3 Pages</span>
                                <span className="bg-gray-100 px-2 py-0.5 rounded">Executive Medical</span>
                            </div>
                        </div>

                        {/* Theme 2: Vibrant & Senior Friendly */}
                        <div
                            onClick={() => {
                                setFormData(prev => ({ ...prev, pdf_theme: 'senior' }));
                                setPreviewKey(k => k + 1);
                            }}
                            className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                                formData.pdf_theme === 'senior'
                                    ? 'border-amber-500 bg-amber-50/40 shadow-xs ring-1 ring-amber-400'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🎨</span>
                                        <h4 className="font-bold text-xs sm:text-sm text-heading">
                                            Vibrant & Senior Friendly (Large Print)
                                        </h4>
                                    </div>
                                    {formData.pdf_theme === 'senior' && (
                                        <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <CheckCircle size={10} /> Active Theme
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-para leading-relaxed">
                                    Tailored for older adults & clients needing extra visual clarity. Features large 10pt-12pt fonts, high contrast text, and colorful color-coded meal cards.
                                </p>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-amber-800 pt-2.5 border-t border-amber-100/60">
                                <span className="bg-amber-100/80 px-2 py-0.5 rounded font-bold">Large Print 10pt-12pt</span>
                                <span className="bg-amber-100/80 px-2 py-0.5 rounded">Color-Coded Meals</span>
                                <span className="bg-amber-100/80 px-2 py-0.5 rounded font-bold">Senior Friendly</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Split / Single View Layout */}
                <div className={`grid gap-6 ${activeView === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>

                    {/* ════════════════ FORM EDITOR ════════════════ */}
                    {(activeView === 'editor' || activeView === 'split') && (
                        <div className="space-y-6">

                            {/* Section 1: Client Information & Plan Timeline */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                                    <h3 className="font-heading font-bold text-heading text-sm flex items-center gap-2">
                                        <User size={16} className="text-primary" />
                                        1. Client Information & Plan Timeline
                                    </h3>
                                    <span className="text-[11px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                                        Client Profile & Goals
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                            placeholder="e.g., Vegetarian, Non-Vegetarian, Vegan"
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
                                            placeholder="e.g., Phase 1: Metabolic Reset & Gut Detox"
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
                                            placeholder="e.g., Fat Loss, Thyroid Support, Muscle Tone"
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
                                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Medical Conditions</label>
                                        <input
                                            type="text"
                                            value={formData.medical_conditions}
                                            onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                                            placeholder="e.g., PCOS, Hypothyroidism, Hypertension"
                                            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Medication</label>
                                        <input
                                            type="text"
                                            value={formData.medication}
                                            onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
                                            placeholder="e.g., Thyronorm 50mcg, Metformin 500mg"
                                            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Health Abuses / Habits</label>
                                        <input
                                            type="text"
                                            value={formData.health_abuses}
                                            onChange={(e) => setFormData({ ...formData, health_abuses: e.target.value })}
                                            placeholder="e.g., Late Night Eating, Excess Caffeine, Smoking"
                                            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Macro & Daily Targets */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                                    <h3 className="font-heading font-bold text-heading text-sm flex items-center gap-2">
                                        <Target size={16} className="text-primary" />
                                        2. Nutritional Targets & Daily Quotas
                                    </h3>
                                    <span className="text-[11px] bg-accent/20 text-accent-dark font-semibold px-2 py-0.5 rounded-full">
                                        Macro Bar
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Calories (kcal)</label>
                                        <input
                                            type="text"
                                            value={formData.calories}
                                            onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                                            placeholder="e.g., 1500 or 1400-1500"
                                            className="w-full text-xs font-bold text-emerald-800 px-2.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Protein (g)</label>
                                        <input
                                            type="text"
                                            value={formData.protein}
                                            onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                                            placeholder="e.g., 85 or 80-90g"
                                            className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Carbs (g)</label>
                                        <input
                                            type="text"
                                            value={formData.carbs}
                                            onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                                            placeholder="e.g., 145 or Low-Carb"
                                            className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Fats (g)</label>
                                        <input
                                            type="text"
                                            value={formData.fats}
                                            onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                                            placeholder="e.g., 42 or 40-50g"
                                            className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Water (Litres)</label>
                                        <input
                                            type="text"
                                            value={formData.water}
                                            onChange={(e) => setFormData({ ...formData, water: e.target.value })}
                                            placeholder="e.g., 3.5 or 3-4 L"
                                            className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Steps Target</label>
                                        <input
                                            type="text"
                                            value={formData.steps}
                                            onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                                            placeholder="e.g., 10,000 or 8k-10k"
                                            className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Daily Meal Schedule */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                                    <div>
                                        <h3 className="font-heading font-bold text-heading text-sm flex items-center gap-2">
                                            <Clock size={16} className="text-primary" />
                                            3. Daily Meal Blueprint ({formData.meals.length} Slots)
                                        </h3>
                                        <p className="text-[11px] text-para mt-0.5">
                                            First 4 meals render on Page 1; remaining meals render on Page 2
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddMeal}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-xl transition cursor-pointer"
                                    >
                                        <Plus size={14} />
                                        Add Meal
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {formData.meals.length === 0 ? (
                                        <div className="text-center py-10 px-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2.5">
                                                <Clock size={20} />
                                            </div>
                                            <p className="text-xs font-bold text-heading">No meals added yet</p>
                                            <p className="text-[11px] text-para mb-3.5 max-w-xs mx-auto">
                                                Click below to add your first meal slot, or pick one of the clinical presets above.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleAddMeal}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition cursor-pointer shadow-xs"
                                            >
                                                <Plus size={14} />
                                                Add First Meal Slot
                                            </button>
                                        </div>
                                    ) : (
                                        formData.meals.map((meal, index) => (
                                            <div
                                                key={index}
                                                className="bg-gray-50/70 border border-gray-200/80 rounded-xl p-4 relative group hover:border-primary/30 transition"
                                            >
                                                <div className="flex items-center justify-between gap-3 mb-3">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                                                            {index + 1}
                                                        </span>
                                                        <input
                                                            type="text"
                                                            value={meal.name}
                                                            onChange={(e) => handleMealChange(index, 'name', e.target.value)}
                                                            placeholder="Meal Name (e.g., Breakfast, Lunch)"
                                                            className="font-bold text-heading text-xs px-2.5 py-1 rounded-lg border border-transparent hover:border-gray-300 focus:border-primary focus:bg-white bg-transparent flex-1"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={meal.time}
                                                            onChange={(e) => handleMealChange(index, 'time', e.target.value)}
                                                            placeholder="Time (e.g. 8:30 AM)"
                                                            className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 w-36 text-center"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveMeal(index)}
                                                            className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition cursor-pointer"
                                                            title="Delete Meal"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2.5">
                                                    {getMealOptions(meal).map((opt, optIndex) => {
                                                        const isPrimary = optIndex === 0;
                                                        const isSecondary = optIndex === 1;
                                                        const labelText = isPrimary
                                                            ? 'Option 1 (Primary Choice)'
                                                            : isSecondary
                                                                ? 'Option 2 (Alternative / Swap)'
                                                                : `Option ${optIndex + 1} (Alternative)`;
                                                        const labelColor = isPrimary
                                                            ? 'text-primary'
                                                            : isSecondary
                                                                ? 'text-amber-700'
                                                                : 'text-blue-700';

                                                        return (
                                                            <div key={optIndex} className="relative">
                                                                <div className="flex items-center justify-between mb-0.5">
                                                                    <label className={`text-[10px] font-bold ${labelColor} uppercase`}>
                                                                        {labelText}
                                                                    </label>
                                                                    {getMealOptions(meal).length > 1 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveMealOption(index, optIndex)}
                                                                            className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500 transition cursor-pointer px-1 py-0.5 rounded hover:bg-red-50"
                                                                            title={`Remove Option ${optIndex + 1}`}
                                                                        >
                                                                            <Trash2 size={11} />
                                                                            <span>Remove</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <textarea
                                                                    rows={2}
                                                                    value={opt}
                                                                    onChange={(e) => handleMealOptionChange(index, optIndex, e.target.value)}
                                                                    placeholder={
                                                                        isPrimary
                                                                            ? "e.g., 2 Moong Dal Chillas + 2 tbsp Mint Chutney"
                                                                            : isSecondary
                                                                                ? "e.g., 1 Bowl Vegetable Oats with 40g Paneer"
                                                                                : `e.g., Alternative meal choice ${optIndex + 1}`
                                                                    }
                                                                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary/20 bg-white"
                                                                />
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Add More Options Button */}
                                                    <div className="pt-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddMealOption(index)}
                                                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary-hover bg-primary/5 hover:bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg transition cursor-pointer active:scale-95"
                                                        >
                                                            <Plus size={13} />
                                                            <span>Add Option {getMealOptions(meal).length + 1}</span>
                                                        </button>
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">
                                                            Chef / Cooking Note
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={meal.notes}
                                                            onChange={(e) => handleMealChange(index, 'notes', e.target.value)}
                                                            placeholder="e.g., Cook with max 1/2 tsp ghee; chew thoroughly."
                                                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary/20 bg-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Section 4: Prescribed Supplements */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                                    <h3 className="font-heading font-bold text-heading text-sm flex items-center gap-2">
                                        <Sparkles size={16} className="text-primary" />
                                        4. Prescribed Supplements
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={handleAddSupp}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-xl transition cursor-pointer"
                                    >
                                        <Plus size={14} />
                                        Add Supplement
                                    </button>
                                </div>

                                <div className="space-y-2.5">
                                    {formData.supplements.length === 0 ? (
                                        <div className="py-3 px-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/40 text-center">
                                            <p className="text-xs text-gray-400">No supplements added. Click &quot;Add Supplement&quot; if needed.</p>
                                        </div>
                                    ) : (
                                        formData.supplements.map((supp, sIdx) => (
                                            <div key={sIdx} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={supp.name}
                                                    onChange={(e) => handleSuppChange(sIdx, 'name', e.target.value)}
                                                    placeholder="Supplement Name (e.g. Omega-3)"
                                                    className="flex-2 text-xs px-3 py-2 rounded-xl border border-gray-200 focus:ring-1 focus:ring-primary/20"
                                                />
                                                <input
                                                    type="text"
                                                    value={supp.dosage}
                                                    onChange={(e) => handleSuppChange(sIdx, 'dosage', e.target.value)}
                                                    placeholder="Dosage (e.g. 1,000 mg)"
                                                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 focus:ring-1 focus:ring-primary/20"
                                                />
                                                <input
                                                    type="text"
                                                    value={supp.timing}
                                                    onChange={(e) => handleSuppChange(sIdx, 'timing', e.target.value)}
                                                    placeholder="Timing (e.g. With Lunch)"
                                                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 focus:ring-1 focus:ring-primary/20"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSupp(sIdx)}
                                                    className="text-gray-400 hover:text-red-500 p-1.5 cursor-pointer"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Section 5: Golden Rules, Don'ts & Personal Note */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                                <h3 className="font-heading font-bold text-heading text-sm border-b border-gray-100 pb-3 mb-4">
                                    5. Golden Rules, Restrictions & Dietitian Message
                                </h3>

                                <div className="space-y-4">
                                    {/* Guidelines (Do's) */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-emerald-800">
                                                ✓ Golden Rules & Daily Habits
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleAddRule}
                                                className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                                            >
                                                + Add Rule
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {formData.guidelines.length === 0 ? (
                                                <p className="text-xs text-gray-400 italic py-1">No rules added. Click &quot;+ Add Rule&quot; to include guidelines.</p>
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
                                                            <Trash2 size={14} />
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
                                                🚫 Foods & Habits to Strictly Avoid
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleAddDont}
                                                className="text-[11px] text-red-600 hover:underline font-semibold cursor-pointer"
                                            >
                                                + Add Restriction
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {formData.donts.length === 0 ? (
                                                <p className="text-xs text-gray-400 italic py-1">No restrictions added. Click &quot;+ Add Restriction&quot; to add foods to avoid.</p>
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
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Personal Message */}
                                    <div>
                                        <label className="block text-xs font-bold text-heading mb-1">
                                            Dietitian&apos;s Personal Note & Sign-off
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={formData.dietitian_note}
                                            onChange={(e) => setFormData({ ...formData, dietitian_note: e.target.value })}
                                            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:ring-1 focus:ring-primary/20 bg-green-50/30"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 6: Attached Clinical Recipe Formulations */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-4">
                                    <div>
                                        <h3 className="font-heading font-bold text-heading text-sm flex items-center gap-2">
                                            <ChefHat size={16} className="text-primary" />
                                            6. Attached Recipe Annexure ({formData.recipes?.length || 0} Dishes Selected)
                                        </h3>
                                        <p className="text-[11px] text-para mt-0.5">
                                            Select dishes to automatically format a structured recipe table & culinary preparation guide in the PDF
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleAutoMatchRecipes}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl transition cursor-pointer"
                                            title="Scan meals and auto-attach matching recipes"
                                        >
                                            <Sparkles size={13} className="text-amber-600" />
                                            <span>Auto-Match from Meals</span>
                                        </button>

                                        <Link
                                            href="/admin/recipes"
                                            target="_blank"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                                            title="Open Recipe Bank in new tab"
                                        >
                                            <Utensils size={13} />
                                            <span>Manage Recipes</span>
                                        </Link>
                                    </div>
                                </div>

                                {/* Selected Dishes Chips Bar */}
                                {formData.recipes?.length > 0 && (
                                    <div className="mb-4 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[11px] font-bold text-emerald-900 uppercase">
                                                Attached Dishes ({formData.recipes.length}):
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleClearAllRecipes}
                                                className="text-[10px] font-semibold text-red-600 hover:underline cursor-pointer"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {formData.recipes.map((r) => (
                                                <span
                                                    key={r.id}
                                                    className="inline-flex items-center gap-1.5 bg-white text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-medium shadow-2xs"
                                                >
                                                    <span className="font-bold text-primary">{r.name}</span>
                                                    <span className="text-[10px] text-gray-500">({r.calories || r.category})</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSelectedRecipe(r.id)}
                                                        className="text-gray-400 hover:text-red-500 cursor-pointer ml-0.5"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Search & Category Filter */}
                                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                                    <div className="relative flex-1">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={recipeSearch}
                                            onChange={(e) => setRecipeSearch(e.target.value)}
                                            placeholder="Filter dishes by name or category..."
                                            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 focus:ring-1 focus:ring-primary/20 bg-gray-50/50"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                                        {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Beverage'].map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setRecipeCategoryFilter(cat)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                                                    recipeCategoryFilter === cat
                                                        ? 'bg-primary text-white shadow-2xs'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dish Selector Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                                    {loadingRecipes ? (
                                        <div className="col-span-full py-6 text-center text-xs text-gray-400">Loading recipe bank...</div>
                                    ) : availableRecipes.length === 0 ? (
                                        <div className="col-span-full py-6 text-center text-xs text-gray-400">
                                            No recipes in bank. <Link href="/admin/recipes" className="text-primary underline">Create recipes</Link> to attach them here.
                                        </div>
                                    ) : (
                                        availableRecipes
                                            .filter(r => {
                                                const matchCat = recipeCategoryFilter === 'All' || r.category?.toLowerCase() === recipeCategoryFilter.toLowerCase();
                                                const matchQ = !recipeSearch.trim() || r.name.toLowerCase().includes(recipeSearch.toLowerCase().trim());
                                                return matchCat && matchQ;
                                            })
                                            .map(recipe => {
                                                const isSelected = (formData.recipes || []).some(r => r.id === recipe.id);
                                                return (
                                                    <div
                                                        key={recipe.id}
                                                        onClick={() => handleToggleRecipe(recipe)}
                                                        className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                                                            isSelected
                                                                ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300'
                                                                : 'bg-gray-50/50 border-gray-200 hover:border-primary/40'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-1.5 mb-1">
                                                            <span className="text-[10px] font-bold text-gray-500 uppercase">
                                                                {recipe.category}
                                                            </span>
                                                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                                                isSelected ? 'bg-primary text-white' : 'border border-gray-300 text-transparent'
                                                            }`}>
                                                                ✓
                                                            </span>
                                                        </div>
                                                        <h4 className="text-xs font-bold text-heading line-clamp-1 mb-1">
                                                            {recipe.name}
                                                        </h4>
                                                        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                                                            <span>{recipe.calories || '—'}</span>
                                                            <span className="font-semibold text-primary">{recipe.protein ? `P: ${recipe.protein}` : ''}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                    )}
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ════════════════ LIVE PDF PREVIEW ════════════════ */}
                    {(activeView === 'preview' || activeView === 'split') && (
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col h-full sticky top-24">
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <Eye size={16} className="text-primary" />
                                    <h3 className="font-heading font-bold text-heading text-sm">
                                        Live Vector PDF Preview
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            formData.pdf_theme === 'senior' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                            {formData.pdf_theme === 'senior' ? '🎨 Senior Large-Print' : '🌿 Clinical Standard'}
                                        </span>
                                        <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded-full">
                                            {formData.pdf_theme === 'senior'
                                                ? (formData.recipes?.length > 0 ? '4 Pages' : '3 Pages')
                                                : (formData.recipes?.length > 0 ? '3 Pages' : '2 Pages')}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setPreviewKey(k => k + 1)}
                                    className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                                    title="Refresh Preview"
                                >
                                    <RefreshCw size={13} />
                                    Refresh
                                </button>
                            </div>

                            <div className="flex-1 w-full min-h-[680px] rounded-xl overflow-hidden border border-gray-200">
                                <PDFViewer key={previewKey} width="100%" height="100%" showToolbar={true}>
                                    <DietPlanPdfDocument plan={formData} />
                                </PDFViewer>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
                                <span>Powered by The Diet Cascade Engine • {formData.pdf_theme === 'senior' ? 'Senior Friendly Large Print Theme' : 'Clinical Precision Theme'}</span>
                                <span>{formData.pdf_theme === 'senior' ? 'Spacious 3-4 Page Print' : 'Compact 2-3 Page Print'}</span>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
