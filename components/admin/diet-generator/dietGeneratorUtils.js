// ============================================================================
// Shared Constants, Clinical Calculators & Layman Scaffolds
// Used across the 4-Step Guided Diet Plan Generator
// ============================================================================

export const DIET_PLAN_DRAFT_STORAGE_KEY = 'tdc_diet_plan_form_draft_v1';
export const AUTO_SAVE_DELAY_MS = 2000;

export const DEFAULT_CALC_CONFIG = {
    heightCm: '',
    heightInches: '',
    heightFeet: '',
    heightRemInches: '',
    ibwOffset: 105, // 100 (Male) | 105 (Female) | custom
    calMultiplier: 25, // 20-30 kcal per kg IBW
    proteinPct: 20,
    carbsPct: 60,
    fatsPct: 20,
    fieldsLocked: false,
    showCalculator: false,
};

export const EMPTY_NEW_RECIPE = {
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
};

export const EMPTY_FORM_STATE = {
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
    revision_date: '',
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
    special_instructions_verified: true,
    calc_config: DEFAULT_CALC_CONFIG,
};

// ─── Quick-Pick Chips for Layman-Friendly Entry ───
export const FOOD_HABIT_CHIPS = [
    'Vegetarian',
    'Non-Vegetarian',
    'Eggetarian',
    'Vegan',
    'Jain Vegetarian',
];

export const LIFESTYLE_CHIPS = [
    'Sedentary (Desk Job)',
    'Lightly Active',
    'Moderately Active',
    'Very Active',
    'Irregular / Night Shifts',
];

export const GOAL_CHIPS = [
    'Fat Loss',
    'PCOS & Hormonal Balance',
    'Diabetes & Sugar Control',
    'Thyroid & Metabolism',
    'Gut Health & Acidity',
    'Healthy Weight Gain',
    'General Wellness',
];

// ─── 1-Tap Meal Day Scaffolds ───
export const MEAL_SCAFFOLDS = {
    standard6: {
        label: 'Standard 6-Meal Day',
        desc: 'Early Morning · Breakfast · Mid-Morning · Lunch · Evening · Dinner',
        slots: [
            { name: 'Early Morning', time: '7:30 AM' },
            { name: 'Breakfast', time: '9:00 AM' },
            { name: 'Mid-Morning', time: '11:30 AM' },
            { name: 'Lunch', time: '1:30 PM' },
            { name: 'Evening Snack', time: '5:00 PM' },
            { name: 'Dinner', time: '8:00 PM' },
        ],
    },
    simple4: {
        label: 'Simple 4-Meal Day',
        desc: 'Breakfast · Lunch · Evening Snack · Dinner',
        slots: [
            { name: 'Breakfast', time: '8:30 AM' },
            { name: 'Lunch', time: '1:30 PM' },
            { name: 'Evening Snack', time: '5:00 PM' },
            { name: 'Dinner', time: '8:00 PM' },
        ],
    },
    complete7: {
        label: '7-Slot Full Day (+ Bedtime)',
        desc: 'Includes Early Morning Detox & Bedtime Soother',
        slots: [
            { name: 'Early Morning Detox', time: '7:00 AM' },
            { name: 'Breakfast', time: '8:30 AM' },
            { name: 'Mid-Morning Snack', time: '11:30 AM' },
            { name: 'Lunch', time: '1:30 PM' },
            { name: 'Evening Snack', time: '5:00 PM' },
            { name: 'Dinner', time: '8:00 PM' },
            { name: 'Bedtime Soother', time: '10:00 PM' },
        ],
    },
};

export function createScaffoldMeals(scaffoldKey) {
    const def = MEAL_SCAFFOLDS[scaffoldKey] || MEAL_SCAFFOLDS.standard6;
    return def.slots.map((s) => ({
        name: s.name,
        time: s.time,
        options: [''],
        option1: '',
        option2: '',
        optional: '',
        notes: '',
    }));
}

