"use client";

interface GeneratingPathCardProps {
  pathId: string;
  topicName: string;
  status: 'pending' | 'generating_metadata' | 'fetching_image' | 'curating_resources' | 'completed' | 'failed';
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
        return 'Initializing generation...';
      case 'generating_metadata':
        return 'Crafting title and description...';
      case 'fetching_image':
        return 'Finding the perfect featured image...';
      case 'curating_resources':
        return 'Curating learning resources from across the web...';
      case 'completed':
        return 'Generation complete!';
      case 'failed':
        return error || 'Generation failed. Please try again.';
      default:
        return 'Generating...';
    }
  };

  const getIcon = () => {
    if (status === 'failed') {
      return 'lucide--alert-circle text-error';
    }
    if (status === 'completed') {
      return 'lucide--check-circle text-success';
    }
    return 'lucide--sparkles text-primary';
  };

  const getTimeEstimate = () => {
    switch (status) {
      case 'pending':
      case 'generating_metadata':
        return '~30s remaining';
      case 'fetching_image':
        return '~20s remaining';
      case 'curating_resources':
        return '~10s remaining';
      default:
        return '';
    }
  };

  const handleCancel = () => {
    if (onCancel && status !== 'completed' && status !== 'failed') {
      onCancel(pathId);
    }
  };

  return (
    <div className="card bg-base-100 shadow">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className={`iconify ${getIcon()} size-4`}></span>
        <p className="grow font-medium">
          {status === 'failed' ? 'Generation Failed' : `Generating: ${topicName}`}
        </p>
        <p className="text-base-content/40 text-xs font-medium max-sm:hidden">
          {getTimeEstimate()}
        </p>
      </div>

      {/* Content */}
      <div className="border-base-300 border-t border-dashed px-4 py-2.5">
        <p className="text-base-content/60 text-sm">
          Creating a personalized learning path for <span className="font-medium">{topicName}</span>
        </p>
        <p className="mt-3 font-medium">{getStatusMessage()}</p>

        {/* Skeleton loaders (only show when generating) */}
        {status !== 'failed' && status !== 'completed' && (
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="rounded-box skeleton h-3 w-[50%]"></div>
            <div className="rounded-box skeleton h-3 w-[75%]"></div>
            <div className="rounded-box skeleton h-3 w-[60%]"></div>
          </div>
        )}

        {/* Error message */}
        {status === 'failed' && error && (
          <div className="alert alert-error mt-2">
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-end gap-2 px-4 pt-2 pb-4">
        {status !== 'failed' && status !== 'completed' && (
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
        {status === 'failed' && (
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
