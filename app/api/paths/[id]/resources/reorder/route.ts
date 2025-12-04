import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/libs/supabase/server";
import { canEditPath } from "@/libs/auth";
import { ReorderResourcesRequestSchema } from "@/libs/validation/path-schema";

/**
 * PATCH /api/paths/[id]/resources/reorder
 * Reorder resources within a section
 *
 * Uses full array approach: client sends complete new order as array of resource IDs
 */
export async function PATCH(
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
    const validatedInput = ReorderResourcesRequestSchema.parse(body);

    // 3. Permission check
    const canEdit = await canEditPath(user.id, pathId);
    if (!canEdit) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to edit this path" },
        { status: 403 }
      );
    }

    // 4. Validate section belongs to this path
    const { data: section, error: sectionError } = await supabase
      .from("sections")
      .select("id, title, learning_path_id")
      .eq("id", validatedInput.section_id)
      .single();

    if (sectionError || !section) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }

    if (section.learning_path_id !== pathId) {
      return NextResponse.json(
        { error: "Section does not belong to this path" },
        { status: 400 }
      );
    }

    // 5. Verify all resource IDs belong to this section
    const { data: existingResources, error: resourcesError } = await supabase
      .from("resources")
      .select("id, title, order")
      .eq("section_id", validatedInput.section_id)
      .order("order", { ascending: true });

    if (resourcesError) {
      console.error("Error fetching resources:", resourcesError);
      return NextResponse.json(
        { error: "Failed to fetch resources" },
        { status: 500 }
      );
    }

    const existingIds = new Set(existingResources?.map((r) => r.id) || []);
    const requestedIds = new Set(validatedInput.resource_order);

    // Check if all requested IDs exist in the section
    for (const id of validatedInput.resource_order) {
      if (!existingIds.has(id)) {
        return NextResponse.json(
          { error: `Resource ${id} does not belong to this section` },
          { status: 400 }
        );
      }
    }

    // 6. Verify count matches (prevent adding/removing via reorder)
    if (validatedInput.resource_order.length !== existingResources?.length) {
      return NextResponse.json(
        {
          error:
            "Resource count mismatch. All resources must be included in the new order.",
        },
        { status: 400 }
      );
    }

    // Check for duplicates in the request
    if (requestedIds.size !== validatedInput.resource_order.length) {
      return NextResponse.json(
        { error: "Duplicate resource IDs in the order array" },
        { status: 400 }
      );
    }

    // Store before order for changelog
    const beforeOrder = existingResources?.map((r) => ({
      id: r.id,
      title: r.title,
      order: r.order,
    }));

    // 7. Update orders using temporary negative values to avoid unique constraint conflicts
    // Step 1: Set all orders to negative (offset by -1000 to avoid conflicts)
    for (let i = 0; i < validatedInput.resource_order.length; i++) {
      const resourceId = validatedInput.resource_order[i];
      const tempOrder = -(i + 1000);

      const { error: tempError } = await supabase
        .from("resources")
        .update({ order: tempOrder })
        .eq("id", resourceId);

      if (tempError) {
        console.error("Error setting temp order:", tempError);
        return NextResponse.json(
          { error: "Failed to reorder resources" },
          { status: 500 }
        );
      }
    }

    // Step 2: Set actual new orders based on array index + 1
    for (let i = 0; i < validatedInput.resource_order.length; i++) {
      const resourceId = validatedInput.resource_order[i];
      const newOrder = i + 1;

      const { error: orderError } = await supabase
        .from("resources")
        .update({ order: newOrder })
        .eq("id", resourceId);

      if (orderError) {
        console.error("Error setting new order:", orderError);
        return NextResponse.json(
          { error: "Failed to reorder resources" },
          { status: 500 }
        );
      }
    }

    // Build after order for changelog
    const afterOrder = validatedInput.resource_order.map((id, index) => {
      const resource = existingResources?.find((r) => r.id === id);
      return {
        id,
        title: resource?.title || "Unknown",
        order: index + 1,
      };
    });

    // 8. Log to changelog
    const { error: changelogError } = await supabase
      .from("path_changelog")
      .insert({
        learning_path_id: pathId,
        actor_id: user.id,
        action_type: "reorder_resources",
        entity_type: "section",
        entity_id: section.id,
        details: {
          section_id: section.id,
          section_title: section.title,
          before_order: beforeOrder,
          after_order: afterOrder,
        },
      });

    if (changelogError) {
      console.error("Error logging changelog:", changelogError);
      // Don't fail the request, changelog is non-critical
    }

    // 9. Return success with new order
    return NextResponse.json({
      success: true,
      section_id: section.id,
      resource_order: validatedInput.resource_order,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error reordering resources:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
