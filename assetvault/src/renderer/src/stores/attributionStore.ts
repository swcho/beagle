import { create } from 'zustand'

import type { Attribution } from '@shared/types'

interface AttributionState {
  attributions: Attribution[]
  fetchAttributions: () => Promise<void>
  createAttribution: (data: Omit<Attribution, 'id' | 'createdAt'>) => Promise<Attribution>
  updateAttribution: (
    id: string,
    data: Partial<Omit<Attribution, 'id' | 'createdAt'>>
  ) => Promise<Attribution>
  deleteAttribution: (id: string) => Promise<void>
  setDirectoryAttribution: (directoryPath: string, attributionId: string | null) => Promise<void>
}

export const useAttributionStore = create<AttributionState>((set) => ({
  attributions: [],

  fetchAttributions: async () => {
    const attributions = await window.api.getAttributions()
    set({ attributions })
  },

  createAttribution: async (data) => {
    const attribution = await window.api.createAttribution(data)
    set((state) => ({ attributions: [attribution, ...state.attributions] }))
    return attribution
  },

  updateAttribution: async (id, data) => {
    const attribution = await window.api.updateAttribution(id, data)
    set((state) => ({
      attributions: state.attributions.map((a) => (a.id === id ? attribution : a))
    }))
    return attribution
  },

  deleteAttribution: async (id) => {
    await window.api.deleteAttribution(id)
    set((state) => ({ attributions: state.attributions.filter((a) => a.id !== id) }))
  },

  setDirectoryAttribution: async (directoryPath, attributionId) => {
    await window.api.setDirectoryAttribution(directoryPath, attributionId)
  }
}))
