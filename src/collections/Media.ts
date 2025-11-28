import type { CollectionConfig } from 'payload'

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
    // Virtual field: CDN URL for serving images
    {
      name: 'cdnUrl',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'CDN URL for serving this image',
      },
      hooks: {
        afterRead: [
          ({ data }) => {
            return getCdnUrl(data?.url)
          },
        ],
      },
    },
  ],
  hooks: {
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
