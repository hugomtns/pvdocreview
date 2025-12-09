import { useEffect, useState } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import type { WorkflowEvent } from '@/types';
import './WorkflowHistory.css';

interface WorkflowHistoryProps {
  documentId: string;
}

const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    submit_for_review: 'Submitted for Review',
    request_approval: 'Requested Approval',
    approve: 'Approved',
    reject: 'Rejected',
    request_changes: 'Requested Changes',
  };
  return labels[action] || action;
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export function WorkflowHistory({ documentId }: WorkflowHistoryProps) {
  const { getWorkflowEvents } = useDocumentStore();
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const workflowEvents = await getWorkflowEvents(documentId);
        setEvents(workflowEvents);
      } catch (err) {
        console.error('Failed to load workflow events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load workflow history');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [documentId, getWorkflowEvents]);

  if (loading) {
    return (
      <div className="workflow-history">
        <div className="workflow-history__loading">
          Loading workflow history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workflow-history">
        <div className="workflow-history__error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="workflow-history">
        <div className="workflow-history__empty">
          <p>No workflow events yet.</p>
          <p className="workflow-history__empty-hint">
            Status changes will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="workflow-history">
      <div className="workflow-history__timeline">
        {events.map((event, index) => (
          <div key={event.id} className="workflow-history__event">
            <div className="workflow-history__event-marker">
              <div className="workflow-history__event-dot" />
              {index < events.length - 1 && (
                <div className="workflow-history__event-line" />
              )}
            </div>
            <div className="workflow-history__event-content">
              <div className="workflow-history__event-header">
                <span className="workflow-history__event-action">
                  {getActionLabel(event.action)}
                </span>
                <span className="workflow-history__event-time">
                  {formatDate(event.createdAt)}
                </span>
              </div>
              <div className="workflow-history__event-actor">
                By {event.actorName}
              </div>
              {event.comment && (
                <div className="workflow-history__event-comment">
                  {event.comment}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
