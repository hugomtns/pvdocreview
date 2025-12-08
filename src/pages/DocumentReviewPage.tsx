import { useParams } from 'react-router-dom';
import './DocumentReviewPage.css';

export function DocumentReviewPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="document-review-page">
      <div className="document-review-page__container">
        <h2 className="document-review-page__title">Document Review</h2>
        <p className="document-review-page__placeholder">
          Document review for ID: {id}
          <br />
          <br />
          Full implementation will be in E3-S3
        </p>
      </div>
    </div>
  );
}
