-- Performance optimization: Add missing indexes for frequently queried columns
-- Orders created_at index for dashboard revenue calculation
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at DESC);

-- Orders status + created_at composite index for filtered queries
CREATE INDEX IF NOT EXISTS orders_status_created_at_idx ON public.orders(status, created_at DESC);

-- Products created_at index for recent products
CREATE INDEX IF NOT EXISTS products_created_at_idx ON public.products(created_at DESC);

-- Products name index for search queries (case-insensitive with text_pattern_ops)
CREATE INDEX IF NOT EXISTS products_name_idx ON public.products USING btree (name text_pattern_ops);

-- Stock composite index for warehouse + product lookups
CREATE INDEX IF NOT EXISTS stock_warehouse_product_idx ON public.stock(warehouse_id, product_id);

-- Order items composite for order detail queries
CREATE INDEX IF NOT EXISTS order_items_order_product_idx ON public.order_items(order_id, product_id);

-- Export audit created_at index for audit log queries
CREATE INDEX IF NOT EXISTS export_audit_created_at_desc_idx ON public.export_audit(created_at DESC);

-- Profiles email index for faster user lookups
CREATE INDEX IF NOT EXISTS profiles_email_text_idx ON public.profiles USING btree (email text_pattern_ops);

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price_monthly DECIMAL(10,2),
  max_warehouses INTEGER,
  max_products INTEGER,
  max_orders_per_month INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Subscriptions (linking users to plans)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS user_subscriptions_user_idx ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_plan_idx ON public.user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_status_idx ON public.user_subscriptions(status);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can read plans
CREATE POLICY "Anyone can read subscription plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

-- RLS Policies: Users can read their own subscription
CREATE POLICY "Users can read own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies: Admins can manage everything
CREATE POLICY "Admins can manage subscription plans"
  ON public.subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Admins can manage user subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Add updated_at trigger
CREATE TRIGGER set_updated_at_subscription_plans
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_user_subscriptions
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Seed default subscription plans
INSERT INTO public.subscription_plans (name, slug, price_monthly, max_warehouses, max_products, max_orders_per_month, features, is_active)
VALUES
  (
    'Starter',
    'starter',
    49.00,
    2,
    500,
    1000,
    '["2 anbar", "500-ə qədər məhsul", "1000 sifariş/ay", "Əsas hesabatlar", "Excel/CSV ixrac", "E-poçt dəstəyi"]'::jsonb,
    true
  ),
  (
    'Professional',
    'professional',
    149.00,
    10,
    5000,
    NULL,
    '["10 anbar", "5000-ə qədər məhsul", "Limitsiz sifarişlər", "Təkmil hesabatlar", "Bütün ixrac formatları", "AI analitika", "10-a qədər istifadəçi", "Prioritet dəstək"]'::jsonb,
    true
  ),
  (
    'Enterprise',
    'enterprise',
    NULL,
    NULL,
    NULL,
    NULL,
    '["Limitsiz anbarlar", "Limitsiz məhsullar", "Limitsiz sifarişlər", "Fərdi hesabatlar", "Təkmil AI analitika", "Limitsiz istifadəçilər", "24/7 prioritet dəstək", "Tam API girişi", "Fərdi inteqrasiyalar"]'::jsonb,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- Add plan field to profiles for basic plan tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_plan TEXT DEFAULT 'starter';
CREATE INDEX IF NOT EXISTS profiles_current_plan_idx ON public.profiles(current_plan);
