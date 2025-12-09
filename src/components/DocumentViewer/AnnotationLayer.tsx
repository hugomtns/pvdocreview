import { useRef, useState } from 'react';
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

interface DragCoordinates {
  x: number;
  y: number;
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<DragCoordinates | null>(null);
  const [dragEnd, setDragEnd] = useState<DragCoordinates | null>(null);

  // Filter comments for this page
  const pageComments = comments.filter(
    comment =>
      comment.type === 'location' &&
      comment.anchor?.page === pageNumber
  );

  // Helper to convert mouse coordinates to percentage
  const getPercentageCoordinates = (e: React.MouseEvent): DragCoordinates => {
    if (!layerRef.current) return { x: 0, y: 0 };

    const rect = layerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !onAddAnnotation || !layerRef.current) return;

    // Don't trigger if clicking on a pin
    if ((e.target as HTMLElement).closest('.annotation-layer__pin')) {
      return;
    }

    const coords = getPercentageCoordinates(e);
    setIsDragging(true);
    setDragStart(coords);
    setDragEnd(coords);

    console.log('🖱️ Mouse down at:', coords);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart) return;

    const coords = getPercentageCoordinates(e);
    setDragEnd(coords);

    // Calculate distance for logging
    const distance = Math.sqrt(
      Math.pow(coords.x - dragStart.x, 2) +
      Math.pow(coords.y - dragStart.y, 2)
    );

    console.log('🖱️ Mouse move - distance:', distance.toFixed(2));
  };

  const handleMouseUp = (_e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart || !dragEnd || !onAddAnnotation) return;

    setIsDragging(false);

    const MIN_DRAG_DISTANCE = 2; // 2% minimum to count as highlight
    const distance = Math.sqrt(
      Math.pow(dragEnd.x - dragStart.x, 2) +
      Math.pow(dragEnd.y - dragStart.y, 2)
    );

    if (distance < MIN_DRAG_DISTANCE) {
      console.log('✅ CLICK detected - creating point comment at:', dragStart);
      // Single click - create point comment
      onAddAnnotation(pageNumber, {
        page: pageNumber,
        x: dragStart.x,
        y: dragStart.y
      });
    } else {
      console.log('✅ DRAG detected - creating highlight from:', dragStart, 'to:', dragEnd);
      // Drag - create highlight comment
      onAddAnnotation(pageNumber, {
        page: pageNumber,
        x: Math.min(dragStart.x, dragEnd.x),
        y: Math.min(dragStart.y, dragEnd.y),
        x2: Math.max(dragStart.x, dragEnd.x),
        y2: Math.max(dragStart.y, dragEnd.y),
        isHighlight: true,
        color: '#FFFF0080' // Semi-transparent yellow
      });
    }

    setDragStart(null);
    setDragEnd(null);
  };

  const handlePinClick = (e: React.MouseEvent, commentId: string) => {
    e.stopPropagation();
    onPinClick?.(commentId);
  };

  return (
    <div
      ref={layerRef}
      className={`annotation-layer ${disabled ? 'annotation-layer--disabled' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* SVG layer for highlights */}
      <svg className="annotation-layer__svg">
        {/* Render saved highlights */}
        {pageComments
          .filter(c => c.anchor?.isHighlight)
          .map(comment => {
            if (!comment.anchor || !comment.anchor.x2 || !comment.anchor.y2) return null;

            const isActive = comment.id === activeCommentId;

            return (
              <rect
                key={comment.id}
                x={`${comment.anchor.x}%`}
                y={`${comment.anchor.y}%`}
                width={`${comment.anchor.x2 - comment.anchor.x}%`}
                height={`${comment.anchor.y2 - comment.anchor.y}%`}
                fill={comment.anchor.color || '#FFFF0080'}
                stroke={isActive ? '#FF6600' : '#FFD700'}
                strokeWidth={isActive ? '3' : '2'}
                className={`annotation-layer__highlight ${isActive ? 'annotation-layer__highlight--active' : ''}`}
                onClick={() => onPinClick?.(comment.id)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}

        {/* Preview while dragging */}
        {isDragging && dragStart && dragEnd && (
          <rect
            x={`${Math.min(dragStart.x, dragEnd.x)}%`}
            y={`${Math.min(dragStart.y, dragEnd.y)}%`}
            width={`${Math.abs(dragEnd.x - dragStart.x)}%`}
            height={`${Math.abs(dragEnd.y - dragStart.y)}%`}
            fill="#FFFF0040"
            stroke="#FFD700"
            strokeWidth="2"
            strokeDasharray="5,5"
            className="annotation-layer__highlight-preview"
          />
        )}
      </svg>

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
