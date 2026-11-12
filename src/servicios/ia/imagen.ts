// Preparación de fotos antes de mandarlas a calcular: se reducen en el teléfono para
// que el envío sea liviano y el servicio de IA procese menos datos.

export const LADO_MAXIMO = 1280;
const CALIDAD = 0.8;

async function decodificar(archivo: Blob): Promise<{ fuente: CanvasImageSource; ancho: number; alto: number; liberar: () => void }> {
  if ('createImageBitmap' in window) {
    try {
      const bmp = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
      return { fuente: bmp, ancho: bmp.width, alto: bmp.height, liberar: () => bmp.close() };
    } catch {
      // Algunos formatos no los decodifica createImageBitmap: se intenta con <img>.
    }
  }
  const url = URL.createObjectURL(archivo);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return { fuente: img, ancho: img.naturalWidth, alto: img.naturalHeight, liberar: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

/** Reduce una foto a LADO_MAXIMO px en su lado más largo y la convierte a JPEG. */
export async function prepararFoto(archivo: Blob): Promise<Blob> {
  const { fuente, ancho, alto, liberar } = await decodificar(archivo);
  try {
    const escala = Math.min(1, LADO_MAXIMO / Math.max(ancho, alto));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(ancho * escala));
    canvas.height = Math.max(1, Math.round(alto * escala));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas no disponible');
    ctx.drawImage(fuente, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo convertir la foto'))), 'image/jpeg', CALIDAD),
    );
  } finally {
    liberar();
  }
}

export function aBase64(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result).split(',')[1] ?? '');
    lector.onerror = () => reject(lector.error);
    lector.readAsDataURL(b);
  });
}
