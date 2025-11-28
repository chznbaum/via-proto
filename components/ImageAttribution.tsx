import type { Media } from "@/payload-types";
import {
  getImageAttribution,
  getAttributionLabel,
} from "@/libs/payload/helpers";

type ImageAttributionProps = {
  media: string | Media | null | undefined;
  className?: string;
};

/**
 * Displays image attribution for stock images from Unsplash, Pixabay, Pexels, etc.
 * Renders nothing if the media doesn't have attribution data.
 *
 * Example output: "Photo by John Doe on Unsplash"
 */
export function ImageAttribution({ media, className = "" }: ImageAttributionProps) {
  const attribution = getImageAttribution(media);

  if (!attribution) return null;

  const label = getAttributionLabel(attribution.creatorType);

  return (
    <p className={`text-xs text-base-content/50 ${className}`}>
      {label}{" "}
      {attribution.creatorUrl ? (
        <a
          href={attribution.creatorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-base-content/70"
        >
          {attribution.creatorName}
        </a>
      ) : (
        <span>{attribution.creatorName}</span>
      )}{" "}
      on{" "}
      {attribution.sourceUrl ? (
        <a
          href={attribution.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-base-content/70"
        >
          {attribution.sourceName}
        </a>
      ) : (
        <span>{attribution.sourceName}</span>
      )}
    </p>
  );
}
