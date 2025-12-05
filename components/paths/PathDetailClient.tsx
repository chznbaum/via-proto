"use client";

import { useState } from "react";
import Link from "next/link";
import { SectionTimeline } from "./SectionTimeline";
import { EditModeToggle } from "./editing/EditModeToggle";
import { RemixButton } from "./RemixButton";

interface Account {
  id: string;
  name: string;
  account_type: string;
}

interface AddedByUser {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface Resource {
  id: string;
  title: string;
  description?: string;
  url: string;
  type: string;
  is_free?: boolean;
  estimated_minutes?: number;
  order: number;
  link_status?: "active" | "broken" | "requires_login" | "unchecked";
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  page_title?: string;
  favicon_url?: string;
  added_by_user_id?: string | null;
  added_by?: AddedByUser | null;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  estimated_hours?: number;
  prerequisite_level?: string;
  notes?: string;
  order: number;
  resources: Resource[];
}

interface ForkedFrom {
  id: string;
  title: string;
  creator?: {
    id: string;
    name: string;
  } | null;
}

interface ResourceProgressItem {
  resource_id: string;
  status: string;
  notes?: string | null;
}

interface PathDetailClientProps {
  pathId: string;
  pathTitle: string;
  sections: Section[];
  canEdit: boolean;
  accounts: Account[];
  forkedFrom?: ForkedFrom | null;
  hasAccessToSource?: boolean;
  isTracking?: boolean;
  resourceProgress?: ResourceProgressItem[];
}

/**
 * Client component for path detail page
 * Handles edit mode state and renders editable sections
 */
export const PathDetailClient = ({
  pathId,
  pathTitle,
  sections: initialSections,
  canEdit,
  accounts,
  forkedFrom,
  hasAccessToSource = false,
  isTracking = false,
  resourceProgress = [],
}: PathDetailClientProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [sections, setSections] = useState(initialSections);

  return (
    <>
      {/* Forked From Badge */}
      {forkedFrom && (
        <div className="alert alert-info mb-6 print-hidden">
          <span className="iconify lucide--git-branch size-4" />
          <span>
            Remixed from{" "}
            {hasAccessToSource ? (
              <Link
                href={`/paths/${forkedFrom.id}`}
                className="font-medium underline hover:no-underline"
              >
                {forkedFrom.title}
              </Link>
            ) : (
              <span className="font-medium">{forkedFrom.title}</span>
            )}
            {forkedFrom.creator && (
              <> by {forkedFrom.creator.name}</>
            )}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mb-6 print-hidden">
        {canEdit && (
          <EditModeToggle
            isEditMode={isEditMode}
            onToggle={() => setIsEditMode(!isEditMode)}
          />
        )}
        {accounts.length > 0 && (
          <RemixButton
            pathId={pathId}
            pathTitle={pathTitle}
            accounts={accounts}
          />
        )}
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="alert alert-warning mb-6 print-hidden">
          <span className="iconify lucide--pencil size-4" />
          <span>
            <strong>Edit Mode</strong> - Add, remove, or reorder resources and sections.
            Changes are saved automatically.
          </span>
        </div>
      )}

      {/* Sections Timeline */}
      {sections && sections.length > 0 && (
        <SectionTimeline
          sections={sections}
          pathId={pathId}
          isEditMode={isEditMode}
          onSectionsChange={setSections}
          isTracking={isTracking}
          resourceProgress={resourceProgress}
        />
      )}
    </>
  );
};
