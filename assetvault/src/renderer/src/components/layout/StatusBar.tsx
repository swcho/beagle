import { useLibraryStore } from '@renderer/stores/libraryStore'
import { useUIStore } from '@renderer/stores/uiStore'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function StatusBar(): React.JSX.Element {
  const { assets, totalCount } = useLibraryStore()
  const { selectedIds } = useUIStore()

  const selectedSize = assets
    .filter((a) => selectedIds.has(a.id))
    .reduce((sum, a) => sum + a.size, 0)

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 bg-zinc-800 border-t border-zinc-700 text-xs text-zinc-500 shrink-0">
      <span>총 {totalCount}개</span>
      {selectedIds.size > 0 && (
        <>
          <span className="text-zinc-400">{selectedIds.size}개 선택됨</span>
          <span>{formatBytes(selectedSize)}</span>
        </>
      )}
    </div>
  )
}
