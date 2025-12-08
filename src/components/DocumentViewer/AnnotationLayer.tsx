import { useRef } from 'react';
import type { Comment, LocationAnchor } from '@/types';
import './AnnotationLayer.css';

interface AnnotationLayerProps {
  pageNumber: number;
  comments: Comment[];
  onAddAnnotation?: (pageNumber: number, anchor: LocationAnchor) => void;
  onPinClick?: (commentId: string) => void;
  activeCommentId?: string | null;
  disabled?: boolean;
}

export function AnnotationLayer({
  pageNumber,
  comments,
  onAddAnnotation,
  onPinClick,
  activeCommentId,
  disabled = false,
}: AnnotationLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);

  // Filter comments for this page
  const pageComments = comments.filter(
    comment =>
      comment.type === 'location' &&
      comment.anchor?.page === pageNumber
  );

  const handleLayerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !onAddAnnotation || !layerRef.current) return;

    // Don't trigger if clicking on a pin
    if ((e.target as HTMLElement).closest('.annotation-layer__pin')) {
      return;
    }

    const rect = layerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Ensure coordinates are within bounds
    const boundedX = Math.max(0, Math.min(100, x));
    const boundedY = Math.max(0, Math.min(100, y));

    onAddAnnotation(pageNumber, { page: pageNumber, x: boundedX, y: boundedY });
  };

  const handlePinClick = (e: React.MouseEvent, commentId: string) => {
    e.stopPropagation();
    onPinClick?.(commentId);
  };

  return (
    <div
      ref={layerRef}
      className={`annotation-layer ${disabled ? 'annotation-layer--disabled' : ''}`}
      onClick={handleLayerClick}
    >
      {pageComments.map((comment, index) => {
        if (!comment.anchor) return null;

        const isActive = comment.id === activeCommentId;
        const isResolved = comment.resolved;

        return (
          <button
            key={comment.id}
            className={`annotation-layer__pin ${isActive ? 'annotation-layer__pin--active' : ''} ${
              isResolved ? 'annotation-layer__pin--resolved' : ''
            }`}
            style={{
              left: `${comment.anchor.x}%`,
              top: `${comment.anchor.y}%`,
            }}
            onClick={(e) => handlePinClick(e, comment.id)}
            title={`Comment by ${comment.authorName}: ${comment.content.substring(0, 50)}${
              comment.content.length > 50 ? '...' : ''
            }`}
          >
            <span className="annotation-layer__pin-number">{index + 1}</span>
          </button>
        );
      })}
    </div>
  );
}
