import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { ExamplePath } from "@/components/landing/ExamplePath";
import { Pricing } from "@/components/landing/Pricing";
import { FAQs } from "@/components/landing/FAQs";
import { createPageMetadata, renderSchemaTags } from "@/libs/seo";

export const metadata = createPageMetadata({
  canonical: "/",
});

export default function Page() {
  // Check if teams feature is enabled
  const teamsEnabled = process.env.TEAMS_ENABLED === 'true';

  return (
    <>
      {/* Preload LCP image with responsive srcset */}
      <link
        rel="preload"
        as="image"
        href="https://cdn.viapro.to/images/dashboard-screenshot.png?width=560"
        imageSrcSet="
          https://cdn.viapro.to/images/dashboard-screenshot.png?width=400 400w,
          https://cdn.viapro.to/images/dashboard-screenshot.png?width=560 560w,
          https://cdn.viapro.to/images/dashboard-screenshot.png?width=800 800w,
          https://cdn.viapro.to/images/dashboard-screenshot.png?width=1120 1120w
        "
        imageSizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1280px) 50vw, 560px"
        fetchPriority="high"
      />
      {renderSchemaTags()}

      <main>
        <Hero />
        <Features />
        <ExamplePath />
        <Pricing teamsEnabled={teamsEnabled} />
        <FAQs />
      </main>
    </>
  );
}
