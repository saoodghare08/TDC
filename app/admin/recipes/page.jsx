'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import Swal from 'sweetalert2';
import {
    ChefHat, Plus, Search, Trash2, Edit3, Eye, Copy,
    Clock, Flame, Utensils, Sparkles, Filter, X,
    CheckCircle2, ArrowRight, BookOpen, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Beverage', 'Soup & Salad'];

const EMPTY_RECIPE = {
    name: '',
    category: 'Breakfast',
    prep_time: '10 mins',
    cook_time: '15 mins',
    servings: '1 serving',
    calories: '250 kcal',
    protein: '14g',
    carbs: '26g',
    fats: '6g',
    ingredients: [''],
    instructions: [''],
    dietitian_tip: '',
    is_preset: false
};

const CATEGORY_COLORS = {
    'Breakfast': 'bg-amber-50 text-amber-800 border-amber-200',
    'Lunch': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Dinner': 'bg-purple-50 text-purple-800 border-purple-200',
    'Snack': 'bg-orange-50 text-orange-800 border-orange-200',
    'Beverage': 'bg-cyan-50 text-cyan-800 border-cyan-200',
    'Soup & Salad': 'bg-teal-50 text-teal-800 border-teal-200'
};

export default function RecipesAdminPage() {
    const supabase = createClient();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Modals
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
    const [formData, setFormData] = useState(EMPTY_RECIPE);
    const [saving, setSaving] = useState(false);

    // Preview Modal
    const [previewRecipe, setPreviewRecipe] = useState(null);

    // Bulk Paste Modes for ingredients/instructions
    const [bulkIngredientsOpen, setBulkIngredientsOpen] = useState(false);
    const [bulkIngredientsText, setBulkIngredientsText] = useState('');
    const [bulkInstructionsOpen, setBulkInstructionsOpen] = useState(false);
    const [bulkInstructionsText, setBulkInstructionsText] = useState('');

    // Fetch recipes from Supabase
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
                confirmButtonColor: '#2d6a4f'
            });
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    // Filtered recipes
    const filteredRecipes = useMemo(() => {
        return recipes.filter(r => {
            const matchCategory = selectedCategory === 'All' || r.category?.toLowerCase() === selectedCategory.toLowerCase();
            const q = searchQuery.toLowerCase().trim();
            if (!q) return matchCategory;

            const nameMatch = r.name?.toLowerCase().includes(q);
            const tipMatch = r.dietitian_tip?.toLowerCase().includes(q);
            const ingMatch = Array.isArray(r.ingredients) && r.ingredients.some(ing => String(ing).toLowerCase().includes(q));

            return matchCategory && (nameMatch || tipMatch || ingMatch);
        });
    }, [recipes, selectedCategory, searchQuery]);

    // Open Form for Create
    const handleOpenCreate = () => {
        setFormData(EMPTY_RECIPE);
        setFormMode('create');
        setIsFormOpen(true);
    };

    // Open Form for Edit
    const handleOpenEdit = (recipe) => {
        setFormData({
            ...recipe,
            ingredients: Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 ? recipe.ingredients : [''],
            instructions: Array.isArray(recipe.instructions) && recipe.instructions.length > 0 ? recipe.instructions : ['']
        });
        setFormMode('edit');
        setIsFormOpen(true);
    };

    // Duplicate Recipe
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
                ingredients: recipe.ingredients || [],
                instructions: recipe.instructions || [],
                dietitian_tip: recipe.dietitian_tip || '',
                is_preset: false
            };

            const { data, error } = await supabase
                .from('recipes')
                .insert([duplicateData])
                .select()
                .single();

            if (error) throw error;

            setRecipes(prev => [data, ...prev]);
            Swal.fire({
                icon: 'success',
                title: 'Recipe Duplicated',
                text: `"${data.name}" has been created.`,
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Duplicate Failed',
                text: err.message,
                confirmButtonColor: '#2d6a4f'
            });
        }
    };

    // Delete Recipe
    const handleDelete = async (recipe) => {
        const result = await Swal.fire({
            title: `Delete "${recipe.name}"?`,
            text: 'This recipe will be permanently removed from the clinical recipe bank.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete recipe',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            const { error } = await supabase
                .from('recipes')
                .delete()
                .eq('id', recipe.id);

            if (error) throw error;

            setRecipes(prev => prev.filter(r => r.id !== recipe.id));
            Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Recipe has been deleted.',
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
    };

    // Save Form (Create or Edit)
    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            Swal.fire({ icon: 'warning', title: 'Missing Dish Name', text: 'Please specify the recipe name.' });
            return;
        }

        const cleanIngredients = (formData.ingredients || [])
            .map(i => (typeof i === 'string' ? i.trim() : String(i).trim()))
            .filter(Boolean);

        const cleanInstructions = (formData.instructions || [])
            .map(i => (typeof i === 'string' ? i.trim() : String(i).trim()))
            .filter(Boolean);

        if (cleanIngredients.length === 0) {
            Swal.fire({ icon: 'warning', title: 'No Ingredients', text: 'Please add at least one ingredient.' });
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
                ingredients: cleanIngredients,
                instructions: cleanInstructions.length > 0 ? cleanInstructions : ['Cook as directed.'],
                dietitian_tip: formData.dietitian_tip?.trim() || '',
                updated_at: new Date().toISOString()
            };

            if (formMode === 'create') {
                const { data, error } = await supabase
                    .from('recipes')
                    .insert([payload])
                    .select()
                    .single();

                if (error) throw error;
                setRecipes(prev => [data, ...prev]);
                Swal.fire({
                    icon: 'success',
                    title: 'Recipe Created',
                    text: `"${data.name}" added to clinical recipes!`,
                    timer: 1800,
                    showConfirmButton: false
                });
            } else {
                const { data, error } = await supabase
                    .from('recipes')
                    .update(payload)
                    .eq('id', formData.id)
                    .select()
                    .single();

                if (error) throw error;
                setRecipes(prev => prev.map(r => r.id === data.id ? data : r));
                Swal.fire({
                    icon: 'success',
                    title: 'Recipe Updated',
                    text: `"${data.name}" has been updated.`,
                    timer: 1800,
                    showConfirmButton: false
                });
            }

            setIsFormOpen(false);
        } catch (err) {
            console.error('Error saving recipe:', err);
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: err.message,
                confirmButtonColor: '#2d6a4f'
            });
        } finally {
            setSaving(false);
        }
    };

    // Ingredient Row Helpers
    const handleAddIngredient = () => {
        setFormData(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, '']
        }));
    };

    const handleIngredientChange = (index, value) => {
        const updated = [...formData.ingredients];
        updated[index] = value;
        setFormData(prev => ({ ...prev, ingredients: updated }));
    };

    const handleRemoveIngredient = (index) => {
        const updated = formData.ingredients.filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            ingredients: updated.length > 0 ? updated : ['']
        }));
    };

    const handleApplyBulkIngredients = () => {
        const lines = bulkIngredientsText
            .split('\n')
            .map(l => l.replace(/^[-•*✓\d.)\s]+/, '').trim())
            .filter(Boolean);

        if (lines.length > 0) {
            setFormData(prev => ({
                ...prev,
                ingredients: lines
            }));
        }
        setBulkIngredientsOpen(false);
        setBulkIngredientsText('');
    };

    // Instruction Row Helpers
    const handleAddInstruction = () => {
        setFormData(prev => ({
            ...prev,
            instructions: [...prev.instructions, '']
        }));
    };

    const handleInstructionChange = (index, value) => {
        const updated = [...formData.instructions];
        updated[index] = value;
        setFormData(prev => ({ ...prev, instructions: updated }));
    };

    const handleRemoveInstruction = (index) => {
        const updated = formData.instructions.filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            instructions: updated.length > 0 ? updated : ['']
        }));
    };

    const handleApplyBulkInstructions = () => {
        const lines = bulkInstructionsText
            .split('\n')
            .map(l => l.replace(/^[-•*✓\d.)\s]+/, '').trim())
            .filter(Boolean);

        if (lines.length > 0) {
            setFormData(prev => ({
                ...prev,
                instructions: lines
            }));
        }
        setBulkInstructionsOpen(false);
        setBulkInstructionsText('');
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Top Navigation & Action Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                            <ChefHat size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold font-heading text-heading">
                                Clinical Recipe Bank
                            </h1>
                            <p className="text-xs text-para mt-0.5">
                                Manage nutritious clinical recipes to attach formatted recipe tables in PDF Diet Plans
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link
                        href="/admin/pdf-generator"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-semibold text-heading hover:bg-gray-50 transition"
                    >
                        <span>PDF Generator</span>
                        <ArrowRight size={14} className="text-gray-400" />
                    </Link>

                    <button
                        onClick={handleOpenCreate}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-md shadow-primary/20 transition cursor-pointer"
                    >
                        <Plus size={16} />
                        <span>Create Recipe</span>
                    </button>
                </div>
            </div>

            {/* Filter, Search & Category Tabs */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by recipe name, ingredient or benefit..."
                            className="w-full text-xs pl-9 pr-8 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50/50"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="text-xs text-gray-500 font-medium">
                        Showing <strong className="text-heading">{filteredRecipes.length}</strong> of {recipes.length} recipes
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {CATEGORIES.map(cat => {
                        const active = selectedCategory.toLowerCase() === cat.toLowerCase();
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${active
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'bg-gray-100/70 text-gray-600 hover:bg-gray-200/60'
                                    }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Recipe Grid */}
            {loading ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-gray-100">
                    <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs font-semibold text-para">Loading recipes...</p>
                </div>
            ) : filteredRecipes.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-gray-100">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                        <Utensils size={24} />
                    </div>
                    <h3 className="text-sm font-bold text-heading">No recipes found</h3>
                    <p className="text-xs text-para mt-1 max-w-sm mx-auto">
                        {searchQuery || selectedCategory !== 'All'
                            ? 'No recipes match your current search and filter criteria.'
                            : 'Get started by creating your first clinical recipe for client plans.'}
                    </p>
                    <button
                        onClick={handleOpenCreate}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition cursor-pointer"
                    >
                        <Plus size={14} />
                        <span>Add New Recipe</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRecipes.map((recipe) => {
                        const colorClass = CATEGORY_COLORS[recipe.category] || 'bg-gray-100 text-gray-700 border-gray-200';
                        const ingredientList = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
                        const instructionList = Array.isArray(recipe.instructions) ? recipe.instructions : [];

                        return (
                            <div
                                key={recipe.id}
                                className="bg-white rounded-3xl p-5 border border-gray-100 hover:border-primary/30 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                            >
                                <div>
                                    {/* Category & Times */}
                                    <div className="flex items-center justify-between gap-2 mb-2.5">
                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${colorClass}`}>
                                            {recipe.category || 'General'}
                                        </span>
                                        <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} className="text-amber-600" />
                                                {(recipe.prep_time || '10m')} + {(recipe.cook_time || '15m')}
                                            </span>
                                            <span>•</span>
                                            <span>{recipe.servings || '1 serving'}</span>
                                        </div>
                                    </div>

                                    {/* Recipe Name */}
                                    <h3 className="font-heading font-bold text-heading text-sm group-hover:text-primary transition line-clamp-1 mb-2">
                                        {recipe.name}
                                    </h3>

                                    {/* Macro Strip */}
                                    <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-gray-50/80 border border-gray-100 mb-3 text-center">
                                        <div>
                                            <span className="block text-[9px] uppercase font-bold text-gray-400">Calories</span>
                                            <span className="text-[11px] font-bold text-emerald-800">{recipe.calories || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[9px] uppercase font-bold text-gray-400">Protein</span>
                                            <span className="text-[11px] font-bold text-primary">{recipe.protein || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[9px] uppercase font-bold text-gray-400">Carbs</span>
                                            <span className="text-[11px] font-bold text-amber-700">{recipe.carbs || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[9px] uppercase font-bold text-gray-400">Fats</span>
                                            <span className="text-[11px] font-bold text-purple-700">{recipe.fats || '—'}</span>
                                        </div>
                                    </div>

                                    {/* Ingredients Summary */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 mb-1">
                                            <span>Ingredients ({ingredientList.length})</span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                                            {ingredientList.slice(0, 4).join(', ')}
                                            {ingredientList.length > 4 ? ` +${ingredientList.length - 4} more` : ''}
                                        </p>
                                    </div>

                                    {/* Dietitian Tip (if any) */}
                                    {recipe.dietitian_tip && (
                                        <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100/70 mb-3">
                                            <span className="block text-[9px] font-bold text-emerald-800 uppercase mb-0.5">Clinical Note:</span>
                                            <p className="text-[10.5px] text-emerald-950/80 line-clamp-2 italic leading-snug">
                                                {recipe.dietitian_tip}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer Actions */}
                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setPreviewRecipe(recipe)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition cursor-pointer"
                                            title="View Full Recipe"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDuplicate(recipe)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                                            title="Duplicate Recipe"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleOpenEdit(recipe)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                                            title="Edit Recipe"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(recipe)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                                        title="Delete Recipe"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ═══════════════ RECIPE FORM MODAL (Add / Edit) ═══════════════ */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 my-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <ChefHat size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold font-heading text-heading">
                                        {formMode === 'create' ? 'Create New Clinical Recipe' : 'Edit Clinical Recipe'}
                                    </h2>
                                    <p className="text-[11px] text-para">
                                        Provide measured ingredients, step-by-step cooking method and nutrition profile
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            {/* Row 1: Dish Name & Category */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                        Dish Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Moong Dal & Spinach Chilla"
                                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                                    >
                                        <option value="Breakfast">Breakfast</option>
                                        <option value="Lunch">Lunch</option>
                                        <option value="Dinner">Dinner</option>
                                        <option value="Snack">Snack</option>
                                        <option value="Beverage">Beverage</option>
                                        <option value="Soup & Salad">Soup & Salad</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 2: Times & Servings */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Prep Time</label>
                                    <input
                                        type="text"
                                        value={formData.prep_time}
                                        onChange={(e) => setFormData({ ...formData, prep_time: e.target.value })}
                                        placeholder="e.g. 10 mins"
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Cook Time</label>
                                    <input
                                        type="text"
                                        value={formData.cook_time}
                                        onChange={(e) => setFormData({ ...formData, cook_time: e.target.value })}
                                        placeholder="e.g. 15 mins"
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Servings</label>
                                    <input
                                        type="text"
                                        value={formData.servings}
                                        onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                                        placeholder="e.g. 1 serving"
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Nutrition Profile */}
                            <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-200/80">
                                <label className="block text-[10px] font-bold text-heading uppercase mb-2">
                                    Nutritional Profile (Per Serving)
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    <div>
                                        <span className="block text-[10px] text-gray-500 mb-0.5">Calories</span>
                                        <input
                                            type="text"
                                            value={formData.calories}
                                            onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                                            placeholder="240 kcal"
                                            className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-200 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-gray-500 mb-0.5">Protein</span>
                                        <input
                                            type="text"
                                            value={formData.protein}
                                            onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                                            placeholder="14g"
                                            className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-200 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-gray-500 mb-0.5">Carbs</span>
                                        <input
                                            type="text"
                                            value={formData.carbs}
                                            onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                                            placeholder="28g"
                                            className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-200 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-gray-500 mb-0.5">Fats</span>
                                        <input
                                            type="text"
                                            value={formData.fats}
                                            onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                                            placeholder="5g"
                                            className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-200 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Measured Ingredients */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-heading">
                                        Measured Ingredients ({formData.ingredients.length}) *
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setBulkIngredientsOpen(!bulkIngredientsOpen)}
                                            className="text-[11px] font-semibold text-gray-500 hover:text-heading cursor-pointer"
                                        >
                                            {bulkIngredientsOpen ? 'Close Paste Mode' : 'Bulk Paste'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAddIngredient}
                                            className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                                        >
                                            + Add Ingredient
                                        </button>
                                    </div>
                                </div>

                                {bulkIngredientsOpen ? (
                                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 mb-3">
                                        <p className="text-[11px] text-gray-500 mb-1.5">
                                            Paste ingredients list (one per line):
                                        </p>
                                        <textarea
                                            rows={4}
                                            value={bulkIngredientsText}
                                            onChange={(e) => setBulkIngredientsText(e.target.value)}
                                            placeholder={"1/2 cup yellow moong dal\n1/2 cup chopped spinach\n1/4 tsp turmeric\n1 tsp cold pressed oil"}
                                            className="w-full text-xs p-2 rounded-xl border border-gray-200 bg-white"
                                        />
                                        <div className="mt-2 flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setBulkIngredientsOpen(false)}
                                                className="px-2.5 py-1 text-xs text-gray-600 rounded-lg hover:bg-gray-200"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleApplyBulkIngredients}
                                                className="px-3 py-1 text-xs bg-primary text-white font-semibold rounded-lg"
                                            >
                                                Apply Lines
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                        {formData.ingredients.map((ing, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className="text-[11px] text-gray-400 w-4 text-center font-bold">•</span>
                                                <input
                                                    type="text"
                                                    value={ing}
                                                    onChange={(e) => handleIngredientChange(idx, e.target.value)}
                                                    placeholder="e.g. 1/2 cup rolled oats or 100g paneer"
                                                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary/20"
                                                />
                                                {formData.ingredients.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveIngredient(idx)}
                                                        className="text-gray-400 hover:text-red-500 p-1"
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
                                        Preparation Method / Instructions ({formData.instructions.length})
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setBulkInstructionsOpen(!bulkInstructionsOpen)}
                                            className="text-[11px] font-semibold text-gray-500 hover:text-heading cursor-pointer"
                                        >
                                            {bulkInstructionsOpen ? 'Close Paste Mode' : 'Bulk Paste'}
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

                                {bulkInstructionsOpen ? (
                                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 mb-3">
                                        <p className="text-[11px] text-gray-500 mb-1.5">
                                            Paste cooking steps (one per line):
                                        </p>
                                        <textarea
                                            rows={4}
                                            value={bulkInstructionsText}
                                            onChange={(e) => setBulkInstructionsText(e.target.value)}
                                            placeholder={"Soak moong dal for 2 hours\nBlend into smooth batter with ginger and chilli\nSpread on hot pan and cook with 1/2 tsp oil"}
                                            className="w-full text-xs p-2 rounded-xl border border-gray-200 bg-white"
                                        />
                                        <div className="mt-2 flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setBulkInstructionsOpen(false)}
                                                className="px-2.5 py-1 text-xs text-gray-600 rounded-lg hover:bg-gray-200"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleApplyBulkInstructions}
                                                className="px-3 py-1 text-xs bg-primary text-white font-semibold rounded-lg"
                                            >
                                                Apply Steps
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                        {formData.instructions.map((step, sIdx) => (
                                            <div key={sIdx} className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                                                    {sIdx + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={step}
                                                    onChange={(e) => handleInstructionChange(sIdx, e.target.value)}
                                                    placeholder={`Step ${sIdx + 1} preparation instructions`}
                                                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary/20"
                                                />
                                                {formData.instructions.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveInstruction(sIdx)}
                                                        className="text-gray-400 hover:text-red-500 p-1"
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
                                    Dietitian Clinical Tip & Benefits
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.dietitian_tip}
                                    onChange={(e) => setFormData({ ...formData, dietitian_tip: e.target.value })}
                                    placeholder="e.g., High in bioavailable protein and soluble fiber. Ideal for PCOS and maintaining steady morning glucose."
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            {/* Modal Actions */}
                            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary-hover shadow-md shadow-primary/20 transition cursor-pointer disabled:opacity-60"
                                >
                                    {saving ? 'Saving...' : formMode === 'create' ? 'Create Recipe' : 'Update Recipe'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════════ PREVIEW MODAL ═══════════════ */}
            {previewRecipe && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 my-8 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-start justify-between border-b border-gray-100 pb-3 mb-4">
                            <div>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border mb-1.5 inline-block ${CATEGORY_COLORS[previewRecipe.category] || 'bg-gray-100 text-gray-700'}`}>
                                    {previewRecipe.category}
                                </span>
                                <h2 className="text-lg font-bold font-heading text-heading">
                                    {previewRecipe.name}
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Prep: {previewRecipe.prep_time || '10m'} • Cook: {previewRecipe.cook_time || '15m'} • {previewRecipe.servings || '1 serving'}
                                </p>
                            </div>
                            <button
                                onClick={() => setPreviewRecipe(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Nutrition Grid */}
                        <div className="grid grid-cols-4 gap-2 p-2.5 rounded-2xl bg-gray-50 border border-gray-100 mb-4 text-center">
                            <div>
                                <span className="block text-[9px] uppercase font-bold text-gray-400">Calories</span>
                                <span className="text-xs font-bold text-emerald-800">{previewRecipe.calories || '—'}</span>
                            </div>
                            <div>
                                <span className="block text-[9px] uppercase font-bold text-gray-400">Protein</span>
                                <span className="text-xs font-bold text-primary">{previewRecipe.protein || '—'}</span>
                            </div>
                            <div>
                                <span className="block text-[9px] uppercase font-bold text-gray-400">Carbs</span>
                                <span className="text-xs font-bold text-amber-700">{previewRecipe.carbs || '—'}</span>
                            </div>
                            <div>
                                <span className="block text-[9px] uppercase font-bold text-gray-400">Fats</span>
                                <span className="text-xs font-bold text-purple-700">{previewRecipe.fats || '—'}</span>
                            </div>
                        </div>

                        {/* Ingredients */}
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-heading uppercase mb-2 flex items-center gap-1.5">
                                <Utensils size={13} className="text-primary" />
                                Measured Ingredients
                            </h4>
                            <ul className="space-y-1 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                                {(previewRecipe.ingredients || []).map((ing, iIdx) => (
                                    <li key={iIdx} className="text-xs text-gray-700 flex items-start gap-2">
                                        <span className="text-primary font-bold">•</span>
                                        <span>{ing}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Instructions */}
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-heading uppercase mb-2 flex items-center gap-1.5">
                                <BookOpen size={13} className="text-primary" />
                                Step-by-Step Preparation
                            </h4>
                            <div className="space-y-2">
                                {(previewRecipe.instructions || []).map((step, sIdx) => (
                                    <div key={sIdx} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
                                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                            {sIdx + 1}
                                        </span>
                                        <span>{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Dietitian Tip */}
                        {previewRecipe.dietitian_tip && (
                            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/70 mb-4">
                                <span className="text-[10px] font-bold text-emerald-800 uppercase mb-1 flex items-center gap-1">
                                    <Sparkles size={12} />
                                    Dietitian Clinical Tip
                                </span>
                                <p className="text-xs text-emerald-950/90 italic leading-relaxed">
                                    {previewRecipe.dietitian_tip}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end pt-3 border-t border-gray-100">
                            <button
                                onClick={() => setPreviewRecipe(null)}
                                className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary-hover transition"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
