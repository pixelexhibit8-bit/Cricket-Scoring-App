const CLOUDINARY_CLOUD_NAME = 'aov9a8tl';
const CLOUDINARY_UPLOAD_PRESET = 'CricScorer_Uploads';

/**
 * Upload image (Base64 Data URI or Image URL) directly to Cloudinary using secure unsigned upload preset
 */
export const uploadImageToCloudinary = async (imageDataUri) => {
  if (!imageDataUri || typeof imageDataUri !== 'string') return null;

  try {
    let filePayload = imageDataUri.trim();
    if (!filePayload.startsWith('data:') && !filePayload.startsWith('http')) {
      filePayload = `data:image/jpeg;base64,${filePayload}`;
    }

    const formData = new FormData();
    formData.append('file', filePayload);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.warn('[Cloudinary Unsigned Upload Error]:', errJson.error?.message || 'Upload failed');
      return null;
    }

    const data = await res.json();
    console.log('[Cloudinary Unsigned Upload Success]:', data.secure_url);
    return data?.secure_url || data?.url || null;
  } catch (err) {
    console.warn('[Cloudinary Exception]:', err.message || err);
    return null;
  }
};
