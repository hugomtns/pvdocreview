import type { Comment } from '@/types';
import './CommentThread.css';

interface CommentThreadProps {
  comment: Comment;
  onResolve?: (commentId: string) => void;
  onUnresolve?: (commentId: string) => void;
  onPinClick?: (commentId: string) => void;
  isActive?: boolean;
  canResolve?: boolean;
}

export function CommentThread({
  comment,
  onResolve,
  onUnresolve,
  onPinClick,
  isActive = false,
  canResolve = false,
}: CommentThreadProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handlePinClick = () => {
    if (comment.type === 'location' && onPinClick) {
      onPinClick(comment.id);
    }
  };

  return (
    <div className={`comment-thread ${isActive ? 'comment-thread--active' : ''} ${comment.resolved ? 'comment-thread--resolved' : ''}`}>
      <div className="comment-thread__header">
        <div className="comment-thread__author-info">
          <span className="comment-thread__author-name">{comment.authorName}</span>
          <span className={`comment-thread__role-badge comment-thread__role-badge--${comment.authorRole}`}>
            {comment.authorRole}
          </span>
        </div>
        {comment.type === 'location' && comment.anchor && (
          <button
            className="comment-thread__pin-link"
            onClick={handlePinClick}
            title="Jump to pin on page"
          >
            Page {comment.anchor.page}
          </button>
        )}
      </div>

      <div className="comment-thread__content">
        {comment.content}
      </div>

      <div className="comment-thread__footer">
        <span className="comment-thread__timestamp">
          {formatDate(comment.createdAt)}
        </span>
        {comment.resolved && (
          <>
            <span className="comment-thread__resolved-badge">Resolved</span>
            {canResolve && onUnresolve && (
              <button
                className="comment-thread__unresolve-button"
                onClick={() => onUnresolve(comment.id)}
              >
                Reopen
              </button>
            )}
          </>
        )}
        {!comment.resolved && canResolve && onResolve && (
          <button
            className="comment-thread__resolve-button"
            onClick={() => onResolve(comment.id)}
          >
            Mark as Resolved
          </button>
        )}
      </div>
    </div>
  );
}
