import Image from "next/image";
import { notFound } from "next/navigation";
import { getAuthorBySlug, getPostsByAuthor } from "@/libs/payload/queries";
import CardArticle from "../../_assets/components/CardArticle";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import { getImageUrl } from "@/libs/payload/helpers";
import { getSocialIcon, getSocialName } from "@/libs/payload/social-icons";
import { Topbar } from "@/components/Topbar";
import Footer from "@/components/Footer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ authorId: string }>;
}) {
  const { authorId } = await params;
  const author = await getAuthorBySlug(authorId);

  if (!author) {
    return getSEOTags({
      title: "Author Not Found",
      description: "The requested author could not be found.",
    });
  }

  return getSEOTags({
    title: `${author.name}, Author at ${config.appName}'s Blog`,
    description:
      author.description || `${author.name}, Author at ${config.appName}'s Blog`,
    canonicalUrlRelative: `/blog/author/${author.slug}`,
  });
}

export default async function Author({
  params,
}: {
  params: Promise<{ authorId: string }>;
}) {
  const { authorId } = await params;

  // Fetch author and their posts in parallel
  const [author, articlesByAuthor] = await Promise.all([
    getAuthorBySlug(authorId),
    getPostsByAuthor(authorId),
  ]);

  if (!author) {
    notFound();
  }

  const avatarUrl = getImageUrl(author.avatar, "card");

  return (
    <>
      <Topbar />
      <main className="group/section container pt-24 pb-8 md:pt-28 lg:pt-32 lg:pb-16 xl:pt-40 xl:pb-20 2xl:pt-44 2xl:pb-24">
        <section className="max-w-3xl mx-auto flex flex-col md:flex-row gap-8 mb-16 xl:mb-24">
        <div>
          <div className="badge badge-outline border-base-300 badge-sm font-mono mb-2">
            Author
          </div>
          <h1 className="font-serif text-2xl font-semibold sm:text-3xl">
            {author.name}
          </h1>
          {author.job && (
            <p className="text-base-content/80 mt-1 font-medium">{author.job}</p>
          )}
          {author.description && (
            <p className="text-base-content/80 mt-4 max-sm:text-sm">
              {author.description}
            </p>
          )}
        </div>

        <div className="max-md:order-first flex md:flex-col gap-4 shrink-0">
          {avatarUrl && (
            <Image
              src={avatarUrl}
              width={256}
              height={256}
              alt={author.name}
              priority={true}
              className="rounded-lg w-[12rem] md:w-[16rem]"
            />
          )}

          {author.socials && author.socials.length > 0 && (
            <div className="flex flex-col md:flex-row gap-4">
              {author.socials.map((social) => (
                <a
                  key={social.id || social.platform}
                  href={social.url}
                  className="btn btn-square btn-ghost"
                  title={`Go to ${author.name}'s profile on ${getSocialName(social.platform)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {getSocialIcon(social.platform)}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-medium sm:text-2xl text-center mb-8 md:mb-12">
          Most recent articles by {author.name}
        </h2>

        {articlesByAuthor.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 xl:gap-12">
            {articlesByAuthor.map((article) => (
              <CardArticle key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center">
            <div className="inline-flex flex-col items-center gap-4 rounded-lg border border-dashed border-base-300 p-12">
              <span className="iconify lucide--book-x size-12 text-base-content/40"></span>
              <div>
                <p className="font-medium">No articles by this author yet</p>
                <p className="text-base-content/75 mt-1 text-sm">
                  Check back soon for new content!
                </p>
              </div>
            </div>
          </div>
        )}
        </section>
      </main>
      <Footer />
    </>
  );
}
