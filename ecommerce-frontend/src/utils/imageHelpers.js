// src/utils/imageHelpers.js
/**
 * Đọc và nén nhẹ danh sách file ảnh được chọn từ máy để lưu gọn dạng Data URL.
 */
export async function readImageFilesAsDataUrls(fileList, maxDimension = 1200, quality = 0.84) {
  const files = Array.from(fileList || []).filter((f) => f.type?.startsWith('image/'));
  return Promise.all(files.map((file) => compressImageFile(file, maxDimension, quality)));
}

function compressImageFile(file, maxDimension, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Không thể đọc tệp ${file.name}`));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height, 1));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(outputType, quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Chuẩn hóa chuỗi JSON mảng hoặc danh sách URL thành mảng hợp lệ không trùng lặp.
 */
export function parseImageGallery(raw) {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((item) => String(item || '').trim()).filter(Boolean))];
  }
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return [...new Set(parsed.map((item) => String(item || '').trim()).filter(Boolean))];
    }
  } catch {
    return raw
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}
