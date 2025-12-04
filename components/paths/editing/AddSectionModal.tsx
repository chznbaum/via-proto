"use client";

import { useState } from "react";
import toast from "react-hot-toast";

const PREREQUISITE_LEVELS = [
  {
    value: "required",
    label: "Required",
    description: "Must complete to proceed safely",
    color: "badge-error",
  },
  {
    value: "recommended",
    label: "Recommended",
    description: "Highly beneficial but skippable",
    color: "badge-warning",
  },
  {
    value: "optional",
    label: "Optional",
    description: "Enrichment / deeper dive",
    color: "badge-ghost",
  },
] as const;

interface AddSectionModalProps {
  pathId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (section: unknown) => void;
}

/**
 * Modal for adding a new section to a learning path
 */
export const AddSectionModal = ({
  pathId,
  isOpen,
  onClose,
  onSuccess,
}: AddSectionModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prerequisite_level: "required" as (typeof PREREQUISITE_LEVELS)[number]["value"],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }

      if (!formData.description.trim()) {
        throw new Error("Description is required");
      }

      const response = await fetch(`/api/paths/${pathId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          prerequisite_level: formData.prerequisite_level,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add section");
      }

      toast.success("Section added successfully");
      onSuccess(data.section);
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add section";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      prerequisite_level: "required",
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
          <h3 className="font-bold text-lg">Add Section</h3>
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
          {/* Title */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Title *</span>
            </label>
            <input
              type="text"
              placeholder="Section title"
              className="input input-bordered w-full"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              maxLength={500}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Description *</span>
            </label>
            <textarea
              placeholder="What will learners achieve in this section?"
              className="textarea textarea-bordered w-full"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              maxLength={2000}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Prerequisite Level */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Prerequisite Level *</span>
            </label>
            <div className="space-y-2">
              {PREREQUISITE_LEVELS.map((level) => (
                <label
                  key={level.value}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.prerequisite_level === level.value
                      ? "border-primary bg-primary/5"
                      : "border-base-300 hover:border-base-content/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="prerequisite_level"
                    className="radio radio-primary mt-0.5"
                    checked={formData.prerequisite_level === level.value}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        prerequisite_level: level.value,
                      })
                    }
                    disabled={isSubmitting}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{level.label}</span>
                      <span className={`badge badge-sm ${level.color}`}>
                        {level.value}
                      </span>
                    </div>
                    <p className="text-sm text-base-content/70 mt-0.5">
                      {level.description}
                    </p>
                  </div>
                </label>
              ))}
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
              disabled={
                isSubmitting || !formData.title || !formData.description
              }
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Adding...
                </>
              ) : (
                <>
                  <span className="iconify lucide--plus size-4" />
                  Add Section
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
