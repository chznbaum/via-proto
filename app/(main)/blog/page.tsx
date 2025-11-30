import Link from "next/link";
import config from "@/config";
import { createPageMetadata } from "@/libs/seo";

export const metadata = createPageMetadata({
  title: `${config.appName} Blog`,
  description:
    "Learn how to learn more effectively, keeping the 'good struggle' while dropping the suffering.",
  canonical: "/blog",
});

export default function Blog() {
  return (
    <main className="group/section container pt-24 pb-8 md:pt-28 lg:pt-32 lg:pb-16 xl:pt-40 xl:pb-20 2xl:pt-44 2xl:pb-24">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center">
        <div className="badge badge-outline border-base-300 badge-sm font-mono">
          Blog
        </div>
        <h1 className="font-serif mt-1 text-2xl font-semibold sm:text-3xl">
          The {config.appName} Blog
        </h1>
        <p className="text-base-content/80 mt-2 max-w-xl max-sm:text-sm">
          Learn how to learn more effectively, keeping the &ldquo;good struggle&rdquo; while dropping the suffering.
        </p>
        <div className="mt-8">
          <Link href="/dashboard" className="btn btn-primary">
            <span className="iconify lucide--rocket size-4"></span>
            Create Your Path
          </Link>
        </div>
      </div>

      {/* Empty State */}
      <div className="mt-16 text-center">
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
    </main>
  );
}
