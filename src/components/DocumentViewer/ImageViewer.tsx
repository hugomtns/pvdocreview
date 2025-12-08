import { useState, useRef, useEffect } from 'react';
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
  onLoadSuccess?: () => void;
  onLoadError?: (error: Error) => void;
}

export function ImageViewer({
  imageFile,
  onLoadSuccess,
  onLoadError,
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
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Document"
              className="image-viewer__image"
              style={{ width: `${getImageWidth()}px` }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
        )}
      </div>
    </div>
  );
}
