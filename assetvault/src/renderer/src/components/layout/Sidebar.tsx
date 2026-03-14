import { useEffect, useRef, useState } from 'react'
import { Tag, Trash2 } from 'lucide-react'
import { useTagStore } from '../../stores/tagStore'
import { useFilterStore } from '../../stores/filterStore'

export function Sidebar(): React.JSX.Element {
  const { tags, tagCounts, fetchTags, deleteTag } = useTagStore()
  const { tagIds, setFilter } = useFilterStore()
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

  function handleColorChange(tagId: string, color: string): void {
    // 색상 변경은 create/delete로 처리하기보다 추후 updateTag 추가 예정
    // 현재는 UI만 표시
    console.log('color change', tagId, color)
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
      <div className="px-3 py-3">
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
                  {/* 컬러 닷 — 클릭하면 color picker */}
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
                      onChange={(e) => handleColorChange(tag.id, e.target.value)}
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
