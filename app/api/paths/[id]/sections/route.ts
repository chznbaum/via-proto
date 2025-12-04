import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/libs/supabase/server";
import { canEditPath } from "@/libs/auth";
import { AddSectionRequestSchema } from "@/libs/validation/path-schema";

/**
 * POST /api/paths/[id]/sections
 * Add a new section to a learning path
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pathId } = await params;
    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate input
    const body = await req.json();
    const validatedInput = AddSectionRequestSchema.parse(body);

    // 3. Permission check
    const canEdit = await canEditPath(user.id, pathId);
    if (!canEdit) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to edit this path" },
        { status: 403 }
      );
    }

    // 4. Verify path exists
    const { data: path, error: pathError } = await supabase
      .from("learning_paths")
      .select("id, title")
      .eq("id", pathId)
      .single();

    if (pathError || !path) {
      return NextResponse.json({ error: "Path not found" }, { status: 404 });
    }

    // 5. Calculate next order (MAX(order) + 1 for this path)
    const { data: maxOrderResult } = await supabase
      .from("sections")
      .select("order")
      .eq("learning_path_id", pathId)
      .order("order", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrderResult?.order ?? 0) + 1;

    // 6. Insert section
    const { data: section, error: insertError } = await supabase
      .from("sections")
      .insert({
        learning_path_id: pathId,
        order: nextOrder,
        title: validatedInput.title,
        description: validatedInput.description,
        prerequisite_level: validatedInput.prerequisite_level,
        estimated_hours: 0, // Will be calculated as resources are added
        notes: null,
      })
      .select()
      .single();

    if (insertError || !section) {
      console.error("Error inserting section:", insertError);
      return NextResponse.json(
        { error: "Failed to add section" },
        { status: 500 }
      );
    }

    // 7. Log to changelog
    const { error: changelogError } = await supabase
      .from("path_changelog")
      .insert({
        learning_path_id: pathId,
        actor_id: user.id,
        action_type: "add_section",
        entity_type: "section",
        entity_id: section.id,
        details: {
          section_title: section.title,
          section_order: section.order,
          prerequisite_level: section.prerequisite_level,
        },
      });

    if (changelogError) {
      console.error("Error logging changelog:", changelogError);
      // Don't fail the request, changelog is non-critical
    }

    // 8. Return created section with empty resources array
    return NextResponse.json(
      {
        section: {
          ...section,
          resources: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error adding section:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
