import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { AssetType } from '@shared/types'

interface FilterState {
  query: string
  types: AssetType[]
  tagIds: string[]
  folderId: string | undefined
  directory: string | undefined
  colors: string[]
  colorTolerance: number
  sortBy: 'name' | 'size' | 'createdAt' | 'importedAt'
  sortOrder: 'asc' | 'desc'
  setFilter: (partial: Partial<Omit<FilterState, 'setFilter' | 'resetFilter'>>) => void
  resetFilter: () => void
}

const defaultFilter = {
  query: '',
  types: [] as AssetType[],
  tagIds: [] as string[],
  folderId: undefined as string | undefined,
  directory: undefined as string | undefined,
  colors: [] as string[],
  colorTolerance: 0.25,
  sortBy: 'importedAt' as const,
  sortOrder: 'desc' as const
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      ...defaultFilter,
      setFilter: (partial) => set((state) => ({ ...state, ...partial })),
      resetFilter: () => set(defaultFilter)
    }),
    {
      name: 'asset-filter',
      partialize: (state) => ({
        types: state.types,
        colors: state.colors,
        colorTolerance: state.colorTolerance,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      })
    }
  )
)
