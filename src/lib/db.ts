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

    this.version(1).stores({
      documents: 'id, status, createdBy, createdAt',
      versions: 'id, documentId, versionNumber, uploadedAt',
      comments: 'id, documentId, versionId, authorId, createdAt',
      workflowEvents: 'id, documentId, createdAt'
    });
  }
}

// Export a singleton instance
export const db = new PVDocReviewDatabase();
