-- Add auth_email column for internal authentication email
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_email TEXT;

-- Update existing staff profiles to use the email as auth_email where applicable
UPDATE profiles 
SET auth_email = email 
WHERE auth_email IS NULL 
  AND email LIKE '%@%.hotel.local';