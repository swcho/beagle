import { useEffect, useState } from 'react'
import { TopBar } from './components/layout/TopBar'
import { StatusBar } from './components/layout/StatusBar'
import { MainGrid } from './components/asset/MainGrid'
import { useLibraryStore } from './stores/libraryStore'
import { useFilterStore } from './stores/filterStore'
import type { ImportProgress } from '../../shared/types'

function App(): React.JSX.Element {
  const { assets, isLoading, fetchAssets, updateThumbnail } = useLibraryStore()
  const { query, types, tagIds, colors, sortBy, sortOrder } = useFilterStore()
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // filterStore 변경 시 fetchAssets 자동 호출
  useEffect(() => {
    fetchAssets({ query, types, tagIds, colors, sortBy, sortOrder })
  }, [query, types, tagIds, colors, sortBy, sortOrder])

  // IPC 이벤트 리스너 등록
  useEffect(() => {
    const onProgress = (...args: unknown[]): void => {
      setProgress(args[0] as ImportProgress)
    }
    const onThumbnail = (...args: unknown[]): void => {
      const { assetId, thumbnailPath, colors: c } = args[0] as {
        assetId: string
        thumbnailPath: string
        colors: string[]
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
      const result = await window.api.importFolder(folder)
      console.log('Import result:', result)
      await fetchAssets({ query, types, tagIds, colors, sortBy, sortOrder })
    } catch (e) {
      setError(e instanceof Error ? e.message : '임포트 중 오류가 발생했습니다.')
    } finally {
      setImporting(false)
      setProgress(null)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-white overflow-hidden">
      <TopBar progress={progress} importing={importing} onImport={handleImport} />

      {error && (
        <div className="mx-4 mt-3 px-4 py-2 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm shrink-0">
          {error}
          <button
            className="ml-3 text-red-400 hover:text-red-200"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      <MainGrid assets={assets} isLoading={isLoading} onImport={handleImport} />

      <StatusBar />
    </div>
  )
}

export default App
