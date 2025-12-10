import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/lib/db';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { mockUsers, login } = useAuthStore();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleLogin = (userId: string) => {
    login(userId);
    navigate('/documents');
  };

  const handleResetLocalStorage = async () => {
    setIsResetting(true);
    try {
      // Clear all data from IndexedDB
      await db.delete();

      // Recreate the database
      await db.open();

      setShowResetDialog(false);
      alert('All data has been cleared successfully. The page will now reload.');

      // Reload the page to reinitialize everything
      window.location.reload();
    } catch (error) {
      console.error('Error resetting local storage:', error);
      alert('Failed to reset local storage. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__container">
        <div className="login-page__header">
          <h1 className="login-page__title">PV Document Review</h1>
          <p className="login-page__subtitle">Select your role to continue</p>
        </div>

        <div className="login-page__cards">
          {mockUsers.map((user) => (
            <Card
              key={user.id}
              className="login-page__card"
              onClick={() => handleLogin(user.id)}
            >
              <CardHeader>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>
                  <span className={`login-page__role-badge login-page__role-badge--${user.role}`}>
                    {user.role}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="login-page__card-instruction">Click to login as {user.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="login-page__reset-section">
          <p className="login-page__reset-warning">
            Need to start fresh? You can delete all uploaded documents and data.
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowResetDialog(true)}
            className="login-page__reset-button"
          >
            Reset All Data
          </Button>
        </div>
      </div>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset All Data</DialogTitle>
            <DialogDescription>
              This will permanently delete all documents, versions, comments, markups, and workflow history from your local storage. This action cannot be undone.
              <br /><br />
              Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetLocalStorage}
              disabled={isResetting}
            >
              {isResetting ? 'Resetting...' : 'Yes, Reset All Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
