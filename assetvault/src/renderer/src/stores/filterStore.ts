import { create } from 'zustand'

import type { AssetType } from '@shared/types'

interface FilterState {
  query: string
  types: AssetType[]
  tagIds: string[]
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
  colors: [] as string[],
  colorTolerance: 0.25,
  sortBy: 'importedAt' as const,
  sortOrder: 'desc' as const
}

export const useFilterStore = create<FilterState>((set) => ({
  ...defaultFilter,
  setFilter: (partial) => set((state) => ({ ...state, ...partial })),
  resetFilter: () => set(defaultFilter)
}))
