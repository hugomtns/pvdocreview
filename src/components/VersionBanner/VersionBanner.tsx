import './VersionBanner.css';

interface VersionBannerProps {
  versionNumber: number;
  onViewCurrent: () => void;
}

export function VersionBanner({ versionNumber, onViewCurrent }: VersionBannerProps) {
  return (
    <div className="version-banner">
      <div className="version-banner__content">
        <span className="version-banner__icon">⚠️</span>
        <span className="version-banner__text">
          Viewing version {versionNumber} (not current)
        </span>
      </div>
      <button
        className="version-banner__button"
        onClick={onViewCurrent}
      >
        View Current Version
      </button>
    </div>
  );
}
