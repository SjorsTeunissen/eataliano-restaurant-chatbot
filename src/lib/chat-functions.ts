import { createAdminClient } from "@/lib/supabase/admin";

interface LookupMenuArgs {
  search_term?: string;
  category?: string;
  dietary_filter?: string;
}

interface CreateReservationArgs {
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  location_id: string;
  customer_email?: string;
  notes?: string;
}

interface CreateOrderArgs {
  customer_name: string;
  customer_phone: string;
  order_type: "pickup" | "delivery";
  location_id: string;
  items: { menu_item_id: string; quantity: number; special_instructions?: string }[];
  delivery_address?: string;
  customer_email?: string;
}

interface GetLocationInfoArgs {
  location_name?: string;
}

export async function executeFunctionCall(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case "lookup_menu":
      return JSON.stringify(await lookupMenu(args as unknown as LookupMenuArgs));
    case "create_reservation":
      return JSON.stringify(await createReservation(args as unknown as CreateReservationArgs));
    case "create_order":
      return JSON.stringify(await createOrder(args as unknown as CreateOrderArgs));
    case "get_location_info":
      return JSON.stringify(await getLocationInfo(args as unknown as GetLocationInfoArgs));
    default:
      return JSON.stringify({ error: `Unknown function: ${name}` });
  }
}

async function lookupMenu(args: LookupMenuArgs) {
  const supabase = createAdminClient();

  let query = supabase
    .from("menu_items")
    .select("id, name, description, price, dietary_labels, allergens, category:menu_categories(name)")
    .eq("is_available", true)
    .order("name", { ascending: true });

  if (args.category) {
    // Join filter on category name
    query = query.eq("category.name", args.category);
  }

  const { data, error } = await query;

  if (error) {
    return { error: "Kon menu niet ophalen" };
  }

  let items = data || [];

  // Filter by search term (name or description contains term)
  if (args.search_term) {
    const term = args.search_term.toLowerCase();
    items = items.filter(
      (item: Record<string, unknown>) =>
        (item.name as string).toLowerCase().includes(term) ||
        ((item.description as string) || "").toLowerCase().includes(term)
    );
  }

  // Filter by dietary label
  if (args.dietary_filter) {
    const filter = args.dietary_filter.toLowerCase();
    items = items.filter((item: Record<string, unknown>) => {
      const labels = item.dietary_labels as string[] | null;
      return labels?.some((label: string) => label.toLowerCase().includes(filter));
    });
  }

  if (items.length === 0) {
    return { message: "Geen menu-items gevonden met deze zoekcriteria." };
  }

  return {
    items: items.map((item: Record<string, unknown>) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      dietary_labels: item.dietary_labels,
      allergens: item.allergens,
      category: (item.category as Record<string, unknown> | null)?.name || null,
    })),
  };
}

async function createReservation(args: CreateReservationArgs) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...args,
      created_via: "chatbot",
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { error: data.error || "Reservering kon niet worden aangemaakt" };
  }

  return {
    success: true,
    message: data.message,
    reservation_id: data.id,
    date: args.reservation_date,
    time: args.reservation_time,
    party_size: args.party_size,
  };
}

async function createOrder(args: CreateOrderArgs) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });

  const data = await res.json();

  if (!res.ok) {
    return { error: data.error || "Bestelling kon niet worden geplaatst" };
  }

  return {
    success: true,
    order_id: data.id,
    total: data.total,
    order_type: data.order_type,
    status: data.status,
  };
}

async function getLocationInfo(args: GetLocationInfoArgs) {
  const supabase = createAdminClient();

  let query = supabase
    .from("locations")
    .select("id, name, address, city, phone, email, opening_hours, is_active")
    .eq("is_active", true);

  if (args.location_name && args.location_name.toLowerCase() !== "all") {
    query = query.ilike("name", `%${args.location_name}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { error: "Kon locatie-informatie niet ophalen" };
  }

  if (!data || data.length === 0) {
    return { message: "Geen locaties gevonden." };
  }

  return {
    locations: data.map((loc: Record<string, unknown>) => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
      city: loc.city,
      phone: loc.phone,
      email: loc.email,
      opening_hours: loc.opening_hours,
    })),
  };
}
