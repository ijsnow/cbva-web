const STORAGE_URL = `${import.meta.env.VITE_SUPABASE_STORAGE_URL}/storage/v1/object/public`

export function getStorageUrl(bucket: string, path: string) {
  return `${STORAGE_URL}/${bucket}/${path}`
}
