-- Add nid_number column to hr_staff_profiles table
ALTER TABLE hr_staff_profiles 
ADD COLUMN IF NOT EXISTS nid_number TEXT;