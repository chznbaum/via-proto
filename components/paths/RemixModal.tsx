"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Account {
  id: string;
  name: string;
  account_type: string;
}

interface RemixModalProps {
  pathId: string;
  pathTitle: string;
  accounts: Account[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal for remixing a learning path
 * Allows selecting target account and customizing title
 */
export const RemixModal = ({
  pathId,
  pathTitle,
  accounts,
  isOpen,
  onClose,
}: RemixModalProps) => {
  const router = useRouter();
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts[0]?.id || ""
  );
  const [title, setTitle] = useState(`Remix of ${pathTitle}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/paths/${pathId}/remix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_account_id: selectedAccountId,
          title: title.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remix path");
      }

      toast.success("Path remixed successfully!");
      onClose();

      // Navigate to the new path
      router.push(`/paths/${data.pathId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remix path";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle(`Remix of ${pathTitle}`);
    setSelectedAccountId(accounts[0]?.id || "");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="iconify lucide--git-branch size-5" />
              Remix Path
            </h3>
            <p className="text-sm text-base-content/70 mt-1">
              Create your own copy to customize
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
          {/* Title */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Title</span>
            </label>
            <input
              type="text"
              placeholder="Enter a title for your remix"
              className="input input-bordered w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={500}
              disabled={isSubmitting}
            />
          </div>

          {/* Account Selection */}
          {accounts.length > 1 && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Save to account</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                disabled={isSubmitting}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                    {account.account_type === "team" && " (Team)"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Info */}
          <div className="alert">
            <span className="iconify lucide--info size-4" />
            <span className="text-sm">
              This will create your own copy that you can edit freely.
            </span>
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Creating...
                </>
              ) : (
                <>
                  <span className="iconify lucide--git-branch size-4" />
                  Create Remix
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
