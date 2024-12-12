import { supabase } from '@/lib/supabase'

interface UpdateUserData {
  full_name?: string
  username?: string
  phone_number?: string
  address?: string
  bio?: string
  avatar_url?: string
}

export const getUserData = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching user data:', error)
    return { success: false, error }
  }
}

export const updateUserProfile = async (userId: string, userData: UpdateUserData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return { success: false, error }
  }
}

export const uploadAvatar = async (userId: string, file: any) => {
  try {
    // Convert URI to Blob
    const response = await fetch(file.uri)
    const blob = await response.blob()

    const fileExt = file.uri.split('.').pop()
    const fileName = `${userId}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, {
        upsert: true,
        contentType: `image/${fileExt}`
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return { success: false, error }
  }
}
