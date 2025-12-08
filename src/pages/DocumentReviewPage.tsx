import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { db } from '@/lib/db';
import { DocumentViewer } from '@/components/DocumentViewer/DocumentViewer';
import type { DocumentVersion } from '@/types';
import './DocumentReviewPage.css';

export function DocumentReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { getDocument } = useDocumentStore();
  const [version, setVersion] = useState<DocumentVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocumentVersion = async () => {
      if (!id) {
        setError('No document ID provided');
        setLoading(false);
        return;
      }

      try {
        const document = getDocument(id);
        if (!document) {
          setError('Document not found');
          setLoading(false);
          return;
        }

        const currentVersion = await db.versions.get(document.currentVersionId);
        if (!currentVersion) {
          setError('Document version not found');
          setLoading(false);
          return;
        }

        setVersion(currentVersion);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
        setLoading(false);
      }
    };

    loadDocumentVersion();
  }, [id, getDocument]);

  const document = id ? getDocument(id) : null;

  return (
    <div className="document-review-page">
      <div className="document-review-page__container">
        <h2 className="document-review-page__title">
          {document?.name || 'Document Review'}
        </h2>

        {loading && (
          <div className="document-review-page__loading">
            Loading document...
          </div>
        )}

        {error && (
          <div className="document-review-page__error">
            {error}
          </div>
        )}

        {version && (
          <div className="document-review-page__viewer">
            <DocumentViewer pdfFile={version.pdfFile} />
          </div>
        )}

        <p className="document-review-page__note">
          E3-S2: Multi-page document viewer with zoom controls. Full layout in E3-S3.
        </p>
      </div>
    </div>
  );
}
