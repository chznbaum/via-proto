import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { canEditPath } from "@/libs/auth";

/**
 * DELETE /api/paths/[id]/sections/[sectionId]
 * Remove a section from a learning path
 *
 * Note: Section can only be deleted if it has no resources
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { id: pathId, sectionId } = await params;
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

    // 3. Validate section exists and belongs to this path
    const { data: section, error: sectionError } = await supabase
      .from("sections")
      .select("id, title, order, learning_path_id")
      .eq("id", sectionId)
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

    // 4. Check if section has any resources
    const { count: resourceCount, error: countError } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("section_id", sectionId);

    if (countError) {
      console.error("Error counting resources:", countError);
      return NextResponse.json(
        { error: "Failed to check section resources" },
        { status: 500 }
      );
    }

    if (resourceCount && resourceCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete section with resources. Remove all resources first.",
          resourceCount,
        },
        { status: 400 }
      );
    }

    // 5. Store section info for changelog before deletion
    const sectionInfo = {
      section_title: section.title,
      section_order: section.order,
    };

    const deletedOrder = section.order;

    // 6. Delete the section
    const { error: deleteError } = await supabase
      .from("sections")
      .delete()
      .eq("id", sectionId);

    if (deleteError) {
      console.error("Error deleting section:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete section" },
        { status: 500 }
      );
    }

    // 7. Reorder remaining sections to fill the gap
    const { data: higherSections } = await supabase
      .from("sections")
      .select("id, order")
      .eq("learning_path_id", pathId)
      .gt("order", deletedOrder)
      .order("order", { ascending: true });

    if (higherSections && higherSections.length > 0) {
      for (const s of higherSections) {
        await supabase
          .from("sections")
          .update({ order: s.order - 1 })
          .eq("id", s.id);
      }
    }

    // 8. Log to changelog
    const { error: changelogError } = await supabase
      .from("path_changelog")
      .insert({
        learning_path_id: pathId,
        actor_id: user.id,
        action_type: "remove_section",
        entity_type: "section",
        entity_id: sectionId,
        details: sectionInfo,
      });

    if (changelogError) {
      console.error("Error logging changelog:", changelogError);
      // Don't fail the request, changelog is non-critical
    }

    // 9. Return success
    return NextResponse.json({ success: true, sectionId });
  } catch (error) {
    console.error("Error deleting section:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
