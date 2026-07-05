-- Atomic guarded stock decrement for the WhatsApp bot.
-- Named apl_* to avoid colliding with the existing no-op decrement_stock.
-- Only decrements when enough stock exists; returns the updated row or nothing.
create or replace function apl_decrement_stock(p_product_id uuid, p_qty int)
returns setof products
language sql
as $$
  update products
     set stock_quantity = stock_quantity - p_qty
   where id = p_product_id
     and stock_quantity >= p_qty
  returning *;
$$;

-- Put stock back (release/cancel).
create or replace function apl_increment_stock(p_product_id uuid, p_qty int)
returns setof products
language sql
as $$
  update products
     set stock_quantity = stock_quantity + p_qty
   where id = p_product_id
  returning *;
$$;

-- Add updated_at to orders (the bot no longer requires it, but it's useful).
alter table orders add column if not exists updated_at timestamptz default now();

-- One-time cleanup: normalize mixed-case order statuses to canonical lowercase.
update orders set status = 'accepted'  where lower(status) = 'confirmed';
update orders set status = lower(status)
  where status is not null and status <> lower(status);
