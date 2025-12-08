import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleGate } from '@/components/RoleGate/RoleGate';
import { db } from '@/lib/db';
import './DocumentListPage.css';

export function DocumentListPage() {
  const [dbStatus, setDbStatus] = useState<'checking' | 'ready' | 'error'>('checking');

  useEffect(() => {
    // Test database initialization
    db.open()
      .then(() => {
        setDbStatus('ready');
      })
      .catch((error) => {
        console.error('Database failed to initialize:', error);
        setDbStatus('error');
      });
  }, []);

  return (
    <div className="document-list-page">
      <div className="document-list-page__container">
        <div className="document-list-page__header">
          <h2 className="document-list-page__title">Documents</h2>

          <RoleGate allowedRoles={['admin']}>
            <Button>Upload Document (Admin Only)</Button>
          </RoleGate>
        </div>

        <div className="document-list-page__demo">
          <Card>
            <CardHeader>
              <CardTitle>E2-S1: Dexie Database Status</CardTitle>
              <CardDescription>
                Database: {dbStatus === 'ready' ? '✓ Ready' : dbStatus === 'checking' ? 'Checking...' : '✗ Error'}
                {' | '}
                Full document list will be implemented in E2-S5.
              </CardDescription>
            </CardHeader>
            <CardContent className="document-list-page__demo-content">
              <div className="document-list-page__demo-section">
                <h3>Everyone can see this (viewer, reviewer, admin)</h3>
                <RoleGate allowedRoles={['viewer', 'reviewer', 'admin']}>
                  <p className="document-list-page__demo-item document-list-page__demo-item--success">
                    ✓ Visible to all authenticated users
                  </p>
                </RoleGate>
              </div>

              <div className="document-list-page__demo-section">
                <h3>Reviewer and Admin can see this</h3>
                <RoleGate
                  allowedRoles={['reviewer', 'admin']}
                  fallback={<p className="document-list-page__demo-item document-list-page__demo-item--muted">✗ You don't have permission (viewer)</p>}
                >
                  <p className="document-list-page__demo-item document-list-page__demo-item--success">
                    ✓ You can add and resolve comments
                  </p>
                </RoleGate>
              </div>

              <div className="document-list-page__demo-section">
                <h3>Admin only</h3>
                <RoleGate
                  allowedRoles={['admin']}
                  fallback={<p className="document-list-page__demo-item document-list-page__demo-item--muted">✗ Admin access required</p>}
                >
                  <p className="document-list-page__demo-item document-list-page__demo-item--success">
                    ✓ You can upload documents, approve, and reject
                  </p>
                </RoleGate>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
