-- ============================================================================
-- FINAL FIX: ELIMINATE ALL RLS RECURSION - PROFILES TABLE
-- ============================================================================
-- This migration completely removes ALL recursion from profiles RLS policies.
-- The key insight: the WITH CHECK clause on UPDATE was still calling
-- get_user_role() which queries profiles, causing recursion.
--
-- COPY THIS ENTIRE FILE INTO SUPABASE SQL EDITOR AND RUN IT.
-- ============================================================================

-- Step 1: Create or replace SECURITY DEFINER helper functions
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

-- Step 2: Drop ALL existing policies on profiles table
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Step 3: Recreate profiles policies WITHOUT any recursion
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
-- CRITICAL: Do NOT check role in WITH CHECK - that causes recursion!
-- Instead, use a trigger to prevent role changes (see below)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Users can insert their own profile during registration
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 4: Create trigger to prevent non-admin users from changing their own role
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_role TEXT;
  is_user_admin BOOLEAN;
BEGIN
  -- Get the old role
  old_role := OLD.role;

  -- Check if user is admin
  is_user_admin := is_admin(auth.uid());

  -- If user is not admin and trying to change role, prevent it
  IF NOT is_user_admin AND NEW.role != old_role THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_change_trigger ON public.profiles;

CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- Step 5: Fix all other tables that reference profiles
-- ============================================================================

-- CATEGORIES
DROP POLICY IF EXISTS "Admin and Manager can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admin and Manager can update categories" ON public.categories;

CREATE POLICY "Admin and Manager can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin and Manager can update categories"
  ON public.categories FOR UPDATE
  USING (is_admin_or_manager(auth.uid()));

-- WAREHOUSES
DROP POLICY IF EXISTS "Admin and Manager can insert warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Admin and Manager can update warehouses" ON public.warehouses;

CREATE POLICY "Admin and Manager can insert warehouses"
  ON public.warehouses FOR INSERT
  WITH CHECK (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin and Manager can update warehouses"
  ON public.warehouses FOR UPDATE
  USING (is_admin_or_manager(auth.uid()));

-- PRODUCTS
DROP POLICY IF EXISTS "Admin and Manager can insert products" ON public.products;
DROP POLICY IF EXISTS "Admin and Manager can update products" ON public.products;

CREATE POLICY "Admin and Manager can insert products"
  ON public.products FOR INSERT
  WITH CHECK (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin and Manager can update products"
  ON public.products FOR UPDATE
  USING (is_admin_or_manager(auth.uid()));

-- STOCK
DROP POLICY IF EXISTS "Admin and Manager can manage stock" ON public.stock;

CREATE POLICY "Admin and Manager can manage stock"
  ON public.stock FOR ALL
  USING (is_admin_or_manager(auth.uid()));

-- ORDERS
DROP POLICY IF EXISTS "Admin and Manager can manage orders" ON public.orders;

CREATE POLICY "Admin and Manager can manage orders"
  ON public.orders FOR ALL
  USING (is_admin_or_manager(auth.uid()));

-- ORDER_ITEMS
DROP POLICY IF EXISTS "Admin and Manager can manage order_items" ON public.order_items;

CREATE POLICY "Admin and Manager can manage order_items"
  ON public.order_items FOR ALL
  USING (is_admin_or_manager(auth.uid()));

-- EXPORT_AUDIT
DROP POLICY IF EXISTS "Admins can read all export audit" ON public.export_audit;
DROP POLICY IF EXISTS "Admin and Manager can insert export audit" ON public.export_audit;

CREATE POLICY "Admins can read all export audit"
  ON public.export_audit FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admin and Manager can insert export audit"
  ON public.export_audit FOR INSERT
  WITH CHECK (is_admin_or_manager(auth.uid()));

-- STOCK_MOVEMENTS
DROP POLICY IF EXISTS "Admin and Manager can view stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Admin and Manager can insert stock movements" ON public.stock_movements;

CREATE POLICY "Admin and Manager can view stock movements"
  ON public.stock_movements FOR SELECT
  USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin and Manager can insert stock movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (is_admin_or_manager(auth.uid()));

-- Step 6: Grant execute permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager TO authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_role_change TO authenticated;

-- ============================================================================
-- COMPLETE - NO MORE RECURSION
-- ============================================================================
-- Key changes from previous attempt:
-- 1. Removed get_user_role() call from "Users can update own profile" WITH CHECK
-- 2. Role change protection now handled by BEFORE UPDATE trigger instead of policy
-- 3. All other tables use is_admin() or is_admin_or_manager() consistently
--
-- Permission model preserved:
-- - Users: read/update own profile (but cannot change role via trigger)
-- - Admins: read/update all profiles
-- - Staff: read all data
-- - Admin/Manager: write all data
-- ============================================================================
