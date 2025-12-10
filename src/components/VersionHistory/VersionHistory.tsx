import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { VersionCard } from './VersionCard';
import type { DocumentVersion } from '@/types';
import './VersionHistory.css';

interface VersionHistoryProps {
  documentId: string;
  currentVersionId: string;
  selectedVersionId: string;
  onVersionSelect: (versionId: string) => void;
}

export function VersionHistory({
  documentId,
  currentVersionId,
  selectedVersionId,
  onVersionSelect,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVersions = async () => {
      setLoading(true);
      setError(null);
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
        setError(err instanceof Error ? err.message : 'Failed to load versions');
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

  if (error) {
    return (
      <div className="version-history">
        <div className="version-history__error">
          <p>{error}</p>
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
            <VersionCard
              key={version.id}
              version={version}
              isCurrent={isCurrent}
              isSelected={isSelected}
              onSelect={onVersionSelect}
            />
          );
        })}
      </div>
    </div>
  );
}
