import type { Metadata } from "next";
import config from "@/config";

const siteUrl = `https://${config.domainName}`;

/**
 * Base metadata for the root layout.
 * Sets metadataBase and default values that pages inherit.
 * Only use this in app/layout.tsx.
 */
export const baseMetadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "development"
      ? "http://localhost:3001"
      : siteUrl
  ),
  title: {
    default: config.appTitle || config.appName,
    template: `%s | ${config.appName}`,
  },
  description: config.appDescription,
  keywords: [config.appName],
  applicationName: config.appName,
  openGraph: {
    siteName: config.appName,
    locale: "en_US",
    type: "website",
    url: siteUrl,
    title: config.appTitle || config.appName,
    description: config.appDescription,
    images: ["/opengraph-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: config.appTitle || config.appName,
    description: config.appDescription,
  },
  other: {
    "og:logo": `${siteUrl}/icon.png`,
  },
};

/**
 * Create page-specific metadata.
 * Use this in individual pages to customize SEO while preserving OG tags.
 *
 * @example
 * // Basic usage with canonical URL
 * export const metadata = createPageMetadata({ canonical: "/" });
 *
 * @example
 * // Custom title and description
 * export const metadata = createPageMetadata({
 *   title: "Explore Learning Paths",
 *   description: "Browse AI-powered learning paths.",
 *   canonical: "/explore",
 * });
 */
export function createPageMetadata({
  title,
  description,
  canonical,
  image,
  type = "website",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
} = {}): Metadata {
  const pageTitle = title || config.appTitle || config.appName;
  const pageDescription = description || config.appDescription;
  const pageImage = image || "/opengraph-image.png";

  const metadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    keywords: [config.appName],
    applicationName: config.appName,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      type,
      images: [pageImage],
      siteName: config.appName,
      locale: "en_US",
      url: canonical ? `${siteUrl}${canonical}` : siteUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
    },
    other: {
      "og:logo": `${siteUrl}/icon.png`,
    },
  };

  if (canonical) {
    metadata.alternates = { canonical };
  }

  if (noIndex) {
    metadata.robots = { index: false, follow: false };
  }

  return metadata;
}

/**
 * @deprecated Use baseMetadata in root layout and createPageMetadata() in pages.
 * Keeping for backwards compatibility with existing pages.
 */
export const getSEOTags = ({
  title,
  description,
  keywords,
  openGraph,
  canonicalUrlRelative,
  extraTags,
}: Metadata & {
  canonicalUrlRelative?: string;
  extraTags?: Record<string, unknown>;
} = {}): Metadata => {
  return {
    title: title || config.appTitle || config.appName,
    description: description || config.appDescription,
    keywords: keywords || [config.appName],
    applicationName: config.appName,
    metadataBase: new URL(
      process.env.NODE_ENV === "development"
        ? "http://localhost:3001/"
        : `${siteUrl}/`,
    ),
    openGraph: {
      title: openGraph?.title || config.appTitle || config.appName,
      description: openGraph?.description || config.appDescription,
      url: openGraph?.url || siteUrl,
      siteName: config.appName,
      images: ["/opengraph-image.png"],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      title: openGraph?.title || config.appTitle || config.appName,
      description: openGraph?.description || config.appDescription,
      card: "summary_large_image",
    },
    other: {
      "og:logo": `${siteUrl}/icon.png`,
    },
    ...(canonicalUrlRelative && {
      alternates: { canonical: canonicalUrlRelative },
    }),
    ...extraTags,
  };
};

// Strctured Data for Rich Results on Google. Learn more: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
// Find your type here (SoftwareApp, Book...): https://developers.google.com/search/docs/appearance/structured-data/search-gallery
// Use this tool to check data is well structure: https://search.google.com/test/rich-results
// You don't have to use this component, but it increase your chances of having a rich snippet on Google.
// I recommend this one below to your /page.js for software apps: It tells Google your AppName is a Software, and it has a rating of 4.8/5 from 12 reviews.
// Fill the fields with your own data
// See https://shipfa.st/docs/features/seo
export const renderSchemaTags = () => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "http://schema.org",
          "@type": "SoftwareApplication",
          name: config.appName,
          description: config.appDescription,
          image: `https://${config.domainName}/icon.png`,
          url: `https://${config.domainName}/`,
          author: {
            "@type": "Person",
            name: "Chazona Baum",
          },
          datePublished: "2025-11-23",
          applicationCategory: "EducationalApplication",
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            ratingCount: "12",
          },
          offers: [
            {
              "@type": "Offer",
              price: "12.00",
              priceCurrency: "USD",
            },
          ],
        }),
      }}
    ></script>
  );
};
