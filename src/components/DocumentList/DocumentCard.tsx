import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import type { Document } from '@/types';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import './DocumentCard.css';

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const navigate = useNavigate();

  // Count versions for this document
  const versionCount = useLiveQuery(
    async () => {
      const count = await db.versions.where('documentId').equals(document.id).count();
      return count;
    },
    [document.id],
    0
  );

  const handleClick = () => {
    navigate(`/documents/${document.id}`);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="document-card" onClick={handleClick}>
      <CardHeader className="document-card__header">
        <div className="document-card__title-row">
          <CardTitle className="document-card__title">{document.name}</CardTitle>
          <StatusBadge status={document.status} />
        </div>
        <CardDescription className="document-card__meta">
          {versionCount} {versionCount === 1 ? 'version' : 'versions'}
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
  );
}
