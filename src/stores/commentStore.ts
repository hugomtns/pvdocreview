import { create } from 'zustand';
import { db } from '@/lib/db';
import type { Comment } from '@/types';

interface CommentState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  currentDocumentId: string | null;
  currentVersionId: string | null;

  // Actions
  loadComments: (documentId: string, versionId: string) => Promise<void>;
  addComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Comment>;
  updateComment: (id: string, content: string) => Promise<void>;
  resolveComment: (id: string) => Promise<void>;
  unresolveComment: (id: string) => Promise<void>;
  clearComments: () => void;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: [],
  loading: false,
  error: null,
  currentDocumentId: null,
  currentVersionId: null,

  loadComments: async (documentId: string, versionId: string) => {
    set({ loading: true, error: null, currentDocumentId: documentId, currentVersionId: versionId });

    try {
      // Load ALL comments for this document, across all versions
      const comments = await db.comments
        .where('documentId')
        .equals(documentId)
        .toArray();

      // Sort by creation date (oldest first)
      comments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      set({ comments, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load comments',
        loading: false,
        comments: [],
      });
    }
  },

  addComment: async (commentData) => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const now = new Date();
      const newComment: Comment = {
        ...commentData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };

      // Save to database
      await db.comments.add(newComment);

      // Update store
      const updatedComments = [...state.comments, newComment];
      set({ comments: updatedComments, loading: false });

      return newComment;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to add comment',
        loading: false,
      });
      throw err;
    }
  },

  updateComment: async (id: string, content: string) => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const now = new Date();

      // Update in database
      await db.comments.update(id, {
        content,
        updatedAt: now,
      });

      // Update store
      const updatedComments = state.comments.map(comment =>
        comment.id === id
          ? { ...comment, content, updatedAt: now }
          : comment
      );
      set({ comments: updatedComments, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update comment',
        loading: false,
      });
      throw err;
    }
  },

  resolveComment: async (id: string) => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const now = new Date();

      // Update in database
      await db.comments.update(id, {
        resolved: true,
        updatedAt: now,
      });

      // Update store
      const updatedComments = state.comments.map(comment =>
        comment.id === id
          ? { ...comment, resolved: true, updatedAt: now }
          : comment
      );
      set({ comments: updatedComments, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to resolve comment',
        loading: false,
      });
      throw err;
    }
  },

  unresolveComment: async (id: string) => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const now = new Date();

      // Update in database
      await db.comments.update(id, {
        resolved: false,
        updatedAt: now,
      });

      // Update store
      const updatedComments = state.comments.map(comment =>
        comment.id === id
          ? { ...comment, resolved: false, updatedAt: now }
          : comment
      );
      set({ comments: updatedComments, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to unresolve comment',
        loading: false,
      });
      throw err;
    }
  },

  clearComments: () => {
    set({
      comments: [],
      loading: false,
      error: null,
      currentDocumentId: null,
      currentVersionId: null,
    });
  },
}));
