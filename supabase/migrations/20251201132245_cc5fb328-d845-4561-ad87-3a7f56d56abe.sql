-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'engineer', 'viewer');

-- Create enum for asset status
CREATE TYPE asset_status AS ENUM ('active', 'in_maintenance', 'retired', 'lost', 'reserved');

-- Create enum for asset condition
CREATE TYPE asset_condition AS ENUM ('excellent', 'good', 'fair', 'poor');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'engineer',
  department TEXT,
  trade_category TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create locations table
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT,
  parent_id UUID REFERENCES public.locations(id),
  address TEXT,
  gps_coordinates TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create assets table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  asset_tag TEXT UNIQUE NOT NULL,
  asset_name TEXT NOT NULL,
  manufacturer TEXT,
  model_number TEXT,
  serial_number TEXT,
  category TEXT NOT NULL,
  trade_category TEXT,
  status asset_status DEFAULT 'active',
  condition asset_condition,
  purchase_date DATE,
  purchase_cost DECIMAL(10, 2),
  current_value DECIMAL(10, 2),
  warranty_expiration DATE,
  location_id UUID REFERENCES public.locations(id),
  department TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  qr_code_url TEXT,
  image_urls TEXT[],
  visual_description TEXT,
  category_match_confidence TEXT,
  custom_fields JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create checkouts table
CREATE TABLE public.checkouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES public.assets(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  checked_out_by UUID REFERENCES auth.users(id) NOT NULL,
  checkout_date TIMESTAMPTZ DEFAULT now(),
  due_date DATE,
  checkin_date TIMESTAMPTZ,
  checked_in_by UUID REFERENCES auth.users(id),
  checkout_notes TEXT,
  checkin_notes TEXT,
  signature_url TEXT,
  status TEXT DEFAULT 'checked_out',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create maintenance table
CREATE TABLE public.maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES public.assets(id) NOT NULL,
  maintenance_type TEXT NOT NULL,
  scheduled_date DATE,
  completed_date DATE,
  technician TEXT,
  vendor TEXT,
  cost DECIMAL(10, 2),
  notes TEXT,
  status TEXT DEFAULT 'scheduled',
  work_order_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Locations policies (all authenticated users can view, admins can modify)
CREATE POLICY "Authenticated users can view locations"
  ON public.locations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert locations"
  ON public.locations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update locations"
  ON public.locations FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Assets policies (users can see all assets in their org, manage their own)
CREATE POLICY "Authenticated users can view all assets"
  ON public.assets FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own assets"
  ON public.assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets"
  ON public.assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets"
  ON public.assets FOR DELETE
  USING (auth.uid() = user_id);

-- Checkouts policies
CREATE POLICY "Authenticated users can view all checkouts"
  ON public.checkouts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create checkouts"
  ON public.checkouts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update checkouts"
  ON public.checkouts FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Maintenance policies
CREATE POLICY "Authenticated users can view all maintenance records"
  ON public.maintenance FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create maintenance records"
  ON public.maintenance FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update maintenance records"
  ON public.maintenance FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'engineer'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at
  BEFORE UPDATE ON public.maintenance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_assets_user_id ON public.assets(user_id);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_category ON public.assets(category);
CREATE INDEX idx_assets_location_id ON public.assets(location_id);
CREATE INDEX idx_checkouts_asset_id ON public.checkouts(asset_id);
CREATE INDEX idx_checkouts_user_id ON public.checkouts(user_id);
CREATE INDEX idx_maintenance_asset_id ON public.maintenance(asset_id);ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS engineer_name TEXT;

ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS engineer_category TEXT;

ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS image_url TEXT;



