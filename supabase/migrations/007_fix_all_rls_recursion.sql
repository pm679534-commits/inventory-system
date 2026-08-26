-- ============================================================================
-- FIX INFINITE RECURSION IN ALL RLS POLICIES
-- ============================================================================
-- Problem: Policies that query profiles table to check roles cause infinite
-- recursion because they trigger RLS policies on profiles itself.
-- Solution: Use SECURITY DEFINER functions that bypass RLS when checking roles.
--
-- IMPORTANT: Copy and paste this entire file into Supabase SQL Editor and run it.
-- ============================================================================

-- Step 1: Create SECURITY DEFINER helper functions (bypass RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role = 'Admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role IN ('Admin', 'Manager');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role;
END;
$$;

-- Step 2: Fix PROFILES table policies
-- ============================================================================

-- Drop existing recursive policies on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Recreate policies without recursion
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = get_user_role(auth.uid())
  );

CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 3: Fix CATEGORIES table policies
-- ============================================================================

DROP POLICY IF EXISTS "Admin and Manager can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admin and Manager can update categories" ON public.categories;

CREATE POLICY "Admin and Manager can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin and Manager can update categories"
  ON public.categories FOR UPDATE
  USING (is_admin_or_manager(auth.uid()));

-- Step 4: Fix WAREHOUSES table policies
-- ============================================================================

DROP POLICY IF EXISTS "Admin and Manager can insert warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Admin and Manager can update warehouses" ON public.warehouses;

CREATE POLICY "Admin and Manager can insert warehouses"
  ON public.warehouses FOR INSERT
  WITH CHECK (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin and Manager can update warehouses"
  ON public.warehouses FOR UPDATE
  USING (is_admin_or_manager(auth.uid()));

-- Step 5: Fix PRODUCTS table policies
-- ============================================================================

DROP POLICY IF EXISTS "Admin and Manager can insert products" ON public.products;
DROP POLICY IF EXISTS "Admin and Manager can update products" ON public.products;

CREATE POLICY "Admin and Manager can insert products"
  ON public.products FOR INSERT
  WITH CHECK (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin and Manager can update products"
  ON public.products FOR UPDATE
  USING (is_admin_or_manager(auth.uid()));

-- Step 6: Fix STOCK table policies
-- ============================================================================

DROP POLICY IF EXISTS "Admin and Manager can manage stock" ON public.stock;

CREATE POLICY "Admin and Manager can manage stock"
  ON public.stock FOR ALL
  USING (is_admin_or_manager(auth.uid()));

-- Step 7: Fix ORDERS table policies
-- ============================================================================

DROP POLICY IF EXISTS "Admin and Manager can manage orders" ON public.orders;

CREATE POLICY "Admin and Manager can manage orders"
  ON public.orders FOR ALL
  USING (is_admin_or_manager(auth.uid()));

-- Step 8: Fix ORDER_ITEMS table policies
-- ============================================================================

DROP POLICY IF EXISTS "Admin and Manager can manage order_items" ON public.order_items;

CREATE POLICY "Admin and Manager can manage order_items"
  ON public.order_items FOR ALL
  USING (is_admin_or_manager(auth.uid()));

-- Step 9: Fix EXPORT_AUDIT table policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can read all export audit" ON public.export_audit;
DROP POLICY IF EXISTS "Admin and Manager can insert export audit" ON public.export_audit;

CREATE POLICY "Admins can read all export audit"
  ON public.export_audit FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admin and Manager can insert export audit"
  ON public.export_audit FOR INSERT
  WITH CHECK (is_admin_or_manager(auth.uid()));

-- Step 10: Fix STOCK_MOVEMENTS table policies (if exists)
-- ============================================================================

DROP POLICY IF EXISTS "Admin and Manager can view stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Admin and Manager can insert stock movements" ON public.stock_movements;

CREATE POLICY "Admin and Manager can view stock movements"
  ON public.stock_movements FOR SELECT
  USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin and Manager can insert stock movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (is_admin_or_manager(auth.uid()));

-- Step 11: Grant execute permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;

-- ============================================================================
-- VERIFICATION SUMMARY
-- ============================================================================
-- Permission Model Preserved:
-- - All authenticated users can READ: categories, warehouses, products, stock, orders, order_items
-- - Admin/Manager can INSERT/UPDATE/DELETE: categories, warehouses, products, stock, orders, order_items
-- - Users can read/update their own profile only (cannot change role)
-- - Admins can read/update all profiles
-- - Users can read their own export audit
-- - Admins can read all export audits
-- - Admin/Manager can create export audit entries
--
-- Recursion Fixed:
-- - All role checks now use SECURITY DEFINER functions
-- - No policy queries profiles table directly anymore
-- - No infinite recursion possible
-- ============================================================================
