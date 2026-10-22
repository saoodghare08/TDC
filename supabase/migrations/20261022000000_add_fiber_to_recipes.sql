-- Add fiber column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS fiber TEXT DEFAULT '4g';
