import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = ["confirmed", "cancelled", "completed", "no_show"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Admin-only: verify Supabase session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid status value",
          details: `Must be one of: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Check if reservation exists
    const { data: existing, error: fetchError } = await supabase
      .from("reservations")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Update the reservation status
    const { data: reservation, error: updateError } = await supabase
      .from("reservations")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update reservation" },
        { status: 500 }
      );
    }

    return NextResponse.json(reservation);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
