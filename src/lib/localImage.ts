export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function isPhotoFile(file: File) {
  return file.type.startsWith('image/') ||
    ((!file.type || file.type === 'application/octet-stream') && /\.(avif|bmp|gif|heic|heif|jpe?g|png|webp)$/i.test(file.name))
}

export async function readPhotoFile(file: File): Promise<string> {
  if (!isPhotoFile(file)) throw new Error('Unsupported image file')

  const src = await readImageFile(file)
  const image = new Image()
  image.src = src
  await image.decode()
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return src

  // Store photographs in a format that will also open in projects imported on a different browser.
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Image conversion unavailable')
  context.drawImage(image, 0, 0)
  return /(?:heic|heif)/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
    ? canvas.toDataURL('image/jpeg', .94)
    : canvas.toDataURL('image/png')
}
