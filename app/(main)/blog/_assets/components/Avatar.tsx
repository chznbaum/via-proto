import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/payload-types";
import {
  isPopulatedAuthor,
  getAuthorAvatarUrl,
  getAuthorName,
  getAuthorSlug,
} from "@/libs/payload/helpers";

// This is the author avatar that appears in the article page and in <CardArticle /> component
const Avatar = ({ article }: { article: Post }) => {
  const author = article.author;

  // If author is not populated, don't render
  if (!isPopulatedAuthor(author)) {
    return null;
  }

  const avatarUrl = getAuthorAvatarUrl(author, "thumbnail");
  const authorName = getAuthorName(author);
  const authorSlug = getAuthorSlug(author);

  return (
    <Link
      href={`/blog/author/${authorSlug}`}
      title={`Posts by ${authorName}`}
      className="inline-flex items-center gap-2 group"
      rel="author"
    >
      <span itemProp="author">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            className="w-7 h-7 rounded-full object-cover object-center"
            width={28}
            height={28}
          />
        ) : (
          <span className="w-7 h-7 rounded-full bg-base-300 flex items-center justify-center text-xs font-medium">
            {authorName.charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <span className="group-hover:underline">{authorName}</span>
    </Link>
  );
};

export default Avatar;
