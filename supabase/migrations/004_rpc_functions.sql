-- Stock movement history table for audit trail
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  from_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  to_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('transfer', 'order_reservation', 'order_fulfillment', 'order_cancellation', 'adjustment')),
  reference_id UUID, -- order_id or other reference
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on stock_movements
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS policies for stock_movements
CREATE POLICY "Admin and Manager can view stock movements"
  ON stock_movements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can insert stock movements"
  ON stock_movements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Admin', 'Manager')
    )
  );

-- Create indexes for performance
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_from_warehouse ON stock_movements(from_warehouse_id);
CREATE INDEX idx_stock_movements_to_warehouse ON stock_movements(to_warehouse_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_id);

-- RPC: Transfer stock between warehouses atomically
CREATE OR REPLACE FUNCTION transfer_stock(
  p_product_id UUID,
  p_from_warehouse_id UUID,
  p_to_warehouse_id UUID,
  p_quantity INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_from_stock RECORD;
  v_to_stock RECORD;
  v_movement_id UUID;
  v_available INTEGER;
BEGIN
  -- Validate inputs
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  IF p_from_warehouse_id = p_to_warehouse_id THEN
    RAISE EXCEPTION 'Source and destination warehouses must be different';
  END IF;

  -- Lock and get source stock row
  SELECT * INTO v_from_stock
  FROM stock
  WHERE product_id = p_product_id
    AND warehouse_id = p_from_warehouse_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found in source warehouse';
  END IF;

  -- Check available quantity
  v_available := v_from_stock.quantity - v_from_stock.reserved_quantity;
  IF v_available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient available stock (available: %, requested: %)', v_available, p_quantity;
  END IF;

  -- Lock and get destination stock row (or create if doesn't exist)
  SELECT * INTO v_to_stock
  FROM stock
  WHERE product_id = p_product_id
    AND warehouse_id = p_to_warehouse_id
  FOR UPDATE;

  -- Deduct from source
  UPDATE stock
  SET quantity = quantity - p_quantity,
      updated_at = NOW()
  WHERE product_id = p_product_id
    AND warehouse_id = p_from_warehouse_id;

  -- Add to destination
  IF v_to_stock IS NULL THEN
    INSERT INTO stock (product_id, warehouse_id, quantity, reserved_quantity)
    VALUES (p_product_id, p_to_warehouse_id, p_quantity, 0);
  ELSE
    UPDATE stock
    SET quantity = quantity + p_quantity,
        updated_at = NOW()
    WHERE product_id = p_product_id
      AND warehouse_id = p_to_warehouse_id;
  END IF;

  -- Log the movement
  INSERT INTO stock_movements (
    product_id,
    from_warehouse_id,
    to_warehouse_id,
    quantity,
    movement_type,
    notes,
    created_by
  )
  VALUES (
    p_product_id,
    p_from_warehouse_id,
    p_to_warehouse_id,
    p_quantity,
    'transfer',
    p_notes,
    auth.uid()
  )
  RETURNING id INTO v_movement_id;

  RETURN jsonb_build_object(
    'success', true,
    'movement_id', v_movement_id,
    'transferred_quantity', p_quantity
  );
END;
$$;

-- RPC: Create order with stock reservation atomically
CREATE OR REPLACE FUNCTION create_order_with_reservation(
  p_warehouse_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_notes TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_stock RECORD;
  v_available INTEGER;
  v_total_amount NUMERIC := 0;
  v_product RECORD;
BEGIN
  -- Validate inputs
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- Create the order
  INSERT INTO orders (
    warehouse_id,
    customer_name,
    customer_email,
    notes,
    status,
    total_amount
  )
  VALUES (
    p_warehouse_id,
    p_customer_name,
    p_customer_email,
    p_notes,
    'pending',
    0 -- Will update after calculating total
  )
  RETURNING id INTO v_order_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Get product price
    SELECT * INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
    END IF;

    -- Lock stock row
    SELECT * INTO v_stock
    FROM stock
    WHERE product_id = (v_item->>'product_id')::UUID
      AND warehouse_id = p_warehouse_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not available in warehouse', v_item->>'product_id';
    END IF;

    -- Check available quantity
    v_available := v_stock.quantity - v_stock.reserved_quantity;
    IF v_available < (v_item->>'quantity')::INTEGER THEN
      RAISE EXCEPTION 'Insufficient stock for product % (available: %, requested: %)',
        v_product.name, v_available, (v_item->>'quantity')::INTEGER;
    END IF;

    -- Reserve the stock
    UPDATE stock
    SET reserved_quantity = reserved_quantity + (v_item->>'quantity')::INTEGER,
        updated_at = NOW()
    WHERE product_id = (v_item->>'product_id')::UUID
      AND warehouse_id = p_warehouse_id;

    -- Create order item
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      unit_price
    )
    VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      v_product.price
    );

    -- Add to total
    v_total_amount := v_total_amount + (v_product.price * (v_item->>'quantity')::INTEGER);

    -- Log reservation movement
    INSERT INTO stock_movements (
      product_id,
      to_warehouse_id,
      quantity,
      movement_type,
      reference_id,
      notes,
      created_by
    )
    VALUES (
      (v_item->>'product_id')::UUID,
      p_warehouse_id,
      (v_item->>'quantity')::INTEGER,
      'order_reservation',
      v_order_id,
      'Stock reserved for order',
      auth.uid()
    );
  END LOOP;

  -- Update order total
  UPDATE orders
  SET total_amount = v_total_amount
  WHERE id = v_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'total_amount', v_total_amount
  );
