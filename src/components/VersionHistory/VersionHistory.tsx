import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import type { DocumentVersion } from '@/types';
import './VersionHistory.css';

interface VersionHistoryProps {
  documentId: string;
  currentVersionId: string;
  selectedVersionId: string;
  onVersionSelect: (versionId: string) => void;
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export function VersionHistory({
  documentId,
  currentVersionId,
  selectedVersionId,
  onVersionSelect,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVersions = async () => {
      setLoading(true);
      try {
        const allVersions = await db.versions
          .where('documentId')
          .equals(documentId)
          .toArray();

        // Sort by version number (newest first)
        allVersions.sort((a, b) => b.versionNumber - a.versionNumber);

        setVersions(allVersions);
      } catch (err) {
        console.error('Failed to load versions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, [documentId]);

  if (loading) {
    return (
      <div className="version-history">
        <div className="version-history__loading">
          Loading versions...
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="version-history">
        <div className="version-history__empty">
          No versions found.
        </div>
      </div>
    );
  }

  return (
    <div className="version-history">
      <div className="version-history__list">
        {versions.map((version) => {
          const isCurrent = version.id === currentVersionId;
          const isSelected = version.id === selectedVersionId;

          return (
            <button
              key={version.id}
              className={`version-history__item ${
                isSelected ? 'version-history__item--selected' : ''
              }`}
              onClick={() => onVersionSelect(version.id)}
            >
              <div className="version-history__item-header">
                <span className="version-history__version-number">
                  Version {version.versionNumber}
                </span>
                {isCurrent && (
                  <span className="version-history__current-badge">
                    Current
                  </span>
                )}
              </div>
              <div className="version-history__item-details">
                <span className="version-history__uploader">
                  Uploaded by {version.uploadedBy}
                </span>
                <span className="version-history__date">
                  {formatDate(version.uploadedAt)}
                </span>
              </div>
              <div className="version-history__item-meta">
                <span className="version-history__filename">
                  {version.fileName}
                </span>
                <span className="version-history__pages">
                  {version.pageCount} {version.pageCount === 1 ? 'page' : 'pages'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
