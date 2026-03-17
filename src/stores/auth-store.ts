import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'trainer' | 'student' | null

interface AuthState {
  user: User | null
  role: UserRole
  trainerId: string | null
  studentId: string | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setRole: (role: UserRole) => void
  setTrainerId: (id: string | null) => void
  setStudentId: (id: string | null) => void
  setIsLoading: (loading: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  trainerId: null,
  studentId: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setTrainerId: (trainerId) => set({ trainerId }),
  setStudentId: (studentId) => set({ studentId }),
  setIsLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ user: null, role: null, trainerId: null, studentId: null, isLoading: false }),
}))
