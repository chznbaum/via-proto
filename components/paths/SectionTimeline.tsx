"use client";

import { useState } from "react";
import Link from "next/link";

interface Resource {
  id: string;
  title: string;
  description?: string;
  url: string;
  type: string;
  is_free?: boolean;
  estimated_minutes?: number;
  order: number;
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
}

const resourceTypeIcons: Record<string, string> = {
  video: "tabler--video",
  article: "tabler--file-text",
  book: "tabler--book",
  project: "tabler--tool",
  audio: "tabler--headphones",
  graphic: "tabler--palette",
};

export const SectionTimeline = ({ sections }: SectionTimelineProps) => {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );

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

  if (!sections || sections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-base-content/60">No sections found in this learning path.</p>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12 lg:py-16">
      <div className="text-center mb-8 md:mb-12">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <div className="bg-primary/80 h-4 w-0.5 rounded-full" />
          <p className="text-base-content/60 font-mono text-sm font-medium">
            Your Journey
          </p>
          <div className="bg-primary/80 h-4 w-0.5 rounded-full" />
        </div>
        <p className="text-2xl font-semibold sm:text-3xl">Learning Path</p>
        <p className="text-base-content/80 mt-2 max-w-lg mx-auto">
          Follow these sections in order to master the skills you need
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section, sectionIndex) => {
          const isOpen = openSections.has(section.id);
          const hasResources = section.resources && section.resources.length > 0;

          return (
            <div
              key={section.id}
              className="card bg-base-100 shadow-lg overflow-hidden">
              {/* Section Header - Always Visible */}
              <div
                className={`card-body cursor-pointer ${isOpen && hasResources ? "pb-4" : ""}`}
                onClick={() => toggleSection(section.id)}>
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
                        className={`iconify lucide--chevron-down size-5 transition-transform ${isOpen ? "rotate-180" : ""}`}></span>
                    </button>
                  )}
                </div>

                <h2 className="card-title text-2xl mt-2">{section.title}</h2>

                {section.description && (
                  <p className="text-base-content/70 mt-1">{section.description}</p>
                )}

                <div className="flex flex-wrap gap-3 text-sm text-base-content/60 mt-3">
                  {section.estimated_hours && (
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
                      }`}>
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
                  <div className="alert alert-info mt-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="stroke-current shrink-0 w-6 h-6">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{section.notes}</span>
                  </div>
                )}
              </div>

              {/* Collapsible Resources Timeline */}
              {isOpen && hasResources && (
                <div className="px-6 pb-6">
                  <div className="divider my-2"></div>
                  <ul className="timeline timeline-snap-icon timeline-vertical max-md:timeline-compact">
                    {section.resources.map((resource, resourceIndex) => (
                      <li key={resource.id}>
                        <div className="timeline-middle">
                          <div className="bg-primary text-primary-content flex items-center justify-center rounded-full p-1.5">
                            <span
                              className={`iconify ${
                                resourceTypeIcons[resource.type] || "tabler--link"
                              } size-4`}></span>
                          </div>
                        </div>
                        <div className="timeline-end mb-8">
                          <div className="card bg-base-200 p-4 hover:bg-base-300 transition-colors">
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:underline text-lg flex items-center gap-2">
                              {resource.title}
                              <span className="iconify lucide--external-link size-4"></span>
                            </a>
                            {resource.description && (
                              <p className="text-base-content/80 text-sm mt-2">
                                {resource.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="badge badge-sm capitalize">
                                {resource.type}
                              </span>
                              {resource.is_free !== null && (
                                <span
                                  className={`badge badge-sm ${
                                    resource.is_free ? "badge-success" : "badge-warning"
                                  }`}>
                                  {resource.is_free ? "Free" : "Paid"}
                                </span>
                              )}
                              {resource.estimated_minutes && (
                                <span className="badge badge-sm gap-1">
                                  <span className="iconify lucide--clock size-3"></span>
                                  {resource.estimated_minutes}m
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {resourceIndex < section.resources.length - 1 && <hr />}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
