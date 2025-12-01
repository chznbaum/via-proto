import Link from "next/link";

export interface PostItemProps {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  date?: string | null;
  tags?: (string | null)[] | null;
}

export function PostItem({
  slug,
  title,
  excerpt,
  coverImage,
  date,
  tags,
}: PostItemProps) {
  const category = tags?.[0] ?? "Article";
  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Link href={`/blog/${slug}`} className="group relative">
      {coverImage ? (
        <img
          src={coverImage}
          alt={title}
          className="h-50 w-full rounded-md object-cover sm:h-72"
        />
      ) : (
        <div className="bg-base-200 h-50 w-full rounded-md sm:h-72 flex items-center justify-center">
          <span className="iconify lucide--file-text text-base-content/30 size-12"></span>
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-base-content/60 font-mono text-xs font-medium tracking-wide uppercase">
          {category}
        </p>
        {formattedDate && (
          <p className="text-base-content/80 text-sm">{formattedDate}</p>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="mt-1 font-medium sm:text-lg">{title}</p>
        <span className="iconify lucide--arrow-up-right size-4 opacity-0 transition-all duration-300 group-hover:opacity-100"></span>
      </div>
      {excerpt && (
        <p className="text-base-content/80 text-sm line-clamp-2">{excerpt}</p>
      )}
      <div className="bg-base-200/60 absolute -inset-3 -z-1 scale-95 rounded-lg opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"></div>
    </Link>
  );
}
