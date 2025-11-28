import { Topbar } from "@/components/Topbar";
import Footer from "@/components/Footer";

export default async function LayoutBlog({ children }: { children: any }) {
  return (
    <>
      <Topbar />
      <main className="group/section container pt-24 pb-8 md:pt-28 lg:pt-32 lg:pb-16 xl:pt-40 xl:pb-20 2xl:pt-44 2xl:pb-24">
        {children}
      </main>
      <Footer />
    </>
  );
}
