import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/libs/supabase/server";
import { PathCard } from "./PathCard";
import { Topbar } from "@/components/Topbar";
import Footer from "@/components/Footer";
import { getFallbackGradient } from "@/libs/unsplash";

export const metadata: Metadata = {
  title: "Explore Public Learning Paths - ViaProto",
  description: "Browse AI-powered learning paths created by the community. Find curated resources for any skill.",
  openGraph: {
    title: "Explore Public Learning Paths - ViaProto",
    description: "Browse AI-powered learning paths created by the community.",
  },
};

export default async function ExplorePage() {
  const supabase = await createClient();

  // Fetch all public learning paths
  const { data: paths, error } = await supabase
    .from("learning_paths")
    .select(`
      *,
      topics (
        name,
        slug,
        category:categories(name, slug, icon)
      ),
      profiles (
        name,
        avatar_url
      ),
      unsplash_images (
        url,
        photographer,
        photographer_url
      )
    `)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching public paths:", error);
  }

  const publicPaths = paths || [];

  // Get featured path (most recently created or most viewed)
  const featuredPath = publicPaths[0];

  // Get stats
  const totalPaths = publicPaths.length;
  const uniqueTopics = new Set(publicPaths.map(p => p.topics?.name).filter(Boolean)).size;

  return (
    <>
      <Topbar />

      <main className="group/section container pt-24 pb-8 md:pt-28 lg:pt-32 lg:pb-16 xl:pt-40 xl:pb-20 2xl:pt-44 2xl:pb-24">
        {/* Hero Section */}
        <div className="grid gap-6 pb-8 sm:gap-8 lg:grid-cols-2 xl:pb-16 2xl:pb-24">
          <div className="flex flex-col max-lg:order-2">
            <div className="badge badge-outline border-base-300 badge-sm font-mono">
              Public Paths
            </div>
            <h1 className="font-serif mt-1 text-2xl font-semibold sm:text-3xl">
              Explore Learning Paths
            </h1>
            <p className="text-base-content/80 mt-2 max-sm:text-sm">
              Discover AI-curated learning paths created by the community. Real resources from real creators.
            </p>
            <div className="text-base-content/60 mt-2 flex items-center gap-1.5">
              <span className="iconify lucide--library size-3.5"></span>
              <p className="text-sm">
                <span className="border-base-content/20 border-b border-dashed font-medium">
                  {totalPaths}
                </span>{" "}
                public paths across{" "}
                <span className="border-base-content/20 border-b border-dashed font-medium">
                  {uniqueTopics}
                </span>{" "}
                topics
              </p>
            </div>
            <div className="mt-auto pt-8 sm:pt-12">
              <p className="max-sm:text-sm">
                Ready to create your own personalized learning path?
              </p>
              <div className="mt-2 flex items-center gap-3">
                <Link href="/dashboard" className="btn btn-primary">
                  <span className="iconify lucide--rocket size-4"></span>
                  Create Your Path
                </Link>
                <a href="#paths" className="btn btn-ghost">
                  Browse All
                  <span className="iconify lucide--arrow-down size-4"></span>
                </a>
              </div>
            </div>
          </div>

          {/* Featured Path */}
          {featuredPath && (() => {
            const unsplashImage = featuredPath.unsplash_images;
            const fallbackStyle = unsplashImage
              ? undefined
              : { background: getFallbackGradient(featuredPath.topics?.name || featuredPath.title) };

            return (
              <div className="relative">
                <Link
                  href={`/paths/${featuredPath.id}`}
                  className="relative overflow-hidden rounded-lg p-8 min-h-[400px] flex"
                  style={fallbackStyle}
                >
                  {/* Featured Image Background */}
                  {unsplashImage && (
                    <>
                      <img
                        src={unsplashImage.url}
                        alt={featuredPath.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {/* Gradient overlay for better text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                    </>
                  )}

                  <div className="badge badge-primary absolute end-4 top-4 gap-1 shadow z-10">
                    <span className="iconify lucide--star size-3.5"></span>
                    Featured
                  </div>
                  <div className="flex h-full flex-col justify-between relative z-10 flex-1">
                    <div>
                      <p className="font-mono text-xs font-medium uppercase tracking-wide text-white/80">
                        {featuredPath.topics?.category?.name || "Featured"}
                      </p>
                      <h2 className="font-serif mt-2 text-2xl font-semibold sm:text-3xl text-white">
                        {featuredPath.title}
                      </h2>
                      <p className="mt-2 text-sm sm:text-base text-white/90">
                        {featuredPath.description || `Master ${featuredPath.topics?.name} with this curated learning path`}
                      </p>
                    </div>
                    <div className="mt-6 flex items-end gap-3">
                      <div className="flex items-center gap-2">
                        {featuredPath.profiles?.avatar_url ? (
                          <div className="avatar">
                            <div className="mask mask-circle w-8">
                              <img src={featuredPath.profiles.avatar_url} alt={featuredPath.profiles.name || "Creator"} />
                            </div>
                          </div>
                        ) : (
                          <div className="avatar placeholder">
                            <div className="mask mask-circle w-8 bg-white/20">
                              <span className="text-xs text-white">
                                {(featuredPath.profiles?.name || "U")[0].toUpperCase()}
                              </span>
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">
                            {featuredPath.profiles?.name || "Anonymous"}
                          </p>
                          <p className="text-xs text-white/70">Creator</p>
                        </div>
                      </div>
                      <div className="badge badge-outline badge-sm ml-auto bg-white/20 backdrop-blur-sm border-white/30 text-white">
                        {featuredPath.skill_level}
                      </div>
                      {featuredPath.estimated_hours && (
                        <p className="text-sm font-medium text-white/90">
                          {featuredPath.estimated_hours}h
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
                {/* Unsplash Attribution - outside Link to avoid nested links */}
                {unsplashImage && (
                  <p className="text-xs text-base-content/50 mt-2">
                    Photo by{" "}
                    <a
                      href={unsplashImage.photographer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-base-content/70"
                    >
                      {unsplashImage.photographer}
                    </a>{" "}
                    on{" "}
                    <a
                      href="https://unsplash.com?utm_source=ViaProto&utm_medium=referral"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-base-content/70"
                    >
                      Unsplash
                    </a>
                  </p>
                )}
              </div>
            );
          })()}
        </div>

        {/* All Paths Grid */}
        <div id="paths" className="mt-12 scroll-mt-24 xl:mt-24">
          <div className="text-center">
            <h2 className="font-serif text-xl font-medium sm:text-2xl">All Public Paths</h2>
            <p className="text-base-content/80 mt-1 inline-block max-w-xl max-sm:text-sm">
              Curated learning journeys from the community
            </p>
          </div>

          {publicPaths.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 xl:mt-16 xl:grid-cols-3 xl:gap-12">
              {publicPaths.map((path) => (
                <PathCard key={path.id} path={path} />
              ))}
            </div>
          ) : (
            <div className="mt-8 text-center">
              <div className="inline-flex flex-col items-center gap-4 rounded-lg border border-dashed border-base-300 p-12">
                <span className="iconify lucide--search-x size-12 text-base-content/40"></span>
                <div>
                  <p className="font-medium">No public paths yet</p>
                  <p className="text-base-content/60 mt-1 text-sm">
                    Be the first to create and share a learning path!
                  </p>
                </div>
                <Link href="/dashboard" className="btn btn-primary btn-sm">
                  Create First Path
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
