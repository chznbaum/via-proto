import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/libs/supabase/server';

async function getPath(id: string) {
  const supabase = await createClient();

  const { data: path, error } = await supabase
    .from('learning_paths')
    .select(`
      *,
      topic:topics(
        *,
        category:categories(name, slug, icon)
      ),
      creator:profiles!creator_id(id, name, avatar_url),
      account:accounts(id, name),
      sections(
        *,
        resources(*)
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

  return path;
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

  const skillLevelColors = {
    beginner: 'badge-success',
    intermediate: 'badge-warning',
    advanced: 'badge-error',
  };

  const skillLevelColor =
    skillLevelColors[path.skill_level as keyof typeof skillLevelColors] ||
    'badge-neutral';

  const resourceTypeIcons: Record<string, string> = {
    video: '🎥',
    article: '📄',
    book: '📚',
    project: '🛠️',
    audio: '🎧',
    graphic: '🎨',
  };

  return (
    <main className="min-h-screen p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="btn btn-ghost btn-sm mb-4">
            ← Back to Dashboard
          </Link>

          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            {path.title}
          </h1>

          <div className="flex flex-wrap gap-2 mb-4">
            <div className="badge badge-primary badge-lg">
              {path.topic.name}
            </div>
            <div className={`badge badge-lg ${skillLevelColor}`}>
              {path.skill_level.charAt(0).toUpperCase() +
                path.skill_level.slice(1)}
            </div>
            {path.is_public && (
              <div className="badge badge-ghost badge-lg">Public</div>
            )}
          </div>

          <p className="text-lg text-base-content/70 mb-4">
            {path.description}
          </p>

          <div className="flex gap-6 text-sm text-base-content/60">
            <span className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {path.total_estimated_hours} hours total
            </span>
            <span className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              {path.sections?.length || 0} sections
            </span>
            <span className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {path.view_count} views
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-base-content/50 mt-2">
            {path.creator?.avatar_url ? (
              <div className="avatar">
                <div className="mask mask-circle w-6">
                  <img src={path.creator.avatar_url} alt={path.creator.name || 'Creator'} />
                </div>
              </div>
            ) : (
              <div className="avatar placeholder">
                <div className="mask mask-circle w-6 bg-base-300">
                  <span className="text-xs">
                    {(path.creator?.name || 'A')[0].toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <span>
              Created by {path.creator?.name || 'Anonymous'} •{' '}
              {new Date(path.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {path.sections && path.sections.length > 0 ? (
            path.sections.map((section: any, idx: number) => (
              <div key={section.id} className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <div className="flex items-start gap-4">
                    <div className="badge badge-primary badge-lg">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h2 className="card-title text-2xl mb-2">
                        {section.title}
                      </h2>

                      <p className="text-base-content/70 mb-4">
                        {section.description}
                      </p>

                      <div className="flex gap-4 text-sm text-base-content/60 mb-4">
                        <span className="flex items-center gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          ~{section.estimated_hours}h
                        </span>
                        <div
                          className={`badge ${
                            section.prerequisite_level === 'required'
                              ? 'badge-error'
                              : section.prerequisite_level === 'recommended'
                              ? 'badge-warning'
                              : 'badge-ghost'
                          }`}
                        >
                          {section.prerequisite_level}
                        </div>
                      </div>

                      {section.notes && (
                        <div className="alert alert-info mb-4">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            className="stroke-current shrink-0 w-6 h-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>{section.notes}</span>
                        </div>
                      )}

                      {/* Resources */}
                      {section.resources && section.resources.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-lg">Resources</h3>
                          {section.resources.map((resource: any) => (
                            <div
                              key={resource.id}
                              className="flex items-start gap-3 p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
                            >
                              <span className="text-2xl flex-shrink-0">
                                {resourceTypeIcons[resource.type] || '📌'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium hover:underline block"
                                >
                                  {resource.title}
                                </a>
                                <p className="text-sm text-base-content/60 mt-1">
                                  {resource.description}
                                </p>
                                <div className="flex gap-3 mt-2 text-xs text-base-content/50">
                                  <span className="badge badge-sm">
                                    {resource.type}
                                  </span>
                                  {resource.is_free !== null && (
                                    <span
                                      className={`badge badge-sm ${
                                        resource.is_free
                                          ? 'badge-success'
                                          : 'badge-warning'
                                      }`}
                                    >
                                      {resource.is_free ? 'Free' : 'Paid'}
                                    </span>
                                  )}
                                  {resource.estimated_minutes && (
                                    <span className="flex items-center gap-1">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-3 w-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      {resource.estimated_minutes}m
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-base-content/60">
                No sections found in this learning path.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
