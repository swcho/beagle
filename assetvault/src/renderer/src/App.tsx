import { useEffect, useState } from 'react'
import { TopBar } from './components/layout/TopBar'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import { MainGrid } from './components/asset/MainGrid'
import { AssetDetail } from './components/asset/AssetDetail'
import { useLibraryStore } from './stores/libraryStore'
import { useFilterStore } from './stores/filterStore'
import { useUIStore } from './stores/uiStore'
import type { ImportProgress } from '../../shared/types'

function App(): React.JSX.Element {
  const { assets, isLoading, fetchAssets, updateThumbnail } = useLibraryStore()
  const { query, types, tagIds, colors, sortBy, sortOrder } = useFilterStore()
  const { selectedAssetId, setSelectedAssetId } = useUIStore()
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) ?? null

  useEffect(() => {
    fetchAssets({ query, types, tagIds, colors, sortBy, sortOrder })
  }, [query, types, tagIds, colors, sortBy, sortOrder])

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

  async function handleImport(): Promise<void> {
    setError(null)
    try {
      const folder = await window.api.openFolderDialog()
      if (!folder) return
      setImporting(true)
      setProgress(null)
      await window.api.importFolder(folder)
      await fetchAssets({ query, types, tagIds, colors, sortBy, sortOrder })
    } catch (e) {
      setError(e instanceof Error ? e.message : '임포트 중 오류가 발생했습니다.')
    } finally {
      setImporting(false)
      setProgress(null)
    }
  }

  async function handleAssetUpdate(): Promise<void> {
    await fetchAssets({ query, types, tagIds, colors, sortBy, sortOrder })
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-white overflow-hidden">
      <TopBar progress={progress} importing={importing} onImport={handleImport} />

      {error && (
        <div className="mx-4 mt-3 px-4 py-2 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm shrink-0">
          {error}
          <button className="ml-3 text-red-400 hover:text-red-200" onClick={() => setError(null)}>✕</button>
        </div>
      )}

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
    </div>
  )
}

export default App
