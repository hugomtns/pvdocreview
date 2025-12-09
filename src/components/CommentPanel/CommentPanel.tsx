import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CommentThread } from './CommentThread';
import { CommentInput } from './CommentInput';
import type { Comment } from '@/types';
import './CommentPanel.css';

interface CommentPanelProps {
  comments: Comment[];
  onResolve?: (commentId: string) => void;
  onUnresolve?: (commentId: string) => void;
  onPinClick?: (commentId: string) => void;
  onAddDocumentComment?: (content: string) => void;
  activeCommentId?: string | null;
  canResolve?: boolean;
  canComment?: boolean;
  loading?: boolean;
  getVersionNumber?: (versionId: string) => number | undefined;
  currentVersionId?: string;
}

export function CommentPanel({
  comments,
  onResolve,
  onUnresolve,
  onPinClick,
  onAddDocumentComment,
  activeCommentId,
  canResolve = false,
  canComment = false,
  loading = false,
  getVersionNumber,
  currentVersionId,
}: CommentPanelProps) {
  const [showResolved, setShowResolved] = useState(true);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const commentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Scroll to active comment
  useEffect(() => {
    if (activeCommentId && commentRefs.current[activeCommentId]) {
      commentRefs.current[activeCommentId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeCommentId]);

  // Separate location and document comments
  const locationComments = comments.filter(c => c.type === 'location');
  const documentComments = comments.filter(c => c.type === 'document');

  // Filter by resolved status
  const filterComments = (commentList: Comment[]) => {
    return showResolved ? commentList : commentList.filter(c => !c.resolved);
  };

  const filteredLocationComments = filterComments(locationComments);
  const filteredDocumentComments = filterComments(documentComments);

  if (loading) {
    return (
      <div className="comment-panel">
        <div className="comment-panel__loading">
          Loading comments...
        </div>
      </div>
    );
  }

  const totalComments = comments.length;
  const unresolvedCount = comments.filter(c => !c.resolved).length;

  const handleAddComment = (content: string) => {
    if (onAddDocumentComment) {
      onAddDocumentComment(content);
      setIsAddingComment(false);
    }
  };

  return (
    <div className="comment-panel">
      <div className="comment-panel__header">
        <div className="comment-panel__stats">
          <span className="comment-panel__count">{totalComments} total</span>
          {unresolvedCount > 0 && (
            <span className="comment-panel__unresolved">{unresolvedCount} unresolved</span>
          )}
        </div>
        <button
          className={`comment-panel__filter-toggle ${showResolved ? '' : 'comment-panel__filter-toggle--active'}`}
          onClick={() => setShowResolved(!showResolved)}
          title={showResolved ? 'Hide resolved comments' : 'Show resolved comments'}
        >
          {showResolved ? 'Hide Resolved' : 'Show Resolved'}
        </button>
      </div>

      {canComment && !isAddingComment && (
        <div className="comment-panel__add-button-container">
          <Button
            size="sm"
            onClick={() => setIsAddingComment(true)}
            className="comment-panel__add-button"
          >
            + Add Document Comment
          </Button>
        </div>
      )}

      {isAddingComment && (
        <div className="comment-panel__input-container">
          <CommentInput
            onSubmit={handleAddComment}
            onCancel={() => setIsAddingComment(false)}
            placeholder="Add a general comment about the document..."
          />
        </div>
      )}

      <div className="comment-panel__content">
        {filteredLocationComments.length > 0 && (
          <div className="comment-panel__section">
            <h3 className="comment-panel__section-title">
              Location Comments ({filteredLocationComments.length})
            </h3>
            <div className="comment-panel__list">
              {filteredLocationComments.map((comment) => (
                <div
                  key={comment.id}
                  ref={(el) => (commentRefs.current[comment.id] = el)}
                >
                  <CommentThread
                    comment={comment}
                    onResolve={onResolve}
                    onUnresolve={onUnresolve}
                    onPinClick={onPinClick}
                    isActive={comment.id === activeCommentId}
                    canResolve={canResolve}
                    versionNumber={getVersionNumber?.(comment.versionId)}
                    isCurrentVersion={comment.versionId === currentVersionId}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredDocumentComments.length > 0 && (
          <div className="comment-panel__section">
            <h3 className="comment-panel__section-title">
              Document Comments ({filteredDocumentComments.length})
            </h3>
            <div className="comment-panel__list">
              {filteredDocumentComments.map((comment) => (
                <div
                  key={comment.id}
                  ref={(el) => (commentRefs.current[comment.id] = el)}
                >
                  <CommentThread
                    comment={comment}
                    onResolve={onResolve}
                    onUnresolve={onUnresolve}
                    isActive={comment.id === activeCommentId}
                    canResolve={canResolve}
                    versionNumber={getVersionNumber?.(comment.versionId)}
                    isCurrentVersion={comment.versionId === currentVersionId}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {totalComments === 0 && (
          <div className="comment-panel__empty">
            <p>No comments yet.</p>
            <p className="comment-panel__empty-hint">
              Click on the document to add a location comment.
            </p>
          </div>
        )}

        {totalComments > 0 && filteredLocationComments.length === 0 && filteredDocumentComments.length === 0 && (
          <div className="comment-panel__empty">
            <p>All comments are resolved.</p>
            <p className="comment-panel__empty-hint">
              Click "Show Resolved" to see them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
