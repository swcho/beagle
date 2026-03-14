import { create } from 'zustand'
import type { Asset, AssetFilter } from '../../../shared/types'

interface LibraryState {
  assets: Asset[]
  totalCount: number
  isLoading: boolean
  fetchAssets: (filter: AssetFilter) => Promise<void>
  removeAssets: (ids: string[]) => Promise<void>
  updateThumbnail: (assetId: string, thumbnailPath: string, colors: string[]) => void
}

export const useLibraryStore = create<LibraryState>((set) => ({
  assets: [],
  totalCount: 0,
  isLoading: false,

  fetchAssets: async (filter: AssetFilter) => {
    set({ isLoading: true })
    try {
      const assets = await window.api.getAssets(filter)
      set({ assets, totalCount: assets.length, isLoading: false })
    } catch (err) {
      console.error('fetchAssets 실패:', err)
      set({ isLoading: false })
    }
  },

  removeAssets: async (ids: string[]) => {
    await window.api.removeAssets(ids)
    set((state) => ({
      assets: state.assets.filter((a) => !ids.includes(a.id)),
      totalCount: state.totalCount - ids.length,
    }))
  },

  updateThumbnail: (assetId: string, thumbnailPath: string, colors: string[]) => {
    set((state) => ({
      assets: state.assets.map((a) =>
        a.id === assetId ? { ...a, thumbnail: thumbnailPath, colors } : a
      ),
    }))
  },
}))
