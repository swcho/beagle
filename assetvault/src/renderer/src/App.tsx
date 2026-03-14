import { useCallback, useEffect, useState } from 'react'
import { TopBar } from './components/layout/TopBar'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import { MainGrid } from './components/asset/MainGrid'
import { AssetDetail } from './components/asset/AssetDetail'
import { Toast, type ToastItem } from './components/ui/Toast'
import { useLibraryStore } from './stores/libraryStore'
import { useFilterStore } from './stores/filterStore'
import { useUIStore } from './stores/uiStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import type { ImportProgress } from '../../shared/types'

let toastCounter = 0
function makeToast(type: ToastItem['type'], message: string): ToastItem {
  return { id: String(++toastCounter), type, message }
}

function App(): React.JSX.Element {
  const { assets, isLoading, fetchAssets, updateThumbnail } = useLibraryStore()
  const { query, types, tagIds, colors, colorTolerance, sortBy, sortOrder } = useFilterStore()
  const { selectedAssetId, setSelectedAssetId } = useUIStore()
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [importing, setImporting] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) ?? null
  const currentFilter = { query, types, tagIds, colors, colorTolerance, sortBy, sortOrder }

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((type: ToastItem['type'], message: string) => {
    setToasts((prev) => [...prev, makeToast(type, message)])
  }, [])

  useEffect(() => {
    fetchAssets(currentFilter)
  }, [query, types, tagIds, colors, colorTolerance, sortBy, sortOrder])

  useEffect(() => {
    const onProgress = (...args: unknown[]): void => {
      setProgress(args[0] as ImportProgress)
    }
    const onThumbnail = (...args: unknown[]): void => {
      const { assetId, thumbnailPath, colors: c } = args[0] as {
        assetId: string; thumbnailPath: string; colors: string[]
      }
      updateThumbnail(assetId, thumbnailPath, c)
    }
    window.api.on('import-progress', onProgress)
    window.api.on('thumbnail-ready', onThumbnail)
    return () => {
      window.api.off('import-progress', onProgress)
      window.api.off('thumbnail-ready', onThumbnail)
    }
  }, [updateThumbnail])

  const handleImport = useCallback(async (): Promise<void> => {
    try {
      const folder = await window.api.openFolderDialog()
      if (!folder) return
      setImporting(true)
      setProgress(null)
      const result = await window.api.importFolder(folder)
      await fetchAssets(currentFilter)
      addToast('success', `${result.imported}개 임포트 완료${result.skipped ? ` (${result.skipped}개 건너뜀)` : ''}`)
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : '임포트 중 오류가 발생했습니다.')
    } finally {
      setImporting(false)
      setProgress(null)
    }
  }, [currentFilter, fetchAssets, addToast])

  useKeyboardShortcuts({ onImport: handleImport })

  async function handleAssetUpdate(): Promise<void> {
    await fetchAssets(currentFilter)
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-white overflow-hidden">
      <TopBar progress={progress} importing={importing} onImport={handleImport} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainGrid assets={assets} isLoading={isLoading} onImport={handleImport} />
        {selectedAsset && (
          <AssetDetail
            asset={selectedAsset}
            onClose={() => setSelectedAssetId(null)}
            onAssetUpdate={handleAssetUpdate}
          />
        )}
      </div>

      <StatusBar />
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

export default App
