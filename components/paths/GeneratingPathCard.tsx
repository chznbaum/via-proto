"use client";

interface GeneratingPathCardProps {
  pathId: string;
  topicName: string;
  status: 'pending' | 'generating_metadata' | 'fetching_image' | 'curating_resources' | 'validating_links' | 'completed' | 'failed' | 'failed_metadata' | 'failed_image' | 'failed_sections';
  error?: string;
  onCancel?: (pathId: string) => void;
}

export function GeneratingPathCard({
  pathId,
  topicName,
  status,
  error,
  onCancel,
}: GeneratingPathCardProps) {
  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return 'Preparing your path...';
      case 'generating_metadata':
        return 'Creating title and description...';
      case 'fetching_image':
        return 'Finding the perfect cover image...';
      case 'curating_resources':
        return 'Gathering learning resources...';
      case 'validating_links':
        return 'Validating links and fetching previews...';
      case 'completed':
        return 'Ready to view!';
      case 'failed_metadata':
        return 'Metadata generation failed';
      case 'failed_image':
        return 'Image fetch failed (path still usable)';
      case 'failed_sections':
        return 'Resource curation failed';
      case 'failed':
        return error || 'Generation failed. Please try again.';
      default:
        return 'Generating...';
    }
  };

  const isTerminal = ['completed', 'failed', 'failed_metadata', 'failed_image', 'failed_sections'].includes(status);
  const isFailed = ['failed', 'failed_metadata', 'failed_image', 'failed_sections'].includes(status);

  const handleCancel = () => {
    if (onCancel && !isTerminal) {
      onCancel(pathId);
    }
  };

  return (
    <div className="card bg-base-100 shadow">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <p className="grow font-medium">
          {isFailed ? 'Generation Failed' : `Generating: ${topicName}`}
        </p>
      </div>

      {/* Content */}
      <div className="border-base-300 border-t border-dashed px-4 py-2.5">
        <p className="text-base-content/60 text-sm">
          Creating a personalized learning path for <span className="font-medium">{topicName}</span>
        </p>
        <p className="mt-3 font-medium">{getStatusMessage()}</p>

        {/* Skeleton loaders (only show when generating) */}
        {!isTerminal && (
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="rounded-box skeleton h-3 w-[50%]"></div>
            <div className="rounded-box skeleton h-3 w-[75%]"></div>
            <div className="rounded-box skeleton h-3 w-[60%]"></div>
          </div>
        )}

        {/* Error message */}
        {isFailed && error && (
          <div className="alert alert-error mt-2">
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-end gap-2 px-4 pt-2 pb-4">
        {!isTerminal && (
          <>
            <div className="tooltip" data-tip="Generating">
              <span className="iconify lucide--loader text-base-content/60 block size-4 animate-spin"></span>
            </div>
            <button
              className="btn btn-sm btn-error gap-2 border-none ms-auto"
              onClick={handleCancel}
            >
              <span className="iconify lucide--x-square size-4"></span>
              Cancel
            </button>
          </>
        )}
        {status === 'completed' && (
          <a href={`/paths/${pathId}`} className="btn btn-sm btn-primary ms-auto">
            <span className="iconify lucide--arrow-right size-4"></span>
            View Path
          </a>
        )}
        {isFailed && (
          <button
            className="btn btn-sm btn-ghost ms-auto"
            onClick={handleCancel}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
