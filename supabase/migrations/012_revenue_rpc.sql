-- Create RPC function to get total revenue from delivered orders
-- Returns sum as DECIMAL to avoid precision loss
CREATE OR REPLACE FUNCTION public.get_total_revenue()
RETURNS DECIMAL(12,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  revenue DECIMAL(12,2);
BEGIN
  SELECT COALESCE(SUM(total_amount), 0)
  INTO revenue
  FROM public.orders
  WHERE status = 'delivered';

  RETURN revenue;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_total_revenue() TO authenticated;