// ─── 1-Tap Standard Clinic Do's & Don'ts Starter ───
export const STANDARD_CLINIC_GUIDELINES = [
    'Drink 3 to 3.5 litres of water steadily throughout the day (avoid gulping right after meals).',
    'Maintain a 3 to 3.5-hour gap between meals and finish dinner at least 2.5 hours before sleep.',
    'Chew every bite slowly and eat mindfully without screens for better digestion.',
    'Take a gentle 10–15 minute walk after lunch and dinner to support steady blood sugar.',
    'Prioritize 7.5 to 8 hours of restful sleep at a consistent bedtime.',
    'Use measured cold-pressed oil or homemade ghee (limit to 2–3 tsp total per day).',
];

export const STANDARD_CLINIC_DONTS = [
    'Avoid refined sugar, packaged fruit juices, aerated sodas, and commercial sweets.',
    'Avoid deep-fried snacks, bakery items, biscuits, rusks, and refined flour (maida).',
    'Do not skip prescribed meals or stay on an empty stomach for long stretches.',
    'Avoid ultra-processed sauces, Excess namkeen/pickles, and reheated cooking oils.',
    'Limit late-night snacking and avoid tea/coffee immediately before or after main meals.',
];

// ─── Quick-Add Supplement Chips ───
export const SUPPLEMENT_QUICK_PICKS = [
    { name: 'Vitamin D3 (60k IU)', dosage: '1 Sachet / Cap', timing: 'Once Weekly (Post-Meal)' },
    { name: 'Vitamin B12', dosage: '1500 mcg', timing: 'After Breakfast' },
    { name: 'Omega-3 (Fish / Flax)', dosage: '1000 mg', timing: 'After Lunch' },
    { name: 'Magnesium Glycinate', dosage: '300 mg', timing: '30 mins Before Bed' },
    { name: 'Iron + Folic Acid', dosage: '1 Tablet', timing: 'Mid-Morning' },
    { name: 'Probiotic', dosage: '1 Capsule', timing: 'Before Lunch' },
];

// ─── Workout Presets ───
export const WORKOUT_PRESETS = {
    walking: {
        label: 'Daily Walking & Active Steps',
        desc: 'Beginner-friendly daily walking + post-meal strolls',
        days: [
            {
                day: 'Daily Routine',
                focus: 'Brisk Walking & Post-Meal Movement',
                exercises: '30–40 min continuous brisk walk (morning or evening)',
                cardio: '8,000 – 10,000 total daily steps',
                notes: 'Add a 10-min gentle walk after lunch & dinner',
            },
        ],
    },
    '3day': {
        label: '3-Day Strength + Walking',
        desc: 'Mon / Wed / Fri home or gym strength + daily steps',
        days: [
            {
                day: 'Day 1 (Mon)',
                focus: 'Upper Body & Core',
                exercises: 'Incline Push-ups (3x12), Dumbbell Rows (3x10), Plank (3x45s)',
                cardio: '20 min brisk walk (Zone 2) / 8,000 steps',
                notes: 'Rest 60s between sets, controlled tempo',
            },
            {
                day: 'Day 2 (Wed)',
                focus: 'Lower Body & Posture',
                exercises: 'Bodyweight Squats (3x15), Glute Bridges (3x12), Calf Raises (3x20)',
                cardio: '25 min brisk walk / 8,500 steps',
                notes: 'Keep core braced, full range of motion',
            },
            {
                day: 'Day 3 (Fri)',
                focus: 'Full Body & Functional Mobility',
                exercises: 'Walking Lunges (3x10/side), Wall Angels (3x12), Deadbug (3x10/side)',
                cardio: '30 min brisk walk / 10,000 steps',
                notes: 'Dynamic warm-up and deep hamstring stretches',
            },
        ],
    },
    cardio: {
        label: 'Zone-2 Cardio & Mobility',
        desc: 'Alternating cardio days and gentle stretching',
        days: [
            {
                day: 'Mon / Wed / Fri',
                focus: 'Zone-2 Steady State Cardio',
                exercises: 'Incline treadmill walk or outdoor brisk walking',
                cardio: '35-45 min continuous pace @ 110-125 bpm',
                notes: 'Nasal breathing pace, hydrate before & after',
            },
            {
                day: 'Tue / Thu / Sat',
                focus: 'Mobility, Core & Active Steps',
                exercises: 'Cat-Cow (3x10), Bird-Dog (3x10), Hip Flexor Stretch (60s)',
                cardio: 'Daily 10,000 cumulative steps',
                notes: 'Post-meal 10-min walks recommended',
            },
        ],
    },
};

