"use client";

import { useState } from "react";
import { RemixModal } from "./RemixModal";

interface RemixButtonProps {
  pathId: string;
  pathTitle: string;
  accounts: Array<{
    id: string;
    name: string;
    account_type: string;
  }>;
}

/**
 * Button to open the remix modal
 */
export const RemixButton = ({
  pathId,
  pathTitle,
  accounts,
}: RemixButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn btn-ghost btn-sm gap-2"
      >
        <span className="iconify lucide--git-branch size-4" />
        Remix
      </button>

      <RemixModal
        pathId={pathId}
        pathTitle={pathTitle}
        accounts={accounts}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
