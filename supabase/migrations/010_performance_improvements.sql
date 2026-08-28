-- Performance improvement: Calculate total revenue with SQL aggregation instead of fetching all orders
CREATE OR REPLACE FUNCTION calculate_total_revenue()
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(total_amount), 0)
  FROM orders
  WHERE status = 'delivered';
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION calculate_total_revenue() TO authenticated;

-- Add composite index for orders filtering by status and date (common query pattern)
CREATE INDEX IF NOT EXISTS orders_status_warehouse_created_idx
ON public.orders(status, warehouse_id, created_at DESC);

-- Improve products query performance with composite index for search patterns
CREATE INDEX IF NOT EXISTS products_status_created_idx
ON public.products(status, created_at DESC);

-- Add index for category filtering on products
CREATE INDEX IF NOT EXISTS products_category_status_idx
ON public.products(category_id, status)
WHERE category_id IS NOT NULL;
