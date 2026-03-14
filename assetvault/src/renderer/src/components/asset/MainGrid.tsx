import { useRef, useEffect, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { FolderOpen } from 'lucide-react'
import type { Asset } from '../../../../shared/types'
import { AssetCard } from './AssetCard'
import { useUIStore } from '../../stores/uiStore'

interface MainGridProps {
  assets: Asset[]
  isLoading: boolean
  onImport: () => void
}

export function MainGrid({ assets, isLoading, onImport }: MainGridProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const { gridColumns, setGridColumns } = useUIStore()

  // ResizeObserver로 컨테이너 너비 감지 → gridColumns 자동 계산
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width
      let cols = 5
      if (width < 800) cols = 3
      else if (width <= 1200) cols = 5
      else cols = 7
      setGridColumns(cols)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [setGridColumns])

  // assets를 행(row) 단위로 묶음
  const rows = useMemo(() => {
    const result: Asset[][] = []
    for (let i = 0; i < assets.length; i += gridColumns) {
      result.push(assets.slice(i, i + gridColumns))
    }
    return result
  }, [assets, gridColumns])

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 180,
    overscan: 3,
  })

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        불러오는 중...
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-500">
        <FolderOpen size={48} className="text-zinc-600" />
        <p className="text-sm">폴더를 임포트해서 시작하세요</p>
        <button
          onClick={onImport}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors"
        >
          폴더 임포트
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-3">
      <div
        style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index]
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: virtualRow.start,
                left: 0,
                right: 0,
                display: 'grid',
                gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                gap: '8px',
                paddingBottom: '8px',
              }}
            >
              {row.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
