-- ==============================================================================
-- DIET PLAN TEMPLATES TABLE
-- Stores dynamic presets and custom diet plan templates created by the admin
-- ==============================================================================

CREATE TABLE IF NOT EXISTS diet_plan_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    badge TEXT NOT NULL,
    plan_title TEXT,
    goal TEXT,
    calories TEXT,
    protein TEXT,
    carbs TEXT,
    fats TEXT,
    water TEXT,
    steps TEXT,
    dietitian_name TEXT DEFAULT 'Dt. Sabah Ghare',
    dietitian_note TEXT,
    meals JSONB NOT NULL DEFAULT '[]'::jsonb,
    supplements JSONB NOT NULL DEFAULT '[]'::jsonb,
    guidelines JSONB NOT NULL DEFAULT '[]'::jsonb,
    donts JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_preset BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_diet_plan_templates_created_at ON diet_plan_templates(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE diet_plan_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated read to diet_plan_templates" ON diet_plan_templates;
DROP POLICY IF EXISTS "Allow authenticated insert to diet_plan_templates" ON diet_plan_templates;
DROP POLICY IF EXISTS "Allow authenticated update to diet_plan_templates" ON diet_plan_templates;
DROP POLICY IF EXISTS "Allow authenticated delete to diet_plan_templates" ON diet_plan_templates;
DROP POLICY IF EXISTS "Allow public read to diet_plan_templates" ON diet_plan_templates;

-- Policies: allow authenticated admins full access, and public read access for convenience
CREATE POLICY "Allow public read to diet_plan_templates"
ON diet_plan_templates
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated insert to diet_plan_templates"
ON diet_plan_templates
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update to diet_plan_templates"
ON diet_plan_templates
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete to diet_plan_templates"
ON diet_plan_templates
FOR DELETE
TO authenticated
USING (true);

-- Seed initial clinical presets
INSERT INTO diet_plan_templates (label, badge, plan_title, goal, calories, protein, carbs, fats, water, steps, dietitian_name, dietitian_note, is_preset, meals, supplements, guidelines, donts)
VALUES
(
    'Fat Loss & Metabolic Reset',
    '1,500 kcal',
    'Phase 1: Fat Loss & Metabolic Reset',
    'Fat Loss & Inch Loss',
    '1500',
    '85',
    '145',
    '42',
    '3.5',
    '10,000',
    'Dt. Sabah Ghare',
    'Focus on chewing thoroughly and taking 20 minutes per meal. Hydrate with warm water between meals and wrap up dinner before 8:00 PM for optimal fat oxidation.',
    true,
    '[
        {"name": "Early Morning Detox", "time": "07:00 AM – 07:30 AM", "option1": "500ml Warm water with 1 tbsp soaked chia seeds + 1 pinch cinnamon powder", "option2": "Warm lemon water with 5 soaked almonds + 1 walnut half", "notes": "Drink slowly while sitting. Do not gulp."},
        {"name": "Breakfast", "time": "08:30 AM – 09:00 AM", "option1": "2 Moong Dal & Spinach Chillas with 2 tbsp fresh mint-coriander chutney", "option2": "1 Bowl Vegetable Masala Oats topped with 40g pan-seared paneer cubes", "notes": "Prepare using maximum 1/2 tsp cold-pressed oil or ghee."},
        {"name": "Mid-Morning Snack", "time": "11:30 AM – 12:00 PM", "option1": "1 Fresh seasonal fruit (Apple / Papaya 150g / Guava) + 1 cup green tea", "option2": "1 Glass Fresh Tender Coconut Water with pulp", "notes": "Avoid drinking green tea with meals."},
        {"name": "Lunch", "time": "01:30 PM – 02:00 PM", "option1": "1 Multigrain Roti (Jowar/Bajra) + 1 large bowl Mixed Dal + 1 bowl Seasonal Vegetable + Green Salad", "option2": "150g Grilled Herb Chicken Breast / 120g Tofu Stir-Fry + 1/2 cup Quinoa + Cucumber Salad", "notes": "Eat salad first, followed by protein/dal, then grains."},
        {"name": "Evening Snack", "time": "05:00 PM – 05:30 PM", "option1": "1 Cup Roasted Makhana (Foxnuts) with turmeric & black pepper + Black coffee/tea (No sugar)", "option2": "1 Small bowl Boiled Chana Chaat (Chickpeas) with diced onions, tomatoes & lime", "notes": "Strictly no biscuits or packaged rusks."},
        {"name": "Dinner", "time": "07:30 PM – 08:00 PM", "option1": "1 Large bowl Clear Vegetable & Moong Dal Soup + 100g Lightly Sautéed Paneer", "option2": "150g Steamed Fish with stir-fried zucchini, bell peppers & broccoli", "notes": "Keep dinner light. Finish at least 2.5 hours before bedtime."},
        {"name": "Bedtime Soother", "time": "09:30 PM – 10:00 PM", "option1": "1 Cup Chamomile Tea or Warm Fennel (Saunf) & Ajwain water", "option2": "1/2 Cup Warm skimmed milk with 1 pinch turmeric & nutmeg", "notes": "Aids digestive repair and sleep quality."}
    ]'::jsonb,
    '[
        {"name": "Vitamin D3 60,000 IU", "dosage": "1 Capsule", "timing": "Once weekly post-breakfast"},
        {"name": "Omega-3 Fish Oil / Flax Oil", "dosage": "1,000 mg (1 softgel)", "timing": "Daily with lunch"},
        {"name": "Multivitamin & Minerals", "dosage": "1 Tablet", "timing": "Post-breakfast"}
    ]'::jsonb,
    '[
        "Drink at least 3.5 litres of water spread evenly throughout the day.",
        "Maintain a consistent 10,000 steps daily average.",
        "Prioritize 7.5 to 8 hours of uninterrupted sleep every night.",
        "Keep oil intake capped to 2 teaspoons per full day."
    ]'::jsonb,
    '[
        "No refined white sugar, aerated drinks, or packaged fruit juices",
        "No deep-fried savouries or ultra-processed bakery snacks",
        "Avoid eating heavy carbs after 8:00 PM"
    ]'::jsonb
),
(
    'PCOS & Hormonal Harmony',
    '1,400 kcal',
    'Phase 1: PCOS Insulin Sensitivity & Hormone Protocol',
    'PCOS Management & Hormonal Balance',
    '1400',
    '80',
    '130',
    '45',
    '3.0',
    '8,500',
    'Dt. Sabah Ghare',
    'In PCOS, managing insulin resistance is priority #1. Never skip breakfast, pair every carbohydrate with protein or fiber, and stay consistent with anti-inflammatory seeds.',
    true,
    '[
        {"name": "Hormone Wake-Up Drink", "time": "07:00 AM – 07:30 AM", "option1": "Spearmint Tea (1 cup) + 1 tbsp soaked Flax & Pumpkin seeds", "option2": "Warm fenugreek (Methi) seed water soaked overnight", "notes": "Spearmint helps balance androgens."},
        {"name": "Breakfast", "time": "08:30 AM – 09:00 AM", "option1": "2 Whole Eggs Scramble (with spinach & mushrooms) + 1 slice Sourdough Toast", "option2": "Sprouted Moong & Paneer Tikki (2 pcs) with raw mint dip", "notes": "High protein breakfast prevents mid-day sugar spikes."},
        {"name": "Mid-Morning Snack", "time": "11:30 AM – 12:00 PM", "option1": "1 Handful soaked Walnuts & Brazil Nuts (2 pcs) + 1 Guava or Apple", "option2": "1 Cup A2 Buttermilk with roasted cumin and crushed ginger", "notes": "Rich in selenium and gut-friendly probiotics."},
        {"name": "Lunch", "time": "01:30 PM – 02:00 PM", "option1": "1 Millet Roti (Ragi / Jowar) + 1 bowl Methi Dal + 1 bowl Sautéed Bhindi + Cucumber Salad with Apple Cider Vinegar", "option2": "100g Grilled Salmon / Paneer + 1 bowl Brown Rice Bowl with sautéed greens", "notes": "Always take apple cider vinegar salad dressing 10 mins before lunch."},
        {"name": "Evening Snack", "time": "05:00 PM – 05:30 PM", "option1": "1 Cup Cinnamon & Cardamom Infused Herbal Tea + 2 tbsp Roasted Sunflower Seeds", "option2": "Hummus (3 tbsp) with fresh carrot & cucumber sticks", "notes": "Cinnamon drastically improves insulin sensitivity."},
        {"name": "Dinner", "time": "07:30 PM – 08:00 PM", "option1": "Warm Pumpkin & Lentil Soup + 80g Tofu / Grilled Chicken Strips with steamed beans", "option2": "Palak Paneer (light gravy) with 1 small Jowar roti", "notes": "Avoid raw salads at dinner for smooth digestion."},
        {"name": "Bedtime", "time": "09:30 PM – 10:00 PM", "option1": "Warm water with 1 pinch of Ashwagandha or Chamomile", "option2": "1/2 glass warm water with 1 tsp soaked Isabgol (Psyllium husk)", "notes": "Assists estrogen clearance and cortisol reduction."}
    ]'::jsonb,
    '[
        {"name": "Myo-Inositol & D-Chiro Inositol (40:1)", "dosage": "2,000 mg", "timing": "Morning 20 mins before breakfast"},
        {"name": "Magnesium Glycinate", "dosage": "250 mg", "timing": "30 mins before sleep"},
        {"name": "Vitamin D3", "dosage": "60,000 IU", "timing": "Once weekly"}
    ]'::jsonb,
    '[
        "Incorporate seed cycling: Days 1-14 (Pumpkin/Flax), Days 15-28 (Sunflower/Sesame).",
        "Avoid high-GI foods and never consume liquid calories or refined flour.",
        "Prioritize strength training 3-4 times a week alongside daily walking.",
        "Strict caffeine cutoff by 2:00 PM."
    ]'::jsonb,
    '[
        "No commercial cow milk dairy if acne or bloating is present",
        "No sugar substitutes containing maltodextrin or aspartame",
        "No crash fasting or skipping meals"
    ]'::jsonb
),
(
    'Lean Muscle & Hypertrophy',
    '1,850 kcal',
    'Phase 1: Clean Bulking & Lean Muscle Protocol',
    'Lean Muscle Gain & Strength',
    '1850',
    '115',
    '190',
    '50',
    '4.0',
    '9,000',
    'Dt. Sabah Ghare',
    'Ensure protein distribution is spaced evenly every 3 to 4 hours to maximize muscle protein synthesis. Pre-workout and post-workout nutrition is essential.',
    true,
    '[
        {"name": "Pre-Workout Fuel", "time": "06:30 AM – 07:00 AM", "option1": "1 Ripe Banana + 1 tbsp Natural Peanut Butter + Black Coffee", "option2": "2 Medjool Dates filled with almonds + 1 cup warm water", "notes": "Consume 30-45 minutes before starting workout."},
        {"name": "Post-Workout Breakfast", "time": "08:30 AM – 09:00 AM", "option1": "1 Scoop Whey Protein in water + 3 Whole Eggs Omelette with 2 slices Multigrain Toast", "option2": "High-Protein Smoothie (1 Scoop Whey + 50g Rolled Oats + 1 Banana + 200ml Almond Milk)", "notes": "Consume within 60 minutes after your training session."},
        {"name": "Mid-Morning Snack", "time": "11:30 AM – 12:00 PM", "option1": "150g Greek Yoghurt topped with berries & 1 tsp chia seeds", "option2": "1 Cup Boiled Kala Chana Salad + 30g Crumbled Paneer", "notes": "Supplies sustained slow-digesting casein and plant fiber."},
        {"name": "Lunch", "time": "01:30 PM – 02:00 PM", "option1": "150g Grilled Chicken Breast / 150g Sautéed Paneer + 1 Cup Basmati Rice + 1 Bowl Rajma + Salad", "option2": "2 Ragi Rotis + 150g Soya Chunks Curry + 1 Bowl Mixed Sprouts Salad", "notes": "Do not skimp on carbohydrate portions; glycogen replenishment is key."},
        {"name": "Evening Power Snack", "time": "05:00 PM – 05:30 PM", "option1": "2 Whole Wheat Bread Toast with 50g Cottage Cheese/Paneer & Tomato slices", "option2": "1 Bowl Sautéed Edamame / Roasted Makhana + 1 handful Roasted Almonds", "notes": "Hydrate with 500ml water during this snack window."},
        {"name": "Dinner", "time": "08:00 PM – 08:30 PM", "option1": "160g Baked Fish / 140g Tofu & Vegetable Stir Fry + 1 Sweet Potato (steamed)", "option2": "1 Multigrain Roti + 1 Large Bowl Paneer Bhurji (100g) + Yellow Dal Tadka", "notes": "Healthy fats like olive oil or avocado are encouraged here."},
        {"name": "Pre-Bed Casein Boost", "time": "10:00 PM – 10:30 PM", "option1": "1 Glass Warm Milk with Turmeric & 4-5 crushed Almonds", "option2": "100g Cottage Cheese (Paneer cubes with a dash of chaat masala)", "notes": "Prevents nocturnal muscle catabolism."}
    ]'::jsonb,
    '[
        {"name": "Creatine Monohydrate (Creapure)", "dosage": "3-5g", "timing": "Post-workout daily"},
        {"name": "Whey Protein Isolate", "dosage": "1 Scoop (25-28g protein)", "timing": "Immediately post-workout"},
        {"name": "Zinc & Magnesium (ZMA)", "dosage": "1 Capsule", "timing": "At night 45 mins before sleep"}
    ]'::jsonb,
    '[
        "Progressive overload in your training program is required to match nutrition.",
        "Drink at least 4.0 litres of water to assist creatine uptake and kidney health.",
        "Prioritize 8 hours of sleep for testosterone and growth hormone production.",
        "Weigh yourself once a week under identical conditions (fasted, morning)."
    ]'::jsonb,
    '[
        "Do not skip post-workout nutrition window",
        "Avoid alcohol as it suppresses muscle protein synthesis by up to 37%",
        "Do not substitute whole meals with protein powders exclusively"
    ]'::jsonb
);
