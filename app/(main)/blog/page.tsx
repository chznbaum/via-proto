import Link from "next/link";
import config from "@/config";
import { createPageMetadata } from "@/libs/seo";
import { client } from "@/tina/__generated__/client";
import { PostItem } from "./PostItem";

export const metadata = createPageMetadata({
  title: `${config.appName} Blog`,
  description:
    "Learn how to learn more effectively, keeping the 'good struggle' while dropping the suffering.",
  canonical: "/blog",
});

export default async function BlogPage() {
  const { data } = await client.queries.postConnection({
    sort: "date",
    last: 50,
  });

  const posts =
    data.postConnection.edges
      ?.map((edge) => edge?.node)
      .filter((post): post is NonNullable<typeof post> => post !== null && post !== undefined)
      .reverse() ?? [];

  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <main className="group/section container pt-24 pb-8 md:pt-28 lg:pt-32 lg:pb-16 xl:pt-40 xl:pb-20 2xl:pt-44 2xl:pb-24">
      <div className="grid gap-6 pb-8 sm:gap-8 lg:grid-cols-2 xl:pb-16 2xl:pb-24">
        <div className="flex flex-col max-lg:order-2">
          <div className="badge badge-outline border-base-300 badge-sm font-mono">
            Blog
          </div>
          <h1 className="font-serif mt-1 text-2xl font-semibold sm:text-3xl">
            The {config.appName} Blog
          </h1>
          <p className="text-base-content/80 mt-2 max-sm:text-sm">
            Learn how to learn more effectively, keeping the &ldquo;good
            struggle&rdquo; while dropping the suffering.
          </p>
          <div className="text-base-content/60 mt-2 flex items-center gap-1.5">
            <span className="iconify lucide--library size-3.5"></span>
            <p className="text-sm">
              <span className="border-base-content/20 border-b border-dashed font-medium">
                {posts.length}
              </span>{" "}
              {posts.length === 1 ? "article" : "articles"} published
            </p>
          </div>
          <div className="mt-auto pt-8 sm:pt-12">
            <p className="max-sm:text-sm">
              Ready to create your own personalized learning path?
            </p>
            <div className="mt-2 flex items-center gap-3">
              <Link href="/dashboard" className="btn btn-primary">
                <span className="iconify lucide--rocket size-4"></span>
                Create Your Path
              </Link>
              {posts.length > 0 && (
                <a href="#articles" className="btn btn-ghost">
                  Read more{" "}
                  <span className="iconify lucide--arrow-down size-4"></span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Featured Post */}
        {featuredPost ? (
          <Link
            href={`/blog/${featuredPost._sys.filename}`}
            className="relative overflow-hidden rounded-lg"
          >
            {featuredPost.coverImage ? (
              <img
                src={featuredPost.coverImage}
                className="h-64 w-full object-cover sm:h-96"
                alt={featuredPost.title}
              />
            ) : (
              <div className="bg-base-200 h-64 w-full sm:h-96 flex items-center justify-center">
                <span className="iconify lucide--file-text text-base-content/30 size-16"></span>
              </div>
            )}
            <div className="badge badge-primary absolute end-4 top-4 gap-1 shadow">
              <span className="iconify lucide--flame size-3.5"></span>
              Latest
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent to-black px-4 pt-28 pb-4 text-white">
              <p className="text-lg font-medium">{featuredPost.title}</p>
              {featuredPost.excerpt && (
                <p className="text-sm text-white/80 line-clamp-2">
                  {featuredPost.excerpt}
                </p>
              )}
              <div className="mt-3 flex items-end gap-3">
                {featuredPost.author?.name && (
                  <>
                    {featuredPost.author.avatar ? (
                      <div className="avatar cursor-pointer">
                        <div className="mask mask-squircle w-8 bg-white/20">
                          <img
                            src={featuredPost.author.avatar}
                            alt={featuredPost.author.name}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="avatar placeholder">
                        <div className="mask mask-squircle w-8 bg-white/20">
                          <span className="text-xs text-white">
                            {featuredPost.author.name[0].toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-base font-medium">
                        {featuredPost.author.name}
                      </p>
                      <p className="-mt-0.5 text-xs/none text-white/80">
                        Author
                      </p>
                    </div>
                  </>
                )}
                {featuredPost.date && (
                  <p className="ms-auto text-sm font-medium text-white/80">
                    {new Date(featuredPost.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ) : (
          <div className="border-base-300 flex h-64 w-full items-center justify-center rounded-lg border border-dashed sm:h-96">
            <div className="text-center">
              <span className="iconify lucide--pen-line text-base-content/30 size-12"></span>
              <p className="text-base-content/60 mt-2 text-sm">
                First post coming soon
              </p>
            </div>
          </div>
        )}
      </div>

      {/* All Articles */}
      <div id="articles" className="mt-12 scroll-mt-24 xl:mt-24">
        <div className="text-center">
          <h2 className="font-serif text-xl font-medium sm:text-2xl">
            All Articles
          </h2>
          <p className="text-base-content/80 mt-1 inline-block max-w-xl max-sm:text-sm">
            Ideas, lessons, and insights for effective learning
          </p>
        </div>

        {remainingPosts.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 xl:mt-16 xl:grid-cols-3 xl:gap-12">
            {remainingPosts.map((post) => (
              <PostItem
                key={post._sys.filename}
                slug={post._sys.filename}
                title={post.title}
                excerpt={post.excerpt}
                coverImage={post.coverImage}
                date={post.date}
                tags={post.tags}
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
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
        ) : (
          <div className="mt-8 text-center">
            <p className="text-base-content/60 text-sm">
              More articles coming soon!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
