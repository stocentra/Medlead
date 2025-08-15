import { create } from 'zustand';
import { User } from '@/types';
// UPDATED: Import real API functions
import { getAllUsers, getSingleUser, updateUserStatus, getPendingVerificationUsers } from '@/api/usersApi';

interface UserState {
    users: User[];
    selectedUser: User | null;
    pendingVerificationUsers: User[];
    status: 'idle' | 'loading' | 'success' | 'error';
    error: string | null;
    fetchUsers: () => Promise<void>;
    fetchUserById: (id: string) => Promise<void>;
    fetchPendingVerificationUsers: () => Promise<void>;
    updateUser: (id: string, updates: Partial<User>) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
    users: [],
    selectedUser: null,
    pendingVerificationUsers: [],
    status: 'idle',
    error: null,

    fetchUsers: async () => {
        set({ status: 'loading', error: null });
        try {
            // UPDATED: Call real API
            const users = await getAllUsers();
            set({ users, status: 'success' });
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch users.';
            set({ status: 'error', error: errorMessage, users: [] });
        }
    },

    fetchUserById: async (id: string) => {
        set({ status: 'loading', error: null, selectedUser: null });
        try {
            // UPDATED: Call real API
            const user = await getSingleUser(id);
            set({ selectedUser: user, status: 'success' });
        } catch (err: any) {
            const errorMessage = `Failed to fetch user with id ${id}.`;
            set({ status: 'error', error: errorMessage });
        }
    },
    
    fetchPendingVerificationUsers: async () => {
        set({ status: 'loading', error: null });
        try {
            // UPDATED: Call real API
            const pendingUsers = await getPendingVerificationUsers();
            set({ pendingVerificationUsers: pendingUsers, status: 'success' });
        } catch (err: any) {
            const errorMessage = 'Failed to fetch pending verification users.';
            set({ status: 'error', error: errorMessage, pendingVerificationUsers: [] });
        }
    },

    updateUser: async (id: string, updates: Partial<User>) => {
        try {
            // UPDATED: Call real API
            const updatedUser = await updateUserStatus(id, updates);
            set(state => ({
                users: state.users.map(u => u.id === id ? updatedUser : u),
                selectedUser: state.selectedUser?.id === id ? updatedUser : state.selectedUser,
                pendingVerificationUsers: state.pendingVerificationUsers.filter(u => u.id !== id)
            }));
        } catch (error) {
            console.error("Failed to update user:", error);
        }
    },
}));