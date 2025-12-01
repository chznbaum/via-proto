import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { client } from "@/tina/__generated__/client";
import config from "@/config";
import ClientPage from "./client-page";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const { data } = await client.queries.postConnection();
  return (
    data.postConnection.edges
      ?.map((edge) => ({
        slug: edge?.node?._sys.filename,
      }))
      .filter((p) => p.slug) ?? []
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data } = await client.queries.post({
      relativePath: `${slug}.mdx`,
    });

    return {
      title: `${data.post.title} | ${config.appName} Blog`,
      description: data.post.excerpt || `Read ${data.post.title} on the ${config.appName} blog.`,
      openGraph: {
        title: data.post.title,
        description: data.post.excerpt || undefined,
        images: data.post.coverImage ? [data.post.coverImage] : undefined,
      },
    };
  } catch {
    return {
      title: `Blog Post | ${config.appName}`,
    };
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    const { data, query, variables } = await client.queries.post({
      relativePath: `${slug}.mdx`,
    });

    // Fetch related posts (exclude current post)
    const { data: allPosts } = await client.queries.postConnection({
      sort: "date",
      last: 10,
    });

    const relatedPosts =
      allPosts.postConnection.edges
        ?.map((edge) => edge?.node)
        .filter((post) => post && post._sys.filename !== slug)
        .slice(0, 2)
        .map((post) => ({
          slug: post!._sys.filename,
          title: post!.title,
          excerpt: post!.excerpt,
          coverImage: post!.coverImage,
          date: post!.date,
          tags: post!.tags,
        })) ?? [];

    return (
      <ClientPage
        data={data}
        query={query}
        variables={variables}
        relatedPosts={relatedPosts}
      />
    );
  } catch {
    notFound();
  }
}
