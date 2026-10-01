import { sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";

export interface CustomerRow {
  /** "u:<userId>" for an account, "g:<email>" for someone who only checked out as a guest. */
  id: string;
  userId: string | null;
  type: "account" | "guest";
  name: string | null;
  email: string | null;
  phone: string | null;
  registeredAt: string | null;
  totalOrders: number;
  /** Paid orders only. */
  totalSpent: number;
  lastOrderAt: string | null;
}

// postgres-js returns an array of rows; PGlite (tests) returns { rows }.
function rowsOf<T>(result: unknown): T[] {
  return (Array.isArray(result) ? result : (result as { rows: T[] }).rows) as T[];
}

/**
 * Everyone who shops here: customer accounts, plus guests grouped by email.
 * A guest order placed with an account's email counts towards that account.
 * Staff accounts are left out, along with any orders they placed.
 */
function customersQuery(search?: string): SQL {
  const term = search?.trim();
  const digits = term?.replace(/\D/g, "") ?? "";
  const like = term ? `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
  const filter = term
    ? sql`where (c.name ilike ${like} or c.email ilike ${like}${
        digits.length >= 4 ? sql` or regexp_replace(coalesce(c.phone, ''), '[^0-9]', '', 'g') like ${`%${digits}%`}` : sql``
      })`
    : sql``;

  return sql`
    with placed as (
      select
        coalesce(o.user_id, acct.id) as user_id,
        lower(coalesce(u.email, o.guest_email)) as email,
        nullif(o.shipping_address->>'phone', '') as phone,
        nullif(trim(concat_ws(' ', o.shipping_address->>'firstName', o.shipping_address->>'lastName')), '') as recipient,
        o.total_amount, o.payment_status, o.status, o.created_at
      from orders o
      left join users u on u.id = o.user_id
      left join users acct on o.user_id is null and lower(acct.email) = lower(o.guest_email)
    ),
    buyers as (
      select
        coalesce('u:' || user_id, 'g:' || email) as key,
        max(user_id) as user_id,
        max(email) as email,
        -- Contact details from the latest order that wasn't cancelled, if any.
        (array_agg(phone order by status = 'cancelled', created_at desc) filter (where phone is not null))[1] as phone,
        (array_agg(recipient order by status = 'cancelled', created_at desc) filter (where recipient is not null))[1] as recipient,
        count(*) filter (where status <> 'cancelled') as orders,
        coalesce(sum(total_amount) filter (where payment_status = 'paid'), 0) as spent,
        max(created_at) as last_order_at
      from placed
      where user_id is not null or email is not null
      group by 1
    ),
    c as (
      select
        coalesce(b.key, 'u:' || a.id) as id,
        a.id as user_id,
        case when a.id is null then 'guest' else 'account' end as type,
        coalesce(a.name, b.recipient) as name,
        coalesce(a.email, b.email) as email,
        coalesce(a.phone, b.phone) as phone,
        a.created_at as registered_at,
        coalesce(b.orders, 0)::int as total_orders,
        coalesce(b.spent, 0)::numeric as total_spent,
        b.last_order_at
      from (select * from users where role = 'customer') a
      full outer join buyers b on b.user_id = a.id
      where a.id is not null or b.user_id is null
    )
    select * from c ${filter}
  `;
}

export async function listCustomers({ page, limit, search }: { page: number; limit: number; search?: string }) {
  const base = customersQuery(search);
  const [countResult, pageResult] = await Promise.all([
    db.execute(sql`select count(*)::int as total from (${base}) as everyone`),
    db.execute(sql`
      select * from (${base}) as everyone
      order by coalesce(last_order_at, registered_at) desc nulls last, id
      limit ${limit} offset ${(page - 1) * limit}
    `),
  ]);

  const total = rowsOf<{ total: number }>(countResult)[0]?.total ?? 0;
  const customers: CustomerRow[] = rowsOf<Record<string, unknown>>(pageResult).map((r) => ({
    id: String(r.id),
    userId: (r.user_id as string) ?? null,
    type: r.type as CustomerRow["type"],
    name: (r.name as string) ?? null,
    email: (r.email as string) ?? null,
    phone: (r.phone as string) ?? null,
    registeredAt: r.registered_at ? new Date(r.registered_at as string).toISOString() : null,
    totalOrders: Number(r.total_orders),
    totalSpent: Number(r.total_spent),
    lastOrderAt: r.last_order_at ? new Date(r.last_order_at as string).toISOString() : null,
  }));
  return { customers, total };
}
