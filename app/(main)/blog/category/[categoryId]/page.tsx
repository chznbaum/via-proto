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

// Revalidate hourly - shows fresh content without redeploying
export const revalidate = 3600;

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
    <main className="group/section container pt-24 pb-8 md:pt-28 lg:pt-32 lg:pb-16 xl:pt-40 xl:pb-20 2xl:pt-44 2xl:pb-24">
      <section className="mb-16 xl:mb-24 max-w-3xl mx-auto text-center">
        <div className="badge badge-outline border-base-300 badge-sm font-mono mb-2">
          Category
        </div>
        <h1 className="font-serif text-2xl font-semibold sm:text-3xl">
          {category.title}
        </h1>
        {category.description && (
          <p className="text-base-content/80 mt-2 max-sm:text-sm max-w-xl mx-auto">
            {category.description}
          </p>
        )}
      </section>

      <section className="mb-24">
        <h2 className="font-serif text-xl font-medium sm:text-2xl text-center mb-8 md:mb-12">
          Most recent articles in {category.title}
        </h2>

        {articlesInCategory.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 xl:gap-12">
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
          <div className="text-center">
            <div className="inline-flex flex-col items-center gap-4 rounded-lg border border-dashed border-base-300 p-12">
              <span className="iconify lucide--book-x size-12 text-base-content/40"></span>
              <div>
                <p className="font-medium">No articles in this category yet</p>
                <p className="text-base-content/75 mt-1 text-sm">
                  Check back soon for new content!
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {otherCategories.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-medium sm:text-2xl text-center mb-8 md:mb-12">
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
    </main>
  );
}
