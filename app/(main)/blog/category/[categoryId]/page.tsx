import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  getPostsByCategory,
  getAllCategories,
} from "@/libs/payload/queries";
import CardArticle from "../../_assets/components/CardArticle";
import CardCategory from "../../_assets/components/CardCategory";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const category = await getCategoryBySlug(categoryId);

  if (!category) {
    return getSEOTags({
      title: "Category Not Found",
      description: "The requested category could not be found.",
    });
  }

  return getSEOTags({
    title: `${category.title} | Blog by ${config.appName}`,
    description: category.description || `Articles about ${category.title}`,
    canonicalUrlRelative: `/blog/category/${category.slug}`,
  });
}

export default async function Category({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;

  // Fetch category, posts in category, and all categories in parallel
  const [category, articlesInCategory, allCategories] = await Promise.all([
    getCategoryBySlug(categoryId),
    getPostsByCategory(categoryId),
    getAllCategories(),
  ]);

  if (!category) {
    notFound();
  }

  // Filter out the current category from the "other categories" list
  const otherCategories = allCategories.filter((c) => c.slug !== category.slug);

  return (
    <>
      <section className="mt-12 mb-24 md:mb-32 max-w-3xl mx-auto text-center">
        <h1 className="font-extrabold text-3xl lg:text-5xl tracking-tight mb-6 md:mb-12">
          {category.title}
        </h1>
        {category.description && (
          <p className="md:text-lg opacity-80 max-w-xl mx-auto">
            {category.description}
          </p>
        )}
      </section>

      <section className="mb-24">
        <h2 className="font-bold text-2xl lg:text-4xl tracking-tight text-center mb-8 md:mb-12">
          Most recent articles in {category.title}
        </h2>

        {articlesInCategory.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {articlesInCategory.map((article) => (
              <CardArticle
                key={article.id}
                article={article}
                tag="h3"
                showCategory={false}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-base-content/60">
            No articles in this category yet.
          </p>
        )}
      </section>

      {otherCategories.length > 0 && (
        <section>
          <h2 className="font-bold text-2xl lg:text-4xl tracking-tight text-center mb-8 md:mb-12">
            Other categories you might like
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {otherCategories.map((otherCategory) => (
              <CardCategory
                key={otherCategory.id}
                category={otherCategory}
                tag="h3"
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
