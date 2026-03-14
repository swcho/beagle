import { useVirtualizer } from '@tanstack/react-virtual'
import { Button, Col, Empty, Row, Spin } from 'antd'
import { FolderOpen, SearchX } from 'lucide-react'
import { useRef, useEffect, useMemo } from 'react'

import type { Asset } from '@shared/types'

import { useFilterStore } from '@renderer/stores/filterStore'
import { useUIStore } from '@renderer/stores/uiStore'

import { AssetCard } from './AssetCard'

interface MainGridProps {
  assets: Asset[]
  isLoading: boolean
  onImport: () => void
}

export function MainGrid({ assets, isLoading, onImport }: MainGridProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const { gridColumns, setGridColumns, viewMode } = useUIStore()
  const { query, types, tagIds, colors, resetFilter } = useFilterStore()
  const hasActiveFilter = !!(query || types.length || tagIds.length || colors.length)

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
    if (viewMode === 'list') return assets.map((a) => [a])
    const result: Asset[][] = []
    for (let i = 0; i < assets.length; i += gridColumns) {
      result.push(assets.slice(i, i + gridColumns))
    }
    return result
  }, [assets, gridColumns, viewMode])

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => (viewMode === 'list' ? 52 : 180),
    overscan: 3
  })

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (assets.length === 0) {
    if (hasActiveFilter) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Empty
            image={<SearchX size={48} className="text-zinc-600 mx-auto" />}
            description={<span className="text-zinc-500 text-sm">검색 결과가 없습니다</span>}
          >
            <Button onClick={resetFilter}>필터 초기화</Button>
          </Empty>
        </div>
      )
    }
    return (
      <div className="flex-1 flex items-center justify-center">
        <Empty
          image={<FolderOpen size={48} className="text-zinc-600 mx-auto" />}
          description={<span className="text-zinc-500 text-sm">폴더를 임포트해서 시작하세요</span>}
        >
          <Button type="primary" onClick={onImport}>
            폴더 임포트
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-3">
      <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index]
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{ position: 'absolute', top: virtualRow.start, left: 0, right: 0 }}
            >
              {viewMode === 'list' ? (
                <div className="pb-1">
                  <AssetCard asset={row[0]} mode="list" />
                </div>
              ) : (
                <Row gutter={[8, 0]} style={{ paddingBottom: 8 }}>
                  {row.map((asset) => {
                    const colFlex = `0 0 calc(100% / ${gridColumns})`
                    return (
                      <Col
                        key={asset.id}
                        style={{ flex: colFlex, maxWidth: `calc(100% / ${gridColumns})` }}
                      >
                        <AssetCard asset={asset} />
                      </Col>
                    )
                  })}
                </Row>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
