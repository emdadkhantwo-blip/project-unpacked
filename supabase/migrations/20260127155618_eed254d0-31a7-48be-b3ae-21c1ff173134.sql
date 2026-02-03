-- Add current_balance column to track outstanding corporate account balance
ALTER TABLE corporate_accounts 
ADD COLUMN current_balance numeric NOT NULL DEFAULT 0;

-- Add corporate_account_id to payments table to track which payments were charged to corporate
ALTER TABLE payments 
ADD COLUMN corporate_account_id uuid REFERENCES corporate_accounts(id);