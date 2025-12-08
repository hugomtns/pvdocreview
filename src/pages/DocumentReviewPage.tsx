import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useCommentStore } from '@/stores/commentStore';
import { useAuthStore } from '@/stores/authStore';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { CommentPanel } from '@/components/CommentPanel/CommentPanel';
import { CommentInput } from '@/components/CommentPanel/CommentInput';
import { WorkflowActions } from '@/components/WorkflowActions/WorkflowActions';
import { db } from '@/lib/db';
import { DocumentViewer } from '@/components/DocumentViewer/DocumentViewer';
import { ImageViewer } from '@/components/DocumentViewer/ImageViewer';
import type { DocumentVersion, LocationAnchor, WorkflowAction, DocumentStatus } from '@/types';
import './DocumentReviewPage.css';

export function DocumentReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { getDocument, updateDocumentStatus, recordWorkflowEvent } = useDocumentStore();
  const { comments, loading: commentsLoading, loadComments, resolveComment, unresolveComment, addComment } = useCommentStore();
  const currentUser = useAuthStore(state => state.currentUser);
  const [version, setVersion] = useState<DocumentVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [pendingAnnotation, setPendingAnnotation] = useState<{ pageNumber: number; anchor: LocationAnchor } | null>(null);

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

  const handleUnresolveComment = async (commentId: string) => {
    try {
      await unresolveComment(commentId);
    } catch (err) {
      console.error('Failed to unresolve comment:', err);
    }
  };

  const handleAddDocumentComment = async (content: string) => {
    if (!currentUser || !document || !version) return;

    try {
      await addComment({
        documentId: document.id,
        versionId: version.id,
        type: 'document',
        content,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        resolved: false,
      });
    } catch (err) {
      console.error('Failed to add document comment:', err);
    }
  };

  const handleAddLocationComment = async (pageNumber: number, anchor: LocationAnchor) => {
    if (!currentUser || !document || !version) return;

    // Show the comment input dialog
    setPendingAnnotation({ pageNumber, anchor });
  };

  const handleSubmitLocationComment = async (content: string) => {
    if (!currentUser || !document || !version || !pendingAnnotation) return;

    try {
      const newComment = await addComment({
        documentId: document.id,
        versionId: version.id,
        type: 'location',
        anchor: pendingAnnotation.anchor,
        content,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        resolved: false,
      });

      // Set the new comment as active to highlight its pin
      setActiveCommentId(newComment.id);

      // Close the dialog
      setPendingAnnotation(null);
    } catch (err) {
      console.error('Failed to add location comment:', err);
    }
  };

  const handleCancelLocationComment = () => {
    setPendingAnnotation(null);
  };

  const handleWorkflowAction = async (action: WorkflowAction, toStatus: DocumentStatus, comment?: string) => {
    if (!currentUser || !document) return;

    try {
      // Record the workflow event
      await recordWorkflowEvent({
        documentId: document.id,
        action,
        fromStatus: document.status,
        toStatus,
        actorId: currentUser.id,
        actorName: currentUser.name,
        comment,
      });

      // Update the document status
      await updateDocumentStatus(document.id, toStatus);
    } catch (err) {
      console.error('Failed to execute workflow action:', err);
      throw err;
    }
  };

  // Check permissions
  const canResolve = currentUser?.role === 'reviewer' || currentUser?.role === 'admin';
  const canComment = currentUser?.role === 'reviewer' || currentUser?.role === 'admin';

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
          {currentUser && (
            <WorkflowActions
              currentStatus={document.status}
              userRole={currentUser.role}
              onStatusChange={handleWorkflowAction}
            />
          )}
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
          {canComment && version && (
            <div className="document-review-page__toolbar">
              <button
                className={`document-review-page__annotation-toggle ${annotationMode ? 'document-review-page__annotation-toggle--active' : ''}`}
                onClick={() => setAnnotationMode(!annotationMode)}
                title={annotationMode ? 'Disable annotation mode' : 'Enable annotation mode'}
              >
                {annotationMode ? '✓ Annotation Mode' : '+ Annotation Mode'}
              </button>
            </div>
          )}
          {version && (
            version.fileType === 'image' ? (
              <ImageViewer
                imageFile={version.pdfFile}
                comments={comments}
                onAddAnnotation={canComment && annotationMode ? handleAddLocationComment : undefined}
                onPinClick={handlePinClick}
                activeCommentId={activeCommentId}
                annotationsEnabled={canComment && annotationMode}
              />
            ) : (
              <DocumentViewer
                pdfFile={version.pdfFile}
                comments={comments}
                onAddAnnotation={canComment && annotationMode ? handleAddLocationComment : undefined}
                onPinClick={handlePinClick}
                activeCommentId={activeCommentId}
                annotationsEnabled={canComment && annotationMode}
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
              onUnresolve={handleUnresolveComment}
              onPinClick={handlePinClick}
              onAddDocumentComment={canComment ? handleAddDocumentComment : undefined}
              activeCommentId={activeCommentId}
              canResolve={canResolve}
              canComment={canComment}
              loading={commentsLoading}
            />
          </div>
        </aside>
      </div>

      {/* Location comment input modal */}
      {pendingAnnotation && (
        <div className="document-review-page__modal-overlay" onClick={handleCancelLocationComment}>
          <div className="document-review-page__modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="document-review-page__modal-title">Add Location Comment</h3>
            <CommentInput
              onSubmit={handleSubmitLocationComment}
              onCancel={handleCancelLocationComment}
              placeholder="Add a comment about this location..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
