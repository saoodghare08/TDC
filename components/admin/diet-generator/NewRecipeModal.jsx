'use client';

import React from 'react';
import { ChefHat, X, Trash2, Database } from 'lucide-react';

export default function NewRecipeModal({
    isOpen,
    onClose,
    newRecipeForm,
    setNewRecipeForm,
    savingNewRecipe,
    saveNewRecipeToBank,
    setSaveNewRecipeToBank,
    newRecipeBulkIngOpen,
    setNewRecipeBulkIngOpen,
    newRecipeBulkIngText,
    setNewRecipeBulkIngText,
    onApplyBulkIngredients,
    newRecipeBulkInstOpen,
    setNewRecipeBulkInstOpen,
    newRecipeBulkInstText,
    setNewRecipeBulkInstText,
    onApplyBulkInstructions,
    onSubmit,
}) {
    if (!isOpen) return null;

    const handleAddIngredient = () =>
        setNewRecipeForm((prev) => ({
            ...prev,
            ingredients: [...prev.ingredients, ''],
        }));

    const handleIngredientChange = (idx, val) =>
        setNewRecipeForm((prev) => {
            const updated = [...prev.ingredients];
            updated[idx] = val;
            return { ...prev, ingredients: updated };
        });

    const handleRemoveIngredient = (idx) =>
        setNewRecipeForm((prev) => {
            const updated = prev.ingredients.filter((_, i) => i !== idx);
            return { ...prev, ingredients: updated.length > 0 ? updated : [''] };
        });

    const handleAddInstruction = () =>
        setNewRecipeForm((prev) => ({
            ...prev,
            instructions: [...prev.instructions, ''],
        }));

    const handleInstructionChange = (idx, val) =>
        setNewRecipeForm((prev) => {
            const updated = [...prev.instructions];
            updated[idx] = val;
            return { ...prev, instructions: updated };
        });

    const handleRemoveInstruction = (idx) =>
        setNewRecipeForm((prev) => {
            const updated = prev.instructions.filter((_, i) => i !== idx);
            return { ...prev, instructions: updated.length > 0 ? updated : [''] };
        });

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-gray-100 max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <ChefHat size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold font-heading text-heading">
                                Create &amp; Attach New Recipe
                            </h2>
                            <p className="text-[11px] text-para">
                                Add ingredients and cooking steps — attaches directly to this diet plan
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
                                    setNewRecipeForm((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
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
                                    setNewRecipeForm((prev) => ({
                                        ...prev,
                                        category: e.target.value,
                                    }))
                                }
                                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white"
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

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                Prep Time
                            </label>
                            <input
                                type="text"
                                value={newRecipeForm.prep_time}
                                onChange={(e) =>
                                    setNewRecipeForm((prev) => ({
                                        ...prev,
                                        prep_time: e.target.value,
                                    }))
                                }
                                placeholder="10 mins"
                                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                Cook Time
                            </label>
                            <input
                                type="text"
                                value={newRecipeForm.cook_time}
                                onChange={(e) =>
                                    setNewRecipeForm((prev) => ({
                                        ...prev,
                                        cook_time: e.target.value,
                                    }))
                                }
                                placeholder="15 mins"
                                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                Servings
                            </label>
                            <input
                                type="text"
                                value={newRecipeForm.servings}
                                onChange={(e) =>
                                    setNewRecipeForm((prev) => ({
                                        ...prev,
                                        servings: e.target.value,
                                    }))
                                }
                                placeholder="1 serving"
                                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-200/80">
                        <label className="block text-[10px] font-bold text-heading uppercase mb-2">
                            Nutrition Per Serving (Optional)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {[
                                ['calories', 'Calories', '240 kcal'],
                                ['protein', 'Protein', '14g'],
                                ['carbs', 'Carbs', '28g'],
                                ['fats', 'Fats', '5g'],
                                ['fiber', 'Fibre', '4g'],
                            ].map(([field, lbl, ph]) => (
                                <div key={field}>
                                    <span className="block text-[10px] text-gray-500 mb-0.5">
                                        {lbl}
                                    </span>
                                    <input
                                        type="text"
                                        value={newRecipeForm[field]}
                                        onChange={(e) =>
                                            setNewRecipeForm((prev) => ({
                                                ...prev,
                                                [field]: e.target.value,
                                            }))
                                        }
                                        placeholder={ph}
                                        className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-200 bg-white"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ingredients */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-heading">
                                Ingredients ({newRecipeForm.ingredients.length}) *
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setNewRecipeBulkIngOpen(!newRecipeBulkIngOpen)}
                                    className="text-[11px] font-semibold text-gray-500 hover:text-heading cursor-pointer"
                                >
                                    {newRecipeBulkIngOpen ? 'Close Paste Mode' : 'Paste List'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddIngredient}
                                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                                >
                                    + Add Line
                                </button>
                            </div>
                        </div>

                        {newRecipeBulkIngOpen ? (
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 mb-3">
                                <textarea
                                    rows={4}
                                    value={newRecipeBulkIngText}
                                    onChange={(e) => setNewRecipeBulkIngText(e.target.value)}
                                    placeholder={
                                        '1/2 cup yellow moong dal\n1/2 cup chopped spinach\n1 tsp cold pressed oil'
                                    }
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
                                        onClick={onApplyBulkIngredients}
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
                                        <span className="text-[11px] text-gray-400 w-4 text-center font-bold">
                                            •
                                        </span>
                                        <input
                                            type="text"
                                            value={ing}
                                            onChange={(e) =>
                                                handleIngredientChange(idx, e.target.value)
                                            }
                                            placeholder="e.g., 1/2 cup rolled oats or 100g paneer"
                                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200"
                                        />
                                        {newRecipeForm.ingredients.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveIngredient(idx)}
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

                    {/* Instructions */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-heading">
                                Cooking Steps ({newRecipeForm.instructions.length})
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setNewRecipeBulkInstOpen(!newRecipeBulkInstOpen)
                                    }
                                    className="text-[11px] font-semibold text-gray-500 hover:text-heading cursor-pointer"
                                >
                                    {newRecipeBulkInstOpen ? 'Close Paste Mode' : 'Paste Steps'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddInstruction}
                                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                                >
                                    + Add Step
                                </button>
                            </div>
                        </div>

                        {newRecipeBulkInstOpen ? (
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 mb-3">
                                <textarea
                                    rows={4}
                                    value={newRecipeBulkInstText}
                                    onChange={(e) => setNewRecipeBulkInstText(e.target.value)}
                                    placeholder={
                                        'Soak moong dal for 2 hours\nBlend smooth with ginger\nCook on hot pan with 1/2 tsp oil'
                                    }
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
                                        onClick={onApplyBulkInstructions}
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
                                                handleInstructionChange(sIdx, e.target.value)
                                            }
                                            placeholder={`Step ${sIdx + 1}`}
                                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200"
                                        />
                                        {newRecipeForm.instructions.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveInstruction(sIdx)}
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

                    <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Dietitian Tip (Optional)
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
                            placeholder="e.g., High in protein and soluble fibre — keeps morning energy steady."
                            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200"
                        />
                    </div>

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
                                Save to Clinic Recipe Bank for future plans
                            </span>
                        </label>

                        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full sm:w-auto min-h-10 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={savingNewRecipe}
                                className="w-full sm:w-auto min-h-[42px] px-5 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary-hover shadow-xs cursor-pointer disabled:opacity-60"
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
    );
}
