'use client';

import Link from 'next/link';
import { useState } from 'react';

interface PathCardProps {
  path: {
    id: string;
    title: string;
    description: string;
    skill_level: string;
    total_estimated_hours: number;
    is_public: boolean;
    view_count: number;
    created_at: string;
    topic: {
      name: string;
      category: string;
    };
    creator: {
      name: string | null;
    };
  };
  isOwner?: boolean;
  onDelete?: (id: string) => void;
}

export default function PathCard({ path, isOwner, onDelete }: PathCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this learning path?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/paths/${path.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete?.(path.id);
      } else {
        alert('Failed to delete path');
      }
    } catch (error) {
      console.error('Error deleting path:', error);
      alert('Failed to delete path');
    } finally {
      setIsDeleting(false);
    }
  };

  const skillLevelColors = {
    beginner: 'badge-success',
    intermediate: 'badge-warning',
    advanced: 'badge-error',
  };

  const skillLevelColor =
    skillLevelColors[path.skill_level as keyof typeof skillLevelColors] ||
    'badge-neutral';

  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
      <div className="card-body">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <Link
              href={`/paths/${path.id}`}
              className="card-title hover:underline text-lg mb-2"
            >
              {path.title}
            </Link>
          </div>
          {isOwner && (
            <div className="dropdown dropdown-end">
              <button
                tabIndex={0}
                className="btn btn-ghost btn-sm btn-circle"
                disabled={isDeleting}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="w-5 h-5 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
              >
                <li>
                  <Link href={`/paths/${path.id}/edit`}>Edit</Link>
                </li>
                <li>
                  <button onClick={handleDelete} className="text-error">
                    Delete
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          <div className="badge badge-primary">{path.topic.name}</div>
          <div className={`badge ${skillLevelColor}`}>
            {path.skill_level.charAt(0).toUpperCase() +
              path.skill_level.slice(1)}
          </div>
          {path.is_public && <div className="badge badge-ghost">Public</div>}
        </div>

        <p className="text-sm text-base-content/70 line-clamp-2">
          {path.description}
        </p>

        <div className="card-actions justify-between items-center mt-4">
          <div className="flex gap-4 text-xs text-base-content/60">
            <span className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {path.total_estimated_hours}h
            </span>
            <span className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {path.view_count}
            </span>
          </div>

          <Link href={`/paths/${path.id}`} className="btn btn-sm btn-primary">
            View Path
          </Link>
        </div>
      </div>
    </div>
  );
}
