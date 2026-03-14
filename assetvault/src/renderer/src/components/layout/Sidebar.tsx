import { useEffect, useRef, useState } from 'react'
import { Tag, Trash2, Palette } from 'lucide-react'
import { useTagStore } from '../../stores/tagStore'
import { useFilterStore } from '../../stores/filterStore'

const PRESET_COLORS = [
  { label: '빨강',   hex: '#ef4444' },
  { label: '주황',   hex: '#f97316' },
  { label: '노랑',   hex: '#eab308' },
  { label: '초록',   hex: '#22c55e' },
  { label: '파랑',   hex: '#3b82f6' },
  { label: '남색',   hex: '#6366f1' },
  { label: '보라',   hex: '#a855f7' },
  { label: '분홍',   hex: '#ec4899' },
  { label: '흰색',   hex: '#f4f4f5' },
  { label: '회색',   hex: '#71717a' },
  { label: '검정',   hex: '#18181b' },
]

export function Sidebar(): React.JSX.Element {
  const { tags, tagCounts, fetchTags, deleteTag } = useTagStore()
  const { tagIds, colors, colorTolerance, setFilter } = useFilterStore()
  const [contextMenu, setContextMenu] = useState<{ tagId: string; x: number; y: number } | null>(null)
  const contextRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  useEffect(() => {
    function handleClick(): void { setContextMenu(null) }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  function toggleTagFilter(tagId: string): void {
    const next = tagIds.includes(tagId)
      ? tagIds.filter((id) => id !== tagId)
      : [...tagIds, tagId]
    setFilter({ tagIds: next })
  }

  function toggleColorFilter(hex: string): void {
    const next = colors.includes(hex)
      ? colors.filter((c) => c !== hex)
      : [...colors, hex]
    setFilter({ colors: next })
  }

  async function handleDelete(tagId: string): Promise<void> {
    setContextMenu(null)
    await deleteTag(tagId)
    if (tagIds.includes(tagId)) {
      setFilter({ tagIds: tagIds.filter((id) => id !== tagId) })
    }
  }

  return (
    <div className="w-52 flex flex-col bg-zinc-800 border-r border-zinc-700 shrink-0 overflow-y-auto">
      {/* 태그 섹션 */}
      <div className="px-3 py-3 border-b border-zinc-700">
        <div className="flex items-center gap-2 mb-2">
          <Tag size={13} className="text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">태그</span>
        </div>

        {tags.length === 0 ? (
          <p className="text-xs text-zinc-600 px-1">태그 없음</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {tags.map((tag) => {
              const isActive = tagIds.includes(tag.id)
              const count = tagCounts[tag.id] ?? 0
              return (
                <div
                  key={tag.id}
                  className={`
                    group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors
                    ${isActive ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'}
                  `}
                  onClick={() => toggleTagFilter(tag.id)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setContextMenu({ tagId: tag.id, x: e.clientX, y: e.clientY })
                  }}
                >
                  <label
                    className="w-3 h-3 rounded-full shrink-0 cursor-pointer"
                    style={{ backgroundColor: tag.color }}
                    onClick={(e) => e.stopPropagation()}
                    title="색상 변경"
                  >
                    <input
                      type="color"
                      className="opacity-0 w-0 h-0 absolute"
                      defaultValue={tag.color}
                    />
                  </label>
                  <span className="text-xs flex-1 truncate">{tag.name}</span>
                  {count > 0 && (
                    <span className="text-[10px] text-zinc-500 bg-zinc-700 px-1.5 py-0.5 rounded-full shrink-0">
                      {count}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 색상 필터 섹션 */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Palette size={13} className="text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">색상</span>
        </div>

        <div className="grid grid-cols-6 gap-1.5 mb-3">
          {PRESET_COLORS.map(({ label, hex }) => {
            const isActive = colors.includes(hex)
            return (
              <button
                key={hex}
                title={label}
                onClick={() => toggleColorFilter(hex)}
                className={`
                  w-6 h-6 rounded-full border-2 transition-transform hover:scale-110
                  ${isActive ? 'border-white scale-110' : 'border-transparent border-zinc-600'}
                `}
                style={{ backgroundColor: hex }}
              />
            )
          })}
        </div>

        {/* 선택된 색상 칩 */}
        {colors.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {colors.map((hex) => {
              const label = PRESET_COLORS.find((p) => p.hex === hex)?.label ?? hex
              return (
                <button
                  key={hex}
                  onClick={() => toggleColorFilter(hex)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white border border-zinc-600"
                  style={{ backgroundColor: hex + '33', borderColor: hex }}
                >
                  <span style={{ color: hex }}>●</span> {label}
                  <span className="text-zinc-400">✕</span>
                </button>
              )
            })}
          </div>
        )}

        {/* tolerance 슬라이더 */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>유사도</span>
            <span>{Math.round(colorTolerance * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.5"
            step="0.05"
            value={colorTolerance}
            onChange={(e) => setFilter({ colorTolerance: parseFloat(e.target.value) })}
            className="w-full accent-blue-500"
          />
        </div>
      </div>

      {/* 우클릭 컨텍스트 메뉴 */}
      {contextMenu && (
        <div
          ref={contextRef}
          style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 9999 }}
          className="bg-zinc-700 border border-zinc-600 rounded shadow-xl py-1 min-w-[120px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleDelete(contextMenu.tagId)}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-400 hover:bg-zinc-600 transition-colors"
          >
            <Trash2 size={12} />
            태그 삭제
          </button>
        </div>
      )}
    </div>
  )
}
