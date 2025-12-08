import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleGate } from '@/components/RoleGate/RoleGate';
import { DocumentUploadDialog } from '@/components/DocumentUpload/DocumentUploadDialog';
import { useDocumentStore } from '@/stores/documentStore';
import { useAuthStore } from '@/stores/authStore';
import './DocumentListPage.css';

export function DocumentListPage() {
  const { documents, loading, error, loadDocuments, createDocument } = useDocumentStore();
  const currentUser = useAuthStore(state => state.currentUser);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleCreateTestDocument = async () => {
    if (!currentUser) return;

    try {
      await createDocument({
        name: `Test Document ${Date.now()}`,
        status: 'draft',
        currentVersionId: 'temp-version-id',
        createdBy: currentUser.id,
      });
    } catch (err) {
      console.error('Failed to create test document:', err);
    }
  };

  return (
    <div className="document-list-page">
      <div className="document-list-page__container">
        <div className="document-list-page__header">
          <h2 className="document-list-page__title">Documents</h2>

          <div className="document-list-page__actions">
            <Button onClick={handleCreateTestDocument} variant="outline" size="sm">
              Create Test Document
            </Button>
            <RoleGate allowedRoles={['admin']}>
              <DocumentUploadDialog>
                <Button>Upload Document</Button>
              </DocumentUploadDialog>
            </RoleGate>
          </div>
        </div>

        {error && (
          <div className="document-list-page__error">
            Error: {error}
          </div>
        )}

        {loading && (
          <div className="document-list-page__loading">
            Loading documents...
          </div>
        )}

        {!loading && documents.length > 0 && (
          <div className="document-list-page__list">
            <h3>Documents ({documents.length})</h3>
            {documents.map(doc => (
              <Card key={doc.id} className="document-list-page__document-card">
                <CardHeader>
                  <CardTitle>{doc.name}</CardTitle>
                  <CardDescription>
                    Status: {doc.status} | Created: {new Date(doc.createdAt).toLocaleString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <div className="document-list-page__demo">
          <Card>
            <CardHeader>
              <CardTitle>E2-S4: Document Upload Demo</CardTitle>
              <CardDescription>
                Upload real files (PDF, images, .docx). Admin-only feature with automatic .docx to PDF conversion.
              </CardDescription>
            </CardHeader>
            <CardContent className="document-list-page__demo-content">
              <div className="document-list-page__demo-section">
                <h3>Everyone can see this (viewer, reviewer, admin)</h3>
                <RoleGate allowedRoles={['viewer', 'reviewer', 'admin']}>
                  <p className="document-list-page__demo-item document-list-page__demo-item--success">
                    ✓ Visible to all authenticated users
                  </p>
                </RoleGate>
              </div>

              <div className="document-list-page__demo-section">
                <h3>Reviewer and Admin can see this</h3>
                <RoleGate
                  allowedRoles={['reviewer', 'admin']}
                  fallback={<p className="document-list-page__demo-item document-list-page__demo-item--muted">✗ You don't have permission (viewer)</p>}
                >
                  <p className="document-list-page__demo-item document-list-page__demo-item--success">
                    ✓ You can add and resolve comments
                  </p>
                </RoleGate>
              </div>

              <div className="document-list-page__demo-section">
                <h3>Admin only</h3>
                <RoleGate
                  allowedRoles={['admin']}
                  fallback={<p className="document-list-page__demo-item document-list-page__demo-item--muted">✗ Admin access required</p>}
                >
                  <p className="document-list-page__demo-item document-list-page__demo-item--success">
                    ✓ You can upload documents, approve, and reject
                  </p>
                </RoleGate>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
