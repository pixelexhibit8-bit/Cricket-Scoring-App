const photoRegistry = new Map();
const resolvedUrlCache = new Map();

/**
 * Auto-resolve web page image links (ImgBB, Imgur, Google Drive) to direct raw image URLs
 */
export const resolveDirectImageUrl = async (url) => {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();
  if (!clean) return '';

  if (resolvedUrlCache.has(clean)) {
    return resolvedUrlCache.get(clean);
  }

  // 1. Direct image link (ends with .jpg, .png, .webp, .gif, .jpeg) or i.ibb.co CDN link
  if (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(clean) || clean.includes('i.ibb.co/')) {
    resolvedUrlCache.set(clean, clean);
    return clean;
  }

  // 2. ImgBB webpage link (e.g. https://ibb.co/Sw9nSftR)
  if (clean.includes('ibb.co/')) {
    try {
      const oembedUrl = `${clean.replace(/\/$/, '')}/oembed.json`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const json = await res.json();
        if (json && json.url) {
          resolvedUrlCache.set(clean, json.url);
          return json.url;
        }
      }
    } catch (e) {}
  }

  // 3. Google Drive view link (e.g. https://drive.google.com/file/d/XYZ/view)
  if (clean.includes('drive.google.com/file/d/')) {
    const match = clean.match(/\/file\/d\/([^\/]+)/);
    if (match && match[1]) {
      const driveUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
      resolvedUrlCache.set(clean, driveUrl);
      return driveUrl;
    }
  }

  // 4. Smart Webpage Meta Image Extractor (Extracts og:image / twitter:image / image_src from article/web links)
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(clean, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const html = await res.text();
        const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
          || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
          || html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i);

        if (ogMatch && ogMatch[1]) {
          const extractedUrl = ogMatch[1].trim();
          resolvedUrlCache.set(clean, extractedUrl);
          return extractedUrl;
        }
      }
    } catch (e) {}
  }

  resolvedUrlCache.set(clean, clean);
  return clean;
};

/**
 * Register player photo URL into central memory map
 */
export const registerPlayerPhoto = (name, photoUrl) => {
  if (!name || typeof name !== 'string') return;
  const key = name.trim().toLowerCase();
  const cleanUrl = typeof photoUrl === 'string' ? photoUrl.trim() : '';
  if (cleanUrl) {
    photoRegistry.set(key, cleanUrl);
  }
};

/**
 * Get registered player photo URL from memory map
 */
export const getPlayerPhotoFromRegistry = (name) => {
  if (!name || typeof name !== 'string') return '';
  const key = name.trim().toLowerCase();
  return photoRegistry.get(key) || '';
};

/**
 * Bulk sync players array into global registry
 */
export const syncPlayersToPhotoRegistry = (playersArray = []) => {
  if (!Array.isArray(playersArray)) return;
  playersArray.forEach(p => {
    if (p && p.name) {
      const url = p.photoUrl || p.photo_url || p.avatar || '';
      registerPlayerPhoto(p.name, url);
    }
  });
};
