/**
 * Image processing and optimization utilities for fast storage in LocalStorage & PDF rendering.
 */

export async function optimizeImageForStorage(
  file: File,
  maxDimension = 480,
  quality = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('O arquivo selecionado não é uma imagem válida.'));
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Não foi possível ler o arquivo da imagem.'));
    };

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        reject(new Error('Falha ao decodificar a imagem selecionada.'));
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // Calculate scaled dimensions while preserving aspect ratio
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback to raw data if canvas is unavailable
            return resolve(e.target?.result as string);
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Clear and draw image
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // For PNG / SVG with potential alpha channel, export as PNG. Otherwise WebP/JPEG for compact size.
          const isTransparent = file.type === 'image/png' || file.type === 'image/svg+xml';
          let optimizedDataUrl: string;

          if (isTransparent) {
            optimizedDataUrl = canvas.toDataURL('image/png');
          } else {
            // Try webp or fallback to jpeg
            optimizedDataUrl = canvas.toDataURL('image/webp', quality);
            if (!optimizedDataUrl.startsWith('data:image/webp')) {
              optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
            }
          }

          resolve(optimizedDataUrl);
        } catch (err) {
          console.warn('Canvas optimization error, falling back to original data URL:', err);
          resolve(e.target?.result as string);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
