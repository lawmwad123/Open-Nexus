import { useState, useEffect } from 'react'
import { getExpiringSoonPosts } from '@/services/contentServices'

export const useExpiringContent = () => {
  const [expiringPosts, setExpiringPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkExpiringContent = async () => {
      setLoading(true)
      const { success, data } = await getExpiringSoonPosts()
      if (success && data) {
        setExpiringPosts(data)
      }
      setLoading(false)
    }

    checkExpiringContent()
    const interval = setInterval(checkExpiringContent, 5 * 60 * 1000) // Check every 5 minutes

    return () => clearInterval(interval)
  }, [])

  return { expiringPosts, loading }
} 