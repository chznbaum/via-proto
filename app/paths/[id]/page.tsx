import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/libs/supabase/server';
import { Topbar } from '@/components/Topbar';
import Footer from '@/components/Footer';
import { ShareSheet } from '@/components/paths/ShareSheet';
import { SkillsDisplay } from '@/components/paths/SkillsDisplay';
import { SectionTimeline } from '@/components/paths/SectionTimeline';
import { TagsSection } from '@/components/paths/TagsSection';
import { CommentForm } from '@/components/paths/CommentForm';
import { RelatedPaths } from '@/components/paths/RelatedPaths';
import { getFallbackGradient } from '@/libs/unsplash';
import config from '@/config';

async function getPath(id: string) {
  const supabase = await createClient();
  const teamsEnabled = process.env.TEAMS_ENABLED === 'true';

  const { data: path, error } = await supabase
    .from('learning_paths')
    .select(`
      *,
      topic:topics(
        *,
        category:categories(name, slug, icon),
        topic_competencies(
          is_primary,
          competency:competencies(
            id,
            name,
            slug,
            description,
            icon,
            prerequisites:competency_prerequisites!competency_prerequisites_competency_id_fkey(
              prerequisite_level,
              prerequisite:competencies!competency_prerequisites_prerequisite_id_fkey(
                id,
                name,
                slug
              )
            )
          )
        )
      ),
      creator:profiles!creator_id(id, name, avatar_url),
      account:accounts(id, name),
      sections(
        *,
        resources(*)
      ),
      unsplash_images(
        url,
        photographer,
        photographer_url
      )
    `)
    .eq('id', id)
    .single();

  if (error || !path) {
    console.error('Error fetching path:', error);
    return null;
  }

  // Sort sections and resources by order
  if (path.sections) {
    path.sections.sort((a: any, b: any) => a.order - b.order);
    path.sections.forEach((section: any) => {
      if (section.resources) {
        section.resources.sort((a: any, b: any) => a.order - b.order);
      }
    });
  }

  // Increment view count (fire and forget)
  supabase
    .from('learning_paths')
    .update({ view_count: (path.view_count || 0) + 1 })
    .eq('id', id)
    .then(() => {})
    .catch((err) => console.error('Failed to increment view count:', err));

  // Add teams enabled flag to path data
  return { ...path, _teamsEnabled: teamsEnabled };
}

async function getRelatedPaths(pathId: string, competencyIds: string[]) {
  if (!competencyIds || competencyIds.length === 0) {
    return [];
  }

  const supabase = await createClient();

  // First, find topic IDs that have the matching competencies
  const { data: matchingTopics } = await supabase
    .from('topic_competencies')
    .select('topic_id')
    .in('competency_id', competencyIds);

  if (!matchingTopics || matchingTopics.length === 0) {
    return [];
  }

  const topicIds = [...new Set(matchingTopics.map(t => t.topic_id))];

  // Then find paths with those topics
  const { data: relatedPaths, error } = await supabase
    .from('learning_paths')
    .select(`
      *,
      topic:topics(
        *,
        category:categories(name, slug, icon)
      ),
      creator:profiles!creator_id(id, name, avatar_url),
      unsplash_images(
        url,
        photographer,
        photographer_url
      )
    `)
    .neq('id', pathId)
    .eq('is_public', true)
    .in('topic_id', topicIds)
    .limit(4);

  if (error) {
    console.error('Error fetching related paths:', error);
    return [];
  }

  return relatedPaths || [];
}

