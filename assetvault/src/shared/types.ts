export interface Asset {
  id: string
  path: string
  name: string
  ext: string
  size: number
  width?: number
  height?: number
  duration?: number
  thumbnail?: string
  colors: string[]
  tags: Tag[]
  createdAt: number
  importedAt: number
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Folder {
  id: string
  name: string
  parentId?: string
  icon: string
  sortOrder: number
}

export interface AssetFilter {
  query?: string
  types?: AssetType[]
  tagIds?: string[]
  folderId?: string
  colors?: string[]
  sortBy?: 'name' | 'size' | 'createdAt' | 'importedAt'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface ImportProgress {
  current: number
  total: number
  filename: string
}

export interface ElectronAPI {
  importFolder: (path: string) => Promise<{ imported: number; skipped: number }>
  getAssets: (filter: AssetFilter) => Promise<Asset[]>
  getAsset: (id: string) => Promise<Asset>
  removeAssets: (ids: string[]) => Promise<void>
  generateThumbnails: (ids: string[]) => Promise<void>
  searchAssets: (query: string) => Promise<Asset[]>
  searchByColor: (hex: string, tolerance: number) => Promise<Asset[]>
  getTags: () => Promise<Tag[]>
  createTag: (name: string, color: string) => Promise<Tag>
  deleteTag: (id: string) => Promise<void>
  updateAssetTags: (assetId: string, tagIds: string[]) => Promise<void>
  getTagAssetCounts: () => Promise<Record<string, number>>
  getFolders: () => Promise<Folder[]>
  createFolder: (name: string, parentId?: string) => Promise<Folder>
  openFolderDialog: () => Promise<string | null>
  showInFinder: (path: string) => Promise<void>
  on: (channel: string, cb: (...args: unknown[]) => void) => void
  off: (channel: string, cb: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}

export const SUPPORTED_FORMATS = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp'],
  audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
  video: ['mp4', 'webm', 'mov'],
  font: ['ttf', 'otf', 'woff', 'woff2'],
  model3d: ['obj', 'glb', 'gltf'],
  doc: ['pdf'],
} as const

export type AssetType = keyof typeof SUPPORTED_FORMATS
