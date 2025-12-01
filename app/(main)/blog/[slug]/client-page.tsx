"use client";

import Link from "next/link";
import { useTina } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import type { PostQuery } from "@/tina/__generated__/types";
import { PostItem } from "../PostItem";

interface ClientPageProps {
  data: PostQuery;
  query: string;
  variables: { relativePath: string };
  relatedPosts: Array<{
    slug: string;
    title: string;
    excerpt?: string | null;
    coverImage?: string | null;
    date?: string | null;
    tags?: (string | null)[] | null;
  }>;
}

export default function ClientPage({
  data,
  query,
  variables,
  relatedPosts,
}: ClientPageProps) {
  const { data: tinaData } = useTina({
    query,
    variables,
    data,
  });

  const post = tinaData.post;
  const category = post.tags?.[0] ?? "Article";
  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="group/section container pb-8 pt-24 md:pt-28 lg:pt-32 xl:pb-16 2xl:pb-24">
      <div className="lg:mx-16 xl:mx-32 2xl:mx-48">
        <Link
          href="/blog"
          className="text-base-content/50 hover:text-base-content flex items-center gap-2 text-sm font-medium transition-all"
        >
          <span className="iconify lucide--arrow-left size-4"></span>
          Back to blog
        </Link>

        {post.coverImage ? (
          <img
            src={post.coverImage}
            className="mt-4 h-64 w-full rounded-lg object-cover sm:mt-6 sm:h-100 lg:h-120"
            alt={post.title}
          />
        ) : (
          <div className="bg-base-200 mt-4 h-64 w-full rounded-lg sm:mt-6 sm:h-100 lg:h-120 flex items-center justify-center">
            <span className="iconify lucide--file-text text-base-content/20 size-24"></span>
          </div>
        )}

        <div className="mt-4 sm:mt-8">
          <div className="flex items-center justify-between">
            <p className="text-base-content/60 font-mono text-xs font-medium tracking-wide uppercase">
              {category}
            </p>
            {formattedDate && (
              <p className="text-base-content/80 text-sm">{formattedDate}</p>
            )}
          </div>
          <h1 className="font-serif mt-1 text-lg font-medium sm:text-xl lg:text-2xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-base-content/80 mt-1 text-sm">{post.excerpt}</p>
          )}

          <div className="mt-6 flex items-start justify-between gap-3 sm:mt-8">
            {post.author?.name && (
              <div className="flex items-center gap-3">
                {post.author.avatar ? (
                  <div className="avatar">
                    <div className="mask mask-squircle bg-base-200 w-10">
                      <img src={post.author.avatar} alt={post.author.name} />
                    </div>
                  </div>
                ) : (
                  <div className="avatar placeholder">
                    <div className="mask mask-squircle bg-base-200 w-10">
                      <span className="text-base-content/60">
                        {post.author.name[0].toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
                <div>
                  <p className="font-medium sm:text-lg">{post.author.name}</p>
                  <p className="text-base-content/80 -mt-1 text-sm">Author</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Article Body */}
        <div className="prose prose-base max-w-none py-8 max-sm:text-sm sm:py-16">
          <TinaMarkdown content={post.body} />
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <>
            <hr className="border-base-300 border-dashed" />
            <div className="mt-6 sm:mt-8">
              <p className="text-lg font-medium">Tags</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {post.tags.map(
                  (tag) =>
                    tag && (
                      <div key={tag} className="badge badge-ghost">
                        {tag}
                      </div>
                    )
                )}
              </div>
            </div>
          </>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <>
            <hr className="border-base-300 mt-6 border-dashed sm:mt-8" />
            <div className="mt-6 sm:mt-8">
              <div className="flex items-center justify-between">
                <p className="text-lg font-medium">You might also like</p>
                <Link
                  href="/blog"
                  className="link link-hover text-primary flex items-center gap-1.5 text-sm"
                >
                  Browse all articles
                  <span className="iconify lucide--arrow-right"></span>
                </Link>
              </div>
              <div className="mt-6 grid gap-8 sm:mt-8 md:grid-cols-2">
                {relatedPosts.slice(0, 2).map((relatedPost) => (
                  <PostItem
                    key={relatedPost.slug}
                    slug={relatedPost.slug}
                    title={relatedPost.title}
                    excerpt={relatedPost.excerpt}
                    coverImage={relatedPost.coverImage}
                    date={relatedPost.date}
                    tags={relatedPost.tags}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
