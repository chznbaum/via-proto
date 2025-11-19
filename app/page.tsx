import Header from "@/components/Header";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { FAQs } from "@/components/landing/FAQs";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <>
      <Header />

      <main>
        <Hero />
        <Features />
        <Pricing />
        <FAQs />
      </main>

      <Footer />
    </>
  );
}
