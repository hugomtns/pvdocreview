import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { AnnotationLayer } from './AnnotationLayer';
import { DrawingLayer } from '../Drawing/DrawingLayer';
import type { Comment, LocationAnchor, ShapeType, DrawingShape } from '@/types';
import './DocumentViewer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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

interface DocumentViewerProps {
  pdfFile: Blob;
  comments?: Comment[];
  onLoadSuccess?: (numPages: number) => void;
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
  onShapeComplete?: (shape: DrawingShape) => void;
  onShapeSelect?: (shapeId: string | null) => void;
}

export function DocumentViewer({
  pdfFile,
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
  drawingStrokeWidth = 2,
  shapes = [],
  selectedShapeId,
  onShapeComplete,
  onShapeSelect,
}: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit-width');
  const [customScale, setCustomScale] = useState<number>(1.0);
  const [pageWidth, setPageWidth] = useState<number>(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    pageRefs.current = new Array(numPages);
    onLoadSuccess?.(numPages);
  };

  const handleDocumentLoadError = (error: Error) => {
    onLoadError?.(error);
  };

  // Update page width on container resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        setPageWidth(containerWidth - 40); // Subtract padding
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Track current page based on scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const scrollMiddle = scrollTop + containerHeight / 2;

      for (let i = 0; i < pageRefs.current.length; i++) {
        const pageElement = pageRefs.current[i];
        if (pageElement) {
          const rect = pageElement.getBoundingClientRect();
          const pageTop = scrollTop + rect.top;
          const pageBottom = pageTop + rect.height;

          if (scrollMiddle >= pageTop && scrollMiddle <= pageBottom) {
            setCurrentPage(i + 1);
            break;
          }
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [numPages]);

  // Scroll to pin location when active comment changes
  useEffect(() => {
    if (!activeCommentId || !containerRef.current) return;

    // Find the comment with the active ID
    const activeComment = comments.find(c => c.id === activeCommentId);
    if (!activeComment || activeComment.type !== 'location' || !activeComment.anchor) return;

    // Get the page number and anchor position
    const pageNumber = activeComment.anchor.page;
    const pageIndex = pageNumber - 1;
    const { y } = activeComment.anchor; // Percentage

    // Use requestAnimationFrame to ensure layout is complete
    requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;

      // Get the page element
      const pageElement = pageRefs.current[pageIndex];
      if (!pageElement) return;

      // Get the PDF page container (the actual rendered page)
      const pageContainer = pageElement.querySelector('.document-viewer__page-container');
      if (!pageContainer) return;

      // Get the canvas element (actual rendered PDF)
      const canvas = pageContainer.querySelector('canvas');
      if (!canvas) return;

      // Calculate pin position
      const pageTop = pageElement.offsetTop;
      const canvasTop = (pageContainer as HTMLElement).offsetTop + (canvas as HTMLElement).offsetTop;

      // Calculate pin's absolute position
      const canvasHeight = canvas.height;
      const pinYPixels = (y / 100) * canvasHeight;
      const absolutePinY = pageTop + canvasTop + pinYPixels;

      // Calculate scroll position to center the pin
      const containerHeight = container.clientHeight;
      const targetScrollTop = absolutePinY - containerHeight / 2;

      // Scroll to the pin location
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    });
  }, [activeCommentId, comments]);

  const getPageWidth = () => {
    if (zoomMode === 'custom') {
      return pageWidth * customScale;
    }
    return pageWidth;
  };

  const handleZoomChange = (option: ZoomOption) => {
    setZoomMode(option.mode);
    if (option.scale !== undefined) {
      setCustomScale(option.scale);
    }
  };

  return (
    <div className="document-viewer">
      <div className="document-viewer__toolbar">
        <div className="document-viewer__page-info">
          Page {currentPage} of {numPages}
        </div>
        <div className="document-viewer__zoom-controls">
          {ZOOM_OPTIONS.map((option, index) => (
            <button
              key={index}
              className={`document-viewer__zoom-button ${
                zoomMode === option.mode &&
                (option.scale === undefined || option.scale === customScale)
                  ? 'document-viewer__zoom-button--active'
                  : ''
              }`}
              onClick={() => handleZoomChange(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="document-viewer__container" ref={containerRef}>
        <Document
          file={pdfFile}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          loading={
            <div className="document-viewer__loading">
              <div className="document-viewer__spinner" />
              <p>Loading document...</p>
            </div>
          }
          error={
            <div className="document-viewer__error">
              <p className="document-viewer__error-title">Error loading document</p>
              <p className="document-viewer__error-message">
                Failed to load PDF file. Please try again.
              </p>
            </div>
          }
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div
              key={`page_${index + 1}`}
              ref={(el) => (pageRefs.current[index] = el)}
              className="document-viewer__page-wrapper"
            >
              <div className="document-viewer__page-number">
                Page {index + 1}
              </div>
              <div className="document-viewer__page-container">
                <Page
                  pageNumber={index + 1}
                  width={getPageWidth()}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={
                    <div className="document-viewer__page-loading">
                      Loading page {index + 1}...
                    </div>
                  }
                />
                {annotationsEnabled && (
                  <AnnotationLayer
                    pageNumber={index + 1}
                    comments={comments}
                    onAddAnnotation={onAddAnnotation}
                    onPinClick={onPinClick}
                    activeCommentId={activeCommentId}
                  />
                )}
                {(shapes.length > 0 || drawingEnabled) && onShapeComplete && (
                  <DrawingLayer
                    pageNumber={index + 1}
                    enabled={drawingEnabled}
                    shapeType={drawingShape}
                    color={drawingColor}
                    strokeWidth={drawingStrokeWidth}
                    shapes={shapes}
                    selectedShapeId={selectedShapeId}
                    onShapeComplete={onShapeComplete}
                    onShapeSelect={onShapeSelect}
                  />
                )}
              </div>
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
