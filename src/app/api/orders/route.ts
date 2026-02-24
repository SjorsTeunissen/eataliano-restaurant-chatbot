import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const DELIVERY_FEE = 2.5;

interface OrderItemInput {
  menu_item_id: string;
  quantity: number;
  special_instructions?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      location_id,
      customer_name,
      customer_email,
      customer_phone,
      order_type,
      delivery_address,
      items,
    } = body;

    // Validate required fields
    if (!location_id || !customer_name || !customer_phone || !order_type || !items) {
      return NextResponse.json(
        { error: "Missing required fields: location_id, customer_name, customer_phone, order_type, items" },
        { status: 400 }
      );
    }

    if (!customer_name.trim() || !customer_phone.trim()) {
      return NextResponse.json(
        { error: "customer_name and customer_phone must not be empty" },
        { status: 400 }
      );
    }

    if (order_type !== "pickup" && order_type !== "delivery") {
      return NextResponse.json(
        { error: "order_type must be 'pickup' or 'delivery'" },
        { status: 400 }
      );
    }

    if (order_type === "delivery" && (!delivery_address || !delivery_address.trim())) {
      return NextResponse.json(
        { error: "delivery_address is required for delivery orders" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate item quantities
    for (const item of items as OrderItemInput[]) {
      if (!item.menu_item_id || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: "Each item must have a valid menu_item_id and quantity > 0" },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminClient();

    // Verify location exists and is active
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("id, is_active, delivery_zones")
      .eq("id", location_id)
      .single();

    if (locationError || !location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    if (!location.is_active) {
      return NextResponse.json(
        { error: "Location is not active" },
        { status: 400 }
      );
    }

    // Validate delivery zone for delivery orders
    if (order_type === "delivery") {
      const postalCodeMatch = delivery_address.match(/\b(\d{4})\s*[A-Za-z]{0,2}\b/);
      if (!postalCodeMatch) {
        return NextResponse.json(
          { error: "Could not determine postal code from delivery address" },
          { status: 422 }
        );
      }
      const postalPrefix = postalCodeMatch[1];
      const deliveryZones = (location.delivery_zones as string[]) || [];
      if (!deliveryZones.includes(postalPrefix)) {
        return NextResponse.json(
          { error: `Delivery address is outside the delivery zone for this location. Postal code ${postalPrefix} is not serviced.` },
          { status: 422 }
        );
      }
    }

    // Fetch and validate all menu items
    const menuItemIds = (items as OrderItemInput[]).map((item) => item.menu_item_id);
    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id, name, price, is_available")
      .in("id", menuItemIds);

    if (menuError) {
      return NextResponse.json(
        { error: "Failed to fetch menu items" },
        { status: 500 }
      );
    }

    if (!menuItems || menuItems.length !== menuItemIds.length) {
      const foundIds = new Set(menuItems?.map((mi) => mi.id) || []);
      const missingIds = menuItemIds.filter((id) => !foundIds.has(id));
      return NextResponse.json(
        { error: `Menu items not found: ${missingIds.join(", ")}` },
        { status: 404 }
      );
    }

    // Check all items are available
    const unavailable = menuItems.filter((mi) => !mi.is_available);
    if (unavailable.length > 0) {
      return NextResponse.json(
        { error: `Menu items not available: ${unavailable.map((mi) => mi.name).join(", ")}` },
        { status: 400 }
      );
    }

    // Build menu item lookup
    const menuItemMap = new Map(menuItems.map((mi) => [mi.id, mi]));

    // Calculate totals
    let subtotal = 0;
    const orderItems: {
      menu_item_id: string;
      item_name: string;
      item_price: number;
      quantity: number;
      special_instructions?: string;
    }[] = [];

    for (const item of items as OrderItemInput[]) {
      const menuItem = menuItemMap.get(item.menu_item_id)!;
      const itemTotal = Number(menuItem.price) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        menu_item_id: item.menu_item_id,
        item_name: menuItem.name,
        item_price: Number(menuItem.price),
        quantity: item.quantity,
        special_instructions: item.special_instructions || null,
      } as {
        menu_item_id: string;
        item_name: string;
        item_price: number;
        quantity: number;
        special_instructions?: string;
      });
    }

    const deliveryFee = order_type === "delivery" ? DELIVERY_FEE : 0;
    const total = subtotal + deliveryFee;

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        location_id,
        customer_name: customer_name.trim(),
        customer_email: customer_email?.trim() || null,
        customer_phone: customer_phone.trim(),
        order_type,
        delivery_address: order_type === "delivery" ? delivery_address.trim() : null,
        status: "pending",
        subtotal: Number(subtotal.toFixed(2)),
        delivery_fee: Number(deliveryFee.toFixed(2)),
        total: Number(total.toFixed(2)),
        payment_status: "pending",
      })
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // Insert order items
    const orderItemsWithOrderId = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { data: createdItems, error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsWithOrderId)
      .select();

    if (itemsError) {
      // Attempt to clean up the order if items fail
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Failed to create order items" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ...order, order_items: createdItems },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("location_id");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    let query = supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (locationId) {
      query = query.eq("location_id", locationId);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }

    const { data: orders, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    return NextResponse.json(orders);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
