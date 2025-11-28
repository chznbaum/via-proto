import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { getPostBySlug, getRelatedPosts } from "@/libs/payload/queries";
import BadgeCategory from "../_assets/components/BadgeCategory";
import Avatar from "../_assets/components/Avatar";
import CardArticle from "../_assets/components/CardArticle";
import { RichText } from "@/components/RichText";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import {
  getPopulatedCategories,
  isPopulatedAuthor,
  getImageUrl,
} from "@/libs/payload/helpers";
import { Topbar } from "@/components/Topbar";
import Footer from "@/components/Footer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  const article = await getPostBySlug(articleId);

  if (!article) {
    return getSEOTags({
      title: "Article Not Found",
      description: "The requested article could not be found.",
    });
  }

  const imageUrl = getImageUrl(article.featuredImage, "hero");

  return getSEOTags({
    title: article.title,
    description: article.description,
    canonicalUrlRelative: `/blog/${article.slug}`,
    extraTags: {
      openGraph: {
        title: article.title,
        description: article.description,
        url: `/blog/${article.slug}`,
        images: imageUrl
          ? [
              {
                url: imageUrl,
                width: 1200,
                height: 660,
              },
            ]
          : [],
        locale: "en_US",
        type: "article",
      },
    },
  });
}

export default async function Article({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  const article = await getPostBySlug(articleId);

  if (!article) {
    notFound();
  }

  const categories = getPopulatedCategories(article.categories);
  const categoryIds = categories.map((c) => c.id);
  const articlesRelated = await getRelatedPosts(article.slug, categoryIds, 3);
  const authorName = isPopulatedAuthor(article.author)
    ? article.author.name
    : "";
  const imageUrl = getImageUrl(article.featuredImage, "hero");

  return (
    <>
      <Topbar />
      <main className="group/section container pt-24 pb-8 md:pt-28 lg:pt-32 lg:pb-16 xl:pt-40 xl:pb-20 2xl:pt-44 2xl:pb-24">
        {/* SCHEMA JSON-LD MARKUP FOR GOOGLE */}
        <Script
        type="application/ld+json"
        id={`json-ld-article-${article.slug}`}
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://${config.domainName}/blog/${article.slug}`,
            },
            name: article.title,
            headline: article.title,
            description: article.description,
            image: imageUrl
              ? `${imageUrl}`
              : `https://${config.domainName}/og-image.png`,
            datePublished: article.publishedAt,
            dateModified: article.updatedAt,
            author: {
              "@type": "Person",
              name: authorName,
            },
          }),
        }}
      />

      {/* GO BACK LINK */}
      <div>
        <Link
          href="/blog"
          className="link !no-underline text-base-content/80 hover:text-base-content inline-flex items-center gap-1"
          title="Back to Blog"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>
          Back to Blog
        </Link>
      </div>

      <article>
        {/* HEADER WITH CATEGORIES AND DATE AND TITLE */}
        <section className="my-12 md:my-20 max-w-[800px]">
          <div className="flex items-center gap-4 mb-6">
            {categories.map((category) => (
              <BadgeCategory
                category={category}
                key={category.id}
                extraStyle="!badge-lg"
              />
            ))}
            <span className="text-base-content/80" itemProp="datePublished">
              {new Date(article.publishedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 md:mb-8">
            {article.title}
          </h1>

          <p className="text-base-content/80 md:text-lg max-w-[700px]">
            {article.description}
          </p>
        </section>

        <div className="flex flex-col md:flex-row">
          {/* SIDEBAR WITH AUTHORS AND 3 RELATED ARTICLES */}
          <section className="max-md:pb-4 md:pl-12 max-md:border-b md:border-l md:order-last md:w-72 shrink-0 border-base-content/10">
            <p className="text-base-content/80 text-sm mb-2 md:mb-3">
              Posted by
            </p>
            <Avatar article={article} />

            {articlesRelated.length > 0 && (
              <div className="hidden md:block mt-12">
                <p className=" text-base-content/80 text-sm  mb-2 md:mb-3">
                  Related reading
                </p>
                <div className="space-y-2 md:space-y-5">
                  {articlesRelated.map((relatedArticle) => (
                    <div className="" key={relatedArticle.id}>
                      <p className="mb-0.5">
                        <Link
                          href={`/blog/${relatedArticle.slug}`}
                          className="link link-hover hover:link-primary font-medium"
                          title={relatedArticle.title}
                          rel="bookmark"
                        >
                          {relatedArticle.title}
                        </Link>
                      </p>
                      <p className="text-base-content/80 max-w-full text-sm">
                        {relatedArticle.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ARTICLE CONTENT */}
          <section className="w-full max-md:pt-4 md:pr-20 space-y-12 md:space-y-20">
            <RichText content={article.content} />
          </section>
        </div>
      </article>

        {/* RELATED ARTICLES FOR MOBILE */}
        {articlesRelated.length > 0 && (
          <section className="md:hidden mt-12">
            <p className="font-bold text-xl mb-6">Related reading</p>
            <div className="grid gap-6">
              {articlesRelated.map((relatedArticle) => (
                <CardArticle
                  key={relatedArticle.id}
                  article={relatedArticle}
                  tag="h3"
                  showCategory={false}
                />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
