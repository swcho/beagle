import { useState, useEffect } from 'react'
import type { Asset, ImportProgress } from '../../shared/types'

function App(): React.JSX.Element {
  const [assets, setAssets] = useState<Asset[]>([])
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (...args: unknown[]): void => {
      setProgress(args[0] as ImportProgress)
    }
    window.api.on('import-progress', handler)
    return () => window.api.off('import-progress', handler)
  }, [])

  async function handleImport(): Promise<void> {
    setError(null)
    try {
      const folder = await window.api.openFolderDialog()
      if (!folder) return

      setImporting(true)
      setProgress(null)
      const result = await window.api.importFolder(folder)
      console.log('Import result:', result)

      const list = await window.api.getAssets({})
      console.log('Assets:', list)
      setAssets(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : '임포트 중 오류가 발생했습니다.')
    } finally {
      setImporting(false)
      setProgress(null)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-white">
      <div className="flex items-center gap-4 px-6 py-4 bg-zinc-800 border-b border-zinc-700">
        <h1 className="text-lg font-semibold">AssetVault</h1>
        <button
          onClick={handleImport}
          disabled={importing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-sm font-medium transition-colors"
        >
          {importing ? '임포트 중...' : '폴더 임포트'}
        </button>
        {progress && (
          <span className="text-sm text-zinc-400">
            {progress.current} / {progress.total} — {progress.filename}
          </span>
        )}
      </div>

      {error && (
        <div className="mx-6 mt-4 px-4 py-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        {assets.length === 0 ? (
          <p className="text-zinc-500 text-center mt-20">
            폴더를 임포트해서 시작하세요
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-zinc-800 rounded-lg p-3 text-sm"
              >
                <div className="text-zinc-200 truncate font-medium">{asset.name}</div>
                <div className="text-zinc-500 mt-1">.{asset.ext} · {(asset.size / 1024).toFixed(1)} KB</div>
                {asset.width && (
                  <div className="text-zinc-500">{asset.width}×{asset.height}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 py-2 bg-zinc-800 border-t border-zinc-700 text-xs text-zinc-500">
        {assets.length}개 에셋
      </div>
    </div>
  )
}

export default App
