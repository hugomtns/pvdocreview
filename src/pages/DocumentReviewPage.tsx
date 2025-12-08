import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useCommentStore } from '@/stores/commentStore';
import { useAuthStore } from '@/stores/authStore';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { CommentPanel } from '@/components/CommentPanel/CommentPanel';
import { db } from '@/lib/db';
import { DocumentViewer } from '@/components/DocumentViewer/DocumentViewer';
import { ImageViewer } from '@/components/DocumentViewer/ImageViewer';
import type { DocumentVersion } from '@/types';
import './DocumentReviewPage.css';

export function DocumentReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { getDocument } = useDocumentStore();
  const { comments, loading: commentsLoading, loadComments, resolveComment } = useCommentStore();
  const currentUser = useAuthStore(state => state.currentUser);
  const [version, setVersion] = useState<DocumentVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

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

        // Load comments for this document/version
        await loadComments(id, currentVersion.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
        setLoading(false);
      }
    };

    loadDocumentVersion();
  }, [id, getDocument, loadComments]);

  const document = id ? getDocument(id) : null;

  const handlePinClick = (commentId: string) => {
    setActiveCommentId(commentId);
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      await resolveComment(commentId);
    } catch (err) {
      console.error('Failed to resolve comment:', err);
    }
  };

  // Check if user can resolve comments
  const canResolve = currentUser?.role === 'reviewer' || currentUser?.role === 'admin';

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
          {version && (
            version.fileType === 'image' ? (
              <ImageViewer
                imageFile={version.pdfFile}
                comments={comments}
                activeCommentId={activeCommentId}
                annotationsEnabled={false}
              />
            ) : (
              <DocumentViewer
                pdfFile={version.pdfFile}
                comments={comments}
                activeCommentId={activeCommentId}
                annotationsEnabled={false}
              />
            )
          )}
        </main>

        <aside className="document-review-page__sidebar document-review-page__sidebar--right">
          <div className="document-review-page__sidebar-header">
            <h2>Comments</h2>
          </div>
          <div className="document-review-page__sidebar-content">
            <CommentPanel
              comments={comments}
              onResolve={handleResolveComment}
              onPinClick={handlePinClick}
              activeCommentId={activeCommentId}
              canResolve={canResolve}
              loading={commentsLoading}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
