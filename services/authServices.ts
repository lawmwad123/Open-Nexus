import { supabase } from '@/lib/supabase'

export const signUpUser = async (
  email: string, 
  password: string, 
  fullName: string
) => {
  try {
    // First sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: undefined // Disable email redirect
      }
    })

    if (signUpError) throw signUpError

    // Immediately sign in after signup
    if (signUpData.user) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) throw signInError
      return { success: true, data: signInData }
    }

    return { success: true, data: signUpData }
  } catch (error) {
    console.error('Error signing up:', error)
    return { success: false, error }
  }
}

export const signInUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error signing in:', error)
    return { success: false, error }
  }
} 