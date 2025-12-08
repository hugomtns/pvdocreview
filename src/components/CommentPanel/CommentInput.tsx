import { useState } from 'react';
import { Button } from '@/components/ui/button';
import './CommentInput.css';

interface CommentInputProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CommentInput({
  onSubmit,
  onCancel,
  placeholder = 'Write your comment...',
  disabled = false,
}: CommentInputProps) {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    const trimmedContent = content.trim();
    if (trimmedContent) {
      onSubmit(trimmedContent);
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    // Cancel on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="comment-input">
      <textarea
        className="comment-input__textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        autoFocus
      />
      <div className="comment-input__actions">
        <span className="comment-input__hint">
          Press Ctrl+Enter to submit, Esc to cancel
        </span>
        <div className="comment-input__buttons">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={disabled}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={disabled || !content.trim()}
          >
            Add Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
