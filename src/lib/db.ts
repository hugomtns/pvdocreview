import Dexie, { type Table } from 'dexie';
import type { Document, DocumentVersion, Comment, WorkflowEvent, DrawingShape } from '@/types';

export class PVDocReviewDatabase extends Dexie {
  // Tables
  documents!: Table<Document, string>;
  versions!: Table<DocumentVersion, string>;
  comments!: Table<Comment, string>;
  workflowEvents!: Table<WorkflowEvent, string>;
  drawings!: Table<DrawingShape, string>;

  constructor() {
    super('PVDocReviewDB');

    // Version 1: Initial schema
    this.version(1).stores({
      documents: 'id, status, createdBy, createdAt',
      versions: 'id, documentId, versionNumber, uploadedAt',
      comments: 'id, documentId, versionId, authorId, createdAt',
      workflowEvents: 'id, documentId, createdAt'
    });

    // Version 2: Add isPrivate field to comments
    this.version(2).stores({
      documents: 'id, status, createdBy, createdAt',
      versions: 'id, documentId, versionNumber, uploadedAt',
      comments: 'id, documentId, versionId, authorId, createdAt, isPrivate',
      workflowEvents: 'id, documentId, createdAt'
    }).upgrade(tx => {
      // Add default isPrivate: false to existing comments
      return tx.table('comments').toCollection().modify(comment => {
        comment.isPrivate = false;
      });
    });

    // Version 3: Add uploaderRole field to versions and fix uploadedBy
    this.version(3).stores({
      documents: 'id, status, createdBy, createdAt',
      versions: 'id, documentId, versionNumber, uploadedAt, uploaderRole',
      comments: 'id, documentId, versionId, authorId, createdAt, isPrivate',
      workflowEvents: 'id, documentId, createdAt'
    }).upgrade(tx => {
      // Fix uploadedBy to use display name instead of ID, and add uploaderRole
      const userMap: Record<string, { name: string; role: 'viewer' | 'reviewer' | 'admin' }> = {
        'admin-1': { name: 'Jordan Admin', role: 'admin' },
        'reviewer-1': { name: 'Sam Reviewer', role: 'reviewer' },
        'viewer-1': { name: 'Alex Viewer', role: 'viewer' },
      };

      return tx.table('versions').toCollection().modify(version => {
        // If uploadedBy is a user ID, convert it to display name and set role
        const user = userMap[version.uploadedBy];
        if (user) {
          version.uploadedBy = user.name;
          version.uploaderRole = user.role;
        } else {
          // Default for unknown users
          version.uploaderRole = 'admin';
        }
      });
    });

    // Version 4: Fix any remaining versions with wrong uploadedBy data
    this.version(4).stores({
      documents: 'id, status, createdBy, createdAt',
      versions: 'id, documentId, versionNumber, uploadedAt, uploaderRole',
      comments: 'id, documentId, versionId, authorId, createdAt, isPrivate',
      workflowEvents: 'id, documentId, createdAt'
    }).upgrade(tx => {
      // Fix uploadedBy to use display name instead of ID, and ensure uploaderRole is set
      const userMap: Record<string, { name: string; role: 'viewer' | 'reviewer' | 'admin' }> = {
        'admin-1': { name: 'Jordan Admin', role: 'admin' },
        'reviewer-1': { name: 'Sam Reviewer', role: 'reviewer' },
        'viewer-1': { name: 'Alex Viewer', role: 'viewer' },
      };

      return tx.table('versions').toCollection().modify(version => {
        console.log('Migrating version:', version.id, 'uploadedBy:', version.uploadedBy, 'uploaderRole:', version.uploaderRole);

        // If uploadedBy is a user ID, convert it to display name and set role
        const user = userMap[version.uploadedBy];
        if (user) {
          console.log('Converting', version.uploadedBy, 'to', user.name);
          version.uploadedBy = user.name;
          version.uploaderRole = user.role;
        } else if (!version.uploaderRole) {
          // If uploaderRole is missing, set default
          console.log('Setting default role for:', version.uploadedBy);
          version.uploaderRole = 'admin';
        }
      });
    });

    // Version 5: Add drawings table for persistent drawing storage
    this.version(5).stores({
      documents: 'id, status, createdBy, createdAt',
      versions: 'id, documentId, versionNumber, uploadedAt, uploaderRole',
      comments: 'id, documentId, versionId, authorId, createdAt, isPrivate',
      workflowEvents: 'id, documentId, createdAt',
      drawings: 'id, versionId, page'
    });
  }
}

// Export a singleton instance
export const db = new PVDocReviewDatabase();
