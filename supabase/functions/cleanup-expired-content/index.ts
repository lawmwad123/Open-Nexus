// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get expired posts
    const { data: expiredPosts, error: fetchError } = await supabaseClient
      .from('posts')
      .select('id, content_url')
      .lt('expires_at', new Date().toISOString())

    if (fetchError) throw fetchError

    if (expiredPosts && expiredPosts.length > 0) {
      // Delete files from storage
      for (const post of expiredPosts) {
        if (post.content_url) {
          const { error: storageError } = await supabaseClient
            .storage
            .from('posts')
            .remove([post.content_url])

          if (storageError) {
            console.error(`Error deleting file for post ${post.id}:`, storageError)
          }
        }
      }

      // Delete expired posts from database
      const { error: deleteError } = await supabaseClient
        .from('posts')
        .delete()
        .lt('expires_at', new Date().toISOString())

      if (deleteError) throw deleteError
    }

    return new Response(
      JSON.stringify({
        message: `Successfully cleaned up ${expiredPosts?.length || 0} expired posts`,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})