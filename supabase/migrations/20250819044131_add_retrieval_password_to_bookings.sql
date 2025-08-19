-- Add retrieval_password column to storage_bookings table
ALTER TABLE public.storage_bookings 
ADD COLUMN retrieval_password TEXT;

-- Add a check constraint to ensure retrieval_password is not empty when status is 'confirmed' or 'active'
-- (This will be enforced by the application logic)
