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
      category?: {
        name: string;
        slug: string;
        icon?: string;
      };
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="card bg-base-100 shadow">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <p className="grow font-medium">{path.title}</p>
        {isOwner && (
          <div className="dropdown dropdown-end">
            <button
              tabIndex={0}
              className="btn btn-ghost btn-xs btn-circle"
              disabled={isDeleting}
            >
              <span className="iconify lucide--more-vertical size-4"></span>
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <Link href={`/paths/${path.id}/edit`}>
                  <span className="iconify lucide--pencil size-4"></span>
                  Edit
                </Link>
              </li>
              <li>
                <button onClick={handleDelete} className="text-error">
                  <span className="iconify lucide--trash-2 size-4"></span>
                  Delete
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="border-base-300 border-t border-dashed px-4 py-2.5">
        <p className="text-base-content/60 text-sm line-clamp-2">
          {path.description}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="badge badge-sm badge-primary">{path.topic.name}</div>
          <div className="badge badge-sm badge-ghost">
            {path.skill_level.charAt(0).toUpperCase() + path.skill_level.slice(1)}
          </div>
          {path.is_public && (
            <div className="badge badge-sm badge-ghost">
              <span className="iconify lucide--globe size-3"></span>
              Public
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-base-content/60">
          <span className="flex items-center gap-1">
            <span className="iconify lucide--clock size-3.5"></span>
            {path.total_estimated_hours}h
          </span>
          <span className="flex items-center gap-1">
            <span className="iconify lucide--eye size-3.5"></span>
            {path.view_count} views
          </span>
          {path.creator.name && (
            <span className="flex items-center gap-1">
              <span className="iconify lucide--user size-3.5"></span>
              {path.creator.name}
            </span>
          )}
          <span className="text-base-content/40 text-xs font-medium max-sm:hidden">
            {formatDate(path.created_at)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-end justify-end gap-2 px-4 pt-2 pb-4">
        <Link href={`/paths/${path.id}`} className="btn btn-sm btn-primary gap-2">
          <span className="iconify lucide--arrow-right size-4"></span>
          View Path
        </Link>
      </div>
    </div>
  );
}
