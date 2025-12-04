import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/libs/supabase/server";
import { canEditPath } from "@/libs/auth";
import { AddResourceRequestSchema } from "@/libs/validation/path-schema";
import { fetchLinkMetadata } from "@/libs/link-metadata";

/**
 * POST /api/paths/[id]/resources
 * Add a new resource to a section in a learning path
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
    const validatedInput = AddResourceRequestSchema.parse(body);

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

    // 5. Fetch link metadata (validates URL and gets OG data)
    const metadata = await fetchLinkMetadata(validatedInput.url, {
      timeout: 8000,
    });

    // 6. Calculate next order (MAX(order) + 1 for this section)
    const { data: maxOrderResult } = await supabase
      .from("resources")
      .select("order")
      .eq("section_id", validatedInput.section_id)
      .order("order", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrderResult?.order ?? 0) + 1;

    // 7. Insert resource with user attribution
    const { data: resource, error: insertError } = await supabase
      .from("resources")
      .insert({
        section_id: validatedInput.section_id,
        order: nextOrder,
        title: validatedInput.title,
        url: validatedInput.url,
        type: validatedInput.type,
        description: validatedInput.description || null,
        is_free: validatedInput.is_free ?? null,
        // Link metadata from fetch
        link_status: metadata.status,
        last_checked_at: new Date().toISOString(),
        og_title: metadata.ogTitle || null,
        og_description: metadata.ogDescription || null,
        og_image_url: metadata.ogImage || null,
        page_title: metadata.title || null,
        favicon_url: metadata.faviconUrl || null,
        // User attribution for manually-added resources
        added_by_user_id: user.id,
      })
      .select(
        `
        *,
        added_by:profiles!resources_added_by_user_id_fkey(id, name, avatar_url)
      `
      )
      .single();

    if (insertError || !resource) {
      console.error("Error inserting resource:", insertError);
      return NextResponse.json(
        { error: "Failed to add resource" },
        { status: 500 }
      );
    }

    // 8. Log to changelog
    const { error: changelogError } = await supabase
      .from("path_changelog")
      .insert({
        learning_path_id: pathId,
        actor_id: user.id,
        action_type: "add_resource",
        entity_type: "resource",
        entity_id: resource.id,
        details: {
          resource_title: resource.title,
          resource_type: resource.type,
          resource_url: resource.url,
          section_id: section.id,
          section_title: section.title,
        },
      });

    if (changelogError) {
      console.error("Error logging changelog:", changelogError);
      // Don't fail the request, changelog is non-critical
    }

    // 9. Return created resource
    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error adding resource:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
