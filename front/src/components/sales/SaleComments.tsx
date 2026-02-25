import { useState } from 'react';

import { Button } from '@/components/ui/button';
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
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h4 className="text-sm font-semibold">Comments</h4>

      <ul className="mt-4 space-y-3">
        {comments.length === 0 ? (
          <li className="text-sm text-muted-foreground">No comments yet.</li>
        ) : (
          comments.map(comment => (
            <li key={comment.id} className="rounded-md border border-border bg-secondary p-3">
              <p className="text-sm">
                <strong>{comment.author}</strong>
                <span className="ml-2 text-xs text-muted-foreground">{comment.createdAt}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{comment.comment}</p>
            </li>
          ))
        )}
      </ul>

      <div className="mt-4 space-y-2">
        <textarea
          className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Add a comment"
          value={commentText}
          onChange={event => setCommentText(event.target.value)}
          rows={3}
          disabled={isSubmitting || disabled}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => void submitComment()}
          disabled={isSubmitting || disabled || !commentText.trim()}
        >
          Add comment
        </Button>
      </div>
    </section>
  );
};