// ─── Medical Condition Alert Presets (Auto-Themed for Layman Ease) ───
export const SPECIAL_CONDITION_PRESETS = {
    diabetes: {
        shortLabel: 'Diabetes / Blood Sugar',
        title: 'Type 2 Diabetes & Glycemic Control Directives',
        badge: 'GLYCEMIC CARE',
        theme: 'emerald',
        style: 'callout',
        instructions: [
            'Strict 3 to 4-hour meal timing intervals to prevent reactive glycemic volatility.',
            'Always combine complex carbohydrates with soluble dietary fibre and high-BV protein.',
            'Morning blood sugar testing: record fasting and 2-hour post-prandial readings 3x/week.',
            'Zero refined sugars, white flour (maida), commercial fruit syrups, or packaged juices.',
            'Engage in a 15-20 minute light post-meal brisk stroll to accelerate muscular glucose uptake.',
        ].join('\n'),
        warning:
            'If blood glucose drops < 70 mg/dL (hypoglycemia), consume 15g fast-acting carbs (3 glucose tablets or 1/2 cup fruit juice) immediately and recheck in 15 minutes.',
    },
    pcos: {
        shortLabel: 'PCOS / Hormonal',
        title: 'PCOS Hormonal Balance & Anti-Inflammatory Directives',
        badge: 'HORMONAL CARE',
        theme: 'rose',
        style: 'callout',
        instructions: [
            'Strict low-glycemic load plate composition to prevent insulin-driven androgen surges.',
            'Seed cycling protocol: 1 tbsp flax + pumpkin seeds (Follicular phase); sunflower + sesame (Luteal phase).',
            'Prioritize 7.5 to 8 hours of uninterrupted sleep in a cool, pitch-dark bedroom.',
            'Drink 1-2 cups of organic spearmint tea daily to aid free testosterone modulation.',
            'Morning cortisol hygiene: 10 minutes of direct morning sunlight exposure and gentle breathwork.',
        ].join('\n'),
        warning:
            'Avoid severe caloric deficits (> 500 kcal) or intense fasting; endocrine pathways require nutritional stability for regular ovulatory signaling.',
    },
    gerd: {
        shortLabel: 'Acidity / GERD / Gut',
        title: 'Acid Reflux (GERD) & Gut Mucosa Healing Directives',
        badge: 'GUT HEALTH',
        theme: 'amber',
        style: 'banner',
        instructions: [
            'Finish dinner at least 3 to 3.5 hours before lying down to sleep at night.',
            'Elevate the head of your bed by 6 inches if nighttime reflux or coughing episodes occur.',
            'Strictly avoid raw onion/garlic, excessive black pepper, citrus juices on an empty stomach, mint, and cocoa.',
            'Mindful chewing: chew each bite 25-30 times to saturate bolus with alkaline salivary enzymes.',
            'Sip warm cumin-fennel infusion 30 minutes post-meals; do not chug cold liquids during meals.',
        ].join('\n'),
        warning:
            'Avoid prolonged fasting or skipping prescribed meal intervals; accumulated gastric acid in an empty stomach accelerates esophageal mucosal erosion.',
    },
    cardiac: {
        shortLabel: 'Heart / High BP',
        title: 'Cardiac Health & Low-Sodium Hypertension Protocol',
        badge: 'CARDIAC CARE',
        theme: 'amber',
        style: 'framed',
        instructions: [
            'Strict daily sodium ceiling: limit total intake to < 1,500mg daily (~1/2 tsp total salt).',
            'Strictly avoid papads, commercial pickles, salted snacks, canned broths, and packaged sauces.',
            'Enhance plate palatability using fresh lime, kokum, roasted jeera powder, garlic, and fresh herbs.',
            'Emphasize natural potassium & magnesium: tender coconut water, steamed drumstick, and gourd sabzis.',
            'Record resting blood pressure twice weekly in the morning before caffeine or breakfast.',
        ].join('\n'),
        warning:
            'Contact supervising cardiologist immediately if resting systolic BP exceeds 160 mmHg, or if experiencing unexplained chest tightness, dizziness, or shortness of breath.',
    },
    fatty_liver: {
        shortLabel: 'Fatty Liver / Lipids',
        title: 'Non-Alcoholic Fatty Liver (NAFLD) & Lipid Optimization',
        badge: 'LIVER RECOVERY',
        theme: 'emerald',
        style: 'callout',
        instructions: [
            'Zero tolerance for refined high-fructose corn syrups, alcohol, and reheated cooking oils.',
            'Limit visible cooking fats to measured cold-pressed oils (maximum 2-3 tsp daily total).',
            'Incorporate cruciferous vegetables (broccoli, cabbage, radishes) to support hepatic phase-2 detox.',
            'Daily soluble prebiotic fiber target (> 35g/day) via soaked chia seeds, flaxseeds, and jowar/nachni.',
            'Minimum 30-40 minutes of daily Zone-2 continuous brisk walking to oxidize hepatic triglycerides.',
        ].join('\n'),
        warning:
            'Do not consume over-the-counter NSAIDs, paracetamol in excess, or unverified fat-loss herbal powders without clinical authorization.',
    },
};

