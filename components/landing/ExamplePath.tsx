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

const resourceTypeIcons: Record<string, string> = {
  video: "tabler--video",
  article: "tabler--file-text",
  book: "tabler--book",
  project: "tabler--tool",
  audio: "tabler--headphones",
  graphic: "tabler--palette",
};

const sectionsData: Section[] = [
  {
      "id": "dbeedcf1-9f4a-4e30-80ea-3425cf43a4d0",
      "title": "React Fundamentals and Component Architecture",
      "description": "Learn core React concepts including JSX, components, props, and the component lifecycle. Build your first interactive components and understand React's declarative approach to UI development.",
      "estimated_hours": 12,
      "prerequisite_level": "required",
      "notes": "Given your advanced JavaScript knowledge, you'll move quickly through these fundamentals. Focus on React's specific patterns and paradigms rather than JavaScript syntax. Complete at least two small projects before moving to the next section.",
      "order": 1,
      "resources": [
          {
          "id": "0727b7e3-62d0-4d6a-9096-dda2081ec381",
          "title": "React Official Tutorial: Tic-Tac-Toe",
          "description": "Official hands-on tutorial from React team that teaches core concepts through building an interactive game. Best starting point for understanding React's component model and state.",
          "url": "https://react.dev/learn/tutorial-tic-tac-toe",
          "type": "article",
          "is_free": true,
          "estimated_minutes": 120,
          "order": 1
          },
          {
          "id": "2c6d1118-3117-414d-b348-531640c28320",
          "title": "React Components and Props - Full Course",
          "description": "Comprehensive video course covering component creation, props passing, and composition patterns. Includes practical examples and common pitfalls to avoid.",
          "url": "https://www.youtube.com/watch?v=Ke90Tje7VS0",
          "type": "video",
          "is_free": true,
          "estimated_minutes": 180,
          "order": 2
          },
          {
          "id": "fa00b2b1-409a-42f8-80bb-82fd27d4cdf6",
          "title": "Thinking in React - Official Guide",
          "description": "Essential reading that teaches React's mental model for breaking down UIs into components. Learn how to structure component hierarchies and data flow effectively.",
          "url": "https://react.dev/learn/thinking-in-react",
          "type": "article",
          "is_free": true,
          "estimated_minutes": 45,
          "order": 3
          },
          {
          "id": "9a3c96f1-6937-4ad5-baa2-73a03e0be2d2",
          "title": "React JSX In Depth",
          "description": "Deep dive into JSX syntax, expressions, and how React transforms JSX into JavaScript. Understand the power and limitations of JSX for building UIs.",
          "url": "https://react.dev/learn/writing-markup-with-jsx",
          "type": "article",
          "is_free": true,
          "estimated_minutes": 40,
          "order": 4
          },
          {
          "id": "d6017385-c2b9-4875-ac7a-5f0cd7bb8e17",
          "title": "Project: Build a Movie Search App",
          "description": "Hands-on project building a real movie search application using the OMDB API. Apply component composition, props, and basic interactivity in a practical context.",
          "url": "https://www.youtube.com/watch?v=b9eMGE7QtTk",
          "type": "project",
          "is_free": true,
          "estimated_minutes": 240,
          "order": 5
          },
          {
          "id": "2e6610a2-e17c-4158-9330-8ddb1e72e210",
          "title": "React Component Patterns - Visual Guide",
          "description": "Interactive visual guide to common React patterns including composition, container/presentational components, and component communication strategies.",
          "url": "https://www.patterns.dev/react",
          "type": "graphic",
          "is_free": true,
          "estimated_minutes": 90,
          "order": 6
          }
      ]
  }
]
export const ExamplePath = () => {
    return (
      <div
        className="group/section relative z-10 container mx-auto max-w-7xl scroll-mt-12 py-8 md:py-12 lg:py-16 2xl:py-28"
        id="features">
        <p className="group-hover/section:text-primary text-base-content/60 text-center text-[12px] font-medium tracking-[1px] uppercase transition-all duration-300 group-hover/section:tracking-[2px]">
          Personalized Curriculum
        </p>
        <h2 className="mt-2 text-center text-2xl font-semibold sm:text-3xl">Everything you need, nothing you don’t</h2>
        <div className="mt-2 flex justify-center text-center">
            <p className="text-base-content/80 max-w-lg">
              Learning paths take your starting point into consideration so they always feel tailored to meet your specific needs.
            </p>
        </div>
        <div className="mt-8">
          <div className="mockup-browser border border-base-300 bg-base-200 max-w-7xl mx-auto rounded-[9px]">
            {/* Browser toolbar */}
            <div className="mockup-browser-toolbar">
              <div className="input border-base-300 flex-1">https://viapro.to/paths/this-could-be-yours</div>
            </div>

            {/* Scrollable content area */}
            <div className="px-2 sm:p-8 py-6 h-120 bg-base-100 overflow-y-auto">
              {sectionsData.map((section, sectionIndex) => {
                const hasResources = section.resources && section.resources.length > 0;

                return (
                  <div key={section.id}>
                    {/* Section Header */}
                    <div className={`${hasResources ? "mb-6" : ""}`}>
                      <div className="flex items-start gap-4">
                        {/* Section Number Badge */}
                        <div className="bg-primary/10 rounded-box inline-flex items-center gap-2.5 px-3 py-1.5 shrink-0">
                          <span className="iconify lucide--layers size-4"></span>
                          <p className="text-primary font-mono text-sm font-medium tracking-wider uppercase">
                            Section {sectionIndex + 1}
                          </p>
                        </div>
                      </div>

                      <h2 className="text-2xl font-semibold mt-3 sm:text-3xl">{section.title}</h2>

                      {section.description && (
                        <p className="text-base-content/70 mt-2">{section.description}</p>
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
                        <div className="alert mt-4">
                          <p>{section.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Resources Timeline - Always Open */}
                    {hasResources && (
                      <ul className="timeline timeline-snap-icon timeline-vertical max-md:timeline-compact mt-6 lg:mt-8">
                        {section.resources.map((resource, resourceIndex) => (
                          <li key={resource.id} className="-mt-2">
                            <div className="timeline-middle">
                              <div className="bg-primary text-primary-content flex items-center justify-center rounded-full p-1.5">
                                <span
                                  className={`iconify ${
                                    resourceTypeIcons[resource.type] || "tabler--link"
                                  } size-5`}></span>
                              </div>
                            </div>
                            <div
                              className={`mx-4 mb-8 sm:mb-12 ${
                                resourceIndex % 2 === 0
                                  ? "timeline-start md:text-end"
                                  : "timeline-end max-md:-mt-9"
                              }`}>
                              <div className="card bg-base-100 p-6 shadow hover:shadow-lg transition-shadow">
                                <p className="font-medium text-lg flex items-center gap-2 underline">
                                  {resource.title}
                                </p>
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
                            <hr />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
};
