import Dexie, { type Table } from 'dexie';
import type { Document, DocumentVersion, Comment, WorkflowEvent } from '@/types';

export class PVDocReviewDatabase extends Dexie {
  // Tables
  documents!: Table<Document, string>;
  versions!: Table<DocumentVersion, string>;
  comments!: Table<Comment, string>;
  workflowEvents!: Table<WorkflowEvent, string>;

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
  }
}

// Export a singleton instance
export const db = new PVDocReviewDatabase();
