import { Button, Col, Input, Progress, Row, Segmented, Select, Tag as AntTag, Tooltip } from 'antd'
import type { InputRef } from 'antd'
import { FolderOpen, LayoutGrid, List, SortAsc, SortDesc } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { ImportProgress } from '@shared/types'

import { useFilterStore } from '@renderer/stores/filterStore'
import { useTagStore } from '@renderer/stores/tagStore'
import { useUIStore } from '@renderer/stores/uiStore'

interface TopBarProps {
  progress: ImportProgress | null
  importing: boolean
  onImport: () => void
}

const SORT_OPTIONS = [
  { value: 'importedAt', label: '임포트 날짜' },
  { value: 'createdAt', label: '생성 날짜' },
  { value: 'name', label: '이름' },
  { value: 'size', label: '크기' }
]

export function TopBar({ progress, importing, onImport }: TopBarProps): React.JSX.Element {
  const { query, tagIds, types, sortBy, sortOrder, setFilter, resetFilter } = useFilterStore()
  const { viewMode, setViewMode } = useUIStore()
  const { tags } = useTagStore()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchInputRef = useRef<InputRef>(null)
  const [localQuery, setLocalQuery] = useState(query)

  const hasActiveFilters = tagIds.length > 0 || types.length > 0

  // Cmd+F: 검색창 포커스 / Esc: 검색 초기화
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current?.input) {
        setLocalQuery('')
        setFilter({ query: '' })
        searchInputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setFilter])

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const val = e.target.value
    setLocalQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setFilter({ query: val }), 300)
  }

  function removeTagFilter(id: string): void {
    setFilter({ tagIds: tagIds.filter((t) => t !== id) })
  }

  function removeTypeFilter(type: string): void {
    setFilter({ types: types.filter((t) => t !== type) })
  }

  function handleReset(): void {
    setLocalQuery('')
    resetFilter()
  }

  return (
    <div className="flex flex-col bg-zinc-800 border-b border-zinc-700 shrink-0">
      {/* 메인 툴바 */}
      <Row gutter={8} align="middle" style={{ padding: '8px 16px' }} wrap={false}>
        <Col flex="none">
          <span className="text-sm font-semibold text-zinc-100">AssetVault</span>
        </Col>

        <Col flex="1 1 0" style={{ maxWidth: 384, minWidth: 0 }}>
          <Input
            ref={searchInputRef}
            value={localQuery}
            onChange={handleQueryChange}
            placeholder="검색... (⌘F)"
            size="small"
            allowClear
          />
        </Col>

        <Col flex="none">
          <Select
            value={sortBy}
            onChange={(val) => setFilter({ sortBy: val as typeof sortBy })}
            options={SORT_OPTIONS}
            size="small"
            style={{ width: 110 }}
          />
        </Col>

        <Col flex="none">
          <Tooltip title={sortOrder === 'asc' ? '오름차순' : '내림차순'}>
            <Button
              type="text"
              size="small"
              icon={sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              onClick={() => setFilter({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
            />
          </Tooltip>
        </Col>

        <Col flex="none">
          <Segmented
            size="small"
            value={viewMode}
            onChange={(val) => setViewMode(val as 'grid' | 'list')}
            options={[
              { value: 'grid', label: <LayoutGrid size={14} /> },
              { value: 'list', label: <List size={14} /> }
            ]}
          />
        </Col>

        <Col flex="none">
          <Button
            type="primary"
            size="small"
            icon={<FolderOpen size={15} />}
            onClick={onImport}
            loading={importing}
          >
            {importing ? '임포트 중...' : '임포트'}
          </Button>
        </Col>

        {progress && (
          <Col flex="1 1 0" style={{ maxWidth: 208, minWidth: 0 }}>
            <Row gutter={8} align="middle" wrap={false}>
              <Col flex="1 1 0">
                <Progress
                  percent={Math.round((progress.current / progress.total) * 100)}
                  size="small"
                  status="active"
                  showInfo={false}
                />
              </Col>
              <Col flex="none">
                <span className="text-xs text-zinc-400 truncate">{progress.filename}</span>
              </Col>
            </Row>
          </Col>
        )}
      </Row>

      {/* 활성 필터 칩 */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-4 pb-2 flex-wrap">
          {tagIds.map((id) => {
            const tag = tags.find((t) => t.id === id)
            if (!tag) return null
            return (
              <AntTag
                key={id}
                closable
                onClose={() => removeTagFilter(id)}
                color={tag.color}
                style={{ marginInlineEnd: 0 }}
              >
                {tag.name}
              </AntTag>
            )
          })}
          {types.map((type) => (
            <AntTag
              key={type}
              closable
              onClose={() => removeTypeFilter(type)}
              style={{ marginInlineEnd: 0 }}
            >
              {type}
            </AntTag>
          ))}
          <Button type="link" size="small" onClick={handleReset} style={{ padding: 0 }}>
            필터 초기화
          </Button>
        </div>
      )}
    </div>
  )
}
