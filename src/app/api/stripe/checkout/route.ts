import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: "order_id is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.payment_status !== "pending") {
      return NextResponse.json(
        { error: `Order payment is already '${order.payment_status}'` },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Convert total to cents and round to avoid floating point issues
    const amountInCents = Math.round(Number(order.total) * 100);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "ideal"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Eataliano bestelling #${order.id.slice(0, 8)}`,
              description: `${order.order_items.length} item(s) - ${order.order_type === "delivery" ? "Bezorging" : "Afhalen"}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        order_id: order.id,
      },
      success_url: `${appUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/order/cancel`,
    });

    // Update order with stripe session id
    await supabase
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order_id);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Stripe")) {
      return NextResponse.json(
        { error: "Payment service error" },
        { status: 402 }
      );
    }
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
