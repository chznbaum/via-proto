"use client";

import { useState } from "react";
import toast from "react-hot-toast";

const RESOURCE_TYPES = [
  { value: "video", label: "Video", icon: "tabler--video" },
  { value: "article", label: "Article", icon: "tabler--file-text" },
  { value: "book", label: "Book", icon: "tabler--book" },
  { value: "project", label: "Project", icon: "tabler--tool" },
  { value: "audio", label: "Audio", icon: "tabler--headphones" },
  { value: "graphic", label: "Graphic", icon: "tabler--palette" },
  { value: "course", label: "Course", icon: "tabler--school" },
] as const;

interface AddResourceModalProps {
  pathId: string;
  sectionId: string;
  sectionTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (resource: unknown) => void;
}

/**
 * Modal for adding a new resource to a section
 */
export const AddResourceModal = ({
  pathId,
  sectionId,
  sectionTitle,
  isOpen,
  onClose,
  onSuccess,
}: AddResourceModalProps) => {
  const [formData, setFormData] = useState({
    url: "",
    type: "article" as (typeof RESOURCE_TYPES)[number]["value"],
    title: "",
    description: "",
    is_free: null as boolean | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate URL
      if (!formData.url.startsWith("http://") && !formData.url.startsWith("https://")) {
        throw new Error("URL must start with http:// or https://");
      }

      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }

      const response = await fetch(`/api/paths/${pathId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_id: sectionId,
          url: formData.url,
          type: formData.type,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          is_free: formData.is_free,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add resource");
      }

      toast.success("Resource added successfully");
      onSuccess(data.resource);
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add resource";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      url: "",
      type: "article",
      title: "",
      description: "",
      is_free: null,
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-lg">Add Resource</h3>
            <p className="text-sm text-base-content/70">
              to {sectionTitle}
            </p>
          </div>
          <button
            className="btn btn-sm btn-ghost btn-circle"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <span className="iconify lucide--x size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">URL *</span>
            </label>
            <input
              type="url"
              placeholder="https://example.com/resource"
              className="input input-bordered w-full"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              required
              disabled={isSubmitting}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                We&apos;ll fetch the link preview automatically
              </span>
            </label>
          </div>

          {/* Type */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Type *</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {RESOURCE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`btn btn-sm gap-1.5 ${
                    formData.type === type.value
                      ? "btn-primary"
                      : "btn-outline"
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, type: type.value })
                  }
                  disabled={isSubmitting}
                >
                  <span className={`iconify ${type.icon} size-4`} />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Title *</span>
            </label>
            <input
              type="text"
              placeholder="Resource title"
              className="input input-bordered w-full"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              maxLength={500}
              required
              disabled={isSubmitting}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                How should this resource appear in the path?
              </span>
            </label>
          </div>

          {/* Description */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Description</span>
              <span className="label-text-alt">Optional</span>
            </label>
            <textarea
              placeholder="Why is this resource helpful? When should learners use it?"
              className="textarea textarea-bordered w-full"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              maxLength={2000}
              disabled={isSubmitting}
            />
          </div>

          {/* Is Free */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Cost</span>
              <span className="label-text-alt">Optional</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`btn btn-sm ${
                  formData.is_free === true ? "btn-success" : "btn-outline"
                }`}
                onClick={() => setFormData({ ...formData, is_free: true })}
                disabled={isSubmitting}
              >
                Free
              </button>
              <button
                type="button"
                className={`btn btn-sm ${
                  formData.is_free === false ? "btn-warning" : "btn-outline"
                }`}
                onClick={() => setFormData({ ...formData, is_free: false })}
                disabled={isSubmitting}
              >
                Paid
              </button>
              <button
                type="button"
                className={`btn btn-sm ${
                  formData.is_free === null ? "btn-ghost btn-active" : "btn-ghost"
                }`}
                onClick={() => setFormData({ ...formData, is_free: null })}
                disabled={isSubmitting}
              >
                Unknown
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error">
              <span className="iconify lucide--alert-circle size-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !formData.url || !formData.title}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Adding...
                </>
              ) : (
                <>
                  <span className="iconify lucide--plus size-4" />
                  Add Resource
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={handleClose} />
    </div>
  );
};
