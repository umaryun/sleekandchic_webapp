import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  carts,
  cartItems,
  products,
  orders,
  orderItems,
  discounts,
  productVariants,
} from "@/lib/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  parseBody,
  getSession,
  generateOrderNumber,
} from "@/lib/api-utils";

const checkoutSchema = z.object({
  guestToken: z.string().optional(),
  guestEmail: z.string().email().optional(),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().default("Nigeria"),
    postalCode: z.string().optional(),
    phone: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  }),
  shippingMethod: z.enum(["standard", "express"]).default("standard"),
  paymentMethod: z.enum(["paystack", "card", "cod"]).default("paystack"),
  discountCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { data, error } = await parseBody(req, checkoutSchema);
    if (error) return error;

    const session = await getSession(req);
    const userId = session?.user?.id || null;
    const {
      guestToken,
      guestEmail,
      shippingAddress,
      shippingMethod,
      paymentMethod,
      discountCode,
    } = data!;

    // Must be authenticated or provide guest email
    if (!userId && !guestEmail) {
      return apiError("Guest email is required for guest checkout", 400);
    }

    // Find cart
    let cart;
    if (userId) {
      const [found] = await db
        .select()
        .from(carts)
        .where(eq(carts.userId, userId))
        .limit(1);
      cart = found;
    } else if (guestToken) {
      const [found] = await db
        .select()
        .from(carts)
        .where(eq(carts.guestSessionToken, guestToken))
        .limit(1);
      cart = found;
    }

    if (!cart) {
      return apiError("Cart not found", 404);
    }

    // Get cart items with product info
    const items = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        variantId: cartItems.variantId,
        quantity: cartItems.quantity,
        unitPrice: cartItems.unitPrice,
        productName: products.name,
        productInStock: products.inStock,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

    if (items.length === 0) {
      return apiError("Cart is empty", 400);
    }

    // Check stock
    const outOfStock = items.filter((i) => !i.productInStock);
    if (outOfStock.length > 0) {
      return apiError(
        `Out of stock: ${outOfStock.map((i) => i.productName).join(", ")}`,
        400
      );
    }

    // Calculate subtotal
    let subtotal = 0;
    for (const item of items) {
      subtotal += Number(item.unitPrice) * item.quantity;
    }

    // Apply discount
    let discountAmount = 0;
    let appliedDiscount = null;

    if (discountCode) {
      const now = new Date();
      const [discount] = await db
        .select()
        .from(discounts)
        .where(
          and(
            eq(discounts.code, discountCode.toUpperCase()),
            eq(discounts.isActive, true)
          )
        )
        .limit(1);

      if (!discount) {
        return apiError("Invalid discount code", 400);
      }

      // Check expiry
      if (discount.expiresAt && discount.expiresAt < now) {
        return apiError("Discount code has expired", 400);
      }

      if (discount.startsAt && discount.startsAt > now) {
        return apiError("Discount code is not yet active", 400);
      }

      // Check usage limit
      if (discount.maxUses && discount.usedCount >= discount.maxUses) {
        return apiError("Discount code usage limit reached", 400);
      }

      // Check minimum order
      if (discount.minOrderAmount && subtotal < Number(discount.minOrderAmount)) {
        return apiError(
          `Minimum order amount is ₦${Number(discount.minOrderAmount).toLocaleString()}`,
          400
        );
      }

      if (discount.discountType === "percentage") {
        discountAmount = (subtotal * Number(discount.value)) / 100;
      } else {
        discountAmount = Number(discount.value);
      }

      // Cap discount to subtotal
      discountAmount = Math.min(discountAmount, subtotal);
      appliedDiscount = discount;
    }

    // Shipping fee (Nigeria rates in NGN)
    const shippingFee =
      shippingMethod === "express"
        ? 5000
        : subtotal >= 50000
        ? 0
        : 2500;

    const totalAmount = subtotal - discountAmount + shippingFee;
    const orderNumber = generateOrderNumber();

    // Get variant details for order items
    const variantIds = items.filter((i) => i.variantId).map((i) => i.variantId!);
    const variantDetails =
      variantIds.length > 0
        ? await db
            .select()
            .from(productVariants)
            .where(sql`${productVariants.id} IN ${variantIds}`)
        : [];
    const variantMap = new Map(variantDetails.map((v) => [v.id, v]));

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId,
        guestEmail: guestEmail || null,
        totalAmount: String(totalAmount),
        discountAmount: String(discountAmount),
        shippingFee: String(shippingFee),
        shippingAddress,
        discountCode: discountCode?.toUpperCase() || null,
        status: "pending",
        paymentStatus: paymentMethod === "cod" ? "unpaid" : "unpaid",
      })
      .returning();

    // Create order items
    const orderItemValues = items.map((item) => {
      const variant = item.variantId ? variantMap.get(item.variantId) : null;
      return {
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        name: item.productName || "Unknown Product",
        price: item.unitPrice,
        quantity: item.quantity,
        color: variant?.color || null,
        size: variant?.size || null,
      };
    });

    await db.insert(orderItems).values(orderItemValues);

    // Increment discount usage
    if (appliedDiscount) {
      await db
        .update(discounts)
        .set({ usedCount: appliedDiscount.usedCount + 1 })
        .where(eq(discounts.id, appliedDiscount.id));
    }

    // Clear cart in database
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

    // If Cash on Delivery or no Paystack key configured, complete order directly
    if (paymentMethod === "cod" || !process.env.PAYSTACK_SECRET_KEY) {
      return apiSuccess({
        orderNumber,
        orderId: order.id,
        subtotal,
        discountAmount,
        shippingFee,
        totalAmount,
        isCod: true,
      });
    }

    // Initialize Paystack payment
    try {
      const paystackResponse = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userId ? session!.user.email : guestEmail,
            amount: Math.round(totalAmount * 100), // Paystack uses kobo
            currency: "NGN",
            reference: orderNumber,
            callback_url: `${process.env.BETTER_AUTH_URL || ""}/orders/tracking?ref=${orderNumber}`,
            metadata: {
              orderId: order.id,
              orderNumber,
            },
          }),
        }
      );

      const paystackData = await paystackResponse.json();

      if (paystackData.status) {
        await db
          .update(orders)
          .set({ paymentReference: paystackData.data.reference })
          .where(eq(orders.id, order.id));

        return apiSuccess({
          orderNumber,
          orderId: order.id,
          subtotal,
          discountAmount,
          shippingFee,
          totalAmount,
          payment: {
            authorization_url: paystackData.data.authorization_url,
            access_code: paystackData.data.access_code,
            reference: paystackData.data.reference,
          },
        });
      }
    } catch (paystackErr) {
      console.warn("Paystack gateway unavailable, falling back to COD response:", paystackErr);
    }

    return apiSuccess({
      orderNumber,
      orderId: order.id,
      subtotal,
      discountAmount,
      shippingFee,
      totalAmount,
      isCod: true,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/store/checkout error:", err);
    return apiError("Internal server error", 500);
  }
}
