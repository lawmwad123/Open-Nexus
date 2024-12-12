export const getValidMediaUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    // Make sure the URL is using HTTPS
    if (urlObj.protocol === 'http:') {
      urlObj.protocol = 'https:';
    }
    return urlObj.toString();
  } catch (e) {
    console.error('Invalid URL:', url);
    return '';
  }
}; 