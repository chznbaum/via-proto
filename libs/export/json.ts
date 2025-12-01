/**
 * JSON export utility for learning paths
 */

import type { ExportPath } from './types';

/**
 * Structure for JSON export - clean, portable format
 */
export interface ExportedPathJSON {
  version: '1.0';
  exportedAt: string;
  source: string;
  path: {
    id: string;
    title: string;
    description: string;
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    totalEstimatedHours: number;
    createdAt: string;
    topic: {
      name: string;
      category: string | null;
    };
    creator: string | null;
    sections: Array<{
      order: number;
      title: string;
      description: string;
      prerequisiteLevel: 'required' | 'recommended' | 'optional';
      notes: string | null;
      estimatedHours: number;
      resources: Array<{
        order: number;
        title: string;
        url: string;
        type: string;
        isFree: boolean | null;
        description: string;
        estimatedMinutes: number | null;
      }>;
    }>;
  };
}

/**
 * Generate JSON export from a learning path
 * Converts to a clean, documented structure with camelCase keys
 */
export function generateJSON(path: ExportPath): ExportedPathJSON {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    source: `https://viapro.to/paths/${path.id}`,
    path: {
      id: path.id,
      title: path.title,
      description: path.description,
      skillLevel: path.skill_level,
      totalEstimatedHours: path.total_estimated_hours,
      createdAt: path.created_at,
      topic: {
        name: path.topic.name,
        category: path.topic.category?.name || null,
      },
      creator: path.creator?.name || null,
      sections: path.sections.map((section) => ({
        order: section.order,
        title: section.title,
        description: section.description,
        prerequisiteLevel: section.prerequisite_level,
        notes: section.notes,
        estimatedHours: section.estimated_hours,
        resources: section.resources.map((resource) => ({
          order: resource.order,
          title: resource.title,
          url: resource.url,
          type: resource.type,
          isFree: resource.is_free,
          description: resource.description,
          estimatedMinutes: resource.estimated_minutes,
        })),
      })),
    },
  };
}

/**
 * Stringify JSON with pretty formatting
 */
export function stringifyJSON(data: ExportedPathJSON): string {
  return JSON.stringify(data, null, 2);
}
