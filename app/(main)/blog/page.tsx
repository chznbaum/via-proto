import Link from "next/link";
import Image from "next/image";
import { getAllPosts, getAllCategories } from "@/libs/payload/queries";
import CardArticle from "./_assets/components/CardArticle";
import config from "@/config";
import { createPageMetadata } from "@/libs/seo";
import {
  getImageUrl,
  getImageAlt,
  getPopulatedCategories,
  isPopulatedAuthor,
  getAuthorName,
  getAuthorAvatarUrl,
} from "@/libs/payload/helpers";
export const metadata = createPageMetadata({
  title: `${config.appName} Blog`,
  description:
    "Learn how to learn more effectively, keeping the 'good struggle' while dropping the suffering.",
  canonical: "/blog",
});

export default async function Blog() {
  // Fetch posts and categories from Payload CMS
  const [articles, categories] = await Promise.all([
    getAllPosts(100),
    getAllCategories(),
  ]);

  // Get featured article (most recent)
  const featuredArticle = articles[0];

  // Get stats
  const totalArticles = articles.length;
  const uniqueCategories = categories.length;

  return (
    <main className="group/section container pt-24 pb-8 md:pt-28 lg:pt-32 lg:pb-16 xl:pt-40 xl:pb-20 2xl:pt-44 2xl:pb-24">
        {/* Hero Section */}
        <div className="grid gap-6 pb-8 sm:gap-8 lg:grid-cols-2 xl:pb-16 2xl:pb-24">
        <div className="flex flex-col max-lg:order-2">
          <div className="badge badge-outline border-base-300 badge-sm font-mono">
            Blog
          </div>
          <h1 className="font-serif mt-1 text-2xl font-semibold sm:text-3xl">
            The {config.appName} Blog
          </h1>
          <p className="text-base-content/80 mt-2 max-sm:text-sm">
            Learn how to learn more effectively, keeping the &ldquo;good struggle&rdquo; while dropping the suffering.
          </p>
          <div className="text-base-content/75 mt-2 flex items-center gap-1.5">
            <span className="iconify lucide--book-open size-3.5"></span>
            <p className="text-sm">
              <span className="border-base-content/20 border-b border-dashed font-medium">
                {totalArticles}
              </span>{" "}
              articles across{" "}
              <span className="border-base-content/20 border-b border-dashed font-medium">
                {uniqueCategories}
              </span>{" "}
              categories
            </p>
          </div>
          <div className="mt-auto pt-8 sm:pt-12">
            <p className="max-sm:text-sm">
              Ready to start your learning journey?
            </p>
            <div className="mt-2 flex items-center gap-3">
              <Link href="/dashboard" className="btn btn-primary">
                <span className="iconify lucide--rocket size-4"></span>
                Create Your Path
              </Link>
              <a href="#articles" className="btn btn-ghost">
                Browse All
                <span className="iconify lucide--arrow-down size-4"></span>
              </a>
            </div>
          </div>
        </div>

        {/* Featured Article */}
        {featuredArticle && (() => {
          const imageUrl = getImageUrl(featuredArticle.featuredImage, "hero");
          const imageAlt = getImageAlt(featuredArticle.featuredImage);
          const categories = getPopulatedCategories(featuredArticle.categories);
          const author = featuredArticle.author;

          return (
            <div className="relative">
              <Link
                href={`/blog/${featuredArticle.slug}`}
                className="relative overflow-hidden rounded-lg p-8 min-h-[400px] flex"
              >
                {/* Featured Image Background */}
                {imageUrl && (
                  <>
                    <Image
                      src={imageUrl}
                      alt={imageAlt}
                      fill
                      className="object-cover"
                      priority
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
                      {categories[0]?.title || "Blog"}
                    </p>
                    <h2 className="font-serif mt-2 text-2xl font-semibold sm:text-3xl text-white">
                      {featuredArticle.title}
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-white/90">
                      {featuredArticle.description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-end gap-3">
                    {isPopulatedAuthor(author) && (
                      <div className="flex items-center gap-2">
                        {getAuthorAvatarUrl(author) ? (
                          <div className="avatar">
                            <div className="mask mask-circle w-8">
                              <Image
                                src={getAuthorAvatarUrl(author)!}
                                alt={getAuthorName(author)}
                                width={32}
                                height={32}
                                className="object-cover"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="avatar placeholder">
                            <div className="mask mask-circle w-8 bg-white/20">
                              <span className="text-xs text-white">
                                {getAuthorName(author)[0]?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">
                            {getAuthorName(author)}
                          </p>
                          <p className="text-xs text-white/70">Author</p>
                        </div>
                      </div>
                    )}
                    <p className="text-sm font-medium text-white/90 ml-auto">
                      {new Date(featuredArticle.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          );
        })()}
      </div>

      {/* All Articles Grid */}
      <div id="articles" className="mt-12 scroll-mt-24 xl:mt-24">
        <div className="text-center">
          <h2 className="font-serif text-xl font-medium sm:text-2xl">All Articles</h2>
          <p className="text-base-content/80 mt-1 inline-block max-w-xl max-sm:text-sm">
            Insights and guides for effective learning
          </p>
        </div>

        {articles.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 xl:mt-16 xl:grid-cols-3 xl:gap-12">
            {articles.map((article, i) => (
              <CardArticle
                article={article}
                key={article.id}
                isImagePriority={i <= 2}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 text-center">
            <div className="inline-flex flex-col items-center gap-4 rounded-lg border border-dashed border-base-300 p-12">
              <span className="iconify lucide--book-x size-12 text-base-content/40"></span>
              <div>
                <p className="font-medium">No articles yet</p>
                <p className="text-base-content/75 mt-1 text-sm">
                  Check back soon for new content!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
