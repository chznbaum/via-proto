import { Topbar } from "@/components/Topbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { ExamplePath } from "@/components/landing/ExamplePath";
import { Pricing } from "@/components/landing/Pricing";
import { FAQs } from "@/components/landing/FAQs";
import Footer from "@/components/Footer";

export default function Page() {
  // Check if teams feature is enabled
  const teamsEnabled = process.env.TEAMS_ENABLED === 'true';

  return (
    <>
      <Topbar />

      <main>
        <Hero />
        <Features />
        <ExamplePath />
        <Pricing teamsEnabled={teamsEnabled} />
        <FAQs />
      </main>

      <Footer />
    </>
  );
}
