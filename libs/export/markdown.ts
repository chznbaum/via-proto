/**
 * Markdown export utility for learning paths
 */

import type { ExportPath, ExportResource, ExportSection } from './types';

/**
 * Format duration for display
 */
function formatDuration(minutes: number | null): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get emoji for resource type
 */
function getResourceTypeEmoji(type: ExportResource['type']): string {
  const emojis: Record<ExportResource['type'], string> = {
    video: '🎬',
    article: '📄',
    book: '📚',
    project: '💻',
    audio: '🎧',
    graphic: '🖼️',
    course: '🎓',
  };
  return emojis[type] || '📌';
}

/**
 * Format a single resource as Markdown
 */
function formatResource(resource: ExportResource): string {
  const emoji = getResourceTypeEmoji(resource.type);
  const duration = formatDuration(resource.estimated_minutes);
  const freeLabel = resource.is_free ? 'free' : resource.is_free === false ? 'paid' : '';

  const meta = [resource.type, duration, freeLabel].filter(Boolean).join(', ');

  let line = `- [ ] ${emoji} [${resource.title}](${resource.url})`;
  if (meta) {
    line += ` *(${meta})*`;
  }

  if (resource.description) {
    line += `\n  > ${resource.description}`;
  }

  return line;
}

/**
 * Format a section as Markdown
 */
function formatSection(section: ExportSection, index: number): string {
  const lines: string[] = [];

  // Section header
  const hoursLabel = section.estimated_hours === 1 ? 'hour' : 'hours';
  lines.push(`## ${index + 1}. ${section.title} *(${section.estimated_hours} ${hoursLabel})*`);
  lines.push('');

  // Description
  if (section.description) {
    lines.push(section.description);
    lines.push('');
  }

  // Notes (if any)
  if (section.notes) {
    lines.push(`> **Notes:** ${section.notes}`);
    lines.push('');
  }

  // Prerequisite level badge
  if (section.prerequisite_level !== 'required') {
    const levelLabel = section.prerequisite_level === 'recommended'
      ? '📝 Recommended'
      : '💡 Optional';
    lines.push(`*${levelLabel}*`);
    lines.push('');
  }

  // Resources
  if (section.resources.length > 0) {
    lines.push('### Resources');
    lines.push('');
    section.resources.forEach((resource) => {
      lines.push(formatResource(resource));
    });
  }

  return lines.join('\n');
}

/**
 * Generate Markdown content from a learning path
 */
export function generateMarkdown(path: ExportPath): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${path.title}`);
  lines.push('');

  // Metadata table
  lines.push(`| | |`);
  lines.push(`|---|---|`);
  lines.push(`| **Topic** | ${path.topic.name} |`);
  if (path.topic.category?.name) {
    lines.push(`| **Category** | ${path.topic.category.name} |`);
  }
  lines.push(`| **Skill Level** | ${path.skill_level.charAt(0).toUpperCase() + path.skill_level.slice(1)} |`);
  lines.push(`| **Estimated Time** | ${path.total_estimated_hours} hours |`);
  if (path.creator?.name) {
    lines.push(`| **Created By** | ${path.creator.name} |`);
  }
  lines.push(`| **Created** | ${new Date(path.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} |`);
  lines.push('');

  // Description
  if (path.description) {
    lines.push('> ' + path.description.split('\n').join('\n> '));
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // Sections
  path.sections.forEach((section, index) => {
    lines.push(formatSection(section, index));
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  // Footer
  lines.push(`*Exported from [ViaProto](https://viapro.to/paths/${path.id})*`);

  return lines.join('\n');
}

/**
 * Generate filename for export
 */
export function generateFilename(path: ExportPath, extension: string): string {
  const slug = path.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  return `${slug}.${extension}`;
}
