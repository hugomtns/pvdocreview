import type { DocumentVersion } from '@/types';
import './VersionCard.css';

interface VersionCardProps {
  version: DocumentVersion;
  isCurrent: boolean;
  isSelected: boolean;
  onSelect: (versionId: string) => void;
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

export function VersionCard({
  version,
  isCurrent,
  isSelected,
  onSelect,
}: VersionCardProps) {
  return (
    <div
      className={`version-card ${isSelected ? 'version-card--selected' : ''}`}
      onClick={() => onSelect(version.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(version.id);
        }
      }}
    >
      <div className="version-card__header">
        <span className="version-card__version-number">
          Version {version.versionNumber}
        </span>
        {isCurrent && (
          <span className="version-card__current-badge">
            Current
          </span>
        )}
      </div>
      <div className="version-card__details">
        <div className="version-card__uploader">
          <span className="version-card__uploader-name">{version.uploadedBy}</span>
          <span className={`version-card__role-badge version-card__role-badge--${version.uploaderRole}`}>
            {version.uploaderRole}
          </span>
        </div>
        <span className="version-card__date">
          {formatDate(version.uploadedAt)}
        </span>
      </div>
      <div className="version-card__meta">
        <span className="version-card__filename">
          {version.fileName}
        </span>
        <span className="version-card__pages">
          {version.pageCount} {version.pageCount === 1 ? 'page' : 'pages'}
        </span>
      </div>
    </div>
  );
}
