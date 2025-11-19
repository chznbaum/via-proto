import Link from "next/link";
import { getFallbackGradient } from "@/libs/unsplash";

type PathCardProps = {
  path: {
    id: string;
    title: string;
    description?: string;
    skill_level: string;
    estimated_hours?: number;
    view_count?: number;
    created_at: string;
    featured_image_url?: string;
    topics?: {
      name: string;
      category?: string;
    };
    profiles?: {
      name?: string;
      avatar_url?: string;
    };
  };
};

export const PathCard = ({ path }: PathCardProps) => {
  const createdDate = new Date(path.created_at);
  const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const timeAgo = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`;

  const fallbackStyle = path.featured_image_url
    ? undefined
    : { background: getFallbackGradient(path.topics?.name || path.title) };

  return (
    <Link href={`/paths/${path.id}`} className="group relative">
      {/* Path Preview - Image or Gradient Box */}
      <div
        className="h-50 sm:h-72 w-full rounded-lg border border-base-300/50 flex flex-col justify-between p-6 transition-all group-hover:border-primary/30 relative overflow-hidden bg-cover bg-center"
        style={fallbackStyle}
      >
        {/* Featured Image Background */}
        {path.featured_image_url && (
          <>
            <img
              src={path.featured_image_url}
              alt={path.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          </>
        )}

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-2">
            <div className="badge badge-outline badge-sm bg-black/30 backdrop-blur-sm border-white/40 text-white">
              {path.topics?.category || "Learning"}
            </div>
            {path.view_count !== undefined && path.view_count > 0 && (
              <div className="flex items-center gap-1 text-xs text-white/90">
                <span className="iconify lucide--eye size-3"></span>
                {path.view_count}
              </div>
            )}
          </div>
          <h3 className="font-serif mt-3 font-semibold text-lg line-clamp-2 text-white">
            {path.title}
          </h3>
          {path.topics?.name && (
            <p className="text-sm mt-1 text-white/80">
              {path.topics.name}
            </p>
          )}
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="badge badge-sm bg-white/20 backdrop-blur-sm border-white/30 text-white">
            {path.skill_level}
          </div>
          {path.estimated_hours && (
            <div className="flex items-center gap-1 text-xs text-white/90">
              <span className="iconify lucide--clock size-3"></span>
              {path.estimated_hours}h
            </div>
          )}
        </div>
      </div>

      {/* Meta Info */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {path.profiles?.avatar_url ? (
            <div className="avatar">
              <div className="mask mask-circle w-5">
                <img src={path.profiles.avatar_url} alt={path.profiles.name || "Creator"} />
              </div>
            </div>
          ) : (
            <div className="avatar placeholder">
              <div className="mask mask-circle w-5 bg-base-300">
                <span className="text-[10px]">
                  {(path.profiles?.name || "U")[0].toUpperCase()}
                </span>
              </div>
            </div>
          )}
          <p className="text-xs text-base-content/70">
            {path.profiles?.name || "Anonymous"}
          </p>
        </div>
        <p className="text-xs text-base-content/60">{timeAgo}</p>
      </div>

      {/* Title and Description */}
      <div className="flex items-start justify-between gap-2 mt-1">
        <p className="font-medium text-base line-clamp-1">
          {path.topics?.name || "Learning Path"}
        </p>
        <span className="iconify lucide--arrow-up-right size-4 opacity-0 transition-all duration-300 group-hover:opacity-100"></span>
      </div>
      {path.description && (
        <p className="text-base-content/80 text-sm line-clamp-2 mt-0.5">
          {path.description}
        </p>
      )}

      {/* Hover Effect Background */}
      <div className="bg-base-200/60 absolute -inset-3 -z-1 scale-95 rounded-lg opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"></div>
    </Link>
  );
};
