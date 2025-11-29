/**
 * Unsplash API integration for fetching featured images
 * Uses the Unsplash API to get random images based on search queries
 * Complies with Unsplash API guidelines for attribution and UTM parameters
 */

const UNSPLASH_API_URL = "https://api.unsplash.com";
const APP_NAME = "ViaProto";

// UTM parameters required by Unsplash API guidelines
const UTM_PARAMS = `utm_source=${APP_NAME}&utm_medium=referral`;

export interface UnsplashImage {
  photoId: string; // Unsplash unique photo identifier
  url: string; // Image URL
  photographer: string; // Photographer name for attribution
  photographerUsername: string; // Photographer's Unsplash username
  photographerUrl: string; // Link to photographer profile with UTM params
  downloadLocation: string; // API endpoint to trigger download event
  altDescription: string | null; // Alt text description from Unsplash
  usageNote: string | null; // Internal note on how we're using the image
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
  // Read API key at runtime (after environment variables are loaded)
  const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!unsplashAccessKey) {
    console.warn("Unsplash access key not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}/photos/random?query=${encodeURIComponent(query)}&orientation=${orientation}&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${unsplashAccessKey}`,
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
      photographerUsername: data.user.username,
      photographerUrl: `${data.user.links.html}?${UTM_PARAMS}`,
      downloadLocation: data.links.download_location,
      altDescription: data.alt_description || null,
      usageNote: 'Featured image for learning path',
    };
  } catch (error) {
    console.error("Error fetching Unsplash image:", error);
    return null;
  }
}

/**
 * Fetch image details from Unsplash by photo ID
 * @param photoId - Unsplash photo ID (e.g., "FHnnjk1Yj7Y" from the URL)
 * @returns UnsplashImage object with url and attribution data, or null if not found
 */
export async function fetchUnsplashImageById(
  photoId: string
): Promise<UnsplashImage | null> {
  const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!unsplashAccessKey) {
    console.warn("Unsplash access key not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}/photos/${photoId}`,
      {
        headers: {
          Authorization: `Client-ID ${unsplashAccessKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`Unsplash API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    return {
      photoId: data.id,
      url: data.urls.regular, // 1080px wide, good for cards
      photographer: data.user.name,
      photographerUsername: data.user.username,
      photographerUrl: `${data.user.links.html}?${UTM_PARAMS}`,
      downloadLocation: data.links.download_location,
      altDescription: data.alt_description || null,
      usageNote: null,
    };
  } catch (error) {
    console.error("Error fetching Unsplash image by ID:", error);
    return null;
  }
}

/**
 * Extract Unsplash photo ID from various URL formats
 * Supports:
 * - https://unsplash.com/photos/FHnnjk1Yj7Y
 * - https://unsplash.com/photos/some-slug-FHnnjk1Yj7Y
 * - Just the ID: FHnnjk1Yj7Y
 * @param input - URL or photo ID
 * @returns Photo ID or null if not valid
 */
export function extractUnsplashPhotoId(input: string): string | null {
  if (!input) return null;

  const trimmed = input.trim();

  // If it's a URL, extract the ID
  if (trimmed.includes('unsplash.com/photos/')) {
    // The ID is the last segment after /photos/
    // URLs can be /photos/ID or /photos/slug-ID
    const match = trimmed.match(/unsplash\.com\/photos\/(?:[^\/]+-)?([a-zA-Z0-9_-]+)(?:\?|$)/);
    if (match) {
      return match[1];
    }
    // Fallback: get the last path segment
    const segments = trimmed.split('/photos/')[1]?.split(/[?#]/)[0];
    if (segments) {
      // The ID is typically the last part after a hyphen, or the whole thing
      const parts = segments.split('-');
      return parts[parts.length - 1] || segments;
    }
  }

  // If it looks like just an ID (alphanumeric with possible underscores/hyphens)
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed) && trimmed.length >= 6 && trimmed.length <= 20) {
    return trimmed;
  }

  return null;
}

/**
 * Build Unsplash source URL with required UTM parameters
 * @returns Unsplash URL with UTM params
 */
export function buildUnsplashSourceUrl(): string {
  return `https://unsplash.com?${UTM_PARAMS}`;
}

/**
 * Trigger download event for Unsplash image
 * Required by Unsplash API guidelines when image is used
 * @param downloadLocation - Download location URL from Unsplash API
 */
export async function triggerUnsplashDownload(downloadLocation: string): Promise<void> {
  // Read API key at runtime (after environment variables are loaded)
  const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!unsplashAccessKey) {
    console.warn("Unsplash access key not configured");
    return;
  }

  try {
    await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${unsplashAccessKey}`,
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
