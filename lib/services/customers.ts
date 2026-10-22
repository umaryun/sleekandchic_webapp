import { and, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderItems, orders, userAddresses, users } from "@/lib/db/schema";

export interface CustomerRow {
  /** "u:<userId>" for an account; "g:<email>" or "p:<phone>" for someone who only bought as a guest. */
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

export type CustomerSort = "recent" | "spent" | "orders" | "name";

// postgres-js returns an array of rows; PGlite (tests) returns { rows }.
function rowsOf<T>(result: unknown): T[] {
  return (Array.isArray(result) ? result : (result as { rows: T[] }).rows) as T[];
}

/** The last 10 digits of a Nigerian number, so "0803…" and "+234 803…" match. */
export function phoneKey(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

/**
 * How a customer is identified across the admin: their account, else the
 * email they bought with, else their phone number (sales recorded from
 * WhatsApp often have no email). Must match customersQuery.
 */
export function customerKey(o: { userId?: string | null; email?: string | null; phone?: string | null }): string | null {
  if (o.userId) return `u:${o.userId}`;
  if (o.email) return `g:${o.email.toLowerCase()}`;
  const phone = phoneKey(o.phone);
  return phone ? `p:${phone}` : null;
}

/**
 * Everyone who shops here: customer accounts, plus guests grouped by email
 * (or by phone when they gave no email). A guest order placed with an
 * account's email counts towards that account. Staff accounts are left out,
 * along with any orders they placed.
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
        nullif(right(regexp_replace(coalesce(o.shipping_address->>'phone', ''), '[^0-9]', '', 'g'), 10), '') as phone_key,
        nullif(trim(concat_ws(' ', o.shipping_address->>'firstName', o.shipping_address->>'lastName')), '') as recipient,
        o.total_amount, o.payment_status, o.status, o.created_at
      from orders o
      left join users u on u.id = o.user_id
      left join users acct on o.user_id is null and lower(acct.email) = lower(o.guest_email)
    ),
    buyers as (
      select
        coalesce('u:' || user_id, 'g:' || email, 'p:' || case when length(phone_key) = 10 then phone_key end) as key,
        max(user_id) as user_id,
        max(email) as email,
        -- Contact details from the latest order that wasn't cancelled, if any.
        (array_agg(phone order by status = 'cancelled', created_at desc) filter (where phone is not null))[1] as phone,
        (array_agg(recipient order by status = 'cancelled', created_at desc) filter (where recipient is not null))[1] as recipient,
        count(*) filter (where status <> 'cancelled') as orders,
        coalesce(sum(total_amount) filter (where payment_status = 'paid'), 0) as spent,
        max(created_at) as last_order_at
      from placed
      group by 1
      having coalesce('u:' || max(user_id), max(email), max(phone_key)) is not null
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
      where (a.id is not null or b.user_id is null) and coalesce(b.key, a.id) is not null
    )
    select * from c ${filter}
  `;
}

const ORDER_BY: Record<CustomerSort, SQL> = {
  recent: sql`coalesce(last_order_at, registered_at) desc nulls last, id`,
  spent: sql`total_spent desc, total_orders desc, id`,
  orders: sql`total_orders desc, total_spent desc, id`,
  name: sql`lower(coalesce(name, email, id)), id`,
};

function toRow(r: Record<string, unknown>): CustomerRow {
  return {
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
  };
}

export async function listCustomers({
  page,
  limit,
  search,
  sort = "recent",
}: {
  page: number;
  limit: number;
  search?: string;
  sort?: CustomerSort;
}) {
  const base = customersQuery(search);
  const [countResult, pageResult] = await Promise.all([
    db.execute(sql`select count(*)::int as total from (${base}) as everyone`),
    db.execute(sql`
      select * from (${base}) as everyone
      order by ${ORDER_BY[sort]}
      limit ${limit} offset ${(page - 1) * limit}
    `),
  ]);

  const total = rowsOf<{ total: number }>(countResult)[0]?.total ?? 0;
  const customers = rowsOf<Record<string, unknown>>(pageResult).map(toRow);
  return { customers, total };
}

/**
 * One customer's profile: their details, every order (from their account,
 * their email or their phone), what they've bought most and their saved
 * addresses. Null when no one matches the id.
 */
export async function getCustomer(id: string) {
  const result = await db.execute(sql`select * from (${customersQuery()}) as everyone where id = ${id} limit 1`);
  const row = rowsOf<Record<string, unknown>>(result)[0];
  if (!row) return null;
  const customer = toRow(row);

  // Same matching as customersQuery: the account's orders and guest orders
  // with its email; for guests, their email or phone.
  const emailMatch = (email: string) =>
    sql`lower(coalesce(${orders.guestEmail}, '')) = ${email.toLowerCase()}`;
  const phoneMatch = (key: string) =>
    sql`right(regexp_replace(coalesce(${orders.shippingAddress}->>'phone', ''), '[^0-9]', '', 'g'), 10) = ${key}`;
  let match: SQL;
  if (customer.userId) {
    match = customer.email
      ? sql`(${orders.userId} = ${customer.userId} or (${orders.userId} is null and ${emailMatch(customer.email)}))`
      : sql`${orders.userId} = ${customer.userId}`;
  } else if (id.startsWith("g:")) {
    match = sql`(${orders.userId} is null and ${emailMatch(id.slice(2))})`;
  } else {
    match = sql`(${orders.userId} is null and ${orders.guestEmail} is null and ${phoneMatch(id.slice(2))})`;
  }

  const history = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      totalAmount: orders.totalAmount,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      source: orders.source,
      shippingAddress: orders.shippingAddress,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(match)
    .orderBy(desc(orders.createdAt))
    .limit(200);

  const ids = history.map((o) => o.id);
  const topItems =
    ids.length > 0
      ? await db
          .select({
            name: orderItems.name,
            productId: orderItems.productId,
            quantity: sql<number>`sum(${orderItems.quantity})::int`,
          })
          .from(orderItems)
          .innerJoin(orders, eq(orderItems.orderId, orders.id))
          .where(and(inArray(orderItems.orderId, ids), sql`${orders.status} <> 'cancelled'`))
          .groupBy(orderItems.name, orderItems.productId)
          .orderBy(desc(sql`sum(${orderItems.quantity})`))
          .limit(5)
      : [];

  const addresses = customer.userId
    ? await db.select().from(userAddresses).where(eq(userAddresses.userId, customer.userId)).orderBy(desc(userAddresses.isDefault))
    : [];
  // Guests have no saved addresses; show where their recent orders went.
  const deliveredTo = [
    ...new Map(
      history
        .map((o) => o.shippingAddress as { street?: string; city?: string; state?: string } | null)
        .filter((a): a is { street: string; city?: string; state?: string } => Boolean(a?.street))
        .map((a) => [`${a.street}|${a.city}|${a.state}`.toLowerCase(), { street: a.street, city: a.city ?? "", state: a.state ?? "" }])
    ).values(),
  ].slice(0, 3);

  const [account] = customer.userId
    ? await db.select({ banned: users.banned, emailVerified: users.emailVerified }).from(users).where(eq(users.id, customer.userId))
    : [];
  const paidOrders = history.filter((o) => o.paymentStatus === "paid");
  return {
    ...customer,
    emailVerified: account?.emailVerified ?? null,
    firstOrderAt: history.length ? history[history.length - 1].createdAt.toISOString() : null,
    averageOrder: paidOrders.length ? customer.totalSpent / paidOrders.length : 0,
    orders: history.map(({ shippingAddress, ...o }) => ({
      ...o,
      totalAmount: Number(o.totalAmount),
      deliveryState: (shippingAddress as { state?: string } | null)?.state ?? null,
    })),
    topItems,
    addresses: addresses.map((a) => ({
      id: a.id,
      label: a.label,
      name: [a.firstName, a.lastName].filter(Boolean).join(" ") || null,
      phone: a.phone,
      street: a.street,
      city: a.city,
      state: a.state,
      isDefault: a.isDefault,
    })),
    deliveredTo,
  };
}
