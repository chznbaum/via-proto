import type { JSX } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/payload-types";
import {
  getImageUrl,
  getImageAlt,
  getPopulatedCategories,
  isPopulatedAuthor,
  getAuthorName,
  getAuthorAvatarUrl,
} from "@/libs/payload/helpers";

// This is the article card that appears in the home page, in the category page, and in the author's page
const CardArticle = ({
  article,
  tag = "h3",
  showCategory = true,
  isImagePriority = false,
}: {
  article: Post;
  tag?: keyof JSX.IntrinsicElements;
  showCategory?: boolean;
  isImagePriority?: boolean;
}) => {
  const TitleTag = tag;
  const imageUrl = getImageUrl(article.featuredImage, "card");
  const imageAlt = getImageAlt(article.featuredImage);
  const categories = getPopulatedCategories(article.categories);
  const author = article.author;

  const publishedDate = new Date(article.publishedAt);
  const daysAgo = Math.floor((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));
  const timeAgo = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`;

  return (
    <article className="group relative">
      <Link href={`/blog/${article.slug}`} title={article.title} rel="bookmark">
        {/* Article Preview - Image Box */}
        <div className="h-50 sm:h-72 w-full rounded-lg border border-base-300/50 flex flex-col justify-between p-6 transition-all group-hover:border-primary/30 relative overflow-hidden bg-cover bg-center">
          {/* Featured Image Background */}
          {imageUrl && (
            <>
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                priority={isImagePriority}
                className="object-cover"
              />
              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </>
          )}

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-2">
              {showCategory && categories.length > 0 && (
                <div className="badge badge-outline badge-sm bg-black/30 backdrop-blur-sm border-white/40 text-white">
                  {categories[0].titleShort || categories[0].title}
                </div>
              )}
            </div>
            <TitleTag className="font-serif mt-3 font-semibold text-lg line-clamp-2 text-white">
              {article.title}
            </TitleTag>
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <div className="badge badge-sm bg-white/20 backdrop-blur-sm border-white/30 text-white">
              {new Date(article.publishedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Meta Info */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPopulatedAuthor(author) && (
              <>
                {getAuthorAvatarUrl(author) ? (
                  <div className="avatar">
                    <div className="mask mask-circle w-5">
                      <Image
                        src={getAuthorAvatarUrl(author)!}
                        alt={getAuthorName(author)}
                        width={20}
                        height={20}
                        className="object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="avatar placeholder">
                    <div className="mask mask-circle w-5 bg-base-300">
                      <span className="text-[10px]">
                        {getAuthorName(author)[0]?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-base-content/70">
                  {getAuthorName(author)}
                </p>
              </>
            )}
          </div>
          <p className="text-xs text-base-content/75">{timeAgo}</p>
        </div>

        {/* Title and Description */}
        <div className="flex items-start justify-between gap-2 mt-1">
          <p className="font-medium text-base line-clamp-1">
            {categories[0]?.title || "Article"}
          </p>
          <span className="iconify lucide--arrow-up-right size-4 opacity-0 transition-all duration-300 group-hover:opacity-100"></span>
        </div>
        {article.description && (
          <p className="text-base-content/80 text-sm line-clamp-2 mt-0.5">
            {article.description}
          </p>
        )}
      </Link>

      {/* Hover Effect Background */}
      <div className="bg-base-200/60 absolute -inset-3 -z-1 scale-95 rounded-lg opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"></div>
    </article>
  );
};

export default CardArticle;
