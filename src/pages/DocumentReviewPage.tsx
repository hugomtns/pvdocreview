import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
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

  if (loading) {
    return (
      <div className="document-review-page">
        <div className="document-review-page__loading-container">
          <div className="document-review-page__loading">
            Loading document...
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="document-review-page">
        <div className="document-review-page__error-container">
          <div className="document-review-page__error">
            {error || 'Document not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="document-review-page">
      <div className="document-review-page__header">
        <div className="document-review-page__header-content">
          <h1 className="document-review-page__title">{document.name}</h1>
          <StatusBadge status={document.status} />
        </div>
      </div>

      <div className="document-review-page__layout">
        <aside className="document-review-page__sidebar document-review-page__sidebar--left">
          <div className="document-review-page__sidebar-header">
            <h2>Versions</h2>
          </div>
          <div className="document-review-page__sidebar-content">
            <p className="document-review-page__placeholder">
              Version history will be implemented in E6-S1
            </p>
          </div>
        </aside>

        <main className="document-review-page__main">
          {version && <DocumentViewer pdfFile={version.pdfFile} />}
        </main>

        <aside className="document-review-page__sidebar document-review-page__sidebar--right">
          <div className="document-review-page__sidebar-header">
            <h2>Comments</h2>
          </div>
          <div className="document-review-page__sidebar-content">
            <p className="document-review-page__placeholder">
              Comments panel will be implemented in E4-S3
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
