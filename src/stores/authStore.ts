import { create } from 'zustand';
import type { User } from '@/types';

const STORAGE_KEY = 'pv-docreview-user';

// Mock users - one per role
const MOCK_USERS: User[] = [
  { id: 'viewer-1', name: 'Alex Viewer', role: 'viewer' },
  { id: 'reviewer-1', name: 'Sam Reviewer', role: 'reviewer' },
  { id: 'admin-1', name: 'Jordan Admin', role: 'admin' },
];

interface AuthState {
  currentUser: User | null;
  mockUsers: User[];
  login: (userId: string) => void;
  logout: () => void;
}

// Load user from localStorage
const loadUserFromStorage = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const user = JSON.parse(stored) as User;
      // Validate that the user still exists in mock users
      const isValid = MOCK_USERS.some(u => u.id === user.id);
      return isValid ? user : null;
    }
  } catch (error) {
    console.error('Failed to load user from storage:', error);
  }
  return null;
};

// Save user to localStorage
const saveUserToStorage = (user: User | null): void => {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to save user to storage:', error);
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: loadUserFromStorage(),
  mockUsers: MOCK_USERS,

  login: (userId: string) => {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) {
      saveUserToStorage(user);
      set({ currentUser: user });
    } else {
      console.error(`User with id ${userId} not found`);
    }
  },

  logout: () => {
    saveUserToStorage(null);
    set({ currentUser: null });
  },
}));
