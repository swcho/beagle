import { useRef, useState } from 'react'
import { LayoutGrid, List, SortAsc, SortDesc, FolderOpen } from 'lucide-react'
import { useFilterStore } from '../../stores/filterStore'
import { useUIStore } from '../../stores/uiStore'
import type { ImportProgress } from '../../../../shared/types'

interface TopBarProps {
  progress: ImportProgress | null
  importing: boolean
  onImport: () => void
}

export function TopBar({ progress, importing, onImport }: TopBarProps): React.JSX.Element {
  const { query, sortBy, sortOrder, setFilter } = useFilterStore()
  const { viewMode, setViewMode } = useUIStore()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [localQuery, setLocalQuery] = useState(query)

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const val = e.target.value
    setLocalQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setFilter({ query: val })
    }, 300)
  }

  function handleSortByChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    setFilter({ sortBy: e.target.value as 'name' | 'size' | 'createdAt' | 'importedAt' })
  }

  function toggleSortOrder(): void {
    setFilter({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800 border-b border-zinc-700 shrink-0">
      <span className="text-sm font-semibold text-zinc-100 mr-1">AssetVault</span>

      {/* 검색창 */}
      <input
        type="text"
        value={localQuery}
        onChange={handleQueryChange}
        placeholder="검색..."
        className="flex-1 max-w-sm px-3 py-1.5 bg-zinc-700 border border-zinc-600 rounded text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
      />

      {/* 정렬 */}
      <select
        value={sortBy}
        onChange={handleSortByChange}
        className="px-2 py-1.5 bg-zinc-700 border border-zinc-600 rounded text-sm text-zinc-300 focus:outline-none"
      >
        <option value="importedAt">임포트 날짜</option>
        <option value="createdAt">생성 날짜</option>
        <option value="name">이름</option>
        <option value="size">크기</option>
      </select>

      <button
        onClick={toggleSortOrder}
        title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
        className="p-1.5 text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
      </button>

      {/* Grid/List 토글 */}
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

      {/* 임포트 */}
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
  )
}
