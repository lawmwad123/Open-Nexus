import { supabase } from '@/lib/supabase'

interface CreatePostParams {
  content_type: 'video' | 'image' | 'text'
  content_url?: string
  caption?: string
  group_id?: string
  duration_hours: number
  is_challenge_entry?: boolean
  challenge_id?: string
}

export const createPost = async ({
  content_type,
  content_url,
  caption,
  group_id,
  duration_hours,
  is_challenge_entry = false,
  challenge_id
}: CreatePostParams) => {
  try {
    const expires_at = new Date()
    expires_at.setHours(expires_at.getHours() + duration_hours)

    const { data, error } = await supabase
      .rpc('create_post', {
        p_content_type: content_type,
        p_content_url: content_url,
        p_caption: caption,
        p_group_id: group_id,
        p_expires_at: expires_at,
        p_is_challenge_entry: is_challenge_entry,
        p_challenge_id: challenge_id
      })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error creating post:', error)
    return { success: false, error }
  }
}

export const uploadContent = async (
  file: any,
  content_type: 'video' | 'image'
) => {
  try {
    const fileExt = file.uri.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${content_type}s/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('posts')
      .getPublicUrl(filePath)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Error uploading content:', error)
    return { success: false, error }
  }
}

export const getExpiringSoonPosts = async () => {
  try {
    const expiryThreshold = new Date()
    expiryThreshold.setHours(expiryThreshold.getHours() + 1)

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:users(id, username, avatar_url),
        group:groups(id, name),
        challenge:challenges(id, title)
      `)
      .lt('expires_at', expiryThreshold.toISOString())
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching expiring posts:', error)
    return { success: false, error }
  }
} 