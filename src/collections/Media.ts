import type { CollectionConfig } from 'payload'
import { triggerUnsplashDownload } from '@/libs/unsplash'

/**
 * Media Collection
 *
 * Handles file uploads for the blog (images, etc.)
 * - In production: Files stored in Scaleway S3, served via BunnyCDN
 * - In development: Files stored locally in /media folder
 *
 * CDN URL transformation:
 * - S3 URL: https://viaproto-prod.s3.nl-ams.scw.cloud/blog/uploads/image.jpg
 * - CDN URL: https://cdn.viapro.to/blog/uploads/image.jpg
 */

// CDN URL helper - transforms S3 URLs to CDN URLs for serving
const getCdnUrl = (s3Url: string | undefined): string | undefined => {
  if (!s3Url) return undefined

  // Only transform if it's an S3 URL
  const cdnUrl = process.env.CDN_URL
  if (!cdnUrl) return s3Url

  // Production bucket
  if (s3Url.includes('viaproto-prod.s3.nl-ams.scw.cloud')) {
    return s3Url.replace('https://viaproto-prod.s3.nl-ams.scw.cloud', cdnUrl)
  }

  // Staging bucket
  if (s3Url.includes('viaproto-dev.s3.nl-ams.scw.cloud')) {
    const stagingCdnUrl = cdnUrl.replace('cdn.viapro.to', 'cdn-dev.viapro.to')
    return s3Url.replace('https://viaproto-dev.s3.nl-ams.scw.cloud', stagingCdnUrl)
  }

  return s3Url
}

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    description: 'Images and files for blog posts',
  },
  access: {
    // Public read access for all media
    read: () => true,
  },
  upload: {
    // Local storage directory (used when S3 is not configured)
    staticDir: 'media',
    // Accepted file types
    mimeTypes: ['image/*'],
    // Image size variants for responsive images
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 432,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1200,
        height: 660,
        position: 'centre',
      },
    ],
    // Show thumbnail in admin UI
    adminThumbnail: 'thumbnail',
    // Enable focal point selection for cropping
    focalPoint: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Describe the image for accessibility (screen readers) and SEO',
      },
    },
    // External URL for hotlinking (required by Unsplash for view tracking)
    {
      name: 'externalUrl',
      type: 'text',
      admin: {
        description: 'External image URL for hotlinking (e.g., Unsplash requires serving from their CDN)',
      },
    },
    // Attribution fields for stock images (Unsplash, Pixabay, Pexels, etc.)
    {
      name: 'attribution',
      type: 'group',
      admin: {
        description: 'Attribution for stock images (leave empty for original content)',
        hideGutter: true,
      },
      fields: [
        {
          name: 'creatorType',
          type: 'select',
          options: [
            { label: 'Photographer', value: 'photographer' },
            { label: 'Artist', value: 'artist' },
            { label: 'Creator', value: 'creator' },
          ],
          admin: {
            description: 'Type of creator (determines "Photo by" vs "Art by" vs "By")',
          },
        },
        {
          name: 'creatorName',
          type: 'text',
          admin: {
            description: 'Name of the photographer, artist, or creator',
          },
        },
        {
          name: 'creatorUrl',
          type: 'text',
          admin: {
            description: 'URL to their profile on the source platform',
          },
        },
        {
          name: 'sourceName',
          type: 'text',
          admin: {
            description: 'Source platform name (e.g., Unsplash, Pixabay, Pexels)',
          },
        },
        {
          name: 'sourceUrl',
          type: 'text',
          admin: {
            description: 'URL to the source platform (with UTM params if required)',
          },
        },
        {
          name: 'unsplashDownloadUrl',
          type: 'text',
          admin: {
            description: 'Unsplash download_location URL (for API compliance tracking)',
            condition: (data) => data?.attribution?.sourceName?.toLowerCase() === 'unsplash',
          },
        },
      ],
    },
    // Virtual field: CDN URL for serving images (populated by collection afterRead hook)
    {
      name: 'cdnUrl',
      type: 'text',
      virtual: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'CDN URL for serving this image (auto-generated)',
      },
    },
  ],
  hooks: {
    // Trigger Unsplash download event when media with Unsplash source is created/updated
    afterChange: [
      async ({ doc, operation }) => {
        // Only trigger on create or when the download URL is newly added
        if (operation === 'create' || operation === 'update') {
          const sourceName = doc?.attribution?.sourceName?.toLowerCase()
          const downloadUrl = doc?.attribution?.unsplashDownloadUrl

          if (sourceName === 'unsplash' && downloadUrl) {
            // Fire and forget - don't block the response
            triggerUnsplashDownload(downloadUrl).catch((err) => {
              console.error('Failed to trigger Unsplash download:', err)
            })
          }
        }

        return doc
      },
    ],
    // Add CDN URLs to all image sizes after reading
    afterRead: [
      async ({ doc }) => {
        if (!doc) return doc

        // Transform main URL
        if (doc.url) {
          doc.cdnUrl = getCdnUrl(doc.url)
        }

        // Transform image size URLs
        if (doc.sizes) {
          for (const sizeName of Object.keys(doc.sizes)) {
            const size = doc.sizes[sizeName]
            if (size?.url) {
              size.cdnUrl = getCdnUrl(size.url)
            }
          }
        }

        return doc
      },
    ],
  },
}
