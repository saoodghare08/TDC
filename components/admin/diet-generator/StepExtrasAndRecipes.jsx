'use client';

import React, { useState } from 'react';
import {
    ChefHat,
    CheckCircle,
    Sparkles,
    Dumbbell,
    ShieldAlert,
    Scale,
    Plus,
    Trash2,
    Search,
    X,
    Info,
    AlertCircle,
    Edit3,
    Undo2,
    Sliders,
    Utensils,
    RefreshCw,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import {
    STANDARD_CLINIC_GUIDELINES,
    STANDARD_CLINIC_DONTS,
    SUPPLEMENT_QUICK_PICKS,
    WORKOUT_PRESETS,
    SPECIAL_CONDITION_PRESETS,
} from './dietGeneratorUtils';

export default function StepExtrasAndRecipes({
    formData,
    setFormData,
    // Recipe props
    availableRecipes,
    loadingRecipes,
    recipeSearch,
    setRecipeSearch,
    recipeCategoryFilter,
    setRecipeCategoryFilter,
    editingRecipeId,
    setEditingRecipeId,
    effectiveClient,
    pastPlansCheckedCount,
    repeatedAttachedCount,
    getPreviousRecipeUsages,
    formatPastUsageBadge,
    formatPastUsageTooltip,
    onToggleRecipe,
    onRemoveSelectedRecipe,
    onClearAllRecipes,
    onSoftEditRecipe,
    onSoftEditIngredientsText,
    onSoftEditInstructionsText,
    onFinishSoftEditRecipe,
    onResetRecipeToMaster,
    onOpenNewRecipeModal,
    activeMeasurementColsCount,
}) {
    // Open Recipes & Rules by default; auto-open any other extra that already contains data
    const [openModules, setOpenModules] = useState(() => ({
        recipes: true,
        rules: true,
        supplements: (formData.supplements?.length || 0) > 0,
        workouts: (formData.workouts?.length || 0) > 0,
        special: Boolean(formData.show_special_instructions),
        measurements: (formData.measurements?.length || 0) > 0,
    }));

    const [showSpecialStyleKnobs, setShowSpecialStyleKnobs] = useState(false);

    const isModuleOpen = (key) => {
        if (key === 'supplements' && (formData.supplements?.length || 0) > 0 && openModules.supplements === undefined) {
            return true;
        }
        return Boolean(openModules[key]);
    };

    const toggleModule = (key) => {
        setOpenModules((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // ─── Rules & Don'ts Helpers ───
    const handleInsertStandardRules = () => {
        setFormData((prev) => {
            const existingDo = new Set(
                (prev.guidelines || []).map((g) => String(g || '').trim().toLowerCase())
            );
            const existingDont = new Set(
                (prev.donts || []).map((d) => String(d || '').trim().toLowerCase())
            );
            const mergedGuidelines = [
                ...(prev.guidelines || []).filter((g) => String(g || '').trim() !== ''),
                ...STANDARD_CLINIC_GUIDELINES.filter(
                    (g) => !existingDo.has(g.trim().toLowerCase())
                ),
            ];
            const mergedDonts = [
                ...(prev.donts || []).filter((d) => String(d || '').trim() !== ''),
                ...STANDARD_CLINIC_DONTS.filter(
                    (d) => !existingDont.has(d.trim().toLowerCase())
                ),
            ];
            return {
                ...prev,
                guidelines: mergedGuidelines,
                donts: mergedDonts,
            };
        });
    };

    const handleAddRule = () =>
        setFormData((prev) => ({ ...prev, guidelines: [...prev.guidelines, ''] }));

    const handleRuleChange = (idx, val) => {
        const updated = [...formData.guidelines];
        updated[idx] = val;
        setFormData((prev) => ({ ...prev, guidelines: updated }));
    };

    const handleRemoveRule = (idx) =>
        setFormData((prev) => ({
            ...prev,
            guidelines: prev.guidelines.filter((_, i) => i !== idx),
        }));

    const handleAddDont = () =>
        setFormData((prev) => ({ ...prev, donts: [...prev.donts, ''] }));

    const handleDontChange = (idx, val) => {
        const updated = [...formData.donts];
        updated[idx] = val;
        setFormData((prev) => ({ ...prev, donts: updated }));
    };

    const handleRemoveDont = (idx) =>
        setFormData((prev) => ({
            ...prev,
            donts: prev.donts.filter((_, i) => i !== idx),
        }));

    // ─── Supplements Helpers ───
    const handleQuickPickSupp = (item) => {
        setOpenModules((prev) => ({ ...prev, supplements: true }));
        setFormData((prev) => ({
            ...prev,
            supplements: [
                ...(prev.supplements || []),
                { name: item.name, dosage: item.dosage, timing: item.timing },
            ],
        }));
    };

    const handleAddCustomSupp = () => {
        setOpenModules((prev) => ({ ...prev, supplements: true }));
        setFormData((prev) => ({
            ...prev,
            supplements: [
                ...(prev.supplements || []),
                { name: '', dosage: '', timing: 'After Meal' },
            ],
        }));
    };

    const handleSuppChange = (idx, field, val) => {
        const updated = [...(formData.supplements || [])];
        if (updated[idx]) {
            updated[idx] = { ...updated[idx], [field]: val };
            setFormData((prev) => ({ ...prev, supplements: updated }));
        }
    };

    const handleRemoveSupp = (idx) =>
        setFormData((prev) => ({
            ...prev,
            supplements: (prev.supplements || []).filter((_, i) => i !== idx),
        }));

    // ─── Workouts Helpers ───
    const handleApplyWorkoutPreset = (key) => {
        if (key === 'clear') {
            setFormData((prev) => ({ ...prev, workouts: [] }));
            return;
        }
        const def = WORKOUT_PRESETS[key];
        if (!def) return;
        setOpenModules((prev) => ({ ...prev, workouts: true }));
        setFormData((prev) => ({
            ...prev,
            workouts: JSON.parse(JSON.stringify(def.days)),
        }));
    };

    const handleAddWorkoutDay = () => {
        setOpenModules((prev) => ({ ...prev, workouts: true }));
        setFormData((prev) => ({
            ...prev,
            workouts: [
                ...(prev.workouts || []),
                {
                    day: `Day ${(prev.workouts?.length || 0) + 1}`,
                    focus: '',
                    exercises: '',
                    cardio: '',
                    notes: '',
                },
            ],
        }));
    };

    const handleWorkoutChange = (idx, field, val) => {
        const updated = [...(formData.workouts || [])];
        if (updated[idx]) {
            updated[idx] = { ...updated[idx], [field]: val };
            setFormData((prev) => ({ ...prev, workouts: updated }));
        }
    };

    const handleRemoveWorkout = (idx) =>
        setFormData((prev) => ({
            ...prev,
            workouts: (prev.workouts || []).filter((_, i) => i !== idx),
        }));

    // ─── Special Condition Alert Helpers ───
    const handleApplyConditionPreset = (key) => {
        if (key === 'clear') {
            setFormData((prev) => ({
                ...prev,
                show_special_instructions: false,
                special_instructions_title:
                    'Special Clinical Instructions & Edge-Case Directives',
                special_instructions_badge: 'EDGE CASE ADVISORY',
                special_instructions_theme: 'emerald',
                special_instructions_style: 'callout',
                special_instructions: '',
                special_instructions_warning: '',
            }));
            return;
        }
        const def = SPECIAL_CONDITION_PRESETS[key];
        if (!def) return;
        setOpenModules((prev) => ({ ...prev, special: true }));
        setFormData((prev) => ({
            ...prev,
            show_special_instructions: true,
            special_instructions_title: def.title,
            special_instructions_badge: def.badge,
            special_instructions_theme: def.theme,
            special_instructions_style: def.style,
            special_instructions: def.instructions,
            special_instructions_warning: def.warning,
        }));
    };

    // ─── Measurements Helpers ───
    const handleAddMeasurement = () => {
        setOpenModules((prev) => ({ ...prev, measurements: true }));
        const today = new Date().toISOString().split('T')[0];
        setFormData((prev) => ({
            ...prev,
            measurements: [
                ...(prev.measurements || []),
                {
                    date: today,
                    weight:
                        prev.measurements && prev.measurements.length > 0
                            ? prev.measurements[prev.measurements.length - 1].weight || ''
                            : prev.start_weight || '',
                    belly_button: '',
                    hip: '',
                    thigh: '',
                    neck: '',
                    bicep: '',
                },
            ],
        }));
    };

    const handleMeasurementChange = (idx, field, val) => {
        const updated = [...(formData.measurements || [])];
        updated[idx] = { ...updated[idx], [field]: val };
        setFormData((prev) => ({ ...prev, measurements: updated }));
    };

    const handleRemoveMeasurement = (idx) =>
        setFormData((prev) => ({
            ...prev,
            measurements: (prev.measurements || []).filter((_, i) => i !== idx),
        }));

    const moduleShelfItems = [
        {
            key: 'recipes',
            label: 'Recipes',
            icon: ChefHat,
            countLabel:
                (formData.recipes?.length || 0) > 0
                    ? `${formData.recipes.length} attached`
                    : 'Optional',
            hasData: (formData.recipes?.length || 0) > 0,
        },
        {
            key: 'rules',
            label: "Do's, Avoid & Note",
            icon: CheckCircle,
            countLabel:
                formData.guidelines.length > 0 ||
                    formData.donts.length > 0 ||
                    formData.dietitian_note?.trim()
                    ? `${formData.guidelines.length + formData.donts.length} items`
                    : 'Optional',
            hasData:
                formData.guidelines.length > 0 ||
                formData.donts.length > 0 ||
                Boolean(formData.dietitian_note?.trim()),
        },
        {
            key: 'supplements',
            label: 'Supplements',
            icon: Sparkles,
            countLabel:
                (formData.supplements?.length || 0) > 0
                    ? `${formData.supplements.length} added`
                    : 'Optional',
            hasData: (formData.supplements?.length || 0) > 0,
        },
        {
            key: 'workouts',
            label: 'Workout Plan',
            icon: Dumbbell,
            countLabel:
                (formData.workouts?.length || 0) > 0
                    ? `${formData.workouts.length} days`
                    : 'Optional',
            hasData: (formData.workouts?.length || 0) > 0,
        },
        {
            key: 'special',
            label: 'Condition Alert Page',
            icon: ShieldAlert,
            countLabel: formData.show_special_instructions ? 'Enabled' : 'Off',
            hasData: Boolean(formData.show_special_instructions),
        },
        {
            key: 'measurements',
            label: 'Body Measurements',
            icon: Scale,
            countLabel:
                (formData.measurements?.length || 0) > 0
                    ? `${formData.measurements.length} logs`
                    : 'Optional',
            hasData: (formData.measurements?.length || 0) > 0,
        },
    ];

    return (
        <div className="space-y-4">
            {/* ── VISUAL ADD-ON TOGGLE SHELF ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-3">
                <div>
                    <h2 className="text-sm sm:text-base font-bold text-heading">
                        Optional Plan Add-Ons
                    </h2>
                    <p className="text-[11px] text-gray-500">
                        Turn on only the sections this client needs — unused add-ons stay out of
                        your way and won&apos;t clutter the PDF
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {moduleShelfItems.map((item) => {
                        const Icon = item.icon;
                        const open = isModuleOpen(item.key);
                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => toggleModule(item.key)}
                                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${open
                                    ? 'bg-emerald-50/90 border-primary ring-1 ring-primary/20 shadow-2xs'
                                    : item.hasData
                                        ? 'bg-emerald-50/40 border-emerald-200 hover:border-primary'
                                        : 'bg-gray-50/70 border-gray-200/80 hover:bg-white hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-1">
                                    <Icon
                                        size={15}
                                        className={
                                            open || item.hasData
                                                ? 'text-primary'
                                                : 'text-gray-400'
                                        }
                                    />
                                    <span
                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.hasData
                                            ? 'bg-primary text-white'
                                            : open
                                                ? 'bg-white text-primary border border-emerald-200'
                                                : 'bg-gray-200/70 text-gray-500'
                                            }`}
                                    >
                                        {item.countLabel}
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-heading leading-tight">
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── MODULE 1: ATTACHED RECIPES ── */}
            {isModuleOpen('recipes') && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-primary flex items-center justify-center shrink-0">
                                <ChefHat size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-heading flex items-center gap-2 flex-wrap">
                                    <span>Attach Recipes</span>
                                    <span className="text-[11px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                                        {formData.recipes?.length || 0} Attached
                                    </span>
                                    {repeatedAttachedCount > 0 && (
                                        <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full">
                                            {repeatedAttachedCount} Repeat
                                        </span>
                                    )}
                                </h3>
                                <p className="text-[11px] text-gray-500">
                                    Tap any recipe card below to attach it to the end of the PDF
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onOpenNewRecipeModal}
                            className="min-h-9 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 text-xs font-bold transition cursor-pointer"
                        >
                            <Plus size={14} />
                            <span>Create New Recipe</span>
                        </button>
                    </div>

                    {/* Selected / Attached Recipes List with Soft Edit */}
                    {formData.recipes?.length > 0 && (
                        <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                    <Utensils size={13} className="text-primary" />
                                    <span>Attached to Plan ({formData.recipes.length})</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={onClearAllRecipes}
                                    className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
                                >
                                    Remove All
                                </button>
                            </div>

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
                                                    ? 'bg-white border-amber-300/90'
                                                    : 'bg-white border-emerald-200/80'
                                                }`}
                                        >
                                            <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                                <div className="flex items-start sm:items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                                                        {rIdx + 1}
                                                    </span>
                                                    <div>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <h4 className="font-bold text-xs sm:text-sm text-heading">
                                                                {recipe.name || 'Untitled Dish'}
                                                            </h4>
                                                            <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                                                                {recipe.category || 'General'}
                                                            </span>
                                                            {pastUsages.length > 0 && (
                                                                <span
                                                                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md"
                                                                    title={formatPastUsageTooltip(
                                                                        pastUsages
                                                                    )}
                                                                >
                                                                    <AlertCircle size={10} />
                                                                    <span>
                                                                        {formatPastUsageBadge(
                                                                            pastUsages
                                                                        )}
                                                                    </span>
                                                                </span>
                                                            )}
                                                            {hasEdits && (
                                                                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                                                                    Customized
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5 flex-wrap">
                                                            <span>
                                                                {recipe.servings || '1 serving'}
                                                            </span>
                                                            <span>•</span>
                                                            <span>
                                                                {recipe.calories ||
                                                                    'Portion Calibrated'}
                                                            </span>
                                                            {recipe.protein && (
                                                                <span>• P: {recipe.protein}</span>
                                                            )}
                                                            {recipe.fiber && (
                                                                <span>• Fib: {recipe.fiber}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                                    {!isEditing && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setEditingRecipeId(recipe.id)
                                                            }
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 cursor-pointer"
                                                        >
                                                            <Edit3 size={11} />
                                                            <span>Edit for Client</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onRemoveSelectedRecipe(recipe.id)
                                                        }
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                                                        title="Remove recipe"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>

                                            {isEditing && (
                                                <div className="p-3.5 bg-slate-50/70 border-t border-gray-100 rounded-b-xl space-y-3">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="flex items-center gap-1.5 text-primary font-bold">
                                                            <Sliders size={13} />
                                                            <span>
                                                                Customize Recipe (Only changes for
                                                                this plan)
                                                            </span>
                                                        </span>
                                                        {hasEdits && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    onResetRecipeToMaster(recipe.id)
                                                                }
                                                                className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:underline font-semibold cursor-pointer"
                                                            >
                                                                <Undo2 size={11} />
                                                                <span>Reset to Original</span>
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                        <div className="sm:col-span-2">
                                                            <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                                                Dish Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={recipe.name ?? ''}
                                                                onChange={(e) =>
                                                                    onSoftEditRecipe(
                                                                        recipe.id,
                                                                        'name',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                                                Category
                                                            </label>
                                                            <input
                                                                type="text"
                                                                list="soft-edit-recipe-categories"
                                                                value={recipe.category ?? ''}
                                                                onChange={(e) =>
                                                                    onSoftEditRecipe(
                                                                        recipe.id,
                                                                        'category',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-white"
                                                            />
                                                            <datalist id="soft-edit-recipe-categories">
                                                                <option value="Breakfast" />
                                                                <option value="Lunch" />
                                                                <option value="Dinner" />
                                                                <option value="Snack" />
                                                                <option value="Beverage" />
                                                                <option value="Soup & Salad" />
                                                            </datalist>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                                                        {[
                                                            ['servings', 'Portions', '1 serving'],
                                                            ['prep_time', 'Prep', '10m'],
                                                            ['cook_time', 'Cook', '15m'],
                                                            ['calories', 'Calories', '250 kcal'],
                                                            ['protein', 'Protein', '15g'],
                                                            ['carbs', 'Carbs', '28g'],
                                                            ['fats', 'Fats', '6g'],
                                                            ['fiber', 'Fibre', '4g'],
                                                        ].map(([field, lbl, ph]) => (
                                                            <div key={field}>
                                                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                                                    {lbl}
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={recipe[field] || ''}
                                                                    onChange={(e) =>
                                                                        onSoftEditRecipe(
                                                                            recipe.id,
                                                                            field,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    placeholder={ph}
                                                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-700 mb-1">
                                                                Ingredients (one per line)
                                                            </label>
                                                            <textarea
                                                                rows={5}
                                                                value={
                                                                    Array.isArray(recipe.ingredients)
                                                                        ? recipe.ingredients.join('\n')
                                                                        : String(
                                                                            recipe.ingredients ?? ''
                                                                        )
                                                                }
                                                                onChange={(e) =>
                                                                    onSoftEditIngredientsText(
                                                                        recipe.id,
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full text-xs p-2.5 rounded-lg border border-gray-200 bg-white font-mono leading-relaxed"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-700 mb-1">
                                                                Cooking Steps (one per line)
                                                            </label>
                                                            <textarea
                                                                rows={5}
                                                                value={
                                                                    Array.isArray(
                                                                        recipe.instructions
                                                                    )
                                                                        ? recipe.instructions.join(
                                                                            '\n'
                                                                        )
                                                                        : String(
                                                                            recipe.instructions ??
                                                                            ''
                                                                        )
                                                                }
                                                                onChange={(e) =>
                                                                    onSoftEditInstructionsText(
                                                                        recipe.id,
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full text-xs p-2.5 rounded-lg border border-gray-200 bg-white font-mono leading-relaxed"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                                            Dietitian Tip
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={recipe.dietitian_tip || ''}
                                                            onChange={(e) =>
                                                                onSoftEditRecipe(
                                                                    recipe.id,
                                                                    'dietitian_tip',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white"
                                                        />
                                                    </div>

                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onFinishSoftEditRecipe(recipe.id)
                                                            }
                                                            className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg cursor-pointer"
                                                        >
                                                            Done Editing
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

                    {/* Search & Category Filter */}
                    <div className="space-y-2.5">
                        <div className="relative">
                            <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                value={recipeSearch}
                                onChange={(e) => setRecipeSearch(e.target.value)}
                                placeholder="Search clinic recipes (e.g., Chilla, Oats, Salad, Chicken)..."
                                className="w-full min-h-10 text-xs pl-9 pr-8 py-2 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            {recipeSearch && (
                                <button
                                    type="button"
                                    onClick={() => setRecipeSearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            {[
                                'All',
                                'Breakfast',
                                'Lunch',
                                'Dinner',
                                'Snack',
                                'Beverage',
                                'Soup & Salad',
                            ].map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setRecipeCategoryFilter(cat)}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${recipeCategoryFilter === cat
                                        ? 'bg-primary text-white font-bold shadow-2xs'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {effectiveClient && pastPlansCheckedCount > 0 && (
                            <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                                <Info size={12} className="text-amber-600 shrink-0" />
                                <span>
                                    Checking repeats across{' '}
                                    <strong className="text-heading">
                                        {pastPlansCheckedCount}
                                    </strong>{' '}
                                    past {pastPlansCheckedCount === 1 ? 'plan' : 'plans'} for{' '}
                                    <strong className="text-heading">
                                        {effectiveClient.full_name}
                                    </strong>
                                </span>
                            </p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                            {loadingRecipes ? (
                                <div className="col-span-full py-8 text-center text-xs text-gray-400">
                                    <RefreshCw
                                        size={14}
                                        className="animate-spin inline mr-1.5 text-primary"
                                    />
                                    Loading recipes...
                                </div>
                            ) : availableRecipes.length === 0 ? (
                                <div className="col-span-full py-6 px-4 text-center text-xs bg-gray-50 rounded-xl border border-dashed border-gray-200 space-y-2.5">
                                    <p className="text-gray-500">
                                        No matching recipes found. Create and attach it in seconds:
                                    </p>
                                    <button
                                        type="button"
                                        onClick={onOpenNewRecipeModal}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover cursor-pointer"
                                    >
                                        <Plus size={14} />
                                        <span>
                                            {recipeSearch.trim()
                                                ? `Add "${recipeSearch.trim()}" as New Recipe`
                                                : 'Add New Recipe'}
                                        </span>
                                    </button>
                                </div>
                            ) : (
                                availableRecipes.map((recipe) => {
                                    const isSelected = (formData.recipes || []).some(
                                        (r) => r.id === recipe.id
                                    );
                                    const pastUsages = getPreviousRecipeUsages(recipe);
                                    const wasUsedPreviously = pastUsages.length > 0;

                                    return (
                                        <div
                                            key={recipe.id}
                                            onClick={() => onToggleRecipe(recipe)}
                                            title={
                                                wasUsedPreviously
                                                    ? formatPastUsageTooltip(pastUsages)
                                                    : undefined
                                            }
                                            className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between select-none ${isSelected
                                                ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
                                                : wasUsedPreviously
                                                    ? 'bg-amber-50/30 border-amber-300 hover:bg-amber-50/60'
                                                    : 'bg-white border-gray-200 hover:border-primary/50 hover:bg-gray-50/50'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-1.5 mb-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                                                        {recipe.category || 'General'}
                                                    </span>
                                                    {wasUsedPreviously && (
                                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-md">
                                                            <AlertCircle size={9} />
                                                            <span>
                                                                {formatPastUsageBadge(pastUsages)}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                                <span
                                                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isSelected
                                                        ? 'bg-primary text-white'
                                                        : 'border border-gray-300 text-transparent'
                                                        }`}
                                                >
                                                    ✓
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-bold text-heading line-clamp-1 mb-1">
                                                {recipe.name}
                                            </h4>
                                            <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                                                <span>
                                                    {recipe.calories || 'Portion Calibrated'}
                                                </span>
                                                {recipe.protein && (
                                                    <span className="font-semibold text-primary">
                                                        P: {recipe.protein}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODULE 2: DO'S, FOODS TO AVOID & PERSONAL NOTE ── */}
            {isModuleOpen('rules') && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                                <CheckCircle size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-heading">
                                    Daily Do&apos;s, Foods to Avoid &amp; Personal Note
                                </h3>
                                <p className="text-[11px] text-gray-500">
                                    Insert standard clinic rules in 1 tap, then edit or add client-specific points
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleInsertStandardRules}
                            className="min-h-9 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 text-xs font-bold transition cursor-pointer"
                        >
                            <Sparkles size={13} />
                            <span>+ Insert Standard Clinic Rules</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Daily Do's */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-emerald-800">
                                    ✓ Daily Habits to Follow ({formData.guidelines.length})
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddRule}
                                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                                >
                                    + Add Line
                                </button>
                            </div>
                            {formData.guidelines.length === 0 ? (
                                <p className="text-xs text-gray-400 p-3 rounded-xl bg-gray-50 border border-dashed border-gray-200">
                                    No daily habits added yet. Tap &ldquo;+ Insert Standard Clinic
                                    Rules&rdquo; above or &ldquo;+ Add Line&rdquo;.
                                </p>
                            ) : (
                                <div className="space-y-1.5">
                                    {formData.guidelines.map((rule, rIdx) => (
                                        <div key={rIdx} className="flex items-center gap-2">
                                            <span className="text-emerald-600 font-bold text-xs">
                                                •
                                            </span>
                                            <input
                                                type="text"
                                                value={rule}
                                                onChange={(e) =>
                                                    handleRuleChange(rIdx, e.target.value)
                                                }
                                                placeholder="e.g., Drink 3.5L water steadily throughout the day"
                                                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRule(rIdx)}
                                                className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Foods to Avoid */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-rose-800">
                                    ✕ Foods &amp; Habits to Avoid ({formData.donts.length})
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddDont}
                                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                                >
                                    + Add Line
                                </button>
                            </div>
                            {formData.donts.length === 0 ? (
                                <p className="text-xs text-gray-400 p-3 rounded-xl bg-gray-50 border border-dashed border-gray-200">
                                    No restrictions added yet.
                                </p>
                            ) : (
                                <div className="space-y-1.5">
                                    {formData.donts.map((dont, dIdx) => (
                                        <div key={dIdx} className="flex items-center gap-2">
                                            <span className="text-rose-500 font-bold text-xs">
                                                ✕
                                            </span>
                                            <input
                                                type="text"
                                                value={dont}
                                                onChange={(e) =>
                                                    handleDontChange(dIdx, e.target.value)
                                                }
                                                placeholder="e.g., Avoid refined sugar, bakery snacks & aerated drinks"
                                                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDont(dIdx)}
                                                className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                        <label className="block text-xs font-bold text-heading mb-1">
                            Personal Encouragement Note from Dietitian
                        </label>
                        <textarea
                            rows={2}
                            value={formData.dietitian_note}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    dietitian_note: e.target.value,
                                }))
                            }
                            placeholder="e.g., Consistency beats perfection! Message me on WhatsApp anytime you travel or eat out."
                            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-emerald-50/20 focus:bg-white focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>
            )}

            {/* ── MODULE 3: SUPPLEMENTS ── */}
            {isModuleOpen('supplements') && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                                <Sparkles size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-heading">
                                    Vitamins &amp; Supplements
                                </h3>
                                <p className="text-[11px] text-gray-500">
                                    Tap a common supplement below or add custom rows
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleAddCustomSupp}
                            className="min-h-9 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-bold cursor-pointer"
                        >
                            <Plus size={13} />
                            <span>Add Blank Row</span>
                        </button>
                    </div>

                    {/* Quick-Add Supplement Chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-gray-400 mr-1">
                            Quick add:
                        </span>
                        {SUPPLEMENT_QUICK_PICKS.map((item) => (
                            <button
                                key={item.name}
                                type="button"
                                onClick={() => handleQuickPickSupp(item)}
                                className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-300 text-[11px] font-semibold text-gray-700 hover:text-teal-900 transition cursor-pointer"
                            >
                                + {item.name}
                            </button>
                        ))}
                    </div>

                    {(formData.supplements?.length || 0) > 0 && (
                        <div className="space-y-2 pt-1">
                            {formData.supplements.map((supp, sIdx) => (
                                <div
                                    key={sIdx}
                                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl bg-gray-50/70 border border-gray-200/80 items-center"
                                >
                                    <input
                                        type="text"
                                        value={supp.name}
                                        onChange={(e) =>
                                            handleSuppChange(sIdx, 'name', e.target.value)
                                        }
                                        placeholder="Supplement Name (e.g., Vitamin D3)"
                                        className="sm:col-span-5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white"
                                    />
                                    <input
                                        type="text"
                                        value={supp.dosage}
                                        onChange={(e) =>
                                            handleSuppChange(sIdx, 'dosage', e.target.value)
                                        }
                                        placeholder="Dosage (e.g., 1 Tablet)"
                                        className="sm:col-span-3 text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white"
                                    />
                                    <div className="sm:col-span-4 flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={supp.timing}
                                            onChange={(e) =>
                                                handleSuppChange(sIdx, 'timing', e.target.value)
                                            }
                                            placeholder="When to take (e.g., After Lunch)"
                                            className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSupp(sIdx)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer shrink-0"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── MODULE 4: WORKOUT PLAN ── */}
            {isModuleOpen('workouts') && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                <Dumbbell size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-heading">
                                    Workout &amp; Walking Routine
                                </h3>
                                <p className="text-[11px] text-gray-500">
                                    Load a ready-made routine in 1 tap or add custom workout days
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {(formData.workouts?.length || 0) > 0 && (
                                <button
                                    type="button"
                                    onClick={() => handleApplyWorkoutPreset('clear')}
                                    className="text-xs font-semibold text-gray-400 hover:text-red-500 cursor-pointer"
                                >
                                    Clear All
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleAddWorkoutDay}
                                className="min-h-9 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 text-xs font-bold cursor-pointer"
                            >
                                <Plus size={13} />
                                <span>Add Day</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {Object.entries(WORKOUT_PRESETS).map(([key, wp]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleApplyWorkoutPreset(key)}
                                className="p-3 rounded-xl border border-gray-200 hover:border-primary hover:bg-emerald-50/40 text-left transition cursor-pointer"
                            >
                                <p className="text-xs font-bold text-heading">{wp.label}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{wp.desc}</p>
                            </button>
                        ))}
                    </div>

                    {(formData.workouts?.length || 0) > 0 && (
                        <div className="space-y-2.5 pt-1">
                            {formData.workouts.map((workout, wIdx) => (
                                <div
                                    key={wIdx}
                                    className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={workout.day}
                                            onChange={(e) =>
                                                handleWorkoutChange(wIdx, 'day', e.target.value)
                                            }
                                            placeholder="Day (e.g., Mon / Wed / Fri)"
                                            className="w-36 sm:w-44 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                        />
                                        <input
                                            type="text"
                                            value={workout.focus}
                                            onChange={(e) =>
                                                handleWorkoutChange(wIdx, 'focus', e.target.value)
                                            }
                                            placeholder="Focus (e.g., Brisk Walk & Core)"
                                            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveWorkout(wIdx)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={workout.exercises}
                                        onChange={(e) =>
                                            handleWorkoutChange(
                                                wIdx,
                                                'exercises',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Exercises (e.g., 30 min brisk walk or Squats 3x12)"
                                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            value={workout.cardio}
                                            onChange={(e) =>
                                                handleWorkoutChange(
                                                    wIdx,
                                                    'cardio',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Steps / Cardio target"
                                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                        />
                                        <input
                                            type="text"
                                            value={workout.notes}
                                            onChange={(e) =>
                                                handleWorkoutChange(wIdx, 'notes', e.target.value)
                                            }
                                            placeholder="Notes (e.g., Post-meal 10m walk)"
                                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── MODULE 5: MEDICAL CONDITION ALERT PAGE ── */}
            {isModuleOpen('special') && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                                <ShieldAlert size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-heading">
                                    Medical Condition Alert Box
                                </h3>
                                <p className="text-[11px] text-gray-500">
                                    Pick a condition below to auto-fill proven care instructions &amp; red-flag warnings
                                </p>
                            </div>
                        </div>

                        {formData.show_special_instructions && (
                            <button
                                type="button"
                                onClick={() => handleApplyConditionPreset('clear')}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer"
                            >
                                Turn Off Alert Box
                            </button>
                        )}
                    </div>

                    {/* 1-Tap Condition Cards */}
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(SPECIAL_CONDITION_PRESETS).map(([key, cond]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleApplyConditionPreset(key)}
                                className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${formData.show_special_instructions &&
                                    formData.special_instructions_title === cond.title
                                    ? 'bg-primary text-white border-primary shadow-2xs'
                                    : 'bg-gray-50 hover:bg-emerald-50 text-heading border-gray-200'
                                    }`}
                            >
                                + {cond.shortLabel}
                            </button>
                        ))}
                        {!formData.show_special_instructions && (
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        show_special_instructions: true,
                                    }))
                                }
                                className="px-3 py-2 rounded-xl border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:border-primary hover:text-primary cursor-pointer"
                            >
                                + Write Custom Alert
                            </button>
                        )}
                    </div>

                    {formData.show_special_instructions && (
                        <div className="space-y-3 pt-2">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Alert Heading
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.special_instructions_title}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                special_instructions_title: e.target.value,
                                            }))
                                        }
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Short Tag
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.special_instructions_badge}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                special_instructions_badge: e.target.value,
                                            }))
                                        }
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 uppercase"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Care Instructions (One point per line)
                                </label>
                                <textarea
                                    rows={4}
                                    value={formData.special_instructions}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            special_instructions: e.target.value,
                                        }))
                                    }
                                    className="w-full text-xs p-3 rounded-xl border border-gray-200 leading-relaxed"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-rose-800 mb-1">
                                    Important Safety / Caution Note (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.special_instructions_warning}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            special_instructions_warning: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g., If blood sugar drops below 70 mg/dL, take 15g fast carbs immediately."
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/30"
                                />
                            </div>

                            {/* Optional Design Knobs Collapsed by Default */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setShowSpecialStyleKnobs((o) => !o)}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-heading cursor-pointer"
                                >
                                    <span>Customize Box Color &amp; Border Style</span>
                                    {showSpecialStyleKnobs ? (
                                        <ChevronUp size={13} />
                                    ) : (
                                        <ChevronDown size={13} />
                                    )}
                                </button>

                                {showSpecialStyleKnobs && (
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                        <div>
                                            <span className="block text-[10px] font-bold text-gray-500 mb-1">
                                                Color Theme
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {[
                                                    'emerald',
                                                    'amber',
                                                    'indigo',
                                                    'rose',
                                                    'slate',
                                                ].map((thm) => (
                                                    <button
                                                        key={thm}
                                                        type="button"
                                                        onClick={() =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                special_instructions_theme: thm,
                                                            }))
                                                        }
                                                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg capitalize border cursor-pointer ${formData.special_instructions_theme ===
                                                            thm
                                                            ? 'bg-white border-primary text-primary'
                                                            : 'bg-gray-100 border-transparent text-gray-600'
                                                            }`}
                                                    >
                                                        {thm}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-bold text-gray-500 mb-1">
                                                Box Layout
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {[
                                                    { key: 'callout', label: 'Left Accent' },
                                                    { key: 'framed', label: 'Full Border' },
                                                    { key: 'banner', label: 'Top Header' },
                                                ].map((st) => (
                                                    <button
                                                        key={st.key}
                                                        type="button"
                                                        onClick={() =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                special_instructions_style:
                                                                    st.key,
                                                            }))
                                                        }
                                                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border cursor-pointer ${formData.special_instructions_style ===
                                                            st.key
                                                            ? 'bg-white border-primary text-primary'
                                                            : 'bg-gray-100 border-transparent text-gray-600'
                                                            }`}
                                                    >
                                                        {st.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── MODULE 6: BODY MEASUREMENTS (MOBILE-FRIENDLY CARDS + DESKTOP TABLE) ── */}
            {isModuleOpen('measurements') && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                                <Scale size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-heading flex items-center gap-2">
                                    <span>Body Measurements Log</span>
                                    {activeMeasurementColsCount > 0 && (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                            {activeMeasurementColsCount} columns in PDF
                                        </span>
                                    )}
                                </h3>
                                <p className="text-[11px] text-gray-500">
                                    Only measurement fields you fill in will appear on the PDF
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleAddMeasurement}
                            className="min-h-9 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold cursor-pointer"
                        >
                            <Plus size={13} />
                            <span>Add Checkpoint</span>
                        </button>
                    </div>

                    {(formData.measurements?.length || 0) === 0 ? (
                        <div className="text-center py-6 px-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
                            <p className="text-xs text-gray-500 mb-2">
                                No measurement logs added yet.
                            </p>
                            <button
                                type="button"
                                onClick={handleAddMeasurement}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer"
                            >
                                <Plus size={13} />
                                <span>Add First Checkpoint</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {formData.measurements.map((row, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2.5"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-heading">
                                            Checkpoint #{idx + 1}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMeasurement(idx)}
                                            className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                                                Date
                                            </label>
                                            <input
                                                type="date"
                                                value={row.date || ''}
                                                onChange={(e) =>
                                                    handleMeasurementChange(
                                                        idx,
                                                        'date',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white"
                                            />
                                        </div>
                                        {[
                                            ['weight', 'Weight (kg)', '68.5 kg'],
                                            ['belly_button', 'Belly (in/cm)', '34 in'],
                                            ['hip', 'Hip', '38 in'],
                                            ['thigh', 'Thigh', '22 in'],
                                            ['neck', 'Neck', '14 in'],
                                            ['bicep', 'Arm / Bicep', '12 in'],
                                        ].map(([field, lbl, ph]) => (
                                            <div key={field}>
                                                <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                                                    {lbl}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={row[field] || ''}
                                                    onChange={(e) =>
                                                        handleMeasurementChange(
                                                            idx,
                                                            field,
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder={ph}
                                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
