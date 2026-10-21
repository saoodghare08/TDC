-- ==============================================================================
-- RECIPES TABLE
-- Stores curated clinical recipes and custom recipes managed by the dietitian
-- ==============================================================================

CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Breakfast',
    prep_time TEXT DEFAULT '10 mins',
    cook_time TEXT DEFAULT '15 mins',
    servings TEXT DEFAULT '1 serving',
    calories TEXT DEFAULT '250 kcal',
    protein TEXT DEFAULT '12g',
    carbs TEXT DEFAULT '28g',
    fats TEXT DEFAULT '6g',
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
    dietitian_tip TEXT,
    is_preset BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read to recipes" ON recipes;
DROP POLICY IF EXISTS "Allow public insert to recipes" ON recipes;
DROP POLICY IF EXISTS "Allow public update to recipes" ON recipes;
DROP POLICY IF EXISTS "Allow public delete to recipes" ON recipes;
DROP POLICY IF EXISTS "Allow authenticated read to recipes" ON recipes;
DROP POLICY IF EXISTS "Allow authenticated insert to recipes" ON recipes;
DROP POLICY IF EXISTS "Allow authenticated update to recipes" ON recipes;
DROP POLICY IF EXISTS "Allow authenticated delete to recipes" ON recipes;

-- Policies: allow public read and authenticated/anon admin modifications
CREATE POLICY "Allow public read to recipes"
ON recipes
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public insert to recipes"
ON recipes
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public update to recipes"
ON recipes
FOR UPDATE
TO public
USING (true);

CREATE POLICY "Allow public delete to recipes"
ON recipes
FOR DELETE
TO public
USING (true);

