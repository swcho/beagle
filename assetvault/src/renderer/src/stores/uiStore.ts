import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  viewMode: 'grid' | 'list'
  selectedIds: Set<string>
  gridColumns: number
  selectedAssetId: string | null
  sidebarWidth: number
  setViewMode: (mode: 'grid' | 'list') => void
  toggleSelect: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  setGridColumns: (cols: number) => void
  setSelectedAssetId: (id: string | null) => void
  setSidebarWidth: (width: number) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      viewMode: 'grid',
      selectedIds: new Set(),
      gridColumns: 5,
      selectedAssetId: null,
      sidebarWidth: 208,

      setViewMode: (mode) => set({ viewMode: mode }),

      toggleSelect: (id) =>
        set((state) => {
          const next = new Set(state.selectedIds)
          if (next.has(id)) {
            next.delete(id)
          } else {
            next.add(id)
          }
          return { selectedIds: next }
        }),

      selectAll: (ids) => set({ selectedIds: new Set(ids) }),

      clearSelection: () => set({ selectedIds: new Set() }),

      setGridColumns: (cols) => set({ gridColumns: cols }),

      setSelectedAssetId: (id) => set({ selectedAssetId: id }),
      setSidebarWidth: (width) => set({ sidebarWidth: width })
    }),
    {
      name: 'asset-ui',
      partialize: (state) => ({
        viewMode: state.viewMode,
        gridColumns: state.gridColumns,
        sidebarWidth: state.sidebarWidth
      })
    }
  )
)
