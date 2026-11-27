'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import {
    ChefHat,
    Plus,
    Search,
    Trash2,
    Edit3,
    Eye,
    Copy,
    Clock,
    Utensils,
    Sparkles,
    X,
    ArrowRight,
    BookOpen,
    RefreshCw,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import RecipeFormModal, {
    RECIPE_CATEGORIES,
    cleanMultilineItems,
} from '@/components/admin/recipes/RecipeFormModal';

const CATEGORIES = ['All', ...RECIPE_CATEGORIES];

const EMPTY_RECIPE = {
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
    is_preset: false,
};

const CATEGORY_COLORS = {
    Breakfast: 'bg-amber-50 text-amber-800 border-amber-200',
    Lunch: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Dinner: 'bg-purple-50 text-purple-800 border-purple-200',
    Snack: 'bg-orange-50 text-orange-800 border-orange-200',
    Beverage: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    'Soup & Salad': 'bg-teal-50 text-teal-800 border-teal-200',
};

export default function RecipesAdminPage() {
    const supabase = useMemo(() => createClient(), []);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search & Category Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Add / Edit Modal State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
    const [formData, setFormData] = useState(EMPTY_RECIPE);
    const [saving, setSaving] = useState(false);

    // Preview Modal State
    const [previewRecipe, setPreviewRecipe] = useState(null);

    const fetchRecipes = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRecipes(data || []);
        } catch (err) {
            console.error('Error fetching recipes:', err);
            Swal.fire({
                icon: 'error',
                title: 'Failed to load recipes',
                text: err.message,
                confirmButtonColor: '#2d6a4f',
            });
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    const categoryCounts = useMemo(() => {
        const counts = { All: recipes.length };
        for (const cat of RECIPE_CATEGORIES) counts[cat] = 0;
        for (const r of recipes) {
            const matched = RECIPE_CATEGORIES.find(
                (c) => c.toLowerCase() === String(r.category || '').toLowerCase()
            );
            if (matched) counts[matched] = (counts[matched] || 0) + 1;
        }
        return counts;
    }, [recipes]);

    const filteredRecipes = useMemo(() => {
        return recipes.filter((r) => {
            const matchCategory =
                selectedCategory === 'All' ||
                r.category?.toLowerCase() === selectedCategory.toLowerCase();
            const q = searchQuery.toLowerCase().trim();
            if (!q) return matchCategory;

            const nameMatch = r.name?.toLowerCase().includes(q);
            const tipMatch = r.dietitian_tip?.toLowerCase().includes(q);
            const ingMatch =
                Array.isArray(r.ingredients) &&
                r.ingredients.some((ing) => String(ing).toLowerCase().includes(q));

            return matchCategory && (nameMatch || tipMatch || ingMatch);
        });
    }, [recipes, selectedCategory, searchQuery]);

    const handleOpenCreate = () => {
        const prefilledCat =
            selectedCategory !== 'All' ? selectedCategory : 'Breakfast';
        setFormData({
            ...EMPTY_RECIPE,
            category: prefilledCat,
            ingredients: [''],
            instructions: [''],
        });
        setFormMode('create');
        setIsFormOpen(true);
    };

    const handleOpenEdit = (recipe) => {
        setPreviewRecipe(null);
        setFormData({
            ...recipe,
            ingredients:
                Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
                    ? recipe.ingredients
                    : [''],
            instructions:
                Array.isArray(recipe.instructions) && recipe.instructions.length > 0
                    ? recipe.instructions
                    : [''],
        });
        setFormMode('edit');
        setIsFormOpen(true);
    };

    const handleDuplicate = async (recipe) => {
        try {
            const duplicateData = {
                name: `${recipe.name} (Copy)`,
                category: recipe.category || 'Breakfast',
                prep_time: recipe.prep_time || '10 mins',
                cook_time: recipe.cook_time || '15 mins',
                servings: recipe.servings || '1 serving',
                calories: recipe.calories || '',
                protein: recipe.protein || '',
                carbs: recipe.carbs || '',
                fats: recipe.fats || '',
                fiber: recipe.fiber || '',
                ingredients: recipe.ingredients || [],
                instructions: recipe.instructions || [],
                dietitian_tip: recipe.dietitian_tip || '',
                is_preset: false,
            };

            const { data, error } = await supabase
                .from('recipes')
                .insert([duplicateData])
                .select()
                .single();

            if (error) throw error;

            setRecipes((prev) => [data, ...prev]);
            Swal.fire({
                icon: 'success',
                title: 'Recipe Duplicated',
                text: `"${data.name}" has been created.`,
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Duplicate Failed',
                text: err.message,
                confirmButtonColor: '#2d6a4f',
            });
        }
    };

    const handleDelete = async (recipe) => {
        const result = await Swal.fire({
            title: `Delete "${recipe.name}"?`,
            text: 'This recipe will be permanently removed from the clinic recipe bank.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete',
        });

        if (!result.isConfirmed) return;

        try {
            const { error } = await supabase.from('recipes').delete().eq('id', recipe.id);
            if (error) throw error;
            setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Delete Failed',
                text: err.message,
                confirmButtonColor: '#2d6a4f',
            });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Dish Name',
                text: 'Please enter the recipe name.',
            });
            return;
        }

        const cleanIngredients = cleanMultilineItems(formData.ingredients, false);
        const cleanInstructions = cleanMultilineItems(formData.instructions, true);

        if (cleanIngredients.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Ingredients',
                text: 'Please type or paste at least one ingredient.',
            });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: formData.name.trim(),
                category: formData.category || 'Breakfast',
                prep_time: formData.prep_time?.trim() || '10 mins',
                cook_time: formData.cook_time?.trim() || '15 mins',
                servings: formData.servings?.trim() || '1 serving',
                calories: formData.calories?.trim() || '',
                protein: formData.protein?.trim() || '',
                carbs: formData.carbs?.trim() || '',
                fats: formData.fats?.trim() || '',
                fiber: formData.fiber?.trim() || '',
                ingredients: cleanIngredients,
                instructions:
                    cleanInstructions.length > 0
                        ? cleanInstructions
                        : ['Cook as directed.'],
                dietitian_tip: formData.dietitian_tip?.trim() || '',
                updated_at: new Date().toISOString(),
            };

            if (formMode === 'create') {
                const { data, error } = await supabase
                    .from('recipes')
                    .insert([payload])
                    .select()
                    .single();

                if (error) throw error;
                setRecipes((prev) => [data, ...prev]);
                Swal.fire({
                    icon: 'success',
                    title: 'Recipe Saved!',
                    text: `"${data.name}" added to the Recipe Bank.`,
                    timer: 1600,
                    showConfirmButton: false,
                });
            } else {
                const { data, error } = await supabase
                    .from('recipes')
                    .update(payload)
                    .eq('id', formData.id)
                    .select()
                    .single();

                if (error) throw error;
                setRecipes((prev) => prev.map((r) => (r.id === data.id ? data : r)));
                Swal.fire({
                    icon: 'success',
                    title: 'Recipe Updated!',
                    timer: 1500,
                    showConfirmButton: false,
                });
            }

            setIsFormOpen(false);
        } catch (err) {
            console.error('Error saving recipe:', err);
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: err.message,
                confirmButtonColor: '#2d6a4f',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-0.5 sm:px-2 py-1 sm:py-4 space-y-4 sm:space-y-6 pb-12">
            {/* ── Header ── */}
            <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-xl sm:text-3xl font-bold text-heading flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <span className="p-2 sm:p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                            <ChefHat size={20} className="sm:w-[22px] sm:h-[22px]" />
                        </span>
                        <span className="truncate">Recipe Bank</span>
                    </h1>

                    <div className="flex items-center gap-2 shrink-0">
                        <Link
                            href="/admin/diet-plan-generator"
                            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 min-h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-heading transition"
                        >
                            <span>Diet Plan Builder</span>
                            <ArrowRight size={13} className="text-gray-400" />
                        </Link>

                        <button
                            type="button"
                            onClick={handleOpenCreate}
                            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-10 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs whitespace-nowrap transition active:scale-[0.98] cursor-pointer"
                        >
                            <Plus size={16} />
                            <span>Add Recipe</span>
                        </button>
                    </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-500">
                    Save reusable recipes once, then attach them to any client&apos;s diet plan in 1 tap
                </p>
            </div>

            {/* ── Search & Category Filter Bar ── */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="relative flex-1">
                        <Search
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search recipes by dish name, ingredient, or benefit..."
                            className="w-full text-sm pl-10 pr-9 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="text-xs text-gray-500 font-medium shrink-0">
                        Showing <strong className="text-heading">{filteredRecipes.length}</strong>{' '}
                        of {recipes.length}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                    {CATEGORIES.map((cat) => {
                        const active = selectedCategory.toLowerCase() === cat.toLowerCase();
                        const count = categoryCounts[cat] ?? 0;
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                                    active
                                        ? 'bg-primary text-white shadow-2xs font-bold'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                                }`}
                            >
                                {cat} {count > 0 ? `(${count})` : ''}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Recipe Cards Grid ── */}
            {loading ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-gray-200/80 text-sm text-gray-500">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-primary" />
                    Loading recipes...
                </div>
            ) : filteredRecipes.length === 0 ? (
                <div className="py-14 px-6 text-center bg-white rounded-2xl border border-gray-200/80">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center mx-auto mb-3">
                        <Utensils size={24} />
                    </div>
                    <h3 className="text-base font-bold text-heading">No recipes found</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        {searchQuery || selectedCategory !== 'All'
                            ? 'Try clearing your search or switching category.'
                            : 'Add your first recipe — you can paste ingredients directly from WhatsApp or notes.'}
                    </p>
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition cursor-pointer"
                    >
                        <Plus size={14} />
                        <span>Add New Recipe</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                    {filteredRecipes.map((recipe) => {
                        const colorClass =
                            CATEGORY_COLORS[recipe.category] ||
                            'bg-gray-100 text-gray-700 border-gray-200';
                        const ingredientList = Array.isArray(recipe.ingredients)
                            ? recipe.ingredients
                            : [];
                        const hasMacros = Boolean(
                            recipe.calories ||
                                recipe.protein ||
                                recipe.carbs ||
                                recipe.fats ||
                                recipe.fiber
                        );

                        return (
                            <div
                                key={recipe.id}
                                className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 hover:border-primary/40 shadow-2xs transition flex flex-col justify-between group"
                            >
                                <div
                                    onClick={() => setPreviewRecipe(recipe)}
                                    className="cursor-pointer"
                                >
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span
                                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${colorClass}`}
                                        >
                                            {recipe.category || 'General'}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
                                            <Clock size={12} className="text-amber-600" />
                                            {recipe.prep_time || '10m'} +{' '}
                                            {recipe.cook_time || '15m'}
                                        </span>
                                    </div>

                                    <h3 className="font-heading font-bold text-heading text-sm sm:text-base group-hover:text-primary transition line-clamp-1 mb-2">
                                        {recipe.name}
                                    </h3>

                                    {hasMacros && (
                                        <div className="grid grid-cols-5 gap-1 p-2 rounded-xl bg-gray-50 border border-gray-100 mb-2.5 text-center">
                                            <div>
                                                <span className="block text-[9px] uppercase font-bold text-gray-400">
                                                    Cal
                                                </span>
                                                <span className="text-[11px] font-bold text-emerald-800">
                                                    {recipe.calories || '—'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-[9px] uppercase font-bold text-gray-400">
                                                    Prot
                                                </span>
                                                <span className="text-[11px] font-bold text-primary">
                                                    {recipe.protein || '—'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-[9px] uppercase font-bold text-gray-400">
                                                    Carbs
                                                </span>
                                                <span className="text-[11px] font-bold text-amber-700">
                                                    {recipe.carbs || '—'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-[9px] uppercase font-bold text-gray-400">
                                                    Fats
                                                </span>
                                                <span className="text-[11px] font-bold text-purple-700">
                                                    {recipe.fats || '—'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-[9px] uppercase font-bold text-gray-400">
                                                    Fibre
                                                </span>
                                                <span className="text-[11px] font-bold text-teal-700">
                                                    {recipe.fiber || '—'}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2">
                                        <strong className="text-gray-700">
                                            {ingredientList.length} ingredients:
                                        </strong>{' '}
                                        {ingredientList.slice(0, 4).join(', ')}
                                        {ingredientList.length > 4
                                            ? ` +${ingredientList.length - 4} more`
                                            : ''}
                                    </p>

                                    {recipe.dietitian_tip && (
                                        <p className="text-[11px] text-emerald-900 bg-emerald-50/60 border border-emerald-100 rounded-xl px-2.5 py-1.5 line-clamp-1 italic mb-2">
                                            Tip: {recipe.dietitian_tip}
                                        </p>
                                    )}
                                </div>

                                {/* Touch-Friendly Card Footer Actions */}
                                <div className="pt-2.5 mt-1 border-t border-gray-100 flex items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewRecipe(recipe)}
                                            className="min-h-9 px-2.5 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-heading text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                                        >
                                            <Eye size={13} className="text-primary" />
                                            <span>View</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEdit(recipe)}
                                            className="min-h-9 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-primary text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                                        >
                                            <Edit3 size={13} />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDuplicate(recipe)}
                                            className="min-h-9 px-2.5 py-1.5 rounded-xl bg-gray-50 hover:bg-amber-50 text-gray-600 hover:text-amber-800 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                                            title="Duplicate recipe"
                                        >
                                            <Copy size={13} />
                                            <span className="hidden sm:inline">Copy</span>
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(recipe)}
                                        className="min-h-9 w-9 inline-flex items-center justify-center rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                        title="Delete recipe"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Simplified Paste-Friendly Recipe Form Modal ── */}
            <RecipeFormModal
                key={isFormOpen ? `${formMode}-${formData.id || 'new'}` : 'closed'}
                isOpen={isFormOpen}
                mode={formMode}
                formData={formData}
                setFormData={setFormData}
                saving={saving}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleSave}
            />

            {/* ── Recipe Preview Modal ── */}
            {previewRecipe && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-gray-100 max-h-[90dvh] overflow-y-auto">
                        <div className="flex items-start justify-between border-b border-gray-100 pb-3 mb-4">
                            <div>
                                <span
                                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border mb-1.5 inline-block ${
                                        CATEGORY_COLORS[previewRecipe.category] ||
                                        'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {previewRecipe.category}
                                </span>
                                <h2 className="text-lg font-bold font-heading text-heading">
                                    {previewRecipe.name}
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Prep: {previewRecipe.prep_time || '10m'} • Cook:{' '}
                                    {previewRecipe.cook_time || '15m'} •{' '}
                                    {previewRecipe.servings || '1 serving'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewRecipe(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-5 gap-1.5 p-2.5 rounded-2xl bg-gray-50 border border-gray-100 mb-4 text-center">
                            {[
                                ['Calories', previewRecipe.calories, 'text-emerald-800'],
                                ['Protein', previewRecipe.protein, 'text-primary'],
                                ['Carbs', previewRecipe.carbs, 'text-amber-700'],
                                ['Fats', previewRecipe.fats, 'text-purple-700'],
                                ['Fibre', previewRecipe.fiber, 'text-teal-700'],
                            ].map(([lbl, val, cls]) => (
                                <div key={lbl}>
                                    <span className="block text-[9px] uppercase font-bold text-gray-400">
                                        {lbl}
                                    </span>
                                    <span className={`text-xs font-bold ${cls}`}>
                                        {val || '—'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-heading uppercase mb-2 flex items-center gap-1.5">
                                <Utensils size={13} className="text-primary" />
                                Ingredients ({(previewRecipe.ingredients || []).length})
                            </h4>
                            <ul className="space-y-1 bg-gray-50/60 p-3 rounded-2xl border border-gray-100">
                                {(previewRecipe.ingredients || []).map((ing, iIdx) => (
                                    <li
                                        key={iIdx}
                                        className="text-xs text-gray-700 flex items-start gap-2"
                                    >
                                        <span className="text-primary font-bold">•</span>
                                        <span>{ing}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-heading uppercase mb-2 flex items-center gap-1.5">
                                <BookOpen size={13} className="text-primary" />
                                Cooking Steps
                            </h4>
                            <div className="space-y-2">
                                {(previewRecipe.instructions || []).map((step, sIdx) => (
                                    <div
                                        key={sIdx}
                                        className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed"
                                    >
                                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                            {sIdx + 1}
                                        </span>
                                        <span>{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {previewRecipe.dietitian_tip && (
                            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/70 mb-4">
                                <span className="text-[10px] font-bold text-emerald-800 uppercase mb-1 flex items-center gap-1">
                                    <Sparkles size={12} />
                                    Dietitian Tip
                                </span>
                                <p className="text-xs text-emerald-950/90 italic leading-relaxed">
                                    {previewRecipe.dietitian_tip}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => handleOpenEdit(previewRecipe)}
                                className="min-h-10 px-4 py-2 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer"
                            >
                                <Edit3 size={13} />
                                <span>Edit Recipe</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewRecipe(null)}
                                className="min-h-10 px-4 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary-hover transition cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
