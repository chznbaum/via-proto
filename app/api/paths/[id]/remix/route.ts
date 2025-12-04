import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/libs/supabase/server";
import {
  getUserDefaultAccount,
  getAccountWithRole,
  getUserAccounts,
} from "@/libs/auth";
import { RemixPathRequestSchema } from "@/libs/validation/path-schema";

/**
 * POST /api/paths/[id]/remix
 * Create a remix (fork) of an existing learning path
 *
 * Deep copies the path with all sections and resources to the target account.
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
    const validatedInput = RemixPathRequestSchema.parse(body);

    // 3. Verify user has access to source path (public OR member of account)
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

    // Check access: public path OR user is member of account
    if (!sourcePath.is_public) {
      const { data: membership } = await supabase
        .from("account_users")
        .select("id")
        .eq("account_id", sourcePath.account_id)
        .eq("user_id", user.id)
        .single();

      if (!membership) {
        return NextResponse.json(
          { error: "Forbidden: You do not have access to this path" },
          { status: 403 }
        );
      }
    }

    // 4. Get target account (specified or user's default)
    let targetAccountData;

    if (validatedInput.target_account_id) {
      // Verify user is a member of the target account
      try {
        targetAccountData = await getAccountWithRole(
          user.id,
          validatedInput.target_account_id
        );
      } catch {
        return NextResponse.json(
          { error: "Invalid target account or you are not a member" },
          { status: 400 }
        );
      }
    } else {
      // Use default account
      targetAccountData = await getUserDefaultAccount(user.id);
    }

    if (!targetAccountData) {
      return NextResponse.json(
        { error: "No active account found" },
        { status: 400 }
      );
    }

    const { account: targetAccount } = targetAccountData;

    // 5. Fetch source path sections and resources
    // Note: Remixes don't count against rate limits since they don't use LLM
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

    // 7. Determine visibility for new path
    // Free tier: always public
    // Pro/Team: use provided value or default to private
    let isPublic = validatedInput.is_public ?? false;
    if (targetAccount.subscription_tier === "free") {
      isPublic = true; // Free tier paths are always public
    }

    // 8. Create the new (remixed) path
    const newTitle =
      validatedInput.title || `Remix of ${sourcePath.title}`;

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
        generation_status: "completed", // Remixed paths are already complete
        generation_metadata: {
          remixed_from: sourcePathId,
          remixed_at: new Date().toISOString(),
          original_model: sourcePath.model_used,
        },
        forked_from_path_id: sourcePathId,
      })
      .select()
      .single();

    if (pathError || !newPath) {
      console.error("Error creating remixed path:", pathError);
      return NextResponse.json(
        { error: "Failed to create remixed path" },
        { status: 500 }
      );
    }

    // 9. Copy all sections and resources
    for (const sourceSection of sourceSections || []) {
      // Create new section
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
        // Continue with other sections even if one fails
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
            // Clear added_by_user_id - AI-generated attribution is preserved
            added_by_user_id: null,
          })
        );

        const { error: resourcesError } = await supabase
          .from("resources")
          .insert(newResources);

        if (resourcesError) {
          console.error("Error copying resources:", resourcesError);
          // Continue even if resource copy fails
        }
      }
    }

    // 10. Log to changelog on the NEW path
    const { error: changelogError } = await supabase
      .from("path_changelog")
      .insert({
        learning_path_id: newPath.id,
        actor_id: user.id,
        action_type: "remix_path",
        entity_type: "path",
        entity_id: newPath.id,
        details: {
          source_path_id: sourcePathId,
          source_path_title: sourcePath.title,
          source_creator_name:
            (sourcePath.creator as { name?: string })?.name || "Unknown",
          target_account_id: targetAccount.id,
          target_account_name: targetAccount.name,
        },
      });

    if (changelogError) {
      console.error("Error logging changelog:", changelogError);
      // Don't fail the request, changelog is non-critical
    }

    // 10. Return the new path
    return NextResponse.json(
      {
        pathId: newPath.id,
        title: newPath.title,
        forked_from: {
          id: sourcePathId,
          title: sourcePath.title,
          creator: sourcePath.creator,
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
    console.error("Error remixing path:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
