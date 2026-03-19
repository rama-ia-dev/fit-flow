import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import type { Trainer, Student } from '@/types/database'
import { queryClient } from './query-client'

// Listen to auth state changes and resolve user role
export function useAuthListener() {
  const { setUser, setRole, setTrainerId, setStudentId, setIsLoading, clear } = useAuthStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        resolveRole(session.user.id)
      } else {
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        resolveRole(session.user.id)
      } else {
        clear()
      }
    })

    return () => subscription.unsubscribe()

    async function resolveRole(authUserId: string) {
      // Check if user is a trainer
      const { data: trainer } = await supabase
        .from('trainers')
        .select('id')
        .eq('auth_user_id', authUserId)
        .maybeSingle()

      if (trainer) {
        setRole('trainer')
        setTrainerId(trainer.id)
        setIsLoading(false)
        return
      }

      // Check if user is a student
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('auth_user_id', authUserId)
        .maybeSingle()

      if (student) {
        setRole('student')
        setStudentId(student.id)
        setIsLoading(false)
        return
      }

      // User exists in auth but not in trainers or students -> needs onboarding
      setRole(null)
      setIsLoading(false)
    }
  }, [setUser, setRole, setTrainerId, setStudentId, setIsLoading, clear])
}

// Sign in with Google OAuth
export function useSignInWithGoogle() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    },
  })
}

// Sign out
export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      queryClient.clear()
    },
  })
}

// Get current trainer profile
export function useTrainerProfile() {
  const trainerId = useAuthStore((s) => s.trainerId)
  return useQuery<Trainer | null>({
    queryKey: ['trainer', trainerId],
    queryFn: async () => {
      if (!trainerId) return null
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('id', trainerId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!trainerId,
  })
}

// Get current student profile
export function useStudentProfile() {
  const studentId = useAuthStore((s) => s.studentId)
  return useQuery<Student | null>({
    queryKey: ['student', studentId],
    queryFn: async () => {
      if (!studentId) return null
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!studentId,
  })
}

// Look up student info from invite token (no auth required)
export function useStudentByInviteToken(token: string | undefined) {
  return useQuery<{ email: string; full_name: string } | null>({
    queryKey: ['invite-token', token],
    queryFn: async () => {
      if (!token) return null
      const { data, error } = await supabase.rpc('get_student_by_invite_token', { p_token: token })
      if (error) throw error
      if (!data || data.length === 0) return null
      return data[0] as { email: string; full_name: string }
    },
    enabled: !!token,
    retry: false,
  })
}

// Accept student invite and refresh role
export function useAcceptInvite() {
  const { setRole, setStudentId } = useAuthStore()
  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc('accept_student_invite', { p_token: token })
      if (error) throw error
      if (!data) throw new Error('Token inválido o ya utilizado')
      return data as string
    },
    onSuccess: async (studentId) => {
      // Update store immediately so protected route works
      setRole('student')
      setStudentId(studentId)
    },
  })
}
