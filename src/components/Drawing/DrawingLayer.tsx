import { useRef, useState } from 'react';
import type { ShapeType, DrawingShape } from '@/types';
import './DrawingLayer.css';

interface DrawingLayerProps {
  pageNumber: number;
  enabled: boolean;
  shapeType: ShapeType;
  color: string;
  strokeWidth: number;
  shapes?: DrawingShape[];
  selectedShapeId?: string | null;
  onShapeComplete: (shape: DrawingShape) => void;
  onShapeSelect?: (shapeId: string | null) => void;
}

interface DrawCoordinates {
  x: number;
  y: number;
}

export function DrawingLayer({
  pageNumber,
  enabled,
  shapeType,
  color,
  strokeWidth,
  shapes = [],
  selectedShapeId,
  onShapeComplete,
  onShapeSelect,
}: DrawingLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<DrawCoordinates | null>(null);
  const [currentPos, setCurrentPos] = useState<DrawCoordinates | null>(null);
  const [pathPoints, setPathPoints] = useState<DrawCoordinates[]>([]);

  // Convert mouse coordinates to percentage
  const getPercentageCoordinates = (e: React.MouseEvent): DrawCoordinates => {
    if (!layerRef.current) return { x: 0, y: 0 };

    // Find the actual image or canvas element (sibling to the drawing layer)
    const parent = layerRef.current.parentElement;
    if (!parent) return { x: 0, y: 0 };

    // Look for img (ImageViewer) or canvas (DocumentViewer)
    const targetElement = parent.querySelector('img') || parent.querySelector('canvas');
    if (!targetElement) return { x: 0, y: 0 };

    // Use the actual rendered element's bounding rectangle
    const rect = targetElement.getBoundingClientRect();

    // Calculate relative position within the actual image/canvas
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    };
  };

  // Convert path points to SVG path string
  const pointsToSVGPath = (points: DrawCoordinates[]): string => {
    if (points.length === 0) return '';

    const pathData = points.map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `L ${point.x} ${point.y}`;
    }).join(' ');

    return pathData;
  };

  // Calculate bounding box for freehand path
  const calculatePathBounds = (points: DrawCoordinates[]) => {
    if (points.length === 0) {
      return { x1: 0, y1: 0, x2: 0, y2: 0 };
    }

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);

    return {
      x1: Math.min(...xs),
      y1: Math.min(...ys),
      x2: Math.max(...xs),
      y2: Math.max(...ys),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enabled) return;

    const coords = getPercentageCoordinates(e);
    setIsDrawing(true);
    setStartPos(coords);
    setCurrentPos(coords);

    // For freehand, start tracking path points
    if (shapeType === 'freehand') {
      setPathPoints([coords]);
    }

    console.log('🎨 Drawing started:', shapeType, 'at', coords);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPos) return;

    const coords = getPercentageCoordinates(e);
    setCurrentPos(coords);

    // For freehand, add point to path
    if (shapeType === 'freehand') {
      setPathPoints(prev => [...prev, coords]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !startPos || !currentPos) return;

    setIsDrawing(false);

    // Create the shape
    const shape: DrawingShape = {
      id: crypto.randomUUID(),
      type: shapeType,
      page: pageNumber,
      color: color,
      strokeWidth: strokeWidth,
      bounds: shapeType === 'freehand' ? calculatePathBounds(pathPoints) : {
        x1: Math.min(startPos.x, currentPos.x),
        y1: Math.min(startPos.y, currentPos.y),
        x2: Math.max(startPos.x, currentPos.x),
        y2: Math.max(startPos.y, currentPos.y),
      },
      ...(shapeType === 'freehand' && { path: pointsToSVGPath(pathPoints) })
    };

    console.log('✅ Shape completed:', shape);
    onShapeComplete(shape);

    setStartPos(null);
    setCurrentPos(null);
    setPathPoints([]);
  };

  // Render preview while drawing
  const renderPreview = () => {
    if (!isDrawing || !startPos || !currentPos) return null;

    const x1 = Math.min(startPos.x, currentPos.x);
    const y1 = Math.min(startPos.y, currentPos.y);
    const x2 = Math.max(startPos.x, currentPos.x);
    const y2 = Math.max(startPos.y, currentPos.y);
    const width = x2 - x1;
    const height = y2 - y1;

    if (shapeType === 'rectangle') {
      return (
        <rect
          x={`${x1}%`}
          y={`${y1}%`}
          width={`${width}%`}
          height={`${height}%`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray="5,5"
          vectorEffect="non-scaling-stroke"
          className="drawing-layer__preview"
        />
      );
    } else if (shapeType === 'circle') {
      // Calculate center and radius
      const centerX = (x1 + x2) / 2;
      const centerY = (y1 + y2) / 2;
      const radiusX = width / 2;
      const radiusY = height / 2;

      return (
        <ellipse
          cx={`${centerX}%`}
          cy={`${centerY}%`}
          rx={`${radiusX}%`}
          ry={`${radiusY}%`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray="5,5"
          vectorEffect="non-scaling-stroke"
          className="drawing-layer__preview"
        />
      );
    } else if (shapeType === 'freehand' && pathPoints.length > 0) {
      return (
        <path
          d={pointsToSVGPath(pathPoints)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className="drawing-layer__preview"
        />
      );
    }

    return null;
  };

  // Render saved shapes for this page
  const renderSavedShapes = () => {
    // Filter shapes for current page
    const pageShapes = shapes.filter(shape => shape.page === pageNumber);

    return pageShapes.map(shape => {
      const { bounds, type, color, strokeWidth } = shape;
      const width = bounds.x2 - bounds.x1;
      const height = bounds.y2 - bounds.y1;
      const isSelected = shape.id === selectedShapeId;

      const handleShapeClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering drawing mode
        onShapeSelect?.(shape.id);
      };

      const shapeProps = {
        className: 'drawing-layer__shape',
        onClick: !enabled ? handleShapeClick : undefined, // Only selectable when drawing mode OFF
        stroke: isSelected ? '#FF6600' : color,
        strokeWidth: isSelected ? strokeWidth + 2 : strokeWidth,
        fill: 'none',
        vectorEffect: 'non-scaling-stroke' as const,
        style: { cursor: enabled ? 'crosshair' : 'pointer' }, // Different cursor based on mode
      };

      if (type === 'rectangle') {
        return (
          <rect
            key={shape.id}
            x={`${bounds.x1}%`}
            y={`${bounds.y1}%`}
            width={`${width}%`}
            height={`${height}%`}
            {...shapeProps}
          />
        );
      } else if (type === 'circle') {
        const centerX = (bounds.x1 + bounds.x2) / 2;
        const centerY = (bounds.y1 + bounds.y2) / 2;
        const radiusX = width / 2;
        const radiusY = height / 2;

        return (
          <ellipse
            key={shape.id}
            cx={`${centerX}%`}
            cy={`${centerY}%`}
            rx={`${radiusX}%`}
            ry={`${radiusY}%`}
            {...shapeProps}
          />
        );
      } else if (type === 'freehand' && shape.path) {
        return (
          <path
            key={shape.id}
            d={shape.path}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...shapeProps}
          />
        );
      }

      return null;
    });
  };

  return (
    <div
      ref={layerRef}
      className={`drawing-layer ${enabled ? 'drawing-layer--enabled' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // Complete drawing if mouse leaves
    >
      <svg className="drawing-layer__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {renderSavedShapes()}
        {renderPreview()}
      </svg>
    </div>
  );
}
