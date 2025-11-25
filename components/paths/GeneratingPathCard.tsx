"use client";

interface GeneratingPathCardProps {
  pathId: string;
  topicName: string;
  status: 'pending' | 'generating_metadata' | 'fetching_image' | 'researching_resources' | 'curating_resources' | 'validating' | 'validating_links' | 'replacing_broken_resources' | 'enriching_sections' | 'completed' | 'cancelled' | 'failed' | 'failed_metadata' | 'failed_image' | 'failed_research' | 'failed_sections' | 'failed_validation' | 'failed_link_validation' | 'failed_replacement' | 'failed_enrichment';
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
      case 'researching_resources':
        return 'Searching the web for high-quality resources...';
      case 'curating_resources':
        return 'Organizing resources into learning sections...';
      case 'validating':
        return 'Performing quality checks...';
      case 'validating_links':
        return 'Fetching link previews...';
      case 'replacing_broken_resources':
        return 'Replacing broken or inaccessible resources...';
      case 'enriching_sections':
        return 'Adding resources to under-resourced sections...';
      case 'completed':
        return 'Ready to view!';
      case 'cancelled':
        return 'Generation cancelled';
      case 'failed_metadata':
        return 'Metadata generation failed';
      case 'failed_image':
        return 'Image fetch failed (path still usable)';
      case 'failed_research':
        return 'Resource research failed';
      case 'failed_sections':
        return 'Resource curation failed';
      case 'failed_validation':
        return 'Validation failed';
      case 'failed_link_validation':
        return 'Link validation failed';
      case 'failed_replacement':
        return 'Resource replacement failed';
      case 'failed_enrichment':
        return 'Section enrichment failed';
      case 'failed':
        return error || 'Generation failed. Please try again.';
      default:
        return 'Generating...';
    }
  };

  const isTerminal = ['completed', 'cancelled', 'failed', 'failed_metadata', 'failed_image', 'failed_research', 'failed_sections', 'failed_validation', 'failed_link_validation', 'failed_replacement', 'failed_enrichment'].includes(status);
  const isFailed = ['failed', 'failed_metadata', 'failed_image', 'failed_research', 'failed_sections', 'failed_validation', 'failed_link_validation', 'failed_replacement', 'failed_enrichment'].includes(status);

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
        <p className="text-base-content/75 text-sm">
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
        {/* Show loading indicator while generating */}
        {!isTerminal && (
          <div className="tooltip" data-tip="Generating">
            <span className="iconify lucide--loader text-base-content/75 block size-4 animate-spin"></span>
          </div>
        )}

        {/* Show "View Path (Generating...)" button after metadata is generated */}
        {!isFailed && !isTerminal && status !== 'pending' && status !== 'generating_metadata' && (
          <a
            href={`/paths/${pathId}`}
            className="btn btn-sm btn-primary gap-2 ms-auto"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="iconify lucide--external-link size-4"></span>
            View Path (Generating...)
          </a>
        )}

        {/* Show cancel button until terminal state */}
        {!isTerminal && (
          <button
            className="btn btn-sm btn-error gap-2 border-none ms-auto"
            onClick={handleCancel}
          >
            <span className="iconify lucide--x-square size-4"></span>
            Cancel
          </button>
        )}

        {/* Show final "View Path" button when completed */}
        {status === 'completed' && (
          <a href={`/paths/${pathId}`} className="btn btn-sm btn-primary gap-2 ms-auto">
            <span className="iconify lucide--arrow-right size-4"></span>
            View Path
          </a>
        )}

        {/* Show dismiss button for failed/cancelled states */}
        {(isFailed || status === 'cancelled') && (
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
