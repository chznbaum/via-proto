import Link from "next/link";
import PathCard from "./PathCard";

interface RelatedPath {
  id: string;
  title: string;
  description: string;
  skill_level: string;
  total_estimated_hours: number;
  is_public: boolean;
  view_count: number;
  created_at: string;
  topic: {
    name: string;
    category?: {
      name: string;
      slug: string;
      icon?: string;
    };
  };
  creator: {
    name: string | null;
  };
}

interface RelatedPathsProps {
  paths: RelatedPath[];
}

export const RelatedPaths = ({ paths }: RelatedPathsProps) => {
  if (!paths || paths.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-lg font-medium">You might also like</p>
        <Link
          href="/explore"
          className="link link-hover text-primary flex items-center gap-1.5 text-sm">
          Browse all paths
          <span className="iconify lucide--arrow-right"></span>
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {paths.map((path) => (
          <PathCard key={path.id} path={path} />
        ))}
      </div>
    </div>
  );
};
