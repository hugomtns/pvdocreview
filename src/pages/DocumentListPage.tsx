import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RoleGate } from '@/components/RoleGate/RoleGate';
import { DocumentUploadDialog } from '@/components/DocumentUpload/DocumentUploadDialog';
import { DocumentList } from '@/components/DocumentList/DocumentList';
import { useDocumentStore } from '@/stores/documentStore';
import './DocumentListPage.css';

export function DocumentListPage() {
  const { documents, loading, error, loadDocuments } = useDocumentStore();

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return (
    <div className="document-list-page">
      <div className="document-list-page__container">
        <div className="document-list-page__header">
          <h2 className="document-list-page__title">Documents</h2>

          <div className="document-list-page__actions">
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

        {!loading && <DocumentList documents={documents} />}
      </div>
    </div>
  );
}
