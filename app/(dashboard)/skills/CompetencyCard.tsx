'use client';

interface CompetencyCardProps {
  competency: {
    id: string;
    proficiency_level: 'none' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
    notes: string | null;
    assessed_at: string;
    competency: {
      name: string;
      slug: string;
      description: string | null;
      category: {
        name: string;
        slug: string;
        icon: string | null;
      } | null;
    };
  };
  onDelete: () => void;
  onEdit: () => void;
}

const proficiencyConfig = {
  expert: {
    label: 'Expert',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    badgeClass: 'badge-warning',
    icon: 'lucide--trophy',
  },
  advanced: {
    label: 'Advanced',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    badgeClass: 'badge-success',
    icon: 'lucide--trending-up',
  },
  intermediate: {
    label: 'Intermediate',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    badgeClass: 'badge-info',
    icon: 'lucide--activity',
  },
  beginner: {
    label: 'Beginner',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    badgeClass: 'badge-secondary',
    icon: 'lucide--sprout',
  },
  none: {
    label: 'None',
    color: 'text-base-content/40',
    bgColor: 'bg-base-200',
    badgeClass: 'badge-ghost',
    icon: 'lucide--circle-dashed',
  },
};

export function CompetencyCard({ competency, onDelete, onEdit }: CompetencyCardProps) {
  const config = proficiencyConfig[competency.proficiency_level];

  return (
    <div className="card bg-base-100 shadow transition-all hover:shadow-md">
      <div className="card-body p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {competency.competency.category?.icon && (
                <span
                  className={`iconify ${competency.competency.category.icon} size-4 text-base-content/60`}
                ></span>
              )}
              <h3 className="font-medium leading-tight">
                {competency.competency.name}
              </h3>
            </div>
            {competency.competency.category && (
              <p className="text-base-content/60 mt-1 text-xs">
                {competency.competency.category.name}
              </p>
            )}
          </div>

          {/* Actions Dropdown */}
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-xs btn-ghost btn-circle">
              <span className="iconify lucide--more-vertical size-4"></span>
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
            >
              <li>
                <button onClick={onEdit}>
                  <span className="iconify lucide--pencil size-4"></span>
                  Edit
                </button>
              </li>
              <li>
                <button onClick={onDelete} className="text-error">
                  <span className="iconify lucide--trash-2 size-4"></span>
                  Remove
                </button>
              </li>
            </ul>
          </div>
        </div>

        {competency.competency.description && (
          <p className="text-base-content/60 mt-2 text-sm line-clamp-2">
            {competency.competency.description}
          </p>
        )}

        {/* Proficiency Badge */}
        <div className="mt-3 flex items-center gap-2">
          <div className={`${config.bgColor} rounded-box flex items-center gap-1.5 px-2 py-1`}>
            <span className={`iconify ${config.icon} ${config.color} size-3.5`}></span>
            <span className="text-sm font-medium">{config.label}</span>
          </div>
        </div>

        {/* Notes */}
        {competency.notes && (
          <div className="mt-2 text-xs text-base-content/50 line-clamp-2">
            <span className="iconify lucide--sticky-note size-3 inline"></span> {competency.notes}
          </div>
        )}

        {/* Last Assessed */}
        <div className="mt-2 text-xs text-base-content/40">
          <span className="iconify lucide--clock size-3 inline"></span> Updated{' '}
          {new Date(competency.assessed_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
