import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI, AssetFilter } from '../shared/types'

const api: ElectronAPI = {
  importFolder: (path: string) => ipcRenderer.invoke('import-folder', path),
  getAssets: (filter: AssetFilter) => ipcRenderer.invoke('get-assets', filter),
  getAsset: (id: string) => ipcRenderer.invoke('get-asset', id),
  removeAssets: (ids: string[]) => ipcRenderer.invoke('remove-assets', ids),
  generateThumbnails: (ids: string[]) => ipcRenderer.invoke('generate-thumbnails', ids),
  searchAssets: (query: string) => ipcRenderer.invoke('search-assets', query),
  searchByColor: (hex: string, tolerance: number) =>
    ipcRenderer.invoke('search-by-color', hex, tolerance),
  getTags: () => ipcRenderer.invoke('get-tags'),
  createTag: (name: string, color: string) => ipcRenderer.invoke('create-tag', name, color),
  deleteTag: (id: string) => ipcRenderer.invoke('delete-tag', id),
  updateAssetTags: (assetId: string, tagIds: string[]) =>
    ipcRenderer.invoke('update-asset-tags', assetId, tagIds),
  getFolders: () => ipcRenderer.invoke('get-folders'),
  createFolder: (name: string, parentId?: string) =>
    ipcRenderer.invoke('create-folder', name, parentId),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  showInFinder: (path: string) => ipcRenderer.invoke('show-in-finder', path),
  on: (channel: string, cb: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => cb(...args))
  },
  off: (channel: string, cb: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(channel, (_event, ...args) => cb(...args))
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
