import { useRef, useState } from 'react'
import { LayoutGrid, List, SortAsc, SortDesc, FolderOpen, X } from 'lucide-react'
import { useFilterStore } from '../../stores/filterStore'
import { useUIStore } from '../../stores/uiStore'
import { useTagStore } from '../../stores/tagStore'
import type { ImportProgress } from '../../../../shared/types'

interface TopBarProps {
  progress: ImportProgress | null
  importing: boolean
  onImport: () => void
}

export function TopBar({ progress, importing, onImport }: TopBarProps): React.JSX.Element {
  const { query, tagIds, types, sortBy, sortOrder, setFilter, resetFilter } = useFilterStore()
  const { viewMode, setViewMode } = useUIStore()
  const { tags } = useTagStore()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [localQuery, setLocalQuery] = useState(query)

  const hasActiveFilters = tagIds.length > 0 || types.length > 0

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
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="text-sm font-semibold text-zinc-100 mr-1">AssetVault</span>

        <input
          type="text"
          value={localQuery}
          onChange={handleQueryChange}
          placeholder="검색..."
          className="flex-1 max-w-sm px-3 py-1.5 bg-zinc-700 border border-zinc-600 rounded text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
        />

        <select
          value={sortBy}
          onChange={(e) => setFilter({ sortBy: e.target.value as typeof sortBy })}
          className="px-2 py-1.5 bg-zinc-700 border border-zinc-600 rounded text-sm text-zinc-300 focus:outline-none"
        >
          <option value="importedAt">임포트 날짜</option>
          <option value="createdAt">생성 날짜</option>
          <option value="name">이름</option>
          <option value="size">크기</option>
        </select>

        <button
          onClick={() => setFilter({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
          title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
        </button>

        <div className="flex border border-zinc-600 rounded overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-zinc-600 text-zinc-100' : 'text-zinc-400 hover:text-zinc-100'}`}
            title="그리드 보기"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-zinc-600 text-zinc-100' : 'text-zinc-400 hover:text-zinc-100'}`}
            title="리스트 보기"
          >
            <List size={16} />
          </button>
        </div>

        <button
          onClick={onImport}
          disabled={importing}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-sm font-medium transition-colors"
        >
          <FolderOpen size={15} />
          {importing ? '임포트 중...' : '임포트'}
        </button>

        {progress && (
          <span className="text-xs text-zinc-400 truncate max-w-[200px]">
            {progress.current}/{progress.total} — {progress.filename}
          </span>
        )}
      </div>

      {/* 활성 필터 칩 */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-4 pb-2 flex-wrap">
          {tagIds.map((id) => {
            const tag = tags.find((t) => t.id === id)
            if (!tag) return null
            return (
              <span
                key={id}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
                <button onClick={() => removeTagFilter(id)} className="hover:opacity-75">
                  <X size={10} />
                </button>
              </span>
            )
          })}
          {types.map((type) => (
            <span
              key={type}
              className="flex items-center gap-1 px-2 py-0.5 bg-zinc-600 rounded-full text-xs text-zinc-200"
            >
              {type}
              <button onClick={() => removeTypeFilter(type)} className="hover:opacity-75">
                <X size={10} />
              </button>
            </span>
          ))}
          <button
            onClick={handleReset}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            필터 초기화
          </button>
        </div>
      )}
    </div>
  )
}
