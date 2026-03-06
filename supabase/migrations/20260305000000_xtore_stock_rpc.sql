-- Function to safely decrement stock for multiple products in a single transaction
-- Uses FOR UPDATE to lock rows and prevent race conditions during concurrent checkouts

CREATE OR REPLACE FUNCTION decrement_stock(p_items jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_item jsonb;
    v_product_id uuid;
    v_quantity int;
    v_current_stock int;
    v_product_name text;
BEGIN
    -- Loop through each item in the JSON array
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity := (v_item->>'quantity')::int;

        -- Lock the row for update to prevent race conditions
        SELECT stock, name INTO v_current_stock, v_product_name
        FROM public.xtore_products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found', v_product_id;
        END IF;

        IF v_current_stock < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product: % (Available: %, Requested: %)', v_product_name, v_current_stock, v_quantity;
        END IF;

        -- Decrement stock
        UPDATE public.xtore_products
        SET stock = stock - v_quantity,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_product_id;
    END LOOP;
END;
$$;