// ─── Math & Date Helpers ───
export const roundOne = (num) => Math.round(num * 10) / 10;

export const parseNumericValue = (val) => {
    if (val === null || val === undefined || val === '') return NaN;
    const cleaned = String(val).replace(/,/g, '');
    const match = cleaned.match(/-?\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : NaN;
};

/**
 * Parses natural human height strings into cm:
 * - "165" or "165 cm" -> 165
 * - "5'5" or "5' 5\"" or "5 ft 5 in" or "5ft 5" -> 165.1
 * - "65 in" or "65 inches" -> 165.1
 * - "5.5 ft" -> 165.1 (if written with 'ft')
 */
export function parseNaturalHeightToCm(rawText) {
    if (!rawText) return NaN;
    const str = String(rawText).trim().toLowerCase();
    if (!str) return NaN;

    // Pattern 1: explicit cm (e.g. "165 cm (65 in)" or "162.5cm")
    const cmMatch = str.match(/(\d+(?:\.\d+)?)\s*cm/);
    if (cmMatch) {
        const cm = parseFloat(cmMatch[1]);
        return cm >= 80 && cm <= 250 ? roundOne(cm) : NaN;
    }

    // Pattern 2: feet and inches (e.g. 5'5", 5' 5, 5 ft 5 in, 5ft5)
    const ftInMatch = str.match(/^(\d)\s*(?:'|ft|feet)\s*(\d{1,2}(?:\.\d+)?)?\s*(?:"|in|inch|inches)?$/);
    if (ftInMatch) {
        const ft = parseFloat(ftInMatch[1]) || 0;
        const inc = parseFloat(ftInMatch[2]) || 0;
        const totalIn = ft * 12 + inc;
        const cm = roundOne(totalIn * 2.54);
        return cm >= 80 && cm <= 250 ? cm : NaN;
    }

    // Pattern 3: explicit inches (e.g. "65 in" or "65 inches")
    const inMatch = str.match(/^(\d+(?:\.\d+)?)\s*(?:in|inch|inches|")$/);
    if (inMatch) {
        const cm = roundOne(parseFloat(inMatch[1]) * 2.54);
        return cm >= 80 && cm <= 250 ? cm : NaN;
    }

    // Pattern 4: bare number — 90..240 treated as cm; 48..84 treated as inches
    const bare = str.match(/^(\d+(?:\.\d+)?)$/);
    if (bare) {
        const n = parseFloat(bare[1]);
        if (n >= 90 && n <= 240) return roundOne(n);
        if (n >= 48 && n <= 84) return roundOne(n * 2.54);
    }

    return NaN;
}

export const computeMacrosFromCalories = (caloriesNum, pPct, cPct, fPct) => {
    if (!Number.isFinite(caloriesNum) || caloriesNum <= 0) return null;
    const pNum = Number(pPct) || 0;
    const cNum = Number(cPct) || 0;
    const fNum = Number(fPct) || 0;
    return {
        protein: `${Math.max(0, Math.round((caloriesNum * (pNum / 100)) / 4))}g`,
        carbs: `${Math.max(0, Math.round((caloriesNum * (cNum / 100)) / 4))}g`,
        fats: `${Math.max(0, Math.round((caloriesNum * (fNum / 100)) / 9))}g`,
    };
};

export const computeChainFromHeightCm = (cmNum, cfg) => {
    if (!Number.isFinite(cmNum) || cmNum <= 0) return {};
    const totalIn = roundOne(cmNum / 2.54);
    const updates = {
        client_height: `${roundOne(cmNum)} cm (${totalIn} in)`,
    };
    const offset = Number(cfg.ibwOffset);
    if (Number.isFinite(offset)) {
        const ibw = roundOne(cmNum - offset);
        if (ibw >= 15) {
            updates.target_weight = `${ibw} kg`;
            const mult = Number(cfg.calMultiplier);
            if (Number.isFinite(mult) && mult > 0) {
                const cals = Math.round(ibw * mult);
                updates.calories = String(cals);
                const macros = computeMacrosFromCalories(
                    cals,
                    cfg.proteinPct,
                    cfg.carbsPct,
                    cfg.fatsPct
                );
                if (macros) {
                    updates.protein = macros.protein;
                    updates.carbs = macros.carbs;
                    updates.fats = macros.fats;
                }
            }
        }
    }
    return updates;
};

export const hasDietDraftContent = (data) => {
    if (!data || typeof data !== 'object') return false;
    const textFields = [
        'client_name',
        'client_age',
        'start_weight',
        'client_height',
        'food_habits',
        'lifestyle',
        'medical_conditions',
        'medication',
        'health_abuses',
        'client_phone',
        'plan_title',
        'goal',
        'target_weight',
        'end_date',
        'revision_date',
        'next_review_date',
        'calories',
        'protein',
        'carbs',
        'fats',
        'fibre',
        'water',
        'steps',
        'dietitian_note',
        'special_instructions',
        'special_instructions_warning',
    ];
    if (textFields.some((key) => String(data[key] || '').trim() !== '')) return true;
    if (
        String(data?.calc_config?.heightCm || '').trim() !== '' ||
        String(data?.calc_config?.heightInches || '').trim() !== ''
    ) {
        return true;
    }
    const arrayFields = [
        'measurements',
        'meals',
        'supplements',
        'workouts',
        'guidelines',
        'donts',
        'recipes',
    ];
    if (arrayFields.some((key) => Array.isArray(data[key]) && data[key].length > 0)) return true;
    if (data.show_special_instructions || data.pdf_theme === 'senior') return true;
    return false;
};

export const addDaysToIsoDate = (baseIso, days) => {
    const fallback = new Date().toISOString().split('T')[0];
    const [y, m, d] = String(baseIso || fallback)
        .split('-')
        .map(Number);
    if (!y || !m || !d) return '';
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
        dt.getDate()
    ).padStart(2, '0')}`;
};

export const addMonthsToIsoDate = (baseIso, months) => {
    const fallback = new Date().toISOString().split('T')[0];
    const [y, m, d] = String(baseIso || fallback)
        .split('-')
        .map(Number);
    if (!y || !m || !d) return '';
    const dt = new Date(y, m - 1, d);
    dt.setMonth(dt.getMonth() + months);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
        dt.getDate()
    ).padStart(2, '0')}`;
};

export const getMealOptions = (meal) => {
    if (Array.isArray(meal?.options) && meal.options.length > 0) {
        return meal.options;
    }
    const opts = [];
    if (meal?.option1 !== undefined && meal?.option1 !== null && meal?.option1 !== '') {
        opts.push(meal.option1);
    }
    if (meal?.option2 !== undefined && meal?.option2 !== null && meal?.option2 !== '') {
        opts.push(meal.option2);
    }
    return opts.length > 0 ? opts : [''];
};

export const escapeHtmlText = (str) =>
    String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
