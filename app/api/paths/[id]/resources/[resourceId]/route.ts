import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { canEditPath } from "@/libs/auth";
import { z } from "zod";

const UpdateResourceSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().url().optional(),
  type: z.enum(["video", "article", "book", "project", "audio", "graphic", "course"]).optional(),
  is_free: z.boolean().nullable().optional(),
  description: z.string().optional(),
});

/**
 * PATCH /api/paths/[id]/resources/[resourceId]
 * Update a resource in a learning path
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const { id: pathId, resourceId } = await params;
    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Permission check
    const canEdit = await canEditPath(user.id, pathId);
    if (!canEdit) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to edit this path" },
        { status: 403 }
      );
    }

    // 3. Validate input
    const body = await req.json();
    const validated = UpdateResourceSchema.parse(body);

    // 4. Validate resource exists and belongs to this path
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select(
        `
        id,
        title,
        type,
        url,
        description,
        is_free,
        section_id,
        sections!inner(id, title, learning_path_id)
      `
      )
      .eq("id", resourceId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Type assertion for the joined data
    const section = resource.sections as unknown as {
      id: string;
      title: string;
      learning_path_id: string;
    };

    if (section.learning_path_id !== pathId) {
      return NextResponse.json(
        { error: "Resource does not belong to this path" },
        { status: 400 }
      );
    }

    // 5. Store original info for changelog
    const originalInfo = {
      title: resource.title,
      url: resource.url,
      type: resource.type,
      description: resource.description,
      is_free: resource.is_free,
    };

    // 6. Update the resource
    const updateData: Record<string, unknown> = { ...validated };

    // If URL changed, reset link validation status
    if (validated.url && validated.url !== resource.url) {
      updateData.link_status = "unchecked";
      updateData.last_checked_at = null;
      updateData.og_title = null;
      updateData.og_description = null;
      updateData.og_image_url = null;
      updateData.page_title = null;
      updateData.favicon_url = null;
    }

    const { data: updatedResource, error: updateError } = await supabase
      .from("resources")
      .update(updateData)
      .eq("id", resourceId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating resource:", updateError);
      return NextResponse.json(
        { error: "Failed to update resource" },
        { status: 500 }
      );
    }

    // 7. Log to changelog
    const { error: changelogError } = await supabase
      .from("path_changelog")
      .insert({
        learning_path_id: pathId,
        actor_id: user.id,
        action_type: "update_resource",
        entity_type: "resource",
        entity_id: resourceId,
        details: {
          section_id: section.id,
          section_title: section.title,
          original: originalInfo,
          updated: validated,
        },
      });

    if (changelogError) {
      console.error("Error logging changelog:", changelogError);
      // Don't fail the request, changelog is non-critical
    }

    // 8. Return success
    return NextResponse.json({ success: true, resource: updatedResource });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/paths/[id]/resources/[resourceId]
 * Remove a resource from a learning path
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const { id: pathId, resourceId } = await params;
    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Permission check
    const canEdit = await canEditPath(user.id, pathId);
    if (!canEdit) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to edit this path" },
        { status: 403 }
      );
    }

    // 3. Validate resource exists and belongs to this path
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select(
        `
        id,
        title,
        type,
        url,
        order,
        section_id,
        sections!inner(id, title, learning_path_id)
      `
      )
      .eq("id", resourceId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Type assertion for the joined data
    const section = resource.sections as unknown as {
      id: string;
      title: string;
      learning_path_id: string;
    };

    if (section.learning_path_id !== pathId) {
      return NextResponse.json(
        { error: "Resource does not belong to this path" },
        { status: 400 }
      );
    }

    // 4. Store resource info for changelog before deletion
    const resourceInfo = {
      resource_title: resource.title,
      resource_type: resource.type,
      resource_url: resource.url,
      section_id: section.id,
      section_title: section.title,
    };

    const deletedOrder = resource.order;
    const sectionId = resource.section_id;

    // 5. Delete the resource
    const { error: deleteError } = await supabase
      .from("resources")
      .delete()
      .eq("id", resourceId);

    if (deleteError) {
      console.error("Error deleting resource:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete resource" },
        { status: 500 }
      );
    }

    // 6. Reorder remaining resources to fill the gap
    // Decrement order for all resources with order > deleted order
    const { error: reorderError } = await supabase.rpc("decrement_order", {
      p_section_id: sectionId,
      p_deleted_order: deletedOrder,
    });

    // If RPC doesn't exist, fall back to manual update
    if (reorderError) {
      // Manual reorder: get all resources with higher order and update them
      const { data: higherResources } = await supabase
        .from("resources")
        .select("id, order")
        .eq("section_id", sectionId)
        .gt("order", deletedOrder)
        .order("order", { ascending: true });

      if (higherResources && higherResources.length > 0) {
        // Update each resource's order sequentially
        for (const r of higherResources) {
          await supabase
            .from("resources")
            .update({ order: r.order - 1 })
            .eq("id", r.id);
        }
      }
    }

    // 7. Log to changelog
    const { error: changelogError } = await supabase
      .from("path_changelog")
      .insert({
        learning_path_id: pathId,
        actor_id: user.id,
        action_type: "remove_resource",
        entity_type: "resource",
        entity_id: resourceId,
        details: resourceInfo,
      });

    if (changelogError) {
      console.error("Error logging changelog:", changelogError);
      // Don't fail the request, changelog is non-critical
    }

    // 8. Return success
    return NextResponse.json({ success: true, resourceId });
  } catch (error) {
    console.error("Error deleting resource:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
