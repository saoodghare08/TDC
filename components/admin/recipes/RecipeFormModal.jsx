'use client';

import React, { useState } from 'react';
import {
    ChefHat,
    X,
    Clock,
    ChevronDown,
    ChevronUp,
    Database,
    Sparkles,
} from 'lucide-react';

export const RECIPE_CATEGORIES = [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snack',
    'Beverage',
    'Soup & Salad',
];

const TIME_PRESETS = [
    { label: 'Quick 10m', prep: '5 mins', cook: '5 mins' },
    { label: '20m Meal', prep: '10 mins', cook: '10 mins' },
    { label: '30m Cook', prep: '10 mins', cook: '20 mins' },
    { label: 'No-Cook', prep: '10 mins', cook: '0 mins' },
];

export function cleanMultilineItems(rawInput, stripStepPrefix = false) {
    const lines = Array.isArray(rawInput)
        ? rawInput
        : String(rawInput || '').split(/\r?\n/);

    return lines
        .map((line) => {
            const s = String(line || '');
            const stripped = stripStepPrefix
                ? s.replace(/^(?:Step\s*\d+[:.)-]?\s*|[-*•✓·–—\u2022]\s*|\(?\d+[.)]\s+)/i, '')
                : s.replace(/^(?:[-*•✓·–—\u2022]\s*|\(?\d+[.)]\s+)/, '');
            return stripped.trim();
        })
        .filter(Boolean);
}

