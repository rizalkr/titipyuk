-- Added pgcrypto for gen_random_uuid (idempotent)
create extension if not exists "pgcrypto";

-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    address TEXT,
    city TEXT DEFAULT 'Semarang',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles (guard if not exists)
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can view their own profile') THEN
   CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can update their own profile') THEN
   CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
 END IF;
END $$;

-- Create storage locations table
CREATE TABLE IF NOT EXISTS public.storage_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT DEFAULT 'Semarang' NOT NULL,
    phone_number TEXT,
    operating_hours JSONB DEFAULT '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00", "saturday": "08:00-12:00", "sunday": "closed"}',
    capacity INTEGER DEFAULT 100,
    current_usage INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='storage_locations' AND policyname='Anyone can view active storage locations') THEN
   CREATE POLICY "Anyone can view active storage locations" ON public.storage_locations FOR SELECT USING (is_active = true);
 END IF;
END $$;

-- Create box types table
CREATE TABLE IF NOT EXISTS public.box_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    dimensions TEXT,
    max_weight_kg DECIMAL(5,2),
    daily_rate DECIMAL(10,2) NOT NULL,
    monthly_rate DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.box_types ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='box_types' AND policyname='Anyone can view active box types') THEN
   CREATE POLICY "Anyone can view active box types" ON public.box_types FOR SELECT USING (is_active = true);
 END IF;
END $$;

-- Create storage bookings table
CREATE TABLE IF NOT EXISTS public.storage_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    location_id UUID REFERENCES public.storage_locations(id) NOT NULL,
    box_type_id UUID REFERENCES public.box_types(id) NOT NULL,
    item_description TEXT NOT NULL,
    item_value DECIMAL(12,2),
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
    total_amount DECIMAL(12,2),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.storage_bookings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='storage_bookings' AND policyname='Users can view their own bookings') THEN
   CREATE POLICY "Users can view their own bookings" ON public.storage_bookings FOR SELECT USING (auth.uid() = user_id);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='storage_bookings' AND policyname='Users can create their own bookings') THEN
   CREATE POLICY "Users can create their own bookings" ON public.storage_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='storage_bookings' AND policyname='Users can update their own bookings') THEN
   CREATE POLICY "Users can update their own bookings" ON public.storage_bookings FOR UPDATE USING (auth.uid() = user_id);
 END IF;
END $$;

-- Create booking history table
CREATE TABLE IF NOT EXISTS public.booking_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES public.storage_bookings(id) ON DELETE CASCADE NOT NULL,
    status_from TEXT,
    status_to TEXT NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.booking_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='booking_history' AND policyname='Users can view history of their own bookings') THEN
   CREATE POLICY "Users can view history of their own bookings" ON public.booking_history FOR SELECT USING (EXISTS (SELECT 1 FROM public.storage_bookings WHERE id = booking_id AND user_id = auth.uid()));
 END IF;
END $$;

-- Functions (idempotent already with OR REPLACE)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email) ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;$$ LANGUAGE plpgsql;

-- Triggers guarded
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='on_auth_user_created') THEN
   CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_profiles_updated_at') THEN
   CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_storage_locations_updated_at') THEN
   CREATE TRIGGER update_storage_locations_updated_at BEFORE UPDATE ON public.storage_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_box_types_updated_at') THEN
   CREATE TRIGGER update_box_types_updated_at BEFORE UPDATE ON public.box_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_storage_bookings_updated_at') THEN
   CREATE TRIGGER update_storage_bookings_updated_at BEFORE UPDATE ON public.storage_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
 END IF;
END $$;

-- Seed data with conflict guards to avoid duplicates
INSERT INTO public.box_types (id, name, description, dimensions, max_weight_kg, daily_rate, monthly_rate)
VALUES
  (gen_random_uuid(), 'Small Box', 'Perfect for documents, small electronics, and personal items', '30x40x25 cm', 10.00, 5000.00, 120000.00),
  (gen_random_uuid(), 'Medium Box', 'Ideal for clothes, books, and medium-sized items', '40x50x35 cm', 25.00, 8000.00, 200000.00),
  (gen_random_uuid(), 'Large Box', 'Great for bigger items, seasonal decorations, and bulky goods', '50x60x45 cm', 50.00, 12000.00, 300000.00)
ON CONFLICT DO NOTHING;

INSERT INTO public.storage_locations (id, name, address, phone_number)
VALUES
  (gen_random_uuid(), 'TitipYuk Simpang Lima', 'Jl. Ahmad Yani No. 1, Simpang Lima, Semarang Tengah', '+62 24 1234567'),
  (gen_random_uuid(), 'TitipYuk Ungaran', 'Jl. Diponegoro No. 45, Ungaran, Semarang', '+62 24 7654321'),
  (gen_random_uuid(), 'TitipYuk Tembalang', 'Jl. Prof. Sudarto, Tembalang, Semarang Selatan', '+62 24 9876543')
ON CONFLICT DO NOTHING;
