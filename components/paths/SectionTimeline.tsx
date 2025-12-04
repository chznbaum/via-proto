"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  AddedByBadge,
  DeleteResourceButton,
  DeleteSectionButton,
  ResourceReorderControls,
  AddResourceModal,
  AddSectionModal,
} from "./editing";

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
  // Link validation and metadata fields
  link_status?: "active" | "broken" | "requires_login" | "unchecked";
  last_checked_at?: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  page_title?: string;
  favicon_url?: string;
  // User attribution for manually-added resources
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

interface SectionTimelineProps {
  sections: Section[];
  pathId?: string;
  isEditMode?: boolean;
  onSectionsChange?: (sections: Section[]) => void;
}

const resourceTypeIcons: Record<string, string> = {
  video: "tabler--video",
  article: "tabler--file-text",
  book: "tabler--book",
  project: "tabler--tool",
  audio: "tabler--headphones",
  graphic: "tabler--palette",
  course: "tabler--school",
};

export const SectionTimeline = ({
  sections: initialSections,
  pathId,
  isEditMode = false,
  onSectionsChange,
}: SectionTimelineProps) => {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(initialSections.map((s) => s.id))
  );
  const [addResourceModal, setAddResourceModal] = useState<{
    isOpen: boolean;
    sectionId: string;
    sectionTitle: string;
  }>({ isOpen: false, sectionId: "", sectionTitle: "" });
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Handle resource reordering
  const handleMoveResource = async (
    sectionId: string,
    resourceId: string,
    direction: "up" | "down"
  ) => {
    if (!pathId) return;

    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const resourceIndex = section.resources.findIndex(
      (r) => r.id === resourceId
    );
    if (resourceIndex === -1) return;

    const newIndex = direction === "up" ? resourceIndex - 1 : resourceIndex + 1;
    if (newIndex < 0 || newIndex >= section.resources.length) return;

    // Create new order array
    const newResources = [...section.resources];
    [newResources[resourceIndex], newResources[newIndex]] = [
      newResources[newIndex],
      newResources[resourceIndex],
    ];
    const newOrder = newResources.map((r) => r.id);

    // Optimistically update UI
    const updatedSections = sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            resources: newResources.map((r, i) => ({ ...r, order: i + 1 })),
          }
        : s
    );
    setSections(updatedSections);
    onSectionsChange?.(updatedSections);

    setIsReordering(true);

    try {
      const response = await fetch(`/api/paths/${pathId}/resources/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_id: sectionId,
          resource_order: newOrder,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reorder");
      }
    } catch (error) {
      // Revert on error
      setSections(sections);
      onSectionsChange?.(sections);
      toast.error(
        error instanceof Error ? error.message : "Failed to reorder resources"
      );
    } finally {
      setIsReordering(false);
    }
  };

  // Handle resource deletion
  const handleResourceDeleted = (sectionId: string, resourceId: string) => {
    const updatedSections = sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            resources: s.resources
              .filter((r) => r.id !== resourceId)
              .map((r, i) => ({ ...r, order: i + 1 })),
          }
        : s
    );
    setSections(updatedSections);
    onSectionsChange?.(updatedSections);
  };

  // Handle resource added
  const handleResourceAdded = (sectionId: string, resource: Resource) => {
    const updatedSections = sections.map((s) =>
      s.id === sectionId
        ? { ...s, resources: [...s.resources, resource] }
        : s
    );
    setSections(updatedSections);
    onSectionsChange?.(updatedSections);
  };

  // Handle section deleted
  const handleSectionDeleted = (sectionId: string) => {
    const updatedSections = sections
      .filter((s) => s.id !== sectionId)
      .map((s, i) => ({ ...s, order: i + 1 }));
    setSections(updatedSections);
    onSectionsChange?.(updatedSections);
  };

  // Handle section added
  const handleSectionAdded = (section: Section) => {
    const updatedSections = [...sections, section];
    setSections(updatedSections);
    onSectionsChange?.(updatedSections);
    // Open the new section
    setOpenSections((prev) => new Set([...prev, section.id]));
  };

  if (!sections || sections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-base-content/75">
          No sections found in this learning path.
        </p>
        {isEditMode && pathId && (
          <button
            onClick={() => setIsAddSectionModalOpen(true)}
            className="btn btn-primary btn-sm mt-4 gap-2"
          >
            <span className="iconify lucide--plus size-4" />
            Add First Section
          </button>
        )}

        {/* Add Section Modal */}
        {pathId && (
          <AddSectionModal
            pathId={pathId}
            isOpen={isAddSectionModalOpen}
            onClose={() => setIsAddSectionModalOpen(false)}
            onSuccess={(section) => handleSectionAdded(section as Section)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12 lg:py-16">
      <div className="text-center mb-8 md:mb-12">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <div className="bg-primary/80 h-4 w-0.5 rounded-full" />
          <p className="text-base-content/75 font-mono text-sm font-medium">
            Your Journey
          </p>
          <div className="bg-primary/80 h-4 w-0.5 rounded-full" />
        </div>
        <p className="text-2xl font-semibold sm:text-3xl">Learning Path</p>
        <p className="text-base-content/80 mt-2 max-w-lg mx-auto">
          Follow these sections in order to master the skills you need
        </p>
      </div>

      <div className="space-y-12 lg:space-y-16">
        {sections.map((section, sectionIndex) => {
          const isOpen = openSections.has(section.id);
          const hasResources = section.resources && section.resources.length > 0;

          return (
            <div key={section.id}>
              {/* Section Header - Always Visible */}
              <div className={`${hasResources ? "mb-6" : ""}`}>
                <div
                  className="cursor-pointer"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Section Number Badge */}
                    <div className="bg-primary/10 rounded-box inline-flex items-center gap-2.5 px-3 py-1.5 shrink-0">
                      <span className="iconify lucide--layers size-4"></span>
                      <p className="text-primary font-mono text-sm font-medium tracking-wider uppercase">
                        Section {sectionIndex + 1}
                      </p>
                    </div>

                    {/* Collapse Icon */}
                    {hasResources && (
                      <button className="btn btn-ghost btn-sm btn-circle ml-auto">
                        <span
                          className={`iconify lucide--chevron-down size-5 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        ></span>
                      </button>
                    )}
                  </div>

                  <h2 className="text-2xl font-semibold mt-3 sm:text-3xl">
                    {section.title}
                  </h2>

                  {section.description && (
                    <p className="text-base-content/70 mt-2">
                      {section.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-sm text-base-content/75 mt-3">
                    {section.estimated_hours !== undefined &&
                      section.estimated_hours > 0 && (
                        <span className="flex items-center gap-1.5">
                          <span className="iconify lucide--clock size-4"></span>
                          ~{section.estimated_hours}h
                        </span>
                      )}
                    {section.prerequisite_level && (
                      <div
                        className={`badge ${
                          section.prerequisite_level === "required"
                            ? "badge-error"
                            : section.prerequisite_level === "recommended"
                            ? "badge-warning"
                            : "badge-ghost"
                        }`}
                      >
                        {section.prerequisite_level}
                      </div>
                    )}
                    {hasResources && (
                      <span className="flex items-center gap-1.5">
                        <span className="iconify lucide--list size-4"></span>
                        {section.resources.length} resources
                      </span>
                    )}
                  </div>

                  {section.notes && (
                    <div className="alert mt-4">
                      <p>{section.notes}</p>
                    </div>
                  )}
                </div>

                {/* Edit Mode: Section Actions */}
                {isEditMode && pathId && (
                  <div className="flex items-center gap-2 mt-4">
                    <DeleteSectionButton
                      pathId={pathId}
                      sectionId={section.id}
                      sectionTitle={section.title}
                      resourceCount={section.resources?.length || 0}
                      onDelete={() => handleSectionDeleted(section.id)}
                    />
                  </div>
                )}
              </div>

              {/* Collapsible Resources Timeline */}
              {isOpen && hasResources && (
                <ul className="timeline timeline-snap-icon timeline-vertical max-md:timeline-compact mt-6 lg:mt-8">
                  {section.resources.map((resource, resourceIndex) => (
                    <li key={resource.id} className="-mt-2">
                      <div className="timeline-middle">
                        <div className="bg-primary text-primary-content flex items-center justify-center rounded-full p-1.5">
                          <span
                            className={`iconify ${
                              resourceTypeIcons[resource.type] || "tabler--link"
                            } size-5`}
                          ></span>
                        </div>
                      </div>
                      <div
                        className={`mx-4 mb-8 sm:mb-12 ${
                          resourceIndex % 2 === 0
                            ? "timeline-start md:text-end"
                            : "timeline-end max-md:-mt-9"
                        }`}
                      >
                        <div className="card bg-base-100 p-6 shadow hover:shadow-lg transition-shadow">
                          {/* Edit Mode: Resource Controls */}
                          {isEditMode && pathId && (
                            <div className="flex items-center justify-between mb-3 -mt-2">
                              <ResourceReorderControls
                                isFirst={resourceIndex === 0}
                                isLast={
                                  resourceIndex === section.resources.length - 1
                                }
                                onMoveUp={() =>
                                  handleMoveResource(
                                    section.id,
                                    resource.id,
                                    "up"
                                  )
                                }
                                onMoveDown={() =>
                                  handleMoveResource(
                                    section.id,
                                    resource.id,
                                    "down"
                                  )
                                }
                                disabled={isReordering}
                              />
                              <DeleteResourceButton
                                pathId={pathId}
                                resourceId={resource.id}
                                resourceTitle={resource.title}
                                onDelete={() =>
                                  handleResourceDeleted(section.id, resource.id)
                                }
                              />
                            </div>
                          )}

                          {/* Resource Title */}
                          <h3 className="font-semibold text-lg mb-2">
                            {resource.title}
                          </h3>

                          {/* Resource Description */}
                          {resource.description && (
                            <p className="text-base-content/80 text-sm mb-4">
                              {resource.description}
                            </p>
                          )}

                          {/* Link Status Warnings */}
                          {resource.link_status === "requires_login" && (
                            <div className="alert alert-warning mb-3">
                              <span className="iconify lucide--lock size-4"></span>
                              <span className="text-sm">May require login</span>
                            </div>
                          )}
                          {resource.link_status === "broken" && (
                            <div className="alert alert-error mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="iconify lucide--alert-circle size-4"></span>
                                <span className="text-sm">
                                  May be broken link
                                </span>
                              </div>
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(
                                  resource.title
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-ghost gap-1"
                              >
                                <span className="iconify lucide--search size-3"></span>
                                Search Web
                              </a>
                            </div>
                          )}

                          {/* Discord-style Link Preview */}
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border border-base-300 rounded-lg overflow-hidden hover:border-primary transition-colors"
                          >
                            {/* OG Image with optional title overlay */}
                            {resource.og_image_url &&
                              !resource.og_image_url.startsWith("data:") && (
                                <div className="relative bg-base-200">
                                  <img
                                    src={resource.og_image_url}
                                    alt={resource.og_title || resource.title}
                                    className="w-full h-48 object-cover"
                                    onError={(e) => {
                                      e.currentTarget.parentElement!.style.display =
                                        "none";
                                    }}
                                  />
                                  {resource.og_title &&
                                    resource.og_title !== resource.title && (
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                        <p className="text-white font-medium text-sm line-clamp-2">
                                          {resource.og_title}
                                        </p>
                                      </div>
                                    )}
                                </div>
                              )}

                            {/* Domain/Favicon Row */}
                            <div className="p-3 bg-base-200/50">
                              <div className="flex items-center gap-2 mb-2">
                                {resource.favicon_url &&
                                  !resource.favicon_url.startsWith("data:") && (
                                    <img
                                      src={resource.favicon_url}
                                      alt="Site icon"
                                      className="size-4 shrink-0"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  )}
                                <span className="text-xs text-base-content/75 font-mono uppercase tracking-wide">
                                  {(() => {
                                    try {
                                      return new URL(resource.url).hostname.replace(
                                        /^www\./,
                                        ""
                                      );
                                    } catch {
                                      return "External Link";
                                    }
                                  })()}
                                </span>
                                <span className="iconify lucide--external-link size-3 ml-auto text-base-content/40"></span>
                              </div>

                              {/* OG Title or Page Title */}
                              {(() => {
                                const displayTitle =
                                  resource.og_title || resource.page_title;
                                const showTitle =
                                  displayTitle &&
                                  !resource.og_image_url &&
                                  displayTitle !== resource.title;
                                return showTitle ? (
                                  <p className="font-medium text-sm mb-1 line-clamp-2">
                                    {displayTitle}
                                  </p>
                                ) : null;
                              })()}

                              {/* OG Description */}
                              {resource.og_description &&
                                resource.og_description !==
                                  resource.description && (
                                  <p className="text-xs text-base-content/70 line-clamp-2">
                                    {resource.og_description}
                                  </p>
                                )}
                            </div>
                          </a>

                          {/* Metadata Badges */}
                          <div className="flex flex-wrap gap-2 mt-4">
                            <span className="badge badge-sm capitalize">
                              {resource.type}
                            </span>
                            {resource.is_free !== null &&
                              resource.is_free !== undefined && (
                                <span
                                  className={`badge badge-sm ${
                                    resource.is_free
                                      ? "badge-success"
                                      : "badge-warning"
                                  }`}
                                >
                                  {resource.is_free
                                    ? "Free"
                                    : "May require payment"}
                                </span>
                              )}
                            {resource.estimated_minutes && (
                              <span className="badge badge-sm gap-1">
                                <span className="iconify lucide--clock size-3"></span>
                                {resource.estimated_minutes}m
                              </span>
                            )}
                            {/* Added By Badge */}
                            <AddedByBadge user={resource.added_by || null} />
                          </div>
                        </div>
                      </div>
                      <hr />
                    </li>
                  ))}
                </ul>
              )}

              {/* Edit Mode: Add Resource Button */}
              {isEditMode && pathId && isOpen && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() =>
                      setAddResourceModal({
                        isOpen: true,
                        sectionId: section.id,
                        sectionTitle: section.title,
                      })
                    }
                    className="btn btn-outline btn-sm gap-2"
                  >
                    <span className="iconify lucide--plus size-4" />
                    Add Resource to {section.title}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Mode: Add Section Button */}
      {isEditMode && pathId && (
        <div className="flex justify-center mt-12">
          <button
            onClick={() => setIsAddSectionModalOpen(true)}
            className="btn btn-primary gap-2"
          >
            <span className="iconify lucide--plus size-4" />
            Add Section
          </button>
        </div>
      )}

      {/* Modals */}
      {pathId && (
        <>
          <AddResourceModal
            pathId={pathId}
            sectionId={addResourceModal.sectionId}
            sectionTitle={addResourceModal.sectionTitle}
            isOpen={addResourceModal.isOpen}
            onClose={() =>
              setAddResourceModal({
                isOpen: false,
                sectionId: "",
                sectionTitle: "",
              })
            }
            onSuccess={(resource) =>
              handleResourceAdded(
                addResourceModal.sectionId,
                resource as Resource
              )
            }
          />

          <AddSectionModal
            pathId={pathId}
            isOpen={isAddSectionModalOpen}
            onClose={() => setIsAddSectionModalOpen(false)}
            onSuccess={(section) => handleSectionAdded(section as Section)}
          />
        </>
      )}
    </div>
  );
};
