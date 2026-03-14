import { create } from 'zustand'
import type { Tag } from '../../../shared/types'

interface TagState {
  tags: Tag[]
  tagCounts: Record<string, number>
  fetchTags: () => Promise<void>
  createTag: (name: string, color: string) => Promise<Tag>
  deleteTag: (id: string) => Promise<void>
  updateAssetTags: (assetId: string, tagIds: string[]) => Promise<void>
}

export const useTagStore = create<TagState>((set) => ({
  tags: [],
  tagCounts: {},

  fetchTags: async () => {
    const [tags, tagCounts] = await Promise.all([
      window.api.getTags(),
      window.api.getTagAssetCounts(),
    ])
    set({ tags, tagCounts })
  },

  createTag: async (name, color) => {
    const tag = await window.api.createTag(name, color)
    set((state) => ({ tags: [...state.tags, tag] }))
    return tag
  },

  deleteTag: async (id) => {
    await window.api.deleteTag(id)
    set((state) => ({
      tags: state.tags.filter((t) => t.id !== id),
      tagCounts: Object.fromEntries(
        Object.entries(state.tagCounts).filter(([k]) => k !== id)
      ),
    }))
  },

  updateAssetTags: async (assetId, tagIds) => {
    await window.api.updateAssetTags(assetId, tagIds)
    const tagCounts = await window.api.getTagAssetCounts()
    set({ tagCounts })
  },
}))
