-- Fix missing DELETE policy for products table
-- This migration adds the missing DELETE policy that was preventing product deletion

-- Add DELETE policy for products (Admin and Manager only)
CREATE POLICY "Admin and Manager can delete products"
  ON public.products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );

-- Add DELETE policy for categories (Admin and Manager only)
CREATE POLICY "Admin and Manager can delete categories"
  ON public.categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );

-- Add DELETE policy for warehouses (Admin and Manager only)
CREATE POLICY "Admin and Manager can delete warehouses"
  ON public.warehouses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );
