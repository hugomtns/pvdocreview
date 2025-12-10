import { Lock, Trash2 } from 'lucide-react';
import type { Comment } from '@/types';
import './CommentThread.css';

interface CommentThreadProps {
  comment: Comment;
  onResolve?: (commentId: string) => void;
  onUnresolve?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  onPinClick?: (commentId: string) => void;
  isActive?: boolean;
  canResolve?: boolean;
  canDelete?: boolean;
  versionNumber?: number;
  isCurrentVersion?: boolean;
}

export function CommentThread({
  comment,
  onResolve,
  onUnresolve,
  onDelete,
  onPinClick,
  isActive = false,
  canResolve = false,
  canDelete = false,
  versionNumber,
  isCurrentVersion = true,
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
          {versionNumber !== undefined && (
            <span className={`comment-thread__version-badge ${!isCurrentVersion ? 'comment-thread__version-badge--old' : ''}`}>
              v{versionNumber}
            </span>
          )}
          {comment.isPrivate && (
            <span className="comment-thread__private-badge">
              <Lock size={12} />
              Private
            </span>
          )}
        </div>
        {comment.type === 'location' && comment.anchor && (
          <button
            className="comment-thread__pin-link"
            onClick={handlePinClick}
            title="Jump to pin on page"
            aria-label={`Jump to comment location on page ${comment.anchor.page}`}
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
        <div className="comment-thread__actions">
          {comment.resolved && (
            <>
              <span className="comment-thread__resolved-badge">Resolved</span>
              {canResolve && onUnresolve && (
                <button
                  className="comment-thread__unresolve-button"
                  onClick={() => onUnresolve(comment.id)}
                  aria-label="Reopen this comment"
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
              aria-label="Mark this comment as resolved"
            >
              Mark as Resolved
            </button>
          )}
          {canDelete && onDelete && (
            <button
              className="comment-thread__delete-button"
              onClick={() => onDelete(comment.id)}
              aria-label="Delete this comment"
              title="Delete comment"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
