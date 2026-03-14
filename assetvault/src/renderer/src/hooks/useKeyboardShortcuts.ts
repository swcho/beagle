import { useEffect } from 'react'

import { useLibraryStore } from '@renderer/stores/libraryStore'
import { useUIStore } from '@renderer/stores/uiStore'

interface Options {
  onImport: () => void
}

export function useKeyboardShortcuts({ onImport }: Options): void {
  const { assets, removeAssets } = useLibraryStore()
  const { selectedIds, selectedAssetId, selectAll, clearSelection, setSelectedAssetId } =
    useUIStore()

  useEffect(() => {
    async function handleKeyDown(e: KeyboardEvent): Promise<void> {
      const tag = (e.target as HTMLElement).tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA'

      // Cmd/Ctrl+A: 전체 선택
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !isInput) {
        e.preventDefault()
        selectAll(assets.map((a) => a.id))
        return
      }

      // Cmd/Ctrl+I: 임포트 다이얼로그
      if ((e.metaKey || e.ctrlKey) && e.key === 'i' && !isInput) {
        e.preventDefault()
        onImport()
        return
      }

      // Escape: 선택 해제 + 상세 패널 닫기
      if (e.key === 'Escape' && !isInput) {
        clearSelection()
        setSelectedAssetId(null)
        return
      }

      // Delete/Backspace: 선택된 에셋 라이브러리에서 제거 (파일 삭제 아님)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput && selectedIds.size > 0) {
        e.preventDefault()
        await removeAssets([...selectedIds])
        clearSelection()
        if (selectedAssetId && selectedIds.has(selectedAssetId)) {
          setSelectedAssetId(null)
        }
        return
      }

      // Space: 선택된 첫 번째 에셋 상세 패널 열기
      if (e.key === ' ' && !isInput && selectedIds.size > 0) {
        e.preventDefault()
        const firstId = [...selectedIds][0]
        setSelectedAssetId(firstId)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    assets,
    selectedIds,
    selectedAssetId,
    selectAll,
    clearSelection,
    setSelectedAssetId,
    removeAssets,
    onImport
  ])
}
