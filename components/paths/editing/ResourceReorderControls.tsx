"use client";

interface ResourceReorderControlsProps {
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disabled?: boolean;
}

/**
 * Up/down arrow buttons for reordering resources
 */
export const ResourceReorderControls = ({
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  disabled = false,
}: ResourceReorderControlsProps) => {
  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={onMoveUp}
        disabled={disabled || isFirst}
        className="btn btn-ghost btn-xs btn-circle"
        title="Move up"
      >
        <span className="iconify lucide--chevron-up size-4" />
      </button>
      <button
        onClick={onMoveDown}
        disabled={disabled || isLast}
        className="btn btn-ghost btn-xs btn-circle"
        title="Move down"
      >
        <span className="iconify lucide--chevron-down size-4" />
      </button>
    </div>
  );
};
