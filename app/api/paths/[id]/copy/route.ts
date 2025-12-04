import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/libs/supabase/server";
import { getAccountWithRole } from "@/libs/auth";
import { CopyPathRequestSchema } from "@/libs/validation/team-schema";

/**
 * POST /api/paths/[id]/copy
 * Copy a path to another account the user is a member of
 *
 * Unlike remix, this requires membership in BOTH the source and target accounts.
 * This is for sharing paths between accounts you own (personal -> team or vice versa).
 * No rate limits since this is internal copying without LLM usage.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourcePathId } = await params;
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
    const validatedInput = CopyPathRequestSchema.parse(body);

    // 3. Get source path
    const { data: sourcePath, error: sourceError } = await supabase
      .from("learning_paths")
      .select(
        `
        *,
        topic:topics(id, name),
        creator:profiles!learning_paths_creator_id_fkey(id, name)
      `
      )
      .eq("id", sourcePathId)
      .single();

    if (sourceError || !sourcePath) {
      return NextResponse.json(
        { error: "Source path not found" },
        { status: 404 }
      );
    }

    // 4. Verify user is a member of the SOURCE account
    let sourceAccountWithRole;
    try {
      sourceAccountWithRole = await getAccountWithRole(
        user.id,
        sourcePath.account_id
      );
    } catch {
      return NextResponse.json(
        {
          error:
            "You must be a member of the account that owns this path to copy it",
        },
        { status: 403 }
      );
    }

    // 5. Verify user is a member of the TARGET account
    let targetAccountWithRole;
    try {
      targetAccountWithRole = await getAccountWithRole(
        user.id,
        validatedInput.target_account_id
      );
    } catch {
      return NextResponse.json(
        { error: "Invalid target account or you are not a member" },
        { status: 400 }
      );
    }

    const targetAccount = targetAccountWithRole.account;

    // 6. Don't allow copying to the same account
    if (sourcePath.account_id === validatedInput.target_account_id) {
      return NextResponse.json(
        { error: "Cannot copy path to the same account" },
        { status: 400 }
      );
    }

    // 7. Fetch source path sections and resources
    const { data: sourceSections, error: sectionsError } = await supabase
      .from("sections")
      .select("*, resources(*)")
      .eq("learning_path_id", sourcePathId)
      .order("order", { ascending: true });

    if (sectionsError) {
      console.error("Error fetching source sections:", sectionsError);
      return NextResponse.json(
        { error: "Failed to fetch source path data" },
        { status: 500 }
      );
    }

    // 8. Determine visibility for new path
    // Free tier: always public
    // Pro/Team: default to same visibility as source or private
    let isPublic = sourcePath.is_public;
    if (targetAccount.subscription_tier === "free") {
      isPublic = true; // Free tier paths are always public
    }

    // 9. Create the copied path
    const newTitle = validatedInput.title || sourcePath.title;

    const { data: newPath, error: pathError } = await supabase
      .from("learning_paths")
      .insert({
        account_id: targetAccount.id,
        creator_id: user.id,
        topic_id: sourcePath.topic_id,
        title: newTitle,
        description: sourcePath.description,
        skill_level: sourcePath.skill_level,
        total_estimated_hours: sourcePath.total_estimated_hours,
        is_public: isPublic,
        model_used: sourcePath.model_used,
        generation_status: "completed",
        generation_metadata: {
          copied_from: sourcePathId,
          copied_at: new Date().toISOString(),
          original_model: sourcePath.model_used,
          source_account_id: sourcePath.account_id,
        },
        // Note: We're not setting forked_from_path_id for copies
        // This distinguishes copies from public remixes
      })
      .select()
      .single();

    if (pathError || !newPath) {
      console.error("Error creating copied path:", pathError);
      return NextResponse.json(
        { error: "Failed to create copied path" },
        { status: 500 }
      );
    }

    // 10. Copy all sections and resources
    for (const sourceSection of sourceSections || []) {
      const { data: newSection, error: sectionError } = await supabase
        .from("sections")
        .insert({
          learning_path_id: newPath.id,
          order: sourceSection.order,
          title: sourceSection.title,
          description: sourceSection.description,
          prerequisite_level: sourceSection.prerequisite_level,
          notes: sourceSection.notes,
          estimated_hours: sourceSection.estimated_hours,
        })
        .select()
        .single();

      if (sectionError || !newSection) {
        console.error("Error copying section:", sectionError);
        continue;
      }

      // Copy resources for this section
      const sourceResources = sourceSection.resources || [];
      if (sourceResources.length > 0) {
        const newResources = sourceResources.map(
          (r: {
            order: number;
            title: string;
            url: string;
            type: string;
            is_free: boolean | null;
            description: string | null;
            estimated_minutes: number | null;
            link_status: string;
            last_checked_at: string | null;
            og_title: string | null;
            og_description: string | null;
            og_image_url: string | null;
            page_title: string | null;
            favicon_url: string | null;
          }) => ({
            section_id: newSection.id,
            order: r.order,
            title: r.title,
            url: r.url,
            type: r.type,
            is_free: r.is_free,
            description: r.description,
            estimated_minutes: r.estimated_minutes,
            link_status: r.link_status,
            last_checked_at: r.last_checked_at,
            og_title: r.og_title,
            og_description: r.og_description,
            og_image_url: r.og_image_url,
            page_title: r.page_title,
            favicon_url: r.favicon_url,
            added_by_user_id: null,
          })
        );

        const { error: resourcesError } = await supabase
          .from("resources")
          .insert(newResources);

        if (resourcesError) {
          console.error("Error copying resources:", resourcesError);
        }
      }
    }

    // 11. Log to changelog
    const { error: changelogError } = await supabase
      .from("path_changelog")
      .insert({
        learning_path_id: newPath.id,
        actor_id: user.id,
        action_type: "copy_path",
        entity_type: "path",
        entity_id: newPath.id,
        details: {
          source_path_id: sourcePathId,
          source_path_title: sourcePath.title,
          source_account_id: sourcePath.account_id,
          target_account_id: targetAccount.id,
          target_account_name: targetAccount.name,
        },
      });

    if (changelogError) {
      console.error("Error logging changelog:", changelogError);
    }

    // 12. Return the new path
    return NextResponse.json(
      {
        pathId: newPath.id,
        title: newPath.title,
        copied_from: {
          id: sourcePathId,
          title: sourcePath.title,
        },
        target_account: {
          id: targetAccount.id,
          name: targetAccount.name,
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
    console.error("Error copying path:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