-- Seed Data: 8 Curated Clinical Diet Recipes
INSERT INTO recipes (name, category, prep_time, cook_time, servings, calories, protein, carbs, fats, ingredients, instructions, dietitian_tip, is_preset)
VALUES
(
    'Moong Dal & Spinach Chilla',
    'Breakfast',
    '15 mins',
    '10 mins',
    '2 chillas',
    '220 kcal',
    '14g',
    '26g',
    '5g',
    '["1/2 cup yellow moong dal (soaked 2 hrs)", "1/2 cup finely chopped baby spinach", "1 green chilli & 1/2 inch ginger", "1/4 tsp turmeric (haldi) & a pinch of asafoetida (hing)", "Pink Himalayan salt to taste", "1 tsp cold-pressed sesame or olive oil"]'::jsonb,
    '["Drain soaked moong dal and blend with ginger, green chilli, and minimal water into a smooth pouring batter.", "Transfer to a bowl and fold in chopped spinach, turmeric, hing, and Himalayan pink salt.", "Heat a seasoned cast-iron tawa on medium heat. Lightly brush with 1/2 tsp oil.", "Pour a ladleful of batter and spread gently in a circular motion into a thin chilla.", "Cook for 2-3 mins until golden and crisp; flip and cook the other side for 1-2 mins.", "Serve hot with homemade fresh mint-coriander chutney."]'::jsonb,
    'High in plant-based bioavailable protein and iron. Excellent for insulin sensitivity, PCOS management, and sustained morning energy without glucose spikes.',
    true
),
(
    'Overnight Chia & Berry Oats',
    'Breakfast',
    '5 mins',
    '0 mins (overnight)',
    '1 bowl',
    '260 kcal',
    '11g',
    '38g',
    '7g',
    '["1/2 cup rolled oats (gluten-free)", "1 tbsp black chia seeds", "3/4 cup unsweetened almond or toned milk", "1/4 tsp organic cinnamon powder", "1/4 cup fresh blueberries or pomegranate pearls", "4-5 crushed walnuts"]'::jsonb,
    '["In a clean glass mason jar, combine rolled oats, chia seeds, and cinnamon powder.", "Pour in almond milk and stir thoroughly to ensure chia seeds are evenly suspended.", "Seal the jar tightly and refrigerate overnight (minimum 5-6 hours) for oats and chia to swell.", "In the morning, uncover and stir gently. Add a splash of milk if too thick.", "Top with fresh blueberries/pomegranate pearls and crushed walnuts just before eating."]'::jsonb,
    'Loaded with beta-glucan prebiotic fiber and omega-3 fatty acids. Promotes optimal gut microbiome diversity and prolonged satiety.',
    true
),
(
    'High-Protein Paneer & Veggie Bhurji',
    'Lunch',
    '10 mins',
    '12 mins',
    '1 plate',
    '290 kcal',
    '21g',
    '12g',
    '16g',
    '["120g fresh low-fat paneer (crumbled)", "1 small onion & 1 medium ripe tomato (finely chopped)", "1/2 cup diced bell peppers (red and green)", "1 green chilli & 1 tsp grated ginger", "1/4 tsp turmeric, 1/2 tsp cumin seeds, 1/2 tsp garam masala", "1 tsp cow ghee or olive oil", "Handful of freshly chopped coriander leaves"]'::jsonb,
    '["Heat 1 tsp ghee in a skillet, add cumin seeds and allow them to crackle.", "Add chopped onions, ginger, and green chillies. Sauté until onions turn translucent.", "Add diced bell peppers and tomatoes. Cook for 3-4 mins until tomatoes soften.", "Sprinkle turmeric, garam masala, and pink salt. Mix well on medium flame.", "Add crumbled fresh paneer. Toss gently for 2-3 minutes to blend spices without overcooking.", "Garnish generously with fresh coriander leaves and a squeeze of fresh lemon juice."]'::jsonb,
    'Rich in complete casein/whey protein and calcium. Ideal for muscle recovery, hormonal balance, and maintaining lean body mass.',
    true
),
(
    'Warm Quinoa & Sprouted Moong Salad',
    'Lunch',
    '10 mins',
    '15 mins',
    '1 big bowl',
    '275 kcal',
    '13g',
    '42g',
    '5g',
    '["1/2 cup cooked white quinoa", "1/2 cup steamed sprouted green moong", "1/2 cup diced English cucumber", "1/4 cup grated carrots & cherry tomatoes", "Dressing: 1 tsp extra virgin olive oil, 1 tbsp lemon juice, roasted cumin powder & rock salt"]'::jsonb,
    '["Rinse quinoa well and cook in 1 cup of water until fluffy and water is absorbed. Allow to cool slightly.", "Steam sprouted moong for 4-5 minutes until tender yet crunchy.", "In a large salad bowl, combine warm quinoa, sprouted moong, diced cucumber, grated carrots, and cherry tomatoes.", "Whisk olive oil, fresh lemon juice, roasted jeera powder, and rock salt in a small bowl.", "Drizzle dressing over the salad and toss well. Rest for 5 mins before serving."]'::jsonb,
    'Complex carbohydrate profile with exceptional dietary fiber and enzymes. Enhances digestion and provides smooth cellular stamina.',
    true
),
(
    'Roasted Makhana & Seed Trail Mix',
    'Snack',
    '5 mins',
    '8 mins',
    '2 servings',
    '140 kcal',
    '5g',
    '18g',
    '4g',
    '["2 cups raw foxnuts (phool makhana)", "1 tbsp pumpkin seeds & 1 tbsp sunflower seeds", "1/2 tsp cold-pressed coconut oil or A2 ghee", "1/4 tsp turmeric & 1/4 tsp black salt", "Pinch of freshly ground black pepper"]'::jsonb,
    '["Heat 1/2 tsp coconut oil or ghee in a heavy-bottomed kadai on low-medium flame.", "Add foxnuts (makhana) and dry roast continuously for 6-8 minutes until crisp and crunchy when pressed.", "Add pumpkin seeds and sunflower seeds in the last 2 minutes so they lightly toast.", "Turn off heat, immediately sprinkle turmeric, black salt, and black pepper. Stir well so spices coat the makhana.", "Cool completely and store in an airtight glass jar."]'::jsonb,
    'Low glycemic, potassium-rich snack with high antioxidant content. Perfect 4:30 PM craving buster without refined carbs or inflammatory trans fats.',
    true
),
(
    'Detox Beetroot, Amla & Carrot Elixir',
    'Beverage',
    '10 mins',
    '0 mins',
    '1 glass (250ml)',
    '85 kcal',
    '2g',
    '18g',
    '0.5g',
    '["1 medium raw beetroot (peeled and chopped)", "1 large red carrot (chopped)", "1 fresh Indian gooseberry (amla) deseeded", "1/2 inch ginger root", "1 cup chilled water", "1/2 tsp roasted cumin & pink salt", "Squeeze of 1/2 lemon"]'::jsonb,
    '["Add chopped beetroot, carrot, amla, ginger, and half cup water into a high-speed blender.", "Blend until completely smooth and emulsified.", "Strain through a coarse strainer if desired, or consume with pulp for maximum fiber.", "Stir in remaining water, fresh lemon juice, roasted jeera, and pink salt.", "Consume fresh within 15 minutes of blending for peak enzymatic potency."]'::jsonb,
    'Potent botanical elixir rich in betalains and natural Vitamin C. Supports hepatic (liver) phase-1 detoxification and boosts hemoglobin synthesis.',
    true
),
(
    'Grilled Herb Tofu / Paneer Skewers',
    'Dinner',
    '15 mins',
    '10 mins',
    '1 platter',
    '250 kcal',
    '18g',
    '8g',
    '14g',
    '["150g firm organic tofu or low-fat paneer (cubed)", "1 cup bell peppers and red onions (cubed)", "Marinade: 2 tbsp thick hung curd, 1 tsp ginger-garlic paste, 1/2 tsp kasuri methi, 1/2 tsp ajwain, 1/4 tsp smoked paprika, 1 tsp lemon juice, salt"]'::jsonb,
    '["In a glass bowl, whisk hung curd with ginger-garlic paste, kasuri methi, ajwain, paprika, lemon juice, and salt.", "Add cubed tofu/paneer and diced vegetables into the marinade. Coat thoroughly and let rest for 15-20 minutes.", "Thread marinated pieces alternately onto wooden skewers.", "Preheat a grill pan or cast iron skillet with 1 tsp oil.", "Grill skewers on medium-high heat for 2-3 mins on each side until charred edges appear.", "Serve warm with pickled onions and mint dip."]'::jsonb,
    'High satiety dinner with zero refined starches. Keeps nighttime insulin low, promoting nocturnal human growth hormone and natural fat oxidation.',
    true
),
(
    'Spiced Golden Turmeric Soother',
    'Beverage',
    '3 mins',
    '5 mins',
    '1 cup (200ml)',
    '110 kcal',
    '4g',
    '8g',
    '5g',
    '["1 cup low-fat cow milk or almond milk", "1/2 tsp pure Lakadong turmeric powder (high curcumin)", "1 green cardamom pod (lightly bruised)", "1 pinch freshly cracked black pepper (essential for curcumin absorption)", "Pinch of ground nutmeg", "1/4 tsp raw forest honey (optional, added when lukewarm)"]'::jsonb,
    '["Pour milk into a small saucepan and place over low flame.", "Whisk in turmeric powder, crushed cardamom pod, cracked black pepper, and nutmeg.", "Bring to a gentle simmer for 3-4 minutes, allowing the aromatic spices to infuse.", "Strain into your favorite mug.", "Let cool until warm; stir in raw honey if preferred and sip mindfully 45 mins before bedtime."]'::jsonb,
    'Curcumin enhanced with piperine creates a powerful anti-inflammatory cascade. Lowers systemic cortisol and promotes restorative deep-stage REM sleep.',
    true
);
