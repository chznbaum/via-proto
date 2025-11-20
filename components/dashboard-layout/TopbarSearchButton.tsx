"use client";

import { useRef } from "react";

export const TopbarSearchButton = () => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const showModal = () => {
    if (dialogRef.current) {
      dialogRef.current.showModal();
    }
  };

  return (
    <>
      <button
        className="btn btn-outline btn-sm btn-ghost border-base-300 text-base-content/70 hidden h-9 w-48 justify-start gap-2 !text-sm md:flex"
        onClick={showModal}>
        <span className="iconify lucide--search size-4" />
        <span>Search</span>
      </button>
      <button
        className="btn btn-outline btn-sm btn-square btn-ghost border-base-300 text-base-content/70 flex size-9 md:hidden"
        aria-label="Search"
        onClick={showModal}>
        <span className="iconify lucide--search size-4" />
      </button>
      <dialog ref={dialogRef} className="modal p-0">
        <div className="modal-box bg-transparent p-0 shadow-none">
          <div className="bg-base-100 rounded-box">
            <div className="input w-full border-0 !outline-none">
              <span className="iconify lucide--search text-base-content/60 size-4.5" />
              <input type="search" className="grow" placeholder="Search learning paths..." aria-label="Search" />
              <form method="dialog">
                <button className="btn btn-xs btn-circle btn-ghost" aria-label="Close">
                  <span className="iconify lucide--x text-base-content/80 size-4" />
                </button>
              </form>
            </div>
            <div className="border-base-300 flex items-center gap-3 border-t px-2 py-2">
              <div className="flex items-center gap-0.5">
                <div className="border-base-300 bg-base-200 flex size-5 items-center justify-center rounded-sm border shadow-xs">
                  <span className="iconify lucide--arrow-up size-3.5"></span>
                </div>
                <div className="border-base-300 bg-base-200 flex size-5 items-center justify-center rounded-sm border shadow-xs">
                  <span className="iconify lucide--arrow-down size-3.5"></span>
                </div>
                <p className="text-base-content/80 ms-1 text-sm">Navigate</p>
              </div>
              <div className="flex items-center gap-0.5">
                <div className="border-base-300 bg-base-200 flex size-5 items-center justify-center rounded-sm border shadow-xs">
                  <span className="iconify lucide--corner-down-left size-3.5"></span>
                </div>
                <p className="text-base-content/80 ms-1 text-sm">Open</p>
              </div>
              <div className="ms-auto flex items-center gap-0.5">
                <div className="border-base-300 bg-base-200 flex h-5 items-center justify-center rounded-sm border px-1 text-sm/none shadow-xs">
                  esc
                </div>
                <p className="text-base-content/80 ms-1 text-sm">Close</p>
              </div>
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
};
