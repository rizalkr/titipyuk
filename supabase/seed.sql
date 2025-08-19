-- Seed file for development data
-- This file runs after migrations and populates the database with sample data

-- Additional storage locations for development
INSERT INTO public.storage_locations (name, address, phone_number, capacity, current_usage) VALUES
('TitipYuk Pandanaran', 'Jl. Pandanaran No. 88, Semarang Selatan', '+62 24 5555001', 150, 45),
('TitipYuk Gajah Mada', 'Jl. Gajah Mada No. 123, Semarang Tengah', '+62 24 5555002', 200, 78),
('TitipYuk Banyumanik', 'Jl. Banyumanik Raya No. 67, Banyumanik', '+62 24 5555003', 100, 23);

-- Additional box types for testing
INSERT INTO public.box_types (name, description, dimensions, max_weight_kg, daily_rate, monthly_rate) VALUES
('Extra Small', 'For jewelry, documents, and very small items', '20x25x15 cm', 5.00, 3000.00, 75000.00),
('Extra Large', 'For furniture and very large items', '70x80x60 cm', 100.00, 20000.00, 500000.00);

-- Sample user profiles (these will be created automatically when users sign up)
-- But we can add some additional test data if needed

-- Note: In production, you would not include user data in seed files
-- This is just for development testing purposes
