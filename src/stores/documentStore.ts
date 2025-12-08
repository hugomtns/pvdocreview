import { create } from 'zustand';
import { db } from '@/lib/db';
import type { Document, DocumentStatus } from '@/types';

interface DocumentState {
  documents: Document[];
  loading: boolean;
  error: string | null;

  // Actions
  loadDocuments: () => Promise<void>;
  getDocument: (id: string) => Document | undefined;
  createDocument: (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Document>;
  updateDocumentStatus: (id: string, status: DocumentStatus) => Promise<void>;
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
}));
