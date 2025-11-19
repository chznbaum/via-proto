/**
 * Unsplash API integration for fetching featured images
 * Uses the Unsplash API to get random images based on search queries
 */

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = "https://api.unsplash.com";

export interface UnsplashImage {
  url: string;
  photographer: string;
  photographerUrl: string;
  downloadLocation: string; // Required by Unsplash API guidelines to track downloads
}

/**
 * Fetch a random image from Unsplash based on a search query
 * @param query - Search term (e.g., "machine learning", "web development")
 * @param orientation - Image orientation (landscape, portrait, squarish)
 * @returns UnsplashImage object with url and attribution data, or null if not found
 */
export async function fetchUnsplashImage(
  query: string,
  orientation: "landscape" | "portrait" | "squarish" = "landscape"
): Promise<UnsplashImage | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn("Unsplash access key not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}/photos/random?query=${encodeURIComponent(query)}&orientation=${orientation}&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
        // Cache for 1 hour to avoid hitting rate limits
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      console.error(`Unsplash API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    // Trigger download endpoint as required by Unsplash API guidelines
    if (data.links?.download_location) {
      // Fire and forget - don't await
      fetch(data.links.download_location, {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }).catch(() => {
        // Silently fail if download tracking fails
      });
    }

    return {
      url: data.urls.regular, // 1080px wide, good for cards
      photographer: data.user.name,
      photographerUrl: data.user.links.html,
      downloadLocation: data.links.download_location,
    };
  } catch (error) {
    console.error("Error fetching Unsplash image:", error);
    return null;
  }
}

/**
 * Get a fallback gradient style based on the topic name
 * Used when Unsplash image fetch fails or is unavailable
 * Uses brand gradient colors (#167bff to #9c5de8)
 * @param topicName - Topic name (currently unused, kept for API compatibility)
 * @returns CSS gradient string
 */
export function getFallbackGradient(topicName: string): string {
  return `linear-gradient(135deg, #167bff, #9c5de8)`;
}
