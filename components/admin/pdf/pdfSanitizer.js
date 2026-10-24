/**
 * PDF Sanitizer for @react-pdf/renderer
 * 
 * Standard Helvetica font in PDF uses standard WinAnsi (Latin-1) encoding.
 * Emojis (SMP plane / \p{Extended_Pictographic}) and non-WinAnsi mathematical / dingbat
 * symbols (like ✓ \u2713 and ✕ \u2715) lack glyphs in Helvetica, rendering as broken
 * black boxes or missing characters in PDF preview and export.
 * 
 * This module strips emojis and sanitizes special characters across all plan data.
 */

export const sanitizePdfText = (text, fallback = '') => {
    if (text === null || text === undefined) return fallback;
    let str = String(text);
    if (!str.trim()) return fallback;

    // 1. Replace typographic quotes, dashes, ellipses with safe standard characters
    str = str.replace(/[\u2018\u2019]/g, "'"); // Smart single quotes
    str = str.replace(/[\u201C\u201D]/g, '"'); // Smart double quotes
    str = str.replace(/[\u2013\u2014]/g, '-'); // En-dash and Em-dash
    str = str.replace(/\u2026/g, '...');       // Horizontal ellipsis

    // 2. Remove checkmarks, crosses, bullets, and dingbats
    str = str.replace(/[\u2713\u2714]/g, '');  // Checkmarks
    str = str.replace(/[\u2715\u2716\u2717\u2718]/g, ''); // Crosses
    str = str.replace(/[\u2022\u25CF\u25AA\u25AB\u2023\u2043]/g, ' '); // Stray bullet characters

    // 3. Remove zero-width spaces, joiners, variation selectors
    str = str.replace(/[\u200B-\u200D\uFE0E\uFE0F]/g, '');

    // 4. Remove all emojis and pictographs
    try {
        str = str.replace(/\p{Extended_Pictographic}/gu, '');
    } catch {
        // Fallback if environment doesn't support unicode property escapes
    }
    str = str.replace(/[\u{1F000}-\u{1FAFF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

    // 5. Clean up multiple spaces or leading/trailing punctuation left after emoji removal
    str = str.replace(/[ \t]{2,}/g, ' ');
    str = str.trim();

    return str || fallback;
};

/**
 * Deeply sanitizes all string properties in a plan data object
 * to ensure bulletproof PDF rendering.
 */
export const cleanPlanData = (plan) => {
    if (!plan || typeof plan !== 'object') return plan;

    const sanitizeVal = (val, fallback = '') => {
        if (val === null || val === undefined) return fallback;
        if (typeof val === 'string') return sanitizePdfText(val, fallback);
        return val;
    };

    const sanitizeStringList = (list) => {
        if (!Array.isArray(list)) return [];
        return list
            .map(item => sanitizeVal(item))
            .filter(item => item && item.trim() !== '');
    };

    return {
        ...plan,
        plan_title: sanitizeVal(plan.plan_title, 'Diet Regimen Protocol'),
        goal: sanitizeVal(plan.goal, 'General Health & Wellness'),
        start_date: sanitizeVal(plan.start_date, '-'),
        end_date: sanitizeVal(plan.end_date, '-'),
        client_name: sanitizeVal(plan.client_name, '-'),
        client_age: sanitizeVal(plan.client_age, '-'),
        start_weight: sanitizeVal(plan.start_weight, '-'),
        target_weight: sanitizeVal(plan.target_weight, '-'),
        client_height: sanitizeVal(plan.client_height, '-'),
        food_habits: sanitizeVal(plan.food_habits, '-'),
        lifestyle: sanitizeVal(plan.lifestyle, '-'),
        client_phone: sanitizeVal(plan.client_phone, '-'),
        medical_conditions: sanitizeVal(plan.medical_conditions, ''),
        medication: sanitizeVal(plan.medication, ''),
        health_abuses: sanitizeVal(plan.health_abuses, ''),

        // Macros and targets
        calories: sanitizeVal(plan.calories, '-'),
        protein: sanitizeVal(plan.protein, '-'),
        carbs: sanitizeVal(plan.carbs, '-'),
        fats: sanitizeVal(plan.fats, '-'),
        fibre: sanitizeVal(plan.fibre, '-'),
        water: sanitizeVal(plan.water, '-'),
        sleep: sanitizeVal(plan.sleep, '-'),
        steps: sanitizeVal(plan.steps, '-'),

        // Measurements
        measurements: Array.isArray(plan.measurements)
            ? plan.measurements
                .filter(m => m && typeof m === 'object' && ['date', 'weight', 'belly_button', 'hip', 'thigh', 'neck', 'bicep'].some(k => m[k] && String(m[k]).trim() !== '' && String(m[k]).trim() !== '-'))
                .map(m => ({
                    date: sanitizeVal(m.date, '-'),
                    weight: sanitizeVal(m.weight, '-'),
                    belly_button: sanitizeVal(m.belly_button, '-'),
                    hip: sanitizeVal(m.hip, '-'),
                    thigh: sanitizeVal(m.thigh, '-'),
                    neck: sanitizeVal(m.neck, '-'),
                    bicep: sanitizeVal(m.bicep, '-'),
                }))
            : [],

        // Meals
        meals: Array.isArray(plan.meals)
            ? plan.meals.map((meal, idx) => ({
                ...meal,
                name: sanitizeVal(meal?.name, `Meal ${idx + 1}`),
                time: sanitizeVal(meal?.time, ''),
                option1: sanitizeVal(meal?.option1, ''),
                option2: sanitizeVal(meal?.option2, ''),
                options: Array.isArray(meal?.options)
                    ? meal.options.map(opt => sanitizeVal(opt)).filter(Boolean)
                    : undefined,
                optional: sanitizeVal(meal?.optional, ''),
                notes: sanitizeVal(meal?.notes, ''),
            }))
            : [],

        // Supplements
        supplements: Array.isArray(plan.supplements)
            ? plan.supplements
                .filter(supp => supp && typeof supp === 'object')
                .map(supp => ({
                    ...supp,
                    name: sanitizeVal(supp?.name, 'Supplement'),
                    dosage: sanitizeVal(supp?.dosage, ''),
                    timing: sanitizeVal(supp?.timing, ''),
                }))
            : [],

        // Workout Plans
        workouts: Array.isArray(plan.workouts)
            ? plan.workouts
                .filter(w => w && typeof w === 'object')
                .map(w => ({
                    ...w,
                    day: sanitizeVal(w?.day, ''),
                    focus: sanitizeVal(w?.focus, ''),
                    exercises: sanitizeVal(w?.exercises, ''),
                    cardio: sanitizeVal(w?.cardio, ''),
                    notes: sanitizeVal(w?.notes, ''),
                }))
                .filter(w => Boolean(w.day || w.focus || w.exercises || w.cardio || w.notes))
            : [],

        // Guidelines & Don'ts
        guidelines: sanitizeStringList(plan.guidelines),
        donts: sanitizeStringList(plan.donts),

        // Dietitian notes
        dietitian_note: sanitizeVal(
            plan.dietitian_note,
            "Consistency over perfection. Eat mindfully, chew slowly, and stay hydrated. Remember that small daily choices lead to monumental transformations. You've got this!"
        ),
        dietitian_name: sanitizeVal(plan.dietitian_name, 'Dt. Sabah Ghare'),

        // Attached recipes
        recipes: Array.isArray(plan.recipes)
            ? plan.recipes.map(recipe => ({
                ...recipe,
                name: sanitizeVal(recipe?.name, 'Custom Dish'),
                category: sanitizeVal(recipe?.category, 'General'),
                servings: sanitizeVal(recipe?.servings, '1 serving'),
                prep_time: sanitizeVal(recipe?.prep_time, '10 mins'),
                cook_time: sanitizeVal(recipe?.cook_time, '15 mins'),
                calories: sanitizeVal(recipe?.calories, ''),
                protein: sanitizeVal(recipe?.protein, ''),
                carbs: sanitizeVal(recipe?.carbs, ''),
                fats: sanitizeVal(recipe?.fats, ''),
                fiber: sanitizeVal(recipe?.fiber, ''),
                ingredients: sanitizeStringList(recipe?.ingredients),
                instructions: Array.isArray(recipe?.instructions)
                    ? sanitizeStringList(recipe.instructions)
                    : sanitizeVal(recipe?.instructions, ''),
                dietitian_tip: sanitizeVal(recipe?.dietitian_tip, ''),
            }))
            : [],
        selected_recipes: Array.isArray(plan.selected_recipes)
            ? plan.selected_recipes.map(recipe => ({
                ...recipe,
                dish_name: sanitizeVal(recipe?.dish_name, 'Custom Dish'),
                servings: sanitizeVal(recipe?.servings, '1 serving'),
                prep_time: sanitizeVal(recipe?.prep_time, '10 mins'),
                cook_time: sanitizeVal(recipe?.cook_time, '15 mins'),
                calories: sanitizeVal(recipe?.calories, ''),
                protein: sanitizeVal(recipe?.protein, ''),
                carbs: sanitizeVal(recipe?.carbs, ''),
                fats: sanitizeVal(recipe?.fats, ''),
                fiber: sanitizeVal(recipe?.fiber, ''),
                ingredients: sanitizeStringList(recipe?.ingredients),
                instructions: sanitizeVal(recipe?.instructions, ''),
                notes: sanitizeVal(recipe?.notes, ''),
            }))
            : [],

        // Special Clinical Instructions & Edge-Case Directives Page
        show_special_instructions: Boolean(
            plan.show_special_instructions ||
            (typeof plan.special_instructions === 'string' && plan.special_instructions.trim().length > 0)
        ),
        special_instructions_title: sanitizeVal(
            plan.special_instructions_title,
            'Special Clinical Instructions & Edge-Case Directives'
        ),
        special_instructions_badge: sanitizeVal(
            plan.special_instructions_badge,
            'EDGE CASE ADVISORY'
        ),
        special_instructions_theme: ['emerald', 'amber', 'indigo', 'rose', 'slate'].includes(plan.special_instructions_theme)
            ? plan.special_instructions_theme
            : 'emerald',
        special_instructions_style: ['callout', 'framed', 'banner'].includes(plan.special_instructions_style)
            ? plan.special_instructions_style
            : 'callout',
        special_instructions: sanitizeVal(plan.special_instructions, ''),
        special_instructions_warning: sanitizeVal(plan.special_instructions_warning, ''),
        special_instructions_verified: plan.special_instructions_verified !== false,
    };
};
