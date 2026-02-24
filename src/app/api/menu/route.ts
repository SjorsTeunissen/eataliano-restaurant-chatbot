import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category");

    let query = supabase
      .from("menu_items")
      .select("*, category:menu_categories(*)")
      .eq("is_available", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, price, category_id, description, image_url, allergens, dietary_labels, is_available, is_featured, sort_order } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (price == null || typeof price !== "number" || price <= 0) {
      return NextResponse.json(
        { error: "Price is required and must be a positive number" },
        { status: 400 }
      );
    }

    if (!category_id || typeof category_id !== "string") {
      return NextResponse.json(
        { error: "category_id is required and must be a valid UUID" },
        { status: 400 }
      );
    }

    const insertData: Record<string, unknown> = {
      name: name.trim(),
      price,
      category_id,
    };

    if (description !== undefined) insertData.description = description;
    if (image_url !== undefined) insertData.image_url = image_url;
    if (allergens !== undefined) insertData.allergens = allergens;
    if (dietary_labels !== undefined) insertData.dietary_labels = dietary_labels;
    if (is_available !== undefined) insertData.is_available = is_available;
    if (is_featured !== undefined) insertData.is_featured = is_featured;
    if (sort_order !== undefined) insertData.sort_order = sort_order;

    const { data, error } = await supabase
      .from("menu_items")
      .insert(insertData)
      .select("*, category:menu_categories(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
