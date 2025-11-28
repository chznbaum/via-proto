import { Suspense } from "react";
import HeaderBlog from "./_assets/components/HeaderBlog";
import Footer from "@/components/Footer";
import { getAllCategories } from "@/libs/payload/queries";

export default async function LayoutBlog({ children }: { children: any }) {
  // Fetch categories on the server
  const categories = await getAllCategories();

  return (
    <div>
      <Suspense>
        <HeaderBlog categories={categories} />
      </Suspense>

      <main className="min-h-screen max-w-6xl mx-auto p-8">{children}</main>

      <div className="h-24" />

      <Footer />
    </div>
  );
}
