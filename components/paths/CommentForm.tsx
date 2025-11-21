"use client";

import { useState } from "react";

interface CommentFormProps {
  pathId: string;
  onCommentSubmit?: (comment: { name: string; email: string; comment: string }) => void;
}

export const CommentForm = ({ pathId, onCommentSubmit }: CommentFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    comment: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement comment submission API
      if (onCommentSubmit) {
        onCommentSubmit(formData);
      }

      // Reset form
      setFormData({ name: "", email: "", comment: "" });
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <p className="text-lg font-medium">Write a comment</p>
      <form onSubmit={handleSubmit}>
        <fieldset className="fieldset mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="fieldset-label" htmlFor="name">
              Name
            </label>
            <input
              type="text"
              id="name"
              className="input w-full"
              placeholder="Your name"
              autoComplete="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="fieldset-label" htmlFor="email">
              Email address
            </label>
            <input
              type="email"
              id="email"
              className="input w-full"
              placeholder="you@example.com"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="col-span-1 space-y-2 lg:col-span-2">
            <label className="fieldset-label" htmlFor="comment">
              Comment
            </label>
            <textarea
              id="comment"
              placeholder="Write your comment here"
              className="textarea min-h-[120px] w-full resize-y"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              required></textarea>
          </div>
        </fieldset>
        <button
          type="submit"
          className="btn btn-primary mt-4"
          disabled={isSubmitting}>
          {isSubmitting ? "Posting..." : "Post a comment"}
        </button>
      </form>
    </div>
  );
};
