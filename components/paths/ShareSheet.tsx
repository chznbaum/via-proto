"use client";

import { useState } from "react";

interface ShareSheetProps {
  url: string;
  title: string;
  description?: string;
}

export const ShareSheet = ({ url, title, description }: ShareSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = description ? encodeURIComponent(description) : encodedTitle;

  const shareLinks = [
    {
      name: "Bluesky",
      icon: "tabler--brand-bluesky",
      url: `https://bsky.app/intent/compose?text=${encodedTitle}%20${encodedUrl}`,
      color: "hover:bg-[#0285FF]/10 hover:text-[#0285FF]",
    },
    {
      name: "X",
      icon: "tabler--brand-x",
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: "hover:bg-black/10 hover:text-black dark:hover:bg-white/10 dark:hover:text-white",
    },
    {
      name: "Reddit",
      icon: "tabler--brand-reddit",
      url: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      color: "hover:bg-[#FF4500]/10 hover:text-[#FF4500]",
    },
    {
      name: "Mastodon",
      icon: "tabler--brand-mastodon",
      url: `https://mastodon.social/share?text=${encodedTitle}%20${encodedUrl}`,
      color: "hover:bg-[#6364FF]/10 hover:text-[#6364FF]",
    },
    {
      name: "Threads",
      icon: "tabler--brand-threads",
      url: `https://threads.net/intent/post?text=${encodedTitle}%20${encodedUrl}`,
      color: "hover:bg-black/10 hover:text-black dark:hover:bg-white/10 dark:hover:text-white",
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <>
      {/* Share Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-sm btn-ghost btn-circle"
        aria-label="Share">
        <span className="iconify lucide--share-2 size-4"></span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>

            <h3 className="font-bold text-lg mb-4">Share this learning path</h3>

            {/* Social Platform Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {shareLinks.map((platform) => (
                <a
                  key={platform.name}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn btn-ghost justify-start gap-3 ${platform.color}`}>
                  <span className={`iconify ${platform.icon} size-5`}></span>
                  <span className="text-sm">{platform.name}</span>
                </a>
              ))}
            </div>

            {/* Copy Link Section */}
            <div className="divider my-4">or</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                readOnly
                className="input input-bordered flex-1 text-sm"
              />
              <button
                onClick={handleCopyLink}
                className={`btn ${copied ? "btn-success" : "btn-primary"}`}>
                <span className={`iconify ${copied ? "tabler--check" : "tabler--copy"} size-5`}></span>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsOpen(false)}>
            <button>close</button>
          </div>
        </div>
      )}
    </>
  );
};
