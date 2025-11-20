/**
 * Unsplash API integration for fetching featured images
 * Uses the Unsplash API to get random images based on search queries
 * Complies with Unsplash API guidelines for attribution and UTM parameters
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = "https://api.unsplash.com";
const APP_NAME = "ViaProto";

// UTM parameters required by Unsplash API guidelines
const UTM_PARAMS = `utm_source=${APP_NAME}&utm_medium=referral`;

export interface UnsplashImage {
  photoId: string; // Unsplash unique photo identifier
  url: string; // Image URL
  photographer: string; // Photographer name for attribution
  photographerUrl: string; // Link to photographer profile with UTM params
  downloadLocation: string; // API endpoint to trigger download event
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

    // Note: Download event should be triggered when the image is actually set as featured
    // See triggerUnsplashDownload() function below

    return {
      photoId: data.id,
      url: data.urls.regular, // 1080px wide, good for cards
      photographer: data.user.name,
      photographerUrl: `${data.user.links.html}?${UTM_PARAMS}`,
      downloadLocation: data.links.download_location,
    };
  } catch (error) {
    console.error("Error fetching Unsplash image:", error);
    return null;
  }
}

/**
 * Trigger download event for Unsplash image
 * Required by Unsplash API guidelines when image is used
 * @param downloadLocation - Download location URL from Unsplash API
 */
export async function triggerUnsplashDownload(downloadLocation: string): Promise<void> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn("Unsplash access key not configured");
    return;
  }

  try {
    await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });
  } catch (error) {
    // Non-critical error - log but don't throw
    console.error("Failed to trigger Unsplash download event:", error);
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
