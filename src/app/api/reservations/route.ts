import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DUTCH_DAYS = [
  "zondag",
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
] as const;

const VALID_CREATED_VIA = ["chatbot", "admin"] as const;

function getDutchDayName(date: Date): string {
  return DUTCH_DAYS[date.getDay()];
}

function getTodayInAmsterdam(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Amsterdam",
  });
}

function isTimeInRange(time: string, open: string, close: string): boolean {
  return time >= open && time <= close;
}

interface OpeningHoursEntry {
  open: string;
  close: string;
}

interface ReservationBody {
  location_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  party_size?: number;
  reservation_date?: string;
  reservation_time?: string;
  notes?: string;
  created_via?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ReservationBody = await request.json();

    const {
      location_id,
      customer_name,
      customer_email,
      customer_phone,
      party_size,
      reservation_date,
      reservation_time,
      notes,
      created_via,
    } = body;

    // Validate required fields
    const missingFields: string[] = [];
    if (!location_id) missingFields.push("location_id");
    if (!customer_name?.trim()) missingFields.push("customer_name");
    if (!customer_phone?.trim()) missingFields.push("customer_phone");
    if (party_size === undefined || party_size === null)
      missingFields.push("party_size");
    if (!reservation_date) missingFields.push("reservation_date");
    if (!reservation_time) missingFields.push("reservation_time");

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: missingFields,
        },
        { status: 422 }
      );
    }

    // Validate party_size
    if (
      !Number.isInteger(party_size) ||
      party_size! < 1 ||
      party_size! > 20
    ) {
      return NextResponse.json(
        { error: "Party size must be a whole number between 1 and 20" },
        { status: 422 }
      );
    }

    // Validate reservation_date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(reservation_date!)) {
      return NextResponse.json(
        { error: "Reservation date must be in YYYY-MM-DD format" },
        { status: 422 }
      );
    }

    // Validate reservation_time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(reservation_time!)) {
      return NextResponse.json(
        { error: "Reservation time must be in HH:MM format" },
        { status: 422 }
      );
    }

    // Validate reservation_date is not in the past
    const today = getTodayInAmsterdam();
    if (reservation_date! < today) {
      return NextResponse.json(
        { error: "Reservation date cannot be in the past" },
        { status: 422 }
      );
    }

    // Validate created_via if provided
    if (
      created_via &&
      !VALID_CREATED_VIA.includes(created_via as (typeof VALID_CREATED_VIA)[number])
    ) {
      return NextResponse.json(
        {
          error: "Invalid created_via value",
          details: `Must be one of: ${VALID_CREATED_VIA.join(", ")}`,
        },
        { status: 422 }
      );
    }

    // Use admin client to look up location and insert reservation
    const supabaseAdmin = createAdminClient();

    // Fetch location to validate location_id and check opening hours
    const { data: location, error: locationError } = await supabaseAdmin
      .from("locations")
      .select("id, name, opening_hours, is_active")
      .eq("id", location_id!)
      .single();

    if (locationError || !location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 400 }
      );
    }

    if (!location.is_active) {
      return NextResponse.json(
        { error: "This location is currently not active" },
        { status: 400 }
      );
    }

    // Validate reservation time against opening hours
    const reservationDateObj = new Date(reservation_date! + "T00:00:00");
    const dayName = getDutchDayName(reservationDateObj);
    const openingHours = location.opening_hours as Record<
      string,
      OpeningHoursEntry
    >;
    const dayHours = openingHours[dayName];

    if (!dayHours) {
      return NextResponse.json(
        {
          error: `The location is closed on ${dayName}`,
        },
        { status: 422 }
      );
    }

    if (!isTimeInRange(reservation_time!, dayHours.open, dayHours.close)) {
      return NextResponse.json(
        {
          error: `Reservation time must be between ${dayHours.open} and ${dayHours.close} on ${dayName}`,
        },
        { status: 422 }
      );
    }

    // Insert the reservation
    const { data: reservation, error: insertError } = await supabaseAdmin
      .from("reservations")
      .insert({
        location_id,
        customer_name: customer_name!.trim(),
        customer_email: customer_email?.trim() || null,
        customer_phone: customer_phone!.trim(),
        party_size,
        reservation_date,
        reservation_time,
        notes: notes?.trim() || null,
        created_via: created_via || "chatbot",
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to create reservation" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ...reservation,
        message: `Reservation confirmed for ${party_size} guests at Eataliano ${location.name} on ${reservation_date} at ${reservation_time}`,
      },
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
  // Admin-only: verify Supabase session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location_id");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const status = searchParams.get("status");

  let query = supabase
    .from("reservations")
    .select("*")
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true });

  if (locationId) {
    query = query.eq("location_id", locationId);
  }
  if (dateFrom) {
    query = query.gte("reservation_date", dateFrom);
  }
  if (dateTo) {
    query = query.lte("reservation_date", dateTo);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data: reservations, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }

  return NextResponse.json(reservations);
}
