import { useState } from 'react';

import type { Sale } from '@/generated/graphql';

type SaleCommentsProps = {
  comments: Sale['comments'];
  onAddComment: (comment: string) => Promise<unknown>;
  isSubmitting: boolean;
  disabled?: boolean;
};

export const SaleComments = ({ comments, onAddComment, isSubmitting, disabled }: SaleCommentsProps) => {
  const [commentText, setCommentText] = useState('');

  const submitComment = async () => {
    const normalized = commentText.trim();
    if (!normalized) {
      return;
    }

    await onAddComment(normalized);
    setCommentText('');
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="text-base font-semibold text-slate-900">Comments</h4>

      <ul className="mt-4 space-y-3">
        {comments.length === 0 ? (
          <li className="text-sm text-slate-500">No comments yet.</li>
        ) : (
          comments.map(comment => (
            <li key={comment.id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
              <p className="text-sm text-slate-800">
                <strong>{comment.author}</strong>
                <span className="ml-2 text-xs text-slate-500">{comment.createdAt}</span>
              </p>
              <p className="mt-1 text-sm text-slate-700">{comment.comment}</p>
            </li>
          ))
        )}
      </ul>

      <div className="mt-4 space-y-2">
        <textarea
          className="min-h-20 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-sky-200 transition focus:ring-2"
          placeholder="Add a comment"
          value={commentText}
          onChange={event => setCommentText(event.target.value)}
          rows={3}
          disabled={isSubmitting || disabled}
        />
        <button
          type="button"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          onClick={() => void submitComment()}
          disabled={isSubmitting || disabled || !commentText.trim()}
        >
          Add comment
        </button>
      </div>
    </section>
  );
};

