/**
 * RichText Component
 *
 * Renders Payload CMS Lexical rich text content as React components.
 * Uses the official @payloadcms/richtext-lexical/react renderer.
 */

import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

interface RichTextProps {
  /** Lexical editor state from Payload CMS */
  content: SerializedEditorState
  /** Additional CSS classes for the container */
  className?: string
}

/**
 * Renders Lexical rich text content from Payload CMS
 *
 * @example
 * ```tsx
 * <RichText content={post.content} className="prose-lg" />
 * ```
 */
export function RichText({ content, className = '' }: RichTextProps) {
  if (!content) return null

  return (
    <div className={`prose prose-base-content max-w-none ${className}`}>
      <PayloadRichText data={content} />
    </div>
  )
}

export default RichText
