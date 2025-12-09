import { create } from 'zustand';
import { db } from '@/lib/db';
import type { Document, DocumentStatus, WorkflowEvent } from '@/types';

interface DocumentState {
  documents: Document[];
  loading: boolean;
  error: string | null;

  // Actions
  loadDocuments: () => Promise<void>;
  getDocument: (id: string) => Document | undefined;
  createDocument: (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Document>;
  updateDocumentStatus: (id: string, status: DocumentStatus) => Promise<void>;
  recordWorkflowEvent: (event: Omit<WorkflowEvent, 'id' | 'createdAt'>) => Promise<WorkflowEvent>;
  getWorkflowEvents: (documentId: string) => Promise<WorkflowEvent[]>;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  loading: false,
  error: null,

  loadDocuments: async () => {
    set({ loading: true, error: null });
    try {
      const documents = await db.documents.toArray();
      set({ documents, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load documents';
      set({ error: errorMessage, loading: false });
      console.error('Failed to load documents:', error);
    }
  },

  getDocument: (id: string) => {
    return get().documents.find(doc => doc.id === id);
  },

  createDocument: async (documentData) => {
    set({ loading: true, error: null });
    try {
      const now = new Date();
      const document: Document = {
        ...documentData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };

      // Persist to IndexedDB
      await db.documents.add(document);

      // Update store
      set(state => ({
        documents: [...state.documents, document],
        loading: false,
      }));

      return document;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create document';
      set({ error: errorMessage, loading: false });
      console.error('Failed to create document:', error);
      throw error;
    }
  },

  updateDocumentStatus: async (id: string, status: DocumentStatus) => {
    set({ loading: true, error: null });
    try {
      const now = new Date();

      // Update in IndexedDB
      await db.documents.update(id, {
        status,
        updatedAt: now,
      });

      // Update in store
      set(state => ({
        documents: state.documents.map(doc =>
          doc.id === id
            ? { ...doc, status, updatedAt: now }
            : doc
        ),
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update document status';
      set({ error: errorMessage, loading: false });
      console.error('Failed to update document status:', error);
      throw error;
    }
  },

  recordWorkflowEvent: async (eventData) => {
    set({ loading: true, error: null });
    try {
      const now = new Date();
      const event: WorkflowEvent = {
        ...eventData,
        id: crypto.randomUUID(),
        createdAt: now,
      };

      // Persist to IndexedDB
      await db.workflowEvents.add(event);

      set({ loading: false });
      return event;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to record workflow event';
      set({ error: errorMessage, loading: false });
      console.error('Failed to record workflow event:', error);
      throw error;
    }
  },

  getWorkflowEvents: async (documentId: string) => {
    set({ loading: true, error: null });
    try {
      const events = await db.workflowEvents
        .where('documentId')
        .equals(documentId)
        .toArray();

      // Sort by creation date (newest first)
      events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      set({ loading: false });
      return events;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load workflow events';
      set({ error: errorMessage, loading: false });
      console.error('Failed to load workflow events:', error);
      throw error;
    }
  },
}));
