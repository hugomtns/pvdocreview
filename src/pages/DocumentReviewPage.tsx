import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useCommentStore } from '@/stores/commentStore';
import { useAuthStore } from '@/stores/authStore';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { CommentPanel } from '@/components/CommentPanel/CommentPanel';
import { CommentInput } from '@/components/CommentPanel/CommentInput';
import { WorkflowActions } from '@/components/WorkflowActions/WorkflowActions';
import { WorkflowHistory } from '@/components/WorkflowHistory/WorkflowHistory';
import { VersionHistory } from '@/components/VersionHistory/VersionHistory';
import { VersionUploadDialog } from '@/components/VersionUpload/VersionUploadDialog';
import { VersionBanner } from '@/components/VersionBanner/VersionBanner';
import { db } from '@/lib/db';
import { DocumentViewer } from '@/components/DocumentViewer/DocumentViewer';
import { ImageViewer } from '@/components/DocumentViewer/ImageViewer';
import type { DocumentVersion, LocationAnchor, WorkflowAction, DocumentStatus, ShapeType } from '@/types';
import './DocumentReviewPage.css';

export function DocumentReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { getDocument, updateDocumentStatus, recordWorkflowEvent, loadDocuments } = useDocumentStore();
  const { comments, loading: commentsLoading, loadComments, resolveComment, unresolveComment, addComment } = useCommentStore();
  const currentUser = useAuthStore(state => state.currentUser);
  const [version, setVersion] = useState<DocumentVersion | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [pendingAnnotation, setPendingAnnotation] = useState<{ pageNumber: number; anchor: LocationAnchor } | null>(null);
  const [workflowHistoryKey, setWorkflowHistoryKey] = useState(0);
  const [versionHistoryKey, setVersionHistoryKey] = useState(0);

  // Drawing mode state
  const [drawingMode, setDrawingMode] = useState(false);
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle');
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [strokeWidth, setStrokeWidth] = useState(2);

  // Initialize selected version to current version
  useEffect(() => {
    if (!id) return;

    const document = getDocument(id);
    if (document && !selectedVersionId) {
      setSelectedVersionId(document.currentVersionId);
    }
  }, [id, getDocument, selectedVersionId]);

  // Load the selected version
  useEffect(() => {
    const loadDocumentVersion = async () => {
      if (!id || !selectedVersionId) {
        if (!id) {
          setError('No document ID provided');
        }
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

        const versionToLoad = await db.versions.get(selectedVersionId);
        if (!versionToLoad) {
          setError('Document version not found');
          setLoading(false);
          return;
        }

        setVersion(versionToLoad);

        // Load all versions for version mapping
        const allVersions = await db.versions
          .where('documentId')
          .equals(id)
          .toArray();
        setVersions(allVersions);

        setLoading(false);

        // Load comments for this document/version
        await loadComments(id, versionToLoad.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
        setLoading(false);
      }
    };

    loadDocumentVersion();
  }, [id, selectedVersionId, getDocument, loadComments]);

  const document = id ? getDocument(id) : null;

  // Helper to get version number from versionId
  const getVersionNumber = (versionId: string): number | undefined => {
    return versions.find(v => v.id === versionId)?.versionNumber;
  };

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

  const handleAddDocumentComment = async (content: string, isPrivate: boolean) => {
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
        isPrivate,
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

  const handleSubmitLocationComment = async (content: string, isPrivate: boolean) => {
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
        isPrivate,
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

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersionId(versionId);
    setLoading(true);
  };

  const handleViewCurrentVersion = () => {
    if (document) {
      setSelectedVersionId(document.currentVersionId);
      setLoading(true);
    }
  };

  const handleVersionUploaded = async () => {
    // Reload documents from database to get updated current version
    if (!id) return;

    try {
      await loadDocuments();

      const document = getDocument(id);
      if (document) {
        setSelectedVersionId(document.currentVersionId);
        setWorkflowHistoryKey(prev => prev + 1);
        setVersionHistoryKey(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to reload after version upload:', err);
    }
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

      // Trigger workflow history reload
      setWorkflowHistoryKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to execute workflow action:', err);
      throw err;
    }
  };

  // Check permissions
  const canResolve = currentUser?.role === 'reviewer' || currentUser?.role === 'admin';
  const canComment = currentUser?.role === 'reviewer' || currentUser?.role === 'admin';

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Escape - Exit annotation mode
      if (e.key === 'Escape' && annotationMode) {
        setAnnotationMode(false);
        return;
      }

      // 'A' - Toggle annotation mode (only if user can comment)
      if (e.key === 'a' && canComment && version) {
        setAnnotationMode(prev => !prev);
        return;
      }

      // Arrow keys - Navigate versions
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && versions.length > 1) {
        e.preventDefault();
        const currentIndex = versions.findIndex(v => v.id === selectedVersionId);
        if (currentIndex === -1) return;

        if (e.key === 'ArrowLeft') {
          // Previous version (older)
          const nextIndex = currentIndex + 1;
          const nextVersion = versions[nextIndex];
          if (nextVersion) {
            setSelectedVersionId(nextVersion.id);
            setLoading(true);
          }
        } else {
          // Next version (newer)
          const prevIndex = currentIndex - 1;
          const prevVersion = versions[prevIndex];
          if (prevVersion) {
            setSelectedVersionId(prevVersion.id);
            setLoading(true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [annotationMode, canComment, version, versions, selectedVersionId]);

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
          {currentUser?.role === 'admin' && (
            <VersionUploadDialog
              documentId={document.id}
              documentName={document.name}
              onVersionUploaded={handleVersionUploaded}
            />
          )}
        </div>
      </div>

      <div className="document-review-page__layout">
        <aside className="document-review-page__sidebar document-review-page__sidebar--left">
          <div className="document-review-page__sidebar-header">
            <h2>Workflow History</h2>
          </div>
          <div className="document-review-page__sidebar-content">
            <WorkflowHistory key={workflowHistoryKey} documentId={document.id} />
          </div>
          <div className="document-review-page__sidebar-divider" />
          <div className="document-review-page__sidebar-header">
            <h2>Versions</h2>
          </div>
          <div className="document-review-page__sidebar-content">
            {selectedVersionId && (
              <VersionHistory
                key={versionHistoryKey}
                documentId={document.id}
                currentVersionId={document.currentVersionId}
                selectedVersionId={selectedVersionId}
                onVersionSelect={handleVersionSelect}
              />
            )}
          </div>
        </aside>

        <main className="document-review-page__main">
          {version && selectedVersionId !== document.currentVersionId && (
            <VersionBanner
              versionNumber={version.versionNumber}
              onViewCurrent={handleViewCurrentVersion}
            />
          )}
          {canComment && version && (
            <div className="document-review-page__toolbar">
              <button
                className={`document-review-page__annotation-toggle ${annotationMode ? 'document-review-page__annotation-toggle--active' : ''}`}
                onClick={() => setAnnotationMode(!annotationMode)}
                title={annotationMode ? 'Disable annotation mode (Esc)' : 'Enable annotation mode (A)'}
                aria-label={annotationMode ? 'Disable annotation mode' : 'Enable annotation mode'}
                aria-pressed={annotationMode}
              >
                {annotationMode ? '✓ Annotation Mode' : '+ Annotation Mode'}
              </button>

              <button
                className={`document-review-page__annotation-toggle ${drawingMode ? 'document-review-page__annotation-toggle--active' : ''}`}
                onClick={() => setDrawingMode(!drawingMode)}
                title={drawingMode ? 'Disable drawing mode' : 'Enable drawing mode'}
                aria-label={drawingMode ? 'Disable drawing mode' : 'Enable drawing mode'}
                aria-pressed={drawingMode}
              >
                {drawingMode ? '✓ Drawing Mode' : '+ Drawing Mode'}
              </button>

              {drawingMode && (
                <>
                  <div className="document-review-page__toolbar-divider" />

                  {/* Shape Selector */}
                  <div className="document-review-page__toolbar-section">
                    <span className="document-review-page__toolbar-label">Shape:</span>
                    <div className="document-review-page__toolbar-button-group">
                      <button
                        className={`document-review-page__toolbar-button ${selectedShape === 'rectangle' ? 'document-review-page__toolbar-button--active' : ''}`}
                        onClick={() => setSelectedShape('rectangle')}
                        title="Rectangle"
                      >
                        ▭
                      </button>
                      <button
                        className={`document-review-page__toolbar-button ${selectedShape === 'circle' ? 'document-review-page__toolbar-button--active' : ''}`}
                        onClick={() => setSelectedShape('circle')}
                        title="Circle"
                      >
                        ○
                      </button>
                    </div>
                  </div>

                  <div className="document-review-page__toolbar-divider" />

                  {/* Color Picker */}
                  <div className="document-review-page__toolbar-section">
                    <span className="document-review-page__toolbar-label">Color:</span>
                    <div className="document-review-page__toolbar-color-grid">
                      {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#000000', '#FFFFFF'].map(color => (
                        <button
                          key={color}
                          className={`document-review-page__toolbar-color ${selectedColor === color ? 'document-review-page__toolbar-color--active' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="document-review-page__toolbar-divider" />

                  {/* Stroke Width */}
                  <div className="document-review-page__toolbar-section">
                    <span className="document-review-page__toolbar-label">Width:</span>
                    <div className="document-review-page__toolbar-button-group">
                      {[1, 2, 3].map(width => (
                        <button
                          key={width}
                          className={`document-review-page__toolbar-button ${strokeWidth === width ? 'document-review-page__toolbar-button--active' : ''}`}
                          onClick={() => setStrokeWidth(width)}
                          title={`${width}px`}
                        >
                          {width}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
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
                drawingEnabled={canComment && drawingMode}
                drawingShape={selectedShape}
                drawingColor={selectedColor}
                drawingStrokeWidth={strokeWidth}
                onShapeComplete={(shape) => console.log('Shape completed:', shape)}
              />
            ) : (
              <DocumentViewer
                pdfFile={version.pdfFile}
                comments={comments}
                onAddAnnotation={canComment && annotationMode ? handleAddLocationComment : undefined}
                onPinClick={handlePinClick}
                activeCommentId={activeCommentId}
                annotationsEnabled={canComment && annotationMode}
                drawingEnabled={canComment && drawingMode}
                drawingShape={selectedShape}
                drawingColor={selectedColor}
                drawingStrokeWidth={strokeWidth}
                onShapeComplete={(shape) => console.log('Shape completed:', shape)}
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
              getVersionNumber={getVersionNumber}
              currentVersionId={document.currentVersionId}
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
