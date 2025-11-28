import type { JSX } from "react";
import Link from "next/link";
import Image from "next/image";
import BadgeCategory from "./BadgeCategory";
import Avatar from "./Avatar";
import type { Post } from "@/payload-types";
import {
  getImageUrl,
  getImageAlt,
  getPopulatedCategories,
} from "@/libs/payload/helpers";

// This is the article card that appears in the home page, in the category page, and in the author's page
const CardArticle = ({
  article,
  tag = "h2",
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

  return (
    <article className="card bg-base-200 rounded-box overflow-hidden">
      {imageUrl && (
        <Link
          href={`/blog/${article.slug}`}
          className="link link-hover hover:link-primary"
          title={article.title}
          rel="bookmark"
        >
          <figure>
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={768}
              height={432}
              priority={isImagePriority}
              className="aspect-video object-center object-cover hover:scale-[1.03] duration-200 ease-in-out"
            />
          </figure>
        </Link>
      )}
      <div className="card-body">
        {/* CATEGORIES */}
        {showCategory && categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <BadgeCategory category={category} key={category.id} />
            ))}
          </div>
        )}

        {/* TITLE WITH RIGHT TAG */}
        <TitleTag className="mb-1 text-xl md:text-2xl font-bold">
          <Link
            href={`/blog/${article.slug}`}
            className="link link-hover hover:link-primary"
            title={article.title}
            rel="bookmark"
          >
            {article.title}
          </Link>
        </TitleTag>

        <div className=" text-base-content/80 space-y-4">
          {/* DESCRIPTION */}
          <p className="">{article.description}</p>

          {/* AUTHOR & DATE */}
          <div className="flex items-center gap-4 text-sm">
            <Avatar article={article} />

            <span itemProp="datePublished">
              {new Date(article.publishedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default CardArticle;
