'use client';

import React from 'react';
import RecipeFormModal from '@/components/admin/recipes/RecipeFormModal';

export default function NewRecipeModal({
    isOpen,
    onClose,
    newRecipeForm,
    setNewRecipeForm,
    savingNewRecipe,
    saveNewRecipeToBank,
    setSaveNewRecipeToBank,
    onSubmit,
}) {
    return (
        <RecipeFormModal
            isOpen={isOpen}
            mode="create"
            formData={newRecipeForm}
            setFormData={setNewRecipeForm}
            saving={savingNewRecipe}
            onClose={onClose}
            onSubmit={onSubmit}
            showSaveToBankOption={true}
            saveToBank={saveNewRecipeToBank}
            setSaveToBank={setSaveNewRecipeToBank}
        />
    );
}
