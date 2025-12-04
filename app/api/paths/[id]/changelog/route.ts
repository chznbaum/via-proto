import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

/**
 * GET /api/paths/[id]/changelog
 * Get the edit history (changelog) for a learning path
 *
 * Query params:
 * - limit: number (default 50, max 100)
 * - offset: number (default 0)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pathId } = await params;
    const supabase = await createClient();

    // Parse query params
    const url = new URL(req.url);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // 1. Auth check (optional - public paths are viewable by anyone)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 2. Verify access to path (RLS handles this, but we check for better error messages)
    const { data: path, error: pathError } = await supabase
      .from("learning_paths")
      .select("id, is_public, account_id")
      .eq("id", pathId)
      .single();

    if (pathError || !path) {
      return NextResponse.json({ error: "Path not found" }, { status: 404 });
    }

    // If path is private and user is not authenticated, deny access
    if (!path.is_public && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If path is private, verify user is a member of the account (RLS will also enforce this)
    if (!path.is_public && user) {
      const { data: membership } = await supabase
        .from("account_users")
        .select("id")
        .eq("account_id", path.account_id)
        .eq("user_id", user.id)
        .single();

      if (!membership) {
        return NextResponse.json(
          { error: "Forbidden: You do not have access to this path" },
          { status: 403 }
        );
      }
    }

    // 3. Fetch changelog entries with actor info
    const { data: entries, error: entriesError, count } = await supabase
      .from("path_changelog")
      .select(
        `
        id,
        action_type,
        entity_type,
        entity_id,
        details,
        created_at,
        actor:profiles!path_changelog_actor_id_fkey(id, name, avatar_url)
      `,
        { count: "exact" }
      )
      .eq("learning_path_id", pathId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (entriesError) {
      console.error("Error fetching changelog:", entriesError);
      return NextResponse.json(
        { error: "Failed to fetch changelog" },
        { status: 500 }
      );
    }

    // 4. Return paginated results
    return NextResponse.json({
      entries: entries || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error("Error fetching changelog:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
