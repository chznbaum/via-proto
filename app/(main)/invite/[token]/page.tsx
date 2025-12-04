import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/libs/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import config from "@/config";
import { AcceptInvitationButton } from "./AcceptInvitationButton";

export const metadata: Metadata = {
  title: `Team Invitation | ${config.appName}`,
  description: "You've been invited to join a team",
};

interface InvitationData {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  accepted_at: string | null;
  account: {
    id: string;
    name: string;
  };
  inviter: {
    name: string;
  } | null;
}

async function getInvitation(token: string): Promise<InvitationData | null> {
  // Use service role to fetch invitation (bypasses RLS)
  const serviceSupabase = new SupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: invitation, error } = await serviceSupabase
    .from("account_invitations")
    .select(
      `
      id,
      email,
      role,
      expires_at,
      accepted_at,
      account:accounts(id, name),
      inviter:profiles!invited_by_user_id(name)
    `
    )
    .eq("token", token)
    .single();

  if (error || !invitation) {
    return null;
  }

  return invitation as unknown as InvitationData;
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Get invitation details
  const invitation = await getInvitation(token);

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Invalid or not found
  if (!invitation) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-error/10 p-4 rounded-full">
                <span className="iconify lucide--x-circle size-12 text-error" />
              </div>
            </div>
            <h1 className="card-title justify-center text-2xl">
              Invalid Invitation
            </h1>
            <p className="text-base-content/70">
              This invitation link is invalid or has been revoked.
            </p>
            <div className="card-actions justify-center mt-4">
              <Link href="/" className="btn btn-primary">
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Already accepted
  if (invitation.accepted_at) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-success/10 p-4 rounded-full">
                <span className="iconify lucide--check-circle size-12 text-success" />
              </div>
            </div>
            <h1 className="card-title justify-center text-2xl">
              Already Accepted
            </h1>
            <p className="text-base-content/70">
              This invitation has already been accepted.
            </p>
            <div className="card-actions justify-center mt-4">
              <Link href="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Expired
  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-warning/10 p-4 rounded-full">
                <span className="iconify lucide--clock size-12 text-warning" />
              </div>
            </div>
            <h1 className="card-title justify-center text-2xl">
              Invitation Expired
            </h1>
            <p className="text-base-content/70">
              This invitation has expired. Please ask the team admin to send a
              new invitation.
            </p>
            <div className="card-actions justify-center mt-4">
              <Link href="/" className="btn btn-primary">
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const roleDisplay = invitation.role === "admin" ? "an admin" : "a member";
  const inviterName = invitation.inviter?.name || "A team admin";

  // User is authenticated - show accept button
  if (user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <span className="iconify lucide--users size-12 text-primary" />
              </div>
            </div>
            <h1 className="card-title justify-center text-2xl">
              You&apos;re Invited!
            </h1>
            <p className="text-base-content/70 mt-2">
              <strong>{inviterName}</strong> has invited you to join{" "}
              <strong>{invitation.account.name}</strong> as {roleDisplay}.
            </p>

            <div className="bg-base-200 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content w-12 rounded-full">
                    <span className="text-lg">
                      {invitation.account.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-medium">{invitation.account.name}</p>
                  <p className="text-sm text-base-content/60">
                    Role: {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-actions justify-center mt-6">
              <AcceptInvitationButton token={token} />
            </div>

            <p className="text-xs text-base-content/50 mt-4">
              Logged in as {user.email}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // User is not authenticated - show login/signup options
  const loginUrl = `/login?redirect=${encodeURIComponent(`/invite/${token}`)}`;
  const signupUrl = `/register?redirect=${encodeURIComponent(`/invite/${token}`)}&email=${encodeURIComponent(invitation.email)}`;

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl max-w-md w-full">
        <div className="card-body text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <span className="iconify lucide--mail size-12 text-primary" />
            </div>
          </div>
          <h1 className="card-title justify-center text-2xl">You&apos;re Invited!</h1>
          <p className="text-base-content/70 mt-2">
            <strong>{inviterName}</strong> has invited you to join{" "}
            <strong>{invitation.account.name}</strong> as {roleDisplay}.
          </p>

          <div className="bg-base-200 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content w-12 rounded-full">
                  <span className="text-lg">
                    {invitation.account.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-left">
                <p className="font-medium">{invitation.account.name}</p>
                <p className="text-sm text-base-content/60">
                  Role: {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="divider text-xs">Sign in to accept</div>

          <div className="card-actions flex-col gap-3 mt-2">
            <Link href={loginUrl} className="btn btn-primary w-full">
              <span className="iconify lucide--log-in size-4" />
              Sign In
            </Link>
            <Link href={signupUrl} className="btn btn-outline w-full">
              <span className="iconify lucide--user-plus size-4" />
              Create Account
            </Link>
          </div>

          <p className="text-xs text-base-content/50 mt-4">
            Invitation sent to {invitation.email}
          </p>
        </div>
      </div>
    </main>
  );
}
