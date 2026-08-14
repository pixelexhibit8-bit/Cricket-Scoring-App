const CLOUDINARY_CLOUD_NAME = 'aov9a8tl';
const CLOUDINARY_API_KEY = '318327523124978';
const CLOUDINARY_API_SECRET = 'rxzGv3Hx95Nv0tlvYBn4blYiK4c';

// Pure JS SHA-1 for generating Cloudinary upload signatures
function sha1(str) {
  function rotateLeft(n, s) { return (n << s) | (n >>> (32 - s)); }
  function cvtHex(val) {
    let str = '';
    for (let i = 7; i >= 0; i--) {
      const v = (val >>> (i * 4)) & 0x0f;
      str += v.toString(16);
    }
    return str;
  }
  const wordCount = Math.floor((str.length + 8) / 64) + 1;
  const words = new Array(wordCount * 16).fill(0);
  for (let i = 0; i < str.length; i++) {
    words[i >> 2] |= str.charCodeAt(i) << ((3 - (i % 4)) * 8);
  }
  words[str.length >> 2] |= 0x80 << ((3 - (str.length % 4)) * 8);
  words[wordCount * 16 - 1] = str.length * 8;
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476, e = 0xc3d2e1f0;
  for (let i = 0; i < wordCount * 16; i += 16) {
    const w = new Array(80);
    for (let j = 0; j < 16; j++) w[j] = words[i + j];
    for (let j = 16; j < 80; j++) w[j] = rotateLeft(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
    let [A, B, C, D, E] = [a, b, c, d, e];
    for (let j = 0; j < 80; j++) {
      const f = j < 20 ? (B & C) | ((~B) & D)
              : j < 40 ? B ^ C ^ D
              : j < 60 ? (B & C) | (B & D) | (C & D)
              : B ^ C ^ D;
      const k = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6][Math.floor(j / 20)];
      const temp = (rotateLeft(A, 5) + f + E + k + w[j]) & 0xffffffff;
      E = D; D = C; C = rotateLeft(B, 30) & 0xffffffff; B = A; A = temp;
    }
    a = (a + A) & 0xffffffff; b = (b + B) & 0xffffffff; c = (c + C) & 0xffffffff; d = (d + D) & 0xffffffff; e = (e + E) & 0xffffffff;
  }
  return (cvtHex(a) + cvtHex(b) + cvtHex(c) + cvtHex(d) + cvtHex(e)).toLowerCase();
}

/**
 * Upload image (Base64 Data URI or Image String) directly to Cloudinary using signed authentication
 */
export const uploadImageToCloudinary = async (imageDataUri) => {
  if (!imageDataUri || typeof imageDataUri !== 'string') return null;

  try {
    let filePayload = imageDataUri.trim();
    if (!filePayload.startsWith('data:') && !filePayload.startsWith('http')) {
      filePayload = `data:image/jpeg;base64,${filePayload}`;
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signatureToSign = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = sha1(signatureToSign);

    const formData = new URLSearchParams();
    formData.append('file', filePayload);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.warn('[Cloudinary Upload Error]:', errJson.error?.message || 'Upload failed');
      return null;
    }

    const data = await res.json();
    console.log('[Cloudinary Upload Success]:', data.secure_url);
    return data?.secure_url || data?.url || null;
  } catch (err) {
    console.warn('[Cloudinary Exception]:', err.message || err);
    return null;
  }
};
