import Link from "next/link";
import type { Category } from "@/payload-types";

// This is the category badge that appears in the article page and in <CardArticle /> component
const BadgeCategory = ({
  category,
  extraStyle,
}: {
  category: Category;
  extraStyle?: string;
}) => {
  return (
    <Link
      href={`/blog/category/${category.slug}`}
      className={`badge badge-sm md:badge-md hover:badge-primary ${
        extraStyle ? extraStyle : ""
      }`}
      title={`Posts in ${category.title}`}
      rel="tag"
    >
      {category.titleShort || category.title}
    </Link>
  );
};

export default BadgeCategory;