END;
$$;

-- RPC: Update order status with stock management
CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id UUID,
  p_new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_stock RECORD;
BEGIN
  -- Validate status
  IF p_new_status NOT IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', p_new_status;
  END IF;

  -- Lock and get order
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Prevent invalid transitions
  IF v_order.status = 'delivered' AND p_new_status != 'delivered' THEN
    RAISE EXCEPTION 'Cannot change status of delivered order';
  END IF;

  IF v_order.status = 'cancelled' AND p_new_status != 'cancelled' THEN
    RAISE EXCEPTION 'Cannot change status of cancelled order';
  END IF;

  -- Handle cancellation: release reserved stock
  IF p_new_status = 'cancelled' AND v_order.status != 'cancelled' THEN
    FOR v_item IN
      SELECT * FROM order_items WHERE order_id = p_order_id
    LOOP
      -- Lock stock row
      SELECT * INTO v_stock
      FROM stock
      WHERE product_id = v_item.product_id
        AND warehouse_id = v_order.warehouse_id
      FOR UPDATE;

      IF FOUND THEN
        -- Release reservation
        UPDATE stock
        SET reserved_quantity = GREATEST(0, reserved_quantity - v_item.quantity),
            updated_at = NOW()
        WHERE product_id = v_item.product_id
          AND warehouse_id = v_order.warehouse_id;

        -- Log cancellation movement
        INSERT INTO stock_movements (
          product_id,
          from_warehouse_id,
          quantity,
          movement_type,
          reference_id,
          notes,
          created_by
        )
        VALUES (
          v_item.product_id,
          v_order.warehouse_id,
          v_item.quantity,
          'order_cancellation',
          p_order_id,
          'Stock released from cancelled order',
          auth.uid()
        );
      END IF;
    END LOOP;
  END IF;

  -- Handle delivery: deduct from actual stock and reserved
  IF p_new_status = 'delivered' AND v_order.status != 'delivered' THEN
    FOR v_item IN
      SELECT * FROM order_items WHERE order_id = p_order_id
    LOOP
      -- Lock stock row
      SELECT * INTO v_stock
      FROM stock
      WHERE product_id = v_item.product_id
        AND warehouse_id = v_order.warehouse_id
      FOR UPDATE;

      IF FOUND THEN
        -- Deduct from both quantity and reserved
        UPDATE stock
        SET quantity = GREATEST(0, quantity - v_item.quantity),
            reserved_quantity = GREATEST(0, reserved_quantity - v_item.quantity),
            updated_at = NOW()
        WHERE product_id = v_item.product_id
          AND warehouse_id = v_order.warehouse_id;

        -- Log fulfillment movement
        INSERT INTO stock_movements (
          product_id,
          from_warehouse_id,
          quantity,
          movement_type,
          reference_id,
          notes,
          created_by
        )
        VALUES (
          v_item.product_id,
          v_order.warehouse_id,
          v_item.quantity,
          'order_fulfillment',
          p_order_id,
          'Stock deducted for delivered order',
          auth.uid()
        );
      END IF;
    END LOOP;
  END IF;

  -- Update order status
  UPDATE orders
  SET status = p_new_status,
      updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'old_status', v_order.status,
    'new_status', p_new_status
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION transfer_stock TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_with_reservation TO authenticated;
GRANT EXECUTE ON FUNCTION update_order_status TO authenticated;
