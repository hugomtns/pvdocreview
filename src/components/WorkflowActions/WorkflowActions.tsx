import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WorkflowConfirmDialog } from './WorkflowConfirmDialog';
import type { DocumentStatus, WorkflowAction, UserRole } from '@/types';
import './WorkflowActions.css';

interface WorkflowActionsProps {
  currentStatus: DocumentStatus;
  userRole: UserRole;
  onStatusChange: (action: WorkflowAction, toStatus: DocumentStatus, comment?: string) => Promise<void>;
  disabled?: boolean;
}

interface ActionConfig {
  action: WorkflowAction;
  label: string;
  toStatus: DocumentStatus;
  variant?: 'default' | 'outline' | 'destructive';
}

// Action matrix based on current status and user role
const getAvailableActions = (status: DocumentStatus, role: UserRole): ActionConfig[] => {
  // Viewers cannot perform any workflow actions
  if (role === 'viewer') return [];

  const actions: ActionConfig[] = [];

  switch (status) {
    case 'draft':
      if (role === 'reviewer') {
        actions.push({
          action: 'submit_for_review',
          label: 'Submit for Review',
          toStatus: 'in_review',
        });
      } else if (role === 'admin') {
        actions.push(
          {
            action: 'submit_for_review',
            label: 'Submit for Review',
            toStatus: 'in_review',
          },
          {
            action: 'approve',
            label: 'Approve',
            toStatus: 'approved',
          }
        );
      }
      break;

    case 'in_review':
      if (role === 'reviewer') {
        actions.push({
          action: 'request_approval',
          label: 'Request Approval',
          toStatus: 'in_review',
        });
      } else if (role === 'admin') {
        actions.push(
          {
            action: 'approve',
            label: 'Approve',
            toStatus: 'approved',
          },
          {
            action: 'reject',
            label: 'Reject',
            toStatus: 'rejected',
            variant: 'destructive',
          },
          {
            action: 'request_changes',
            label: 'Request Changes',
            toStatus: 'changes_requested',
            variant: 'outline',
          }
        );
      }
      break;

    case 'changes_requested':
      if (role === 'reviewer') {
        actions.push({
          action: 'submit_for_review',
          label: 'Submit for Review',
          toStatus: 'in_review',
        });
      } else if (role === 'admin') {
        actions.push(
          {
            action: 'submit_for_review',
            label: 'Submit for Review',
            toStatus: 'in_review',
          },
          {
            action: 'approve',
            label: 'Approve',
            toStatus: 'approved',
          }
        );
      }
      break;

    case 'approved':
      // No actions available for approved documents
      break;

    case 'rejected':
      if (role === 'admin') {
        actions.push({
          action: 'submit_for_review',
          label: 'Reopen',
          toStatus: 'draft',
        });
      }
      break;
  }

  return actions;
};

export function WorkflowActions({
  currentStatus,
  userRole,
  onStatusChange,
  disabled = false,
}: WorkflowActionsProps) {
  const [pendingAction, setPendingAction] = useState<ActionConfig | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const availableActions = getAvailableActions(currentStatus, userRole);

  const handleActionClick = (action: ActionConfig) => {
    setPendingAction(action);
  };

  const handleConfirm = async (comment?: string) => {
    if (!pendingAction) return;

    setIsProcessing(true);
    try {
      await onStatusChange(pendingAction.action, pendingAction.toStatus, comment);
      setPendingAction(null);
    } catch (err) {
      console.error('Failed to change status:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setPendingAction(null);
  };

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <>
      <div className="workflow-actions">
        {availableActions.map((action) => (
          <Button
            key={action.action}
            variant={action.variant || 'default'}
            size="sm"
            onClick={() => handleActionClick(action)}
            disabled={disabled || isProcessing}
          >
            {action.label}
          </Button>
        ))}
      </div>

      {pendingAction && (
        <WorkflowConfirmDialog
          action={pendingAction}
          currentStatus={currentStatus}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isProcessing={isProcessing}
        />
      )}
    </>
  );
}
