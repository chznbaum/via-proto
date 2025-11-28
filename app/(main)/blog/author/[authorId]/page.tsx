import Image from "next/image";
import { notFound } from "next/navigation";
import { getAuthorBySlug, getPostsByAuthor } from "@/libs/payload/queries";
import CardArticle from "../../_assets/components/CardArticle";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import { getImageUrl } from "@/libs/payload/helpers";
import { getSocialIcon, getSocialName } from "@/libs/payload/social-icons";

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
      <section className="max-w-3xl mx-auto flex flex-col md:flex-row gap-8 mt-12 mb-24 md:mb-32">
        <div>
          <p className="text-xs uppercase tracking-wide text-base-content/80 mb-2">
            Authors
          </p>
          <h1 className="font-extrabold text-3xl lg:text-5xl tracking-tight mb-2">
            {author.name}
          </h1>
          {author.job && (
            <p className="md:text-lg mb-6 md:mb-10 font-medium">{author.job}</p>
          )}
          {author.description && (
            <p className="md:text-lg text-base-content/80">
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
              className="rounded-box w-[12rem] md:w-[16rem]"
            />
          )}

          {author.socials && author.socials.length > 0 && (
            <div className="flex flex-col md:flex-row gap-4">
              {author.socials.map((social) => (
                <a
                  key={social.id || social.platform}
                  href={social.url}
                  className="btn btn-square"
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
        <h2 className="font-bold text-2xl lg:text-4xl tracking-tight text-center mb-8 md:mb-12">
          Most recent articles by {author.name}
        </h2>

        {articlesByAuthor.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {articlesByAuthor.map((article) => (
              <CardArticle key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p className="text-center text-base-content/60">
            No articles by this author yet.
          </p>
        )}
      </section>
    </>
  );
}
