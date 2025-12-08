import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import './PageRenderer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PageRendererProps {
  pdfFile: Blob;
  pageNumber: number;
  width?: number;
  onLoadSuccess?: () => void;
  onLoadError?: (error: Error) => void;
}

export function PageRenderer({
  pdfFile,
  pageNumber,
  width,
  onLoadSuccess,
  onLoadError,
}: PageRendererProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoadSuccess = () => {
    setLoading(false);
    setError(null);
    onLoadSuccess?.();
  };

  const handleLoadError = (err: Error) => {
    setLoading(false);
    setError(err.message || 'Failed to load PDF page');
    onLoadError?.(err);
  };

  const handleDocumentLoadSuccess = () => {
    // Document loaded, page will load next
  };

  return (
    <div className="page-renderer">
      {loading && (
        <div className="page-renderer__loading">
          <div className="page-renderer__spinner" />
          <p>Loading page {pageNumber}...</p>
        </div>
      )}

      {error && (
        <div className="page-renderer__error">
          <p className="page-renderer__error-title">Error loading page</p>
          <p className="page-renderer__error-message">{error}</p>
        </div>
      )}

      <Document
        file={pdfFile}
        onLoadSuccess={handleDocumentLoadSuccess}
        onLoadError={handleLoadError}
        loading={null}
        error={null}
      >
        <Page
          pageNumber={pageNumber}
          width={width}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={null}
          error={null}
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </Document>
    </div>
  );
}
