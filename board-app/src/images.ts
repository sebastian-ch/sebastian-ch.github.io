const MAX_SIDE = 1600;

// Shrinks large photos before committing them; GIFs and SVGs pass through untouched
export async function prepareImage(file: File): Promise<{ blob: Blob; ext: string }> {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return { blob: file, ext: file.type === 'image/gif' ? 'gif' : 'svg' };
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode image'))), 'image/webp', 0.85),
  );
  return { blob, ext: 'webp' };
}