async function getPathTags(pathId: string) {
  const supabase = await createClient();

  const { data: tags, error } = await supabase
    .from('taggables')
    .select('tag:tags(id, name)')
    .eq('taggable_type', 'learning_path')
    .eq('taggable_id', pathId);

  if (error) {
    console.error('Error fetching tags:', error);
    return [];
  }

  return tags?.map((t: any) => t.tag).filter(Boolean) || [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const path = await getPath(id);

  if (!path) {
    return {
      title: 'Path Not Found',
    };
  }

  const ogImageUrl = path.unsplash_images?.url || `${config.domainName}/og-default.png`;

  return {
    title: `${path.title} | ${config.appName}`,
    description: path.description || `Learn ${path.topic.name} - ${path.skill_level}`,
    openGraph: {
      title: path.title,
      description: path.description,
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: path.title,
      description: path.description,
    },
  };
}

export default async function PathDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const path = await getPath(id);

  if (!path) {
    notFound();
  }

  // Check authentication for back link
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const backLink = user ? '/dashboard' : '/explore';
  const backText = user ? 'Back to dashboard' : 'Back to explore';

  // Check if user has any competencies tracked
  let hasUserCompetencies = false;
  if (user) {
    const { count } = await supabase
      .from('user_competencies')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    hasUserCompetencies = (count || 0) > 0;
  }

  // Get competency IDs for related paths
  const competencyIds =
    path.topic?.topic_competencies?.map((tc: any) => tc.competency?.id).filter(Boolean) || [];

  const [tags, relatedPaths] = await Promise.all([
    getPathTags(id),
    getRelatedPaths(id, competencyIds),
  ]);

  const skillLevelColors = {
    beginner: 'badge-success',
    intermediate: 'badge-warning',
    advanced: 'badge-error',
  };

  const skillLevelColor =
    skillLevelColors[path.skill_level as keyof typeof skillLevelColors] || 'badge-neutral';

  const fullUrl = `${config.domainName}/paths/${id}`;
  const unsplashImage = path.unsplash_images;
  const fallbackStyle = unsplashImage
    ? undefined
    : { background: getFallbackGradient(path.topic.name || path.title) };

  return (
    <>
      <Topbar />
      <main className="min-h-screen pt-20 md:pt-24">
        <div className="group/section container pb-8 sm:pt-4 xl:pb-16 2xl:pb-24">
          <div className="lg:mx-16 xl:mx-32 2xl:mx-48">
            {/* Back Link */}
            <Link
              href="/explore"
              className="text-base-content/50 hover:text-base-content flex items-center gap-2 text-sm font-medium transition-all">
              <span className="iconify lucide--arrow-left size-4"></span>
              Back to explore
            </Link>

            {/* Featured Image */}
            <div
              className="mt-4 h-64 w-full rounded-lg overflow-hidden relative sm:mt-6 sm:h-100 lg:h-120"
              style={fallbackStyle}>
              {unsplashImage && (
                <img
                  src={unsplashImage.url}
                  alt={path.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </div>
            {unsplashImage && (
              <p className="text-xs text-base-content/50 mt-2">
                Photo by{' '}
                <a
                  href={unsplashImage.photographer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-base-content/70">
                  {unsplashImage.photographer}
                </a>{' '}
                on{' '}
                <a
                  href="https://unsplash.com?utm_source=ViaProto&utm_medium=referral"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-base-content/70">
                  Unsplash
                </a>
              </p>
            )}

            {/* Meta Info */}
            <div className="mt-4 sm:mt-8">
              <div className="flex items-center justify-between">
                <p className="text-base-content/60 font-mono text-xs font-medium tracking-wide uppercase">
                  {path.topic.category?.name || 'Learning Path'}
                </p>
                <p className="text-base-content/80 text-sm">{path.total_estimated_hours}h</p>
              </div>
              <p className="mt-1 text-lg font-medium sm:text-xl">{path.title}</p>
              <p className="text-base-content/80 mt-1 text-sm">{path.description}</p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                <div className="badge badge-primary">{path.topic.name}</div>
                <div className={`badge ${skillLevelColor}`}>
                  {path.skill_level.charAt(0).toUpperCase() + path.skill_level.slice(1)}
                </div>
                {path.model_used && (
                  <div className="badge badge-secondary">
                    <span className="iconify lucide--sparkles size-3 mr-1"></span>
                    {path.model_used}
                  </div>
                )}
                {path.is_public && (
                  <div className="badge badge-ghost">
                    <span className="iconify lucide--globe size-3 mr-1"></span>
                    Public
                  </div>
                )}
              </div>

              {/* Creator and Actions Bar */}
              <div className="mt-6 flex items-start justify-between gap-3 sm:mt-8">
                <div className="flex items-center gap-3">
                  <div className="avatar cursor-pointer">
                    <div className="mask mask-squircle bg-base-200 w-10">
                      {path.creator?.avatar_url ? (
                        <img src={path.creator.avatar_url} alt={path.creator.name || 'Creator'} />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-base-300">
                          <span className="text-sm">
                            {(path.creator?.name || 'A')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium sm:text-lg">{path.creator?.name || 'Anonymous'}</p>
                    <p className="text-base-content/80 -mt-1 text-sm">Creator</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Favorites - hidden until teams enabled */}
                  {path._teamsEnabled && (
                    <div className="flex items-center gap-0.5">
                      <button className="btn btn-sm btn-ghost btn-circle">
                        <span className="iconify lucide--heart size-4"></span>
                      </button>
                      <p className="text-sm">0</p>
                    </div>
                  )}
                  {/* Comments - hidden until teams enabled */}
                  {path._teamsEnabled && (
                    <div className="flex items-center gap-0.5">
                      <button className="btn btn-sm btn-ghost btn-circle">
                        <span className="iconify lucide--messages-square size-4"></span>
                      </button>
                      <p className="text-sm">0</p>
                    </div>
                  )}
                  {/* Share */}
                  <ShareSheet url={fullUrl} title={path.title} description={path.description} />
                </div>
              </div>

            </div>

            {/* Skills Display */}
            {path.topic?.topic_competencies && path.topic.topic_competencies.length > 0 && (
              <SkillsDisplay
                competencies={path.topic.topic_competencies}
                showCTA={!hasUserCompetencies}
              />
            )}

            {/* Sections Timeline */}
            {path.sections && path.sections.length > 0 && (
              <SectionTimeline sections={path.sections} />
            )}

            {/* Divider */}
            <hr className="border-base-300 border-dashed my-8" />

            {/* Date */}
            <div className="mb-6 sm:mb-8">
              <p className="text-base-content/60 flex items-center gap-1 text-sm">
                <span className="iconify lucide--calendar size-4"></span>
                {new Date(path.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {/* Tags - hidden until teams enabled */}
            {path._teamsEnabled && (
              <>
                <TagsSection tags={tags} />
                <hr className="border-base-300 mt-6 border-dashed sm:mt-8" />
              </>
            )}

            {/* Comment Form - hidden until teams enabled */}
            {path._teamsEnabled && (
              <>
                <div className="mt-6 sm:mt-8">
                  <CommentForm pathId={id} />
                </div>
                <hr className="border-base-300 mt-6 border-dashed sm:mt-8" />
              </>
            )}

            {/* Related Paths */}
            {relatedPaths.length > 0 && (
              <div className="mt-6 sm:mt-8">
                <RelatedPaths paths={relatedPaths} />
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
