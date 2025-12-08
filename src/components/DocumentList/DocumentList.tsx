import { DocumentCard } from './DocumentCard';
import type { Document } from '@/types';
import './DocumentList.css';

interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="document-list document-list--empty">
        <div className="document-list__empty-state">
          <p className="document-list__empty-message">
            No documents yet. Upload your first document to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="document-list">
      <div className="document-list__grid">
        {documents.map(doc => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
      </div>
    </div>
  );
}
