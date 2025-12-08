import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { DocumentStatus } from '@/types';
import './WorkflowConfirmDialog.css';

interface ActionConfig {
  action: string;
  label: string;
  toStatus: DocumentStatus;
  variant?: 'default' | 'outline' | 'destructive';
}

interface WorkflowConfirmDialogProps {
  action: ActionConfig;
  currentStatus: DocumentStatus;
  onConfirm: (comment?: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const getStatusLabel = (status: DocumentStatus): string => {
  const labels: Record<DocumentStatus, string> = {
    draft: 'Draft',
    in_review: 'In Review',
    changes_requested: 'Changes Requested',
    approved: 'Approved',
    rejected: 'Rejected',
  };
  return labels[status];
};

export function WorkflowConfirmDialog({
  action,
  currentStatus,
  onConfirm,
  onCancel,
  isProcessing = false,
}: WorkflowConfirmDialogProps) {
  const [comment, setComment] = useState('');

  const handleConfirm = () => {
    onConfirm(comment.trim() || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
    // Cancel on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="workflow-confirm-dialog__overlay" onClick={onCancel}>
      <div className="workflow-confirm-dialog__content" onClick={(e) => e.stopPropagation()}>
        <h3 className="workflow-confirm-dialog__title">
          Confirm: {action.label}
        </h3>

        <div className="workflow-confirm-dialog__info">
          <p className="workflow-confirm-dialog__status-change">
            <span className="workflow-confirm-dialog__status-label">
              {getStatusLabel(currentStatus)}
            </span>
            <span className="workflow-confirm-dialog__arrow">→</span>
            <span className="workflow-confirm-dialog__status-label workflow-confirm-dialog__status-label--new">
              {getStatusLabel(action.toStatus)}
            </span>
          </p>
        </div>

        <div className="workflow-confirm-dialog__comment-section">
          <label htmlFor="workflow-comment" className="workflow-confirm-dialog__label">
            Add a comment (optional):
          </label>
          <textarea
            id="workflow-comment"
            className="workflow-confirm-dialog__textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Provide additional context for this status change..."
            rows={4}
            disabled={isProcessing}
            autoFocus
          />
          <span className="workflow-confirm-dialog__hint">
            Press Ctrl+Enter to confirm, Esc to cancel
          </span>
        </div>

        <div className="workflow-confirm-dialog__actions">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant={action.variant || 'default'}
            size="sm"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
}
