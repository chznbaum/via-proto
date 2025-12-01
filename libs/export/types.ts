/**
 * Types for learning path export functionality
 */

export interface ExportResource {
  order: number;
  title: string;
  url: string;
  type: 'video' | 'article' | 'book' | 'project' | 'audio' | 'graphic' | 'course';
  is_free: boolean | null;
  description: string;
  estimated_minutes: number | null;
}

export interface ExportSection {
  order: number;
  title: string;
  description: string;
  prerequisite_level: 'required' | 'recommended' | 'optional';
  notes: string | null;
  estimated_hours: number;
  resources: ExportResource[];
}

export interface ExportPath {
  id: string;
  title: string;
  description: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  total_estimated_hours: number;
  created_at: string;
  topic: {
    name: string;
    category?: {
      name: string;
    } | null;
  };
  creator?: {
    name: string | null;
  } | null;
  sections: ExportSection[];
}

export type ExportFormat = 'markdown' | 'json' | 'pdf';
