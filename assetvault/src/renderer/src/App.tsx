import { Layout, message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ImportProgress } from '@shared/types'

import { AssetDetail } from './components/asset/AssetDetail'
import { MainGrid } from './components/asset/MainGrid'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import { TopBar } from './components/layout/TopBar'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useFilterStore } from './stores/filterStore'
import { useFolderStore } from './stores/folderStore'
import { useLibraryStore } from './stores/libraryStore'
import { useUIStore } from './stores/uiStore'

function App(): React.JSX.Element {
  const { assets, isLoading, fetchAssets, updateThumbnail } = useLibraryStore()
  const { fetchDirectories } = useFolderStore()
  const { query, types, tagIds, folderId, directory, colors, colorTolerance, sortBy, sortOrder } =
    useFilterStore()
  const { selectedAssetId, setSelectedAssetId } = useUIStore()
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [importing, setImporting] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) ?? null
  const currentFilter = useMemo(
    () => ({ query, types, tagIds, folderId, directory, colors, colorTolerance, sortBy, sortOrder }),
    [query, types, tagIds, folderId, directory, colors, colorTolerance, sortBy, sortOrder]
  )

  const addToast = useCallback(
    (type: 'success' | 'error' | 'info', msg: string) => {
      if (type === 'success') messageApi.success(msg)
      else if (type === 'error') messageApi.error(msg)
      else messageApi.info(msg)
    },
    [messageApi]
  )

  useEffect(() => {
    fetchAssets(currentFilter)
  }, [currentFilter, fetchAssets])

  useEffect(() => {
    const onProgress = (...args: unknown[]): void => {
      setProgress(args[0] as ImportProgress)
    }
    const onThumbnail = (...args: unknown[]): void => {
      const {
        assetId,
        thumbnailPath,
        colors: c
      } = args[0] as {
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

  const handleImport = useCallback(async (): Promise<void> => {
    try {
      const folder = await window.api.openFolderDialog()
      if (!folder) return
      setImporting(true)
      setProgress(null)
      const result = await window.api.importFolder(folder)
      await Promise.all([fetchAssets(currentFilter), fetchDirectories()])
      addToast(
        'success',
        `${result.imported}개 임포트 완료${result.skipped ? ` (${result.skipped}개 건너뜀)` : ''}`
      )
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
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {contextHolder}
      <Layout.Header style={{ padding: 0, height: 'auto', lineHeight: 'normal' }}>
        <TopBar progress={progress} importing={importing} onImport={handleImport} />
      </Layout.Header>

      <Layout style={{ overflow: 'hidden' }}>
        <Layout.Sider
          width={208}
          style={{
            background: '#27272a',
            borderRight: '1px solid #3f3f46',
            overflow: 'auto'
          }}
        >
          <Sidebar />
        </Layout.Sider>

        <Layout.Content style={{ overflow: 'hidden', display: 'flex' }}>
          <MainGrid assets={assets} isLoading={isLoading} onImport={handleImport} />
          {selectedAsset && (
            <AssetDetail
              asset={selectedAsset}
              onClose={() => setSelectedAssetId(null)}
              onAssetUpdate={handleAssetUpdate}
            />
          )}
        </Layout.Content>
      </Layout>

      <Layout.Footer style={{ padding: 0 }}>
        <StatusBar />
      </Layout.Footer>
    </Layout>
  )
}

export default App
