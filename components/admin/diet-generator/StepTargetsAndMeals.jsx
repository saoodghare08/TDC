'use client';

import React, { useState } from 'react';
import {
    Target,
    Clock,
    Plus,
    Trash2,
    Copy,
    ArrowUp,
    ArrowDown,
    Sparkles,
    Calculator,
    ChevronDown,
    ChevronUp,
    Lock,
    Unlock,
    Utensils,
} from 'lucide-react';
import {
    MEAL_SCAFFOLDS,
    createScaffoldMeals,
    getMealOptions,
    computeMacrosFromCalories,
    DEFAULT_CALC_CONFIG,
} from './dietGeneratorUtils';

export default function StepTargetsAndMeals({
    formData,
    setFormData,
    calcConfig,
    fieldsLocked,
    activeIbwNum,
    activeCaloriesNum,
    macroPctSum,
    proteinPerKgIbw,
    onManualCaloriesChange,
    onCalMultiplierChange,
    onMacroPctChange,
    onApplyMacroPreset,
    onBalanceMacrosTo100,
    onToggleLockFields,
    onToggleCalculatorPanel,
    onOpenTemplatesStep,
}) {
    // Track which meals have expanded optional side / chef note boxes (auto-open if already populated)
    const [openExtrasByIdx, setOpenExtrasByIdx] = useState({});

    const isExtraOpen = (idx, key, currentVal) =>
        Boolean(currentVal && String(currentVal).trim() !== '') ||
        Boolean(openExtrasByIdx[`${idx}_${key}`]);

    const toggleExtraOpen = (idx, key) => {
        setOpenExtrasByIdx((prev) => ({
            ...prev,
            [`${idx}_${key}`]: !prev[`${idx}_${key}`],
        }));
    };

    // Compute a friendly 1-click recommendation when IBW is known
    const suggestedCalories = Number.isFinite(activeIbwNum)
        ? Math.round(activeIbwNum * (Number(calcConfig?.calMultiplier) || 25))
        : null;

    const handleApplyRecommendedTargets = () => {
        const baseCfg = calcConfig || DEFAULT_CALC_CONFIG;
        const cals = suggestedCalories || 1500;
        const macros = computeMacrosFromCalories(
            cals,
            baseCfg.proteinPct || 20,
            baseCfg.carbsPct || 60,
            baseCfg.fatsPct || 20
        );
        setFormData((prev) => ({
            ...prev,
            calories: String(cals),
            ...(macros || {}),
            fibre: prev.fibre?.trim() ? prev.fibre : '30g',
            water: prev.water?.trim() ? prev.water : '3.5L',
            steps: prev.steps?.trim() ? prev.steps : '8,000',
        }));
    };

    // ─── Meal Slot Manipulation Helpers ───
    const handleApplyMealScaffold = (scaffoldKey) => {
        setFormData((prev) => ({
            ...prev,
            meals: createScaffoldMeals(scaffoldKey),
        }));
    };

    const handleAddSingleMeal = () => {
        const defaultSlots = [
            { name: 'Early Morning', time: '7:30 AM' },
            { name: 'Breakfast', time: '9:00 AM' },
            { name: 'Mid-Morning', time: '11:30 AM' },
            { name: 'Lunch', time: '1:30 PM' },
            { name: 'Evening Snack', time: '5:00 PM' },
            { name: 'Dinner', time: '8:00 PM' },
            { name: 'Bedtime', time: '10:00 PM' },
        ];
        const nextDef = defaultSlots[formData.meals.length] || {
            name: `Meal ${formData.meals.length + 1}`,
            time: '',
        };
        setFormData((prev) => ({
            ...prev,
            meals: [
                ...prev.meals,
                {
                    name: nextDef.name,
                    time: nextDef.time,
                    options: [''],
                    option1: '',
                    option2: '',
                    optional: '',
                    notes: '',
                },
            ],
        }));
    };

    const handleMealFieldChange = (index, field, value) => {
        const updated = [...formData.meals];
        updated[index] = { ...updated[index], [field]: value };
        setFormData((prev) => ({ ...prev, meals: updated }));
    };

    const handleMealOptionChange = (mealIndex, optionIndex, value) => {
        const updated = [...formData.meals];
        const currentOptions = [...getMealOptions(updated[mealIndex])];
        currentOptions[optionIndex] = value;
        updated[mealIndex] = {
            ...updated[mealIndex],
            options: currentOptions,
            option1: currentOptions[0] || '',
            option2: currentOptions[1] || '',
        };
        setFormData((prev) => ({ ...prev, meals: updated }));
    };

    const handleAddSwapOption = (mealIndex) => {
        const updated = [...formData.meals];
        const currentOptions = [...getMealOptions(updated[mealIndex]), ''];
        updated[mealIndex] = {
            ...updated[mealIndex],
            options: currentOptions,
            option1: currentOptions[0] || '',
            option2: currentOptions[1] || '',
        };
        setFormData((prev) => ({ ...prev, meals: updated }));
    };

    const handleRemoveSwapOption = (mealIndex, optionIndex) => {
        const updated = [...formData.meals];
        const currentOptions = getMealOptions(updated[mealIndex]).filter(
            (_, idx) => idx !== optionIndex
        );
        const finalOptions = currentOptions.length > 0 ? currentOptions : [''];
        updated[mealIndex] = {
            ...updated[mealIndex],
            options: finalOptions,
            option1: finalOptions[0] || '',
            option2: finalOptions[1] || '',
        };
        setFormData((prev) => ({ ...prev, meals: updated }));
    };

    const handleDuplicateMeal = (index) => {
        const source = formData.meals[index];
        if (!source) return;
        const clone = JSON.parse(JSON.stringify(source));
        clone.name = `${source.name || 'Meal'} (Copy)`;
        const updated = [...formData.meals];
        updated.splice(index + 1, 0, clone);
        setFormData((prev) => ({ ...prev, meals: updated }));
    };

    const handleMoveMeal = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= formData.meals.length) return;
        const updated = [...formData.meals];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
        setFormData((prev) => ({ ...prev, meals: updated }));
    };

    const handleRemoveMeal = (index) => {
        setFormData((prev) => ({
            ...prev,
            meals: prev.meals.filter((_, i) => i !== index),
        }));
    };

    return (
        <div className="space-y-4">
            {/* ── CARD 1: DAILY NUTRITIONAL TARGETS ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <Target size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-heading">
                                Daily Targets{' '}
                                <span className="text-gray-400 font-normal text-xs">
                                    (Printed at the top of the PDF)
                                </span>
                            </h2>
                            <p className="text-[11px] text-gray-500">
                                Enter values directly or click Auto-Fill to calculate from client&apos;s height
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleApplyRecommendedTargets}
                        className="min-h-9 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 text-xs font-bold transition cursor-pointer"
                    >
                        <Sparkles size={13} />
                        <span>
                            {suggestedCalories
                                ? `Auto-Fill (~${suggestedCalories} kcal)`
                                : 'Auto-Fill Standard Targets'}
                        </span>
                    </button>
                </div>

                {/* 7 Clean Target Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                    <div>
                        <label className="flex items-center justify-between text-[11px] font-bold text-gray-700 mb-1">
                            <span>Calories</span>
                            {fieldsLocked && <Lock size={10} className="text-amber-600" />}
                        </label>
                        <input
                            type="text"
                            value={formData.calories}
                            readOnly={fieldsLocked}
                            onChange={(e) => onManualCaloriesChange(e.target.value)}
                            placeholder="1500"
                            className={`w-full min-h-10 text-xs font-bold text-emerald-800 px-3 py-2 rounded-xl border focus:outline-none ${fieldsLocked
                                ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                                : 'border-gray-200 focus:ring-2 focus:ring-primary/20'
                                }`}
                        />
                    </div>

                    <div>
                        <label className="flex items-center justify-between text-[11px] font-bold text-gray-700 mb-1">
                            <span>Protein</span>
                            {fieldsLocked && <Lock size={10} className="text-amber-600" />}
                        </label>
                        <input
                            type="text"
                            value={formData.protein}
                            readOnly={fieldsLocked}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, protein: e.target.value }))
                            }
                            placeholder="75g"
                            className={`w-full min-h-10 text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none ${fieldsLocked
                                ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                                : 'border-gray-200 focus:ring-2 focus:ring-primary/20'
                                }`}
                        />
                    </div>

                    <div>
                        <label className="flex items-center justify-between text-[11px] font-bold text-gray-700 mb-1">
                            <span>Carbs</span>
                            {fieldsLocked && <Lock size={10} className="text-amber-600" />}
                        </label>
                        <input
                            type="text"
                            value={formData.carbs}
                            readOnly={fieldsLocked}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, carbs: e.target.value }))
                            }
                            placeholder="180g"
                            className={`w-full min-h-10 text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none ${fieldsLocked
                                ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                                : 'border-gray-200 focus:ring-2 focus:ring-primary/20'
                                }`}
                        />
                    </div>

                    <div>
                        <label className="flex items-center justify-between text-[11px] font-bold text-gray-700 mb-1">
                            <span>Fats</span>
                            {fieldsLocked && <Lock size={10} className="text-amber-600" />}
                        </label>
                        <input
                            type="text"
                            value={formData.fats}
                            readOnly={fieldsLocked}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, fats: e.target.value }))
                            }
                            placeholder="40g"
                            className={`w-full min-h-10 text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none ${fieldsLocked
                                ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                                : 'border-gray-200 focus:ring-2 focus:ring-primary/20'
                                }`}
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Fibre
                        </label>
                        <input
                            type="text"
                            value={formData.fibre}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, fibre: e.target.value }))
                            }
                            placeholder="30g"
                            className="w-full min-h-10 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div>
                        <label className="flex items-center justify-between text-[11px] font-bold text-gray-700 mb-1">
                            <span>Water</span>
                            <span className="inline-flex gap-1 text-[10px] text-primary font-bold">
                                {['3L', '3.5L'].map((w) => (
                                    <button
                                        key={w}
                                        type="button"
                                        onClick={() =>
                                            setFormData((prev) => ({ ...prev, water: w }))
                                        }
                                        className="hover:underline cursor-pointer"
                                    >
                                        {w}
                                    </button>
                                ))}
                            </span>
                        </label>
                        <input
                            type="text"
                            value={formData.water}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, water: e.target.value }))
                            }
                            placeholder="3.5L"
                            className="w-full min-h-10 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                        <label className="flex items-center justify-between text-[11px] font-bold text-gray-700 mb-1">
                            <span>Daily Steps</span>
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData((prev) => ({ ...prev, steps: '10,000' }))
                                }
                                className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
                            >
                                10k
                            </button>
                        </label>
                        <input
                            type="text"
                            value={formData.steps}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, steps: e.target.value }))
                            }
                            placeholder="8,000"
                            className="w-full min-h-10 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Quiet Progressive Disclosure for Dietitian Formula Sliders */}
                <div className="rounded-xl bg-gray-50/90 border border-gray-200/80 overflow-hidden">
                    <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={onToggleCalculatorPanel}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-primary transition cursor-pointer"
                        >
                            <Calculator size={13} className="text-primary shrink-0" />
                            <span>Advanced Dietitian Formula Sliders</span>
                            {Number.isFinite(activeIbwNum) && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    Ideal Wt: {activeIbwNum} kg
                                </span>
                            )}
                            {calcConfig?.showCalculator ? (
                                <ChevronUp size={14} className="text-gray-400" />
                            ) : (
                                <ChevronDown size={14} className="text-gray-400" />
                            )}
                        </button>

                        {calcConfig?.showCalculator && (
                            <div className="flex items-center gap-2">
                                {macroPctSum !== 100 && (
                                    <button
                                        type="button"
                                        onClick={onBalanceMacrosTo100}
                                        className="text-[10px] font-bold text-amber-700 hover:underline cursor-pointer"
                                    >
                                        Total {macroPctSum}% → Balance to 100%
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={onToggleLockFields}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-heading cursor-pointer"
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
                        )}
                    </div>

                    {calcConfig?.showCalculator && (
                        <div className="p-3 pt-2 border-t border-gray-200/70 space-y-3 bg-white">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                                <span className="text-[11px] text-gray-500">
                                    Macro Split Ratio:
                                </span>
                                <select
                                    value={`${calcConfig.proteinPct}/${calcConfig.carbsPct}/${calcConfig.fatsPct}`}
                                    onChange={(e) => {
                                        if (e.target.value === 'custom') return;
                                        const [p, c, f] = e.target.value.split('/').map(Number);
                                        onApplyMacroPreset(p, c, f);
                                    }}
                                    className="w-full sm:w-auto text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-heading"
                                >
                                    <option value="20/60/20">
                                        Balanced (20% Protein / 60% Carbs / 20% Fats)
                                    </option>
                                    <option value="25/55/20">
                                        High-Protein (25% Protein / 55% Carbs / 20% Fats)
                                    </option>
                                    <option value="25/60/15">
                                        Low-Fat (25% Protein / 60% Carbs / 15% Fats)
                                    </option>
                                    <option value="25/50/25">
                                        Moderate-Carb (25% Protein / 50% Carbs / 25% Fats)
                                    </option>
                                    <option value="custom">
                                        Custom ({calcConfig.proteinPct}% / {calcConfig.carbsPct}% /{' '}
                                        {calcConfig.fatsPct}%)
                                    </option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div className="p-2.5 rounded-xl border border-gray-200/80 space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-bold text-gray-700">
                                            Calories per kg Ideal Weight
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
                                            value={Math.min(
                                                30,
                                                Math.max(20, Number(calcConfig.calMultiplier) || 25)
                                            )}
                                            onChange={(e) => onCalMultiplierChange(e.target.value)}
                                            className="flex-1 accent-primary cursor-pointer h-1.5"
                                        />
                                        <input
                                            type="number"
                                            min="10"
                                            max="50"
                                            step="0.5"
                                            value={calcConfig.calMultiplier}
                                            onChange={(e) => onCalMultiplierChange(e.target.value)}
                                            className="w-14 text-xs font-bold text-center px-1.5 py-1 rounded-lg border border-gray-200"
                                        />
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl border border-gray-200/80 space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-bold text-gray-700">Protein %</span>
                                        <span className="font-bold text-primary">
                                            {formData.protein || '—'}
                                            {proteinPerKgIbw ? ` (${proteinPerKgIbw} g/kg)` : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="range"
                                            min="15"
                                            max="30"
                                            step="0.5"
                                            value={Math.min(
                                                30,
                                                Math.max(15, Number(calcConfig.proteinPct) || 20)
                                            )}
                                            onChange={(e) =>
                                                onMacroPctChange('proteinPct', e.target.value)
                                            }
                                            className="flex-1 accent-primary cursor-pointer h-1.5"
                                        />
                                        <input
                                            type="number"
                                            min="5"
                                            max="50"
                                            step="0.5"
                                            value={calcConfig.proteinPct}
                                            onChange={(e) =>
                                                onMacroPctChange('proteinPct', e.target.value)
                                            }
                                            className="w-14 text-xs font-bold text-center px-1.5 py-1 rounded-lg border border-gray-200"
                                        />
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl border border-gray-200/80 space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-bold text-gray-700">Carbs %</span>
                                        <span className="font-bold text-primary">
                                            {formData.carbs || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="range"
                                            min="40"
                                            max="65"
                                            step="0.5"
                                            value={Math.min(
                                                65,
                                                Math.max(40, Number(calcConfig.carbsPct) || 60)
                                            )}
                                            onChange={(e) =>
                                                onMacroPctChange('carbsPct', e.target.value)
                                            }
                                            className="flex-1 accent-primary cursor-pointer h-1.5"
                                        />
                                        <input
                                            type="number"
                                            min="10"
                                            max="75"
                                            step="0.5"
                                            value={calcConfig.carbsPct}
                                            onChange={(e) =>
                                                onMacroPctChange('carbsPct', e.target.value)
                                            }
                                            className="w-14 text-xs font-bold text-center px-1.5 py-1 rounded-lg border border-gray-200"
                                        />
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl border border-gray-200/80 space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-bold text-gray-700">Fats %</span>
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
                                            value={Math.min(
                                                30,
                                                Math.max(12, Number(calcConfig.fatsPct) || 20)
                                            )}
                                            onChange={(e) =>
                                                onMacroPctChange('fatsPct', e.target.value)
                                            }
                                            className="flex-1 accent-primary cursor-pointer h-1.5"
                                        />
                                        <input
                                            type="number"
                                            min="5"
                                            max="50"
                                            step="0.5"
                                            value={calcConfig.fatsPct}
                                            onChange={(e) =>
                                                onMacroPctChange('fatsPct', e.target.value)
                                            }
                                            className="w-14 text-xs font-bold text-center px-1.5 py-1 rounded-lg border border-gray-200"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── CARD 2: DAILY MEAL PLAN ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <Utensils size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-heading flex items-center gap-2">
                                <span>Daily Meal Plan</span>
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                                    {formData.meals.length}{' '}
                                    {formData.meals.length === 1 ? 'Meal' : 'Meals'}
                                </span>
                            </h2>
                            <p className="text-[11px] text-gray-500">
                                Add what the client eats at each time of day — swap options &amp; cooking tips are optional
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddSingleMeal}
                        className="min-h-9 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                    >
                        <Plus size={14} />
                        <span>Add Meal Slot</span>
                    </button>
                </div>

                {/* Empty State: 1-Tap Meal Day Starters */}
                {formData.meals.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-5 sm:p-6 space-y-4">
                        <div className="text-center space-y-1">
                            <Clock size={24} className="mx-auto text-primary mb-1" />
                            <h3 className="text-sm font-bold text-heading">
                                Choose a Meal Schedule to Start
                            </h3>
                            <p className="text-xs text-gray-500 max-w-md mx-auto">
                                Pick a pre-timed daily structure in 1 tap instead of typing every
                                meal name manually:
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {Object.entries(MEAL_SCAFFOLDS).map(([key, sc]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleApplyMealScaffold(key)}
                                    className="text-left p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-primary hover:bg-emerald-50/40 shadow-2xs transition cursor-pointer space-y-1 group"
                                >
                                    <p className="text-xs font-bold text-heading group-hover:text-primary flex items-center justify-between">
                                        <span>{sc.label}</span>
                                        <Plus size={14} className="text-primary shrink-0" />
                                    </p>
                                    <p className="text-[11px] text-gray-500 leading-relaxed">
                                        {sc.desc}
                                    </p>
                                </button>
                            ))}
                        </div>

                        <div className="text-center pt-1 flex flex-wrap items-center justify-center gap-3 text-xs">
                            <button
                                type="button"
                                onClick={handleAddSingleMeal}
                                className="font-semibold text-gray-600 hover:text-heading underline cursor-pointer"
                            >
                                Or add 1 blank meal slot
                            </button>
                            {onOpenTemplatesStep && (
                                <>
                                    <span className="text-gray-300">•</span>
                                    <button
                                        type="button"
                                        onClick={onOpenTemplatesStep}
                                        className="font-bold text-primary hover:underline cursor-pointer"
                                    >
                                        Or load a complete Clinic Template
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {formData.meals.map((meal, index) => {
                            const options = getMealOptions(meal);
                            const showOptionalSide = isExtraOpen(
                                index,
                                'optional',
                                meal.optional
                            );
                            const showChefNote = isExtraOpen(index, 'notes', meal.notes);

                            return (
                                <div
                                    key={index}
                                    className="rounded-2xl border border-gray-200/90 bg-gray-50/50 hover:bg-white hover:border-primary/40 p-3.5 sm:p-4 transition space-y-3"
                                >
                                    {/* Meal Header: Number + Slot Name + Time + Reorder/Clone/Delete */}
                                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-40">
                                            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                                                {index + 1}
                                            </span>
                                            <input
                                                type="text"
                                                value={meal.name}
                                                onChange={(e) =>
                                                    handleMealFieldChange(
                                                        index,
                                                        'name',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Meal Name (e.g., Breakfast)"
                                                className="font-bold text-heading text-xs sm:text-sm px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-primary flex-1 min-w-0"
                                            />
                                        </div>

                                        <div className="flex items-center gap-1 ml-auto shrink-0">
                                            <input
                                                type="text"
                                                value={meal.time}
                                                onChange={(e) =>
                                                    handleMealFieldChange(
                                                        index,
                                                        'time',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="e.g. 9:00 AM"
                                                className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5 w-24 sm:w-28 text-center focus:outline-none focus:border-amber-400"
                                            />

                                            <button
                                                type="button"
                                                disabled={index === 0}
                                                onClick={() => handleMoveMeal(index, -1)}
                                                className="p-1.5 text-gray-400 hover:text-heading hover:bg-gray-100 rounded-lg disabled:opacity-30 cursor-pointer"
                                                title="Move meal up"
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={index === formData.meals.length - 1}
                                                onClick={() => handleMoveMeal(index, 1)}
                                                className="p-1.5 text-gray-400 hover:text-heading hover:bg-gray-100 rounded-lg disabled:opacity-30 cursor-pointer"
                                                title="Move meal down"
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDuplicateMeal(index)}
                                                className="p-1.5 text-gray-400 hover:text-primary hover:bg-emerald-50 rounded-lg cursor-pointer"
                                                title="Duplicate meal slot"
                                            >
                                                <Copy size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveMeal(index)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                                                title="Delete meal slot"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Meal Options */}
                                    <div className="space-y-2">
                                        {options.map((opt, optIdx) => (
                                            <div key={optIdx} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <label
                                                        className={`text-[11px] font-bold ${optIdx === 0
                                                            ? 'text-primary'
                                                            : 'text-amber-800'
                                                            }`}
                                                    >
                                                        {optIdx === 0
                                                            ? 'What to Eat (Main Choice)'
                                                            : `Swap Option ${optIdx + 1} (OR Choice)`}
                                                    </label>
                                                    {options.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveSwapOption(
                                                                    index,
                                                                    optIdx
                                                                )
                                                            }
                                                            className="text-[11px] text-gray-400 hover:text-red-500 cursor-pointer"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                                <textarea
                                                    rows={2}
                                                    value={opt}
                                                    onChange={(e) =>
                                                        handleMealOptionChange(
                                                            index,
                                                            optIdx,
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder={
                                                        optIdx === 0
                                                            ? 'e.g., 2 Moong Dal Chillas + 2 tbsp Mint Chutney + 1 cup Curd'
                                                            : 'e.g., 1 Bowl Vegetable Oats cooked with 40g Paneer'
                                                    }
                                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Expanded Optional Side Dish */}
                                    {showOptionalSide && (
                                        <div className="space-y-1 pt-1">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[11px] font-bold text-purple-800">
                                                    Optional Side / Add-On{' '}
                                                    <span className="font-normal text-gray-400">
                                                        (Client can have or skip)
                                                    </span>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        handleMealFieldChange(index, 'optional', '');
                                                        setOpenExtrasByIdx((prev) => ({
                                                            ...prev,
                                                            [`${index}_optional`]: false,
                                                        }));
                                                    }}
                                                    className="text-[11px] text-gray-400 hover:text-red-500 cursor-pointer"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                value={meal.optional || ''}
                                                onChange={(e) =>
                                                    handleMealFieldChange(
                                                        index,
                                                        'optional',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="e.g., 1 Boiled Egg or 1 Small Bowl Cucumber Salad"
                                                className="w-full text-xs px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 focus:bg-white focus:outline-none focus:border-purple-400"
                                            />
                                        </div>
                                    )}

                                    {/* Expanded Cooking / Portion Note */}
                                    {showChefNote && (
                                        <div className="space-y-1 pt-1">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[11px] font-bold text-gray-600">
                                                    Cooking / Portion Tip
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        handleMealFieldChange(index, 'notes', '');
                                                        setOpenExtrasByIdx((prev) => ({
                                                            ...prev,
                                                            [`${index}_notes`]: false,
                                                        }));
                                                    }}
                                                    className="text-[11px] text-gray-400 hover:text-red-500 cursor-pointer"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                value={meal.notes || ''}
                                                onChange={(e) =>
                                                    handleMealFieldChange(
                                                        index,
                                                        'notes',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="e.g., Cook in max 1/2 tsp cold-pressed oil or ghee"
                                                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                    )}

                                    {/* Compact 1-Tap Progressive Pills */}
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => handleAddSwapOption(index)}
                                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-[11px] font-semibold text-primary transition cursor-pointer"
                                        >
                                            + Add Swap Option ({options.length + 1})
                                        </button>

                                        {!showOptionalSide && (
                                            <button
                                                type="button"
                                                onClick={() => toggleExtraOpen(index, 'optional')}
                                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-200 text-[11px] font-semibold text-purple-700 transition cursor-pointer"
                                            >
                                                + Optional Side
                                            </button>
                                        )}

                                        {!showChefNote && (
                                            <button
                                                type="button"
                                                onClick={() => toggleExtraOpen(index, 'notes')}
                                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-[11px] font-semibold text-gray-600 transition cursor-pointer"
                                            >
                                                + Cooking Tip
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        <button
                            type="button"
                            onClick={handleAddSingleMeal}
                            className="w-full min-h-11 py-2.5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary hover:bg-emerald-50/40 text-xs font-bold text-primary flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                            <Plus size={15} />
                            <span>Add Another Meal Slot</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
