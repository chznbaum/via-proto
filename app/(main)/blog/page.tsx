import { getAllPosts, getAllCategories } from "@/libs/payload/queries";
import CardArticle from "./_assets/components/CardArticle";
import CardCategory from "./_assets/components/CardCategory";
import config from "@/config";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({
  title: `${config.appName} Blog | Learn Effectively`,
  description:
    "Learn how to learn more effectively, keeping the 'good struggle' while dropping the suffering.",
  canonicalUrlRelative: "/blog",
});

export default async function Blog() {
  // Fetch posts and categories from Payload CMS
  const [articles, categories] = await Promise.all([
    getAllPosts(6),
    getAllCategories(),
  ]);

  return (
    <>
      <section className="text-center max-w-xl mx-auto mt-12 mb-24 md:mb-32">
        <h1 className="font-extrabold text-3xl lg:text-5xl tracking-tight mb-6">
          The {config.appName} Blog
        </h1>
        <p className="text-lg opacity-80 leading-relaxed">
          Learn how to learn more effectively, keeping the "good struggle" while dropping the suffering.
        </p>
      </section>

      <section className="grid lg:grid-cols-2 mb-24 md:mb-32 gap-8">
        {articles.map((article, i) => (
          <CardArticle
            article={article}
            key={article.id}
            isImagePriority={i <= 2}
          />
        ))}
      </section>

      {categories.length > 0 && (
        <section>
          <p className="font-bold text-2xl lg:text-4xl tracking-tight text-center mb-8 md:mb-12">
            Browse articles by category
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <CardCategory key={category.id} category={category} tag="div" />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
