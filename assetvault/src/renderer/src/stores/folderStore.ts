import { create } from 'zustand'

import type { DirectoryNode, Folder } from '@shared/types'

interface FolderStore {
  folders: Folder[]
  folderCounts: Record<string, number>
  selectedFolderId: string | null
  directoryTree: DirectoryNode[]
  fetchFolders: () => Promise<void>
  fetchDirectories: () => Promise<void>
  createFolder: (name: string, parentId?: string) => Promise<Folder>
  deleteFolder: (id: string) => Promise<void>
  renameFolder: (id: string, name: string) => Promise<void>
  selectFolder: (id: string | null) => void
  addAssetsToFolder: (folderId: string, assetIds: string[]) => Promise<void>
  removeAssetsFromFolder: (folderId: string, assetIds: string[]) => Promise<void>
}

export const useFolderStore = create<FolderStore>((set, get) => ({
  folders: [],
  folderCounts: {},
  selectedFolderId: null,
  directoryTree: [],

  fetchFolders: async () => {
    const [folders, folderCounts] = await Promise.all([
      window.api.getFolders(),
      window.api.getFolderAssetCounts()
    ])
    set({ folders, folderCounts })
  },

  fetchDirectories: async () => {
    const directoryTree = await window.api.getAssetDirectories()
    set({ directoryTree })
  },

  createFolder: async (name, parentId) => {
    const folder = await window.api.createFolder(name, parentId)
    set((s) => ({ folders: [...s.folders, folder] }))
    return folder
  },

  deleteFolder: async (id) => {
    await window.api.deleteFolder(id)
    const { selectedFolderId } = get()
    set((s) => ({
      folders: s.folders.filter((f) => f.id !== id),
      selectedFolderId: selectedFolderId === id ? null : selectedFolderId
    }))
  },

  renameFolder: async (id, name) => {
    await window.api.renameFolder(id, name)
    set((s) => ({
      folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f))
    }))
  },

  selectFolder: (id) => set({ selectedFolderId: id }),

  addAssetsToFolder: async (folderId, assetIds) => {
    await window.api.addAssetsToFolder(folderId, assetIds)
    const counts = await window.api.getFolderAssetCounts()
    set({ folderCounts: counts })
  },

  removeAssetsFromFolder: async (folderId, assetIds) => {
    await window.api.removeAssetsFromFolder(folderId, assetIds)
    const counts = await window.api.getFolderAssetCounts()
    set({ folderCounts: counts })
  }
}))