export default function RecipeFormModal({
    isOpen,
    mode = 'create', // 'create' | 'edit'
    formData,
    setFormData,
    saving = false,
    onClose,
    onSubmit,
    // Optional Diet Builder integration props
    showSaveToBankOption = false,
    saveToBank = true,
    setSaveToBank = null,
}) {
    const hasNutritionOrTip = Boolean(
        formData?.calories?.trim() ||
            formData?.protein?.trim() ||
            formData?.carbs?.trim() ||
            formData?.fats?.trim() ||
            formData?.fiber?.trim() ||
            formData?.dietitian_tip?.trim()
    );

    const [showNutritionTray, setShowNutritionTray] = useState(
        () => mode === 'edit' && hasNutritionOrTip
    );
    const [showCustomTimes, setShowCustomTimes] = useState(
        () =>
            Boolean(
                formData?.prep_time?.trim() ||
                    formData?.cook_time?.trim() ||
                    formData?.servings?.trim()
            ) && mode === 'edit'
    );

    if (!isOpen) return null;

    const ingredientsText = Array.isArray(formData.ingredients)
        ? formData.ingredients.join('\n')
        : String(formData.ingredients ?? '');

    const instructionsText = Array.isArray(formData.instructions)
        ? formData.instructions.join('\n')
        : String(formData.instructions ?? '');

    const filledIngredientCount = cleanMultilineItems(formData.ingredients, false).length;
    const filledInstructionCount = cleanMultilineItems(formData.instructions, true).length;

    const handleIngredientsTextChange = (val) => {
        const normalized = String(val ?? '').replace(/\r\n/g, '\n');
        setFormData((prev) => ({
            ...prev,
            ingredients: normalized.split('\n'),
        }));
    };

    const handleInstructionsTextChange = (val) => {
        const normalized = String(val ?? '').replace(/\r\n/g, '\n');
        setFormData((prev) => ({
            ...prev,
            instructions: normalized.split('\n'),
        }));
    };

    const applyTimePreset = (preset) => {
        setFormData((prev) => ({
            ...prev,
            prep_time: preset.prep,
            cook_time: preset.cook,
            servings: prev.servings?.trim() || '1 serving',
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
            <div
                className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-gray-100 max-h-[92dvh] overflow-y-auto"
                style={{ animation: 'modalIn 180ms cubic-bezier(0.23, 1, 0.32, 1)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <ChefHat size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold font-heading text-heading">
                                {showSaveToBankOption
                                    ? 'Add & Attach New Recipe'
                                    : mode === 'create'
                                      ? 'Add New Recipe'
                                      : 'Edit Recipe'}
                            </h2>
                            <p className="text-[11px] text-gray-500">
                                Type or paste ingredients &amp; steps directly — bullets and numbers clean up automatically
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    {/* ── 1. DISH NAME ── */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Dish / Recipe Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="e.g., Moong Dal & Spinach Chilla"
                            className="w-full min-h-[42px] text-sm font-semibold px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* ── 2. VISUAL CATEGORY PILLS ── */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-700">
                            Meal Category
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {RECIPE_CATEGORIES.map((cat) => {
                                const active =
                                    (formData.category || 'Breakfast').toLowerCase() ===
                                    cat.toLowerCase();
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                category: cat,
                                            }))
                                        }
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                                            active
                                                ? 'bg-primary text-white border-primary shadow-2xs font-bold'
                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── 3. QUICK TIME & SERVINGS STRIP ── */}
                    <div className="rounded-2xl bg-gray-50/80 border border-gray-200/80 p-3 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-heading">
                                <Clock size={14} className="text-amber-600" />
                                <span>Cooking Time &amp; Servings</span>
                                <span className="text-[11px] font-normal text-gray-500">
                                    ({formData.prep_time || '10 mins'} prep •{' '}
                                    {formData.cook_time || '15 mins'} cook •{' '}
                                    {formData.servings || '1 serving'})
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowCustomTimes((o) => !o)}
                                className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                            >
                                {showCustomTimes ? 'Hide Custom' : 'Edit Custom'}
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            {TIME_PRESETS.map((tp) => {
                                const isChosen =
                                    formData.prep_time === tp.prep &&
                                    formData.cook_time === tp.cook;
                                return (
                                    <button
                                        key={tp.label}
                                        type="button"
                                        onClick={() => applyTimePreset(tp)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                                            isChosen
                                                ? 'bg-amber-100 text-amber-950 border-amber-300 font-bold'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                                        }`}
                                    >
                                        {tp.label}
                                    </button>
                                );
                            })}

                            <span className="text-gray-300 mx-0.5">|</span>

                            {['1 serving', '2 servings'].map((srv) => {
                                const isChosen =
                                    (formData.servings || '1 serving') === srv;
                                return (
                                    <button
                                        key={srv}
                                        type="button"
                                        onClick={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                servings: srv,
                                            }))
                                        }
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                                            isChosen
                                                ? 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                                        }`}
                                    >
                                        {srv}
                                    </button>
                                );
                            })}
                        </div>

                        {showCustomTimes && (
                            <div className="grid grid-cols-3 gap-2.5 pt-1">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                        Prep Time
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.prep_time}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                prep_time: e.target.value,
                                            }))
                                        }
                                        placeholder="10 mins"
                                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                        Cook Time
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cook_time}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                cook_time: e.target.value,
                                            }))
                                        }
                                        placeholder="15 mins"
                                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                        Servings
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.servings}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                servings: e.target.value,
                                            }))
                                        }
                                        placeholder="1 serving"
                                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── 4. PASTE-FRIENDLY INGREDIENTS & COOKING STEPS ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-heading">
                                    Ingredients *
                                </label>
                                <span className="text-[10px] font-semibold text-primary">
                                    {filledIngredientCount}{' '}
                                    {filledIngredientCount === 1 ? 'item' : 'items'}
                                </span>
                            </div>
                            <textarea
                                rows={6}
                                value={ingredientsText}
                                onChange={(e) => handleIngredientsTextChange(e.target.value)}
                                placeholder={
                                    'One ingredient per line (type or paste):\n1/2 cup yellow moong dal\n1/2 cup chopped spinach\n1/4 tsp turmeric\n1 tsp cold-pressed oil'
                                }
                                className="w-full text-xs p-3 rounded-2xl border border-gray-200 bg-white leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-heading">
                                    Cooking Steps{' '}
                                    <span className="text-gray-400 font-normal">(Optional)</span>
                                </label>
                                <span className="text-[10px] font-semibold text-gray-500">
                                    {filledInstructionCount}{' '}
                                    {filledInstructionCount === 1 ? 'step' : 'steps'}
                                </span>
                            </div>
                            <textarea
                                rows={6}
                                value={instructionsText}
                                onChange={(e) => handleInstructionsTextChange(e.target.value)}
                                placeholder={
                                    'One step per line (type or paste):\nSoak moong dal for 2 hours\nBlend smooth with ginger & green chilli\nCook on a warm pan with 1/2 tsp oil'
                                }
                                className="w-full text-xs p-3 rounded-2xl border border-gray-200 bg-white leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* ── 5. PROGRESSIVE OPTIONAL TRAY: Nutrition Macros & Dietitian Tip ── */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowNutritionTray((o) => !o)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary transition cursor-pointer"
                        >
                            <Sparkles size={13} className="text-primary" />
                            <span>
                                {showNutritionTray
                                    ? 'Hide Nutrition Macros & Dietitian Tip'
                                    : '+ Add Calories, Macros or Dietitian Tip (Optional)'}
                            </span>
                            {hasNutritionOrTip && !showNutritionTray && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px]">
                                    Filled
                                </span>
                            )}
                            {showNutritionTray ? (
                                <ChevronUp size={14} className="text-gray-400" />
                            ) : (
                                <ChevronDown size={14} className="text-gray-400" />
                            )}
                        </button>

                        {showNutritionTray && (
                            <div className="mt-2.5 p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-3">
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {[
                                        ['calories', 'Calories', '240 kcal'],
                                        ['protein', 'Protein', '14g'],
                                        ['carbs', 'Carbs', '28g'],
                                        ['fats', 'Fats', '5g'],
                                        ['fiber', 'Fibre', '4g'],
                                    ].map(([field, lbl, ph]) => (
                                        <div key={field}>
                                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                                {lbl}
                                            </label>
                                            <input
                                                type="text"
                                                value={formData[field] || ''}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        [field]: e.target.value,
                                                    }))
                                                }
                                                placeholder={ph}
                                                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                        Dietitian Tip / Health Benefit
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.dietitian_tip || ''}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                dietitian_tip: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g., High in soluble fibre — keeps morning blood sugar steady."
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── FOOTER ACTIONS ── */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-gray-100">
                        {showSaveToBankOption && setSaveToBank ? (
                            <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={saveToBank}
                                    onChange={(e) => setSaveToBank(e.target.checked)}
                                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                                />
                                <span className="inline-flex items-center gap-1">
                                    <Database size={12} className="text-primary" />
                                    Also save to Clinic Recipe Bank
                                </span>
                            </label>
                        ) : (
                            <span />
                        )}

                        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full sm:w-auto min-h-10 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full sm:w-auto min-h-[42px] px-5 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary-hover shadow-xs transition cursor-pointer disabled:opacity-60"
                            >
                                {saving
                                    ? 'Saving...'
                                    : showSaveToBankOption
                                      ? saveToBank
                                          ? 'Save & Attach Recipe'
                                          : 'Attach to Plan Only'
                                      : mode === 'create'
                                        ? 'Save Recipe'
                                        : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
