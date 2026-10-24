-- Add missing columns to diet_plan_templates table
ALTER TABLE diet_plan_templates ADD COLUMN IF NOT EXISTS fibre TEXT;
ALTER TABLE diet_plan_templates ADD COLUMN IF NOT EXISTS fiber TEXT;
ALTER TABLE diet_plan_templates ADD COLUMN IF NOT EXISTS workouts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE diet_plan_templates ADD COLUMN IF NOT EXISTS recipes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE diet_plan_templates ADD COLUMN IF NOT EXISTS measurements JSONB DEFAULT '[]'::jsonb;
ALTER TABLE diet_plan_templates ADD COLUMN IF NOT EXISTS show_special_instructions BOOLEAN DEFAULT false;
ALTER TABLE diet_plan_templates ADD COLUMN IF NOT EXISTS special_instructions_title TEXT;
ALTER TABLE diet_plan_templates ADD COLUMN IF NOT EXISTS special_instructions_badge TEXT;
ALTER TABLE diet_plan_templates ADD COLUMN IF NOT EXISTS special_instructions_theme TEXT;
ALTER TABLE diet_plan_templates ADD COLUMN IF NOT EXISTS special_instructions_style TEXT;
ALTER TABLE diet_plan_templates ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE diet_plan_templates ADD COLUMN IF NOT EXISTS special_instructions_warning TEXT;
ALTER TABLE diet_plan_templates ADD COLUMN IF NOT EXISTS special_instructions_verified BOOLEAN DEFAULT true;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
