import { useState, useRef, useEffect } from 'react';
import { AnnotationLayer } from './AnnotationLayer';
import { DrawingLayer } from '../Drawing/DrawingLayer';
import type { Comment, LocationAnchor, ShapeType, DrawingShape } from '@/types';
import './ImageViewer.css';

type ZoomMode = 'fit-width' | 'fit-page' | 'custom';

interface ZoomOption {
  label: string;
  mode: ZoomMode;
  scale?: number;
}

const ZOOM_OPTIONS: ZoomOption[] = [
  { label: 'Fit Width', mode: 'fit-width' },
  { label: 'Fit Page', mode: 'fit-page' },
  { label: '50%', mode: 'custom', scale: 0.5 },
  { label: '100%', mode: 'custom', scale: 1.0 },
  { label: '150%', mode: 'custom', scale: 1.5 },
];

interface ImageViewerProps {
  imageFile: Blob;
  comments?: Comment[];
  onLoadSuccess?: () => void;
  onLoadError?: (error: Error) => void;
  onAddAnnotation?: (pageNumber: number, anchor: LocationAnchor) => void;
  onPinClick?: (commentId: string) => void;
  activeCommentId?: string | null;
  annotationsEnabled?: boolean;
  drawingEnabled?: boolean;
  drawingShape?: ShapeType;
  drawingColor?: string;
  drawingStrokeWidth?: number;
  shapes?: DrawingShape[];
  selectedShapeId?: string | null;
  selectedVersionId?: string;
  onShapeComplete?: (shape: DrawingShape) => void;
  onShapeSelect?: (shapeId: string | null) => void;
}

export function ImageViewer({
  imageFile,
  comments = [],
  onLoadSuccess,
  onLoadError,
  onAddAnnotation,
  onPinClick,
  activeCommentId,
  annotationsEnabled = false,
  drawingEnabled = false,
  drawingShape = 'rectangle',
  drawingColor = '#FF0000',
  drawingStrokeWidth = 4,
  shapes = [],
  selectedShapeId,
  selectedVersionId = '',
  onShapeComplete,
  onShapeSelect,
}: ImageViewerProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit-width');
  const [customScale, setCustomScale] = useState<number>(1.0);
  const [imageWidth, setImageWidth] = useState<number>(800);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Create object URL for the image blob
    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        setImageWidth(containerWidth - 40);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setLoading(false);
    setError(null);
    onLoadSuccess?.();
  };

  const handleImageError = () => {
    const err = new Error('Failed to load image');
    setLoading(false);
    setError(err.message);
    onLoadError?.(err);
  };

  // Scroll to center the active pin when clicked
  useEffect(() => {
    if (!activeCommentId || !containerRef.current || !imgRef.current) return;

    // Find the comment with the active ID
    const activeComment = comments.find(c => c.id === activeCommentId);
    if (!activeComment || activeComment.type !== 'location' || !activeComment.anchor) return;

    // Get the pin position as percentage of image dimensions
    const { x, y } = activeComment.anchor;

    // Get the image's rendered (displayed) dimensions
    const imgRect = imgRef.current.getBoundingClientRect();
    const imgWidth = imgRect.width;
    const imgHeight = imgRect.height;

    // Calculate absolute position on the image using displayed dimensions
    const pinX = (x / 100) * imgWidth;
    const pinY = (y / 100) * imgHeight;

    // Get container dimensions
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calculate scroll position to center the pin
    const scrollLeft = pinX - containerWidth / 2;
    const scrollTop = pinY - containerHeight / 2;

    // Scroll smoothly to the pin
    container.scrollTo({
      left: Math.max(0, scrollLeft),
      top: Math.max(0, scrollTop),
      behavior: 'smooth',
    });
  }, [activeCommentId, comments]);

  const getImageWidth = () => {
    if (!naturalDimensions) return imageWidth;

    if (zoomMode === 'custom') {
      return naturalDimensions.width * customScale;
    }
    if (zoomMode === 'fit-page' && containerRef.current) {
      const containerHeight = containerRef.current.clientHeight - 100;
      const scale = containerHeight / naturalDimensions.height;
      return naturalDimensions.width * scale;
    }
    return imageWidth;
  };

  const handleZoomChange = (option: ZoomOption) => {
    setZoomMode(option.mode);
    if (option.scale !== undefined) {
      setCustomScale(option.scale);
    }
  };

  return (
    <div className="image-viewer">
      <div className="image-viewer__toolbar">
        <div className="image-viewer__page-info">
          Page 1 of 1
        </div>
        <div className="image-viewer__zoom-controls">
          {ZOOM_OPTIONS.map((option, index) => (
            <button
              key={index}
              className={`image-viewer__zoom-button ${
                zoomMode === option.mode &&
                (option.scale === undefined || option.scale === customScale)
                  ? 'image-viewer__zoom-button--active'
                  : ''
              }`}
              onClick={() => handleZoomChange(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="image-viewer__container" ref={containerRef}>
        {loading && (
          <div className="image-viewer__loading">
            <div className="image-viewer__spinner" />
            <p>Loading image...</p>
          </div>
        )}

        {error && (
          <div className="image-viewer__error">
            <p className="image-viewer__error-title">Error loading image</p>
            <p className="image-viewer__error-message">{error}</p>
          </div>
        )}

        {imageUrl && (
          <div className="image-viewer__image-wrapper">
            <div className="image-viewer__page-number">PAGE 1</div>
            <div className="image-viewer__image-container">
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Document"
                className="image-viewer__image"
                style={{ width: `${getImageWidth()}px` }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              {annotationsEnabled && (
                <AnnotationLayer
                  pageNumber={1}
                  comments={comments}
                  onAddAnnotation={onAddAnnotation}
                  onPinClick={onPinClick}
                  activeCommentId={activeCommentId}
                />
              )}
              {(shapes.length > 0 || drawingEnabled) && (
                <DrawingLayer
                  pageNumber={1}
                  enabled={drawingEnabled}
                  shapeType={drawingShape}
                  color={drawingColor}
                  strokeWidth={drawingStrokeWidth}
                  shapes={shapes}
                  selectedShapeId={selectedShapeId}
                  selectedVersionId={selectedVersionId}
                  onShapeComplete={onShapeComplete}
                  onShapeSelect={onShapeSelect}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
