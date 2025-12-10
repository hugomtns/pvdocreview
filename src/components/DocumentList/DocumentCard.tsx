import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { useAuthStore } from '@/stores/authStore';
import { useDocumentStore } from '@/stores/documentStore';
import type { Document, Comment } from '@/types';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import './DocumentCard.css';

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.currentUser);
  const { loadDocuments } = useDocumentStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Count versions for this document
  const versionCount = useLiveQuery(
    async () => {
      const count = await db.versions.where('documentId').equals(document.id).count();
      return count;
    },
    [document.id],
    0
  );

  // Count unresolved comments visible to the current user
  const unresolvedCount = useLiveQuery(
    async () => {
      const comments = await db.comments
        .where('documentId')
        .equals(document.id)
        .toArray();

      // Filter private comments: only show to author and admins
      const canViewComment = (comment: Comment): boolean => {
        if (!comment.isPrivate) return true;
        if (!currentUser) return false;
        return currentUser.id === comment.authorId || currentUser.role === 'admin';
      };

      // Count unresolved comments that the user can see
      const count = comments.filter(c => !c.resolved && canViewComment(c)).length;
      return count;
    },
    [document.id, currentUser?.id, currentUser?.role],
    0
  );

  const handleClick = () => {
    navigate(`/documents/${document.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      // Delete all associated data
      await db.transaction('rw', ['documents', 'versions', 'comments', 'workflowEvents'], async () => {
        // Delete all workflow events for this document
        await db.workflowEvents.where('documentId').equals(document.id).delete();

        // Delete all comments for this document
        await db.comments.where('documentId').equals(document.id).delete();

        // Delete all versions for this document
        await db.versions.where('documentId').equals(document.id).delete();

        // Delete the document itself
        await db.documents.delete(document.id);
      });

      setShowDeleteDialog(false);

      // Reload documents to refresh the list
      await loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <Card className="document-card" onClick={handleClick}>
        <CardHeader className="document-card__header">
          <div className="document-card__title-row">
            <CardTitle className="document-card__title">{document.name}</CardTitle>
            <div className="document-card__actions">
              <StatusBadge status={document.status} />
              {currentUser?.role === 'admin' && (
                <button
                  onClick={handleDeleteClick}
                  className="document-card__delete-button"
                  aria-label="Delete document"
                  title="Delete document"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #dc3545',
                    color: '#dc3545',
                    width: '32px',
                    height: '32px',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc3545';
                    e.currentTarget.style.color = 'white';
                    const svg = e.currentTarget.querySelector('svg');
                    if (svg) svg.style.stroke = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#dc3545';
                    const svg = e.currentTarget.querySelector('svg');
                    if (svg) svg.style.stroke = '#dc3545';
                  }}
                >
                  <Trash2 size={16} style={{ stroke: '#dc3545' }} />
                </button>
              )}
            </div>
          </div>
          <CardDescription className="document-card__meta">
            <span>{versionCount} {versionCount === 1 ? 'version' : 'versions'}</span>
            {unresolvedCount > 0 && (
              <>
                <span className="document-card__meta-separator">•</span>
                <span className="document-card__unresolved-count">
                  {unresolvedCount} unresolved
                </span>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="document-card__content">
          <div className="document-card__dates">
            <div className="document-card__date">
              <span className="document-card__date-label">Created:</span>
              <span className="document-card__date-value">{formatDate(document.createdAt)}</span>
            </div>
            <div className="document-card__date">
              <span className="document-card__date-label">Updated:</span>
              <span className="document-card__date-value">{formatDate(document.updatedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{document.name}"? This will permanently delete the document and all associated versions, comments, and markups. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
