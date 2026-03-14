import { Col, Dropdown, Row, Slider, Tag as AntTag } from 'antd'
import type { MenuProps } from 'antd'
import { Tag, Trash2, Palette, Layers } from 'lucide-react'
import { useEffect } from 'react'

import type { AssetType } from '@shared/types'

import { useFilterStore } from '@renderer/stores/filterStore'
import { useTagStore } from '@renderer/stores/tagStore'

const ASSET_TYPES: { type: AssetType; label: string; className: string }[] = [
  { type: 'image', label: 'IMG', className: 'bg-blue-900 text-blue-300' },
  { type: 'audio', label: 'SND', className: 'bg-green-900 text-green-300' },
  { type: 'video', label: 'VID', className: 'bg-purple-900 text-purple-300' },
  { type: 'font', label: 'FONT', className: 'bg-yellow-900 text-yellow-300' },
  { type: 'model3d', label: '3D', className: 'bg-orange-900 text-orange-300' },
  { type: 'doc', label: 'DOC', className: 'bg-red-900 text-red-300' }
]

const PRESET_COLORS = [
  { label: '빨강', hex: '#ef4444' },
  { label: '주황', hex: '#f97316' },
  { label: '노랑', hex: '#eab308' },
  { label: '초록', hex: '#22c55e' },
  { label: '파랑', hex: '#3b82f6' },
  { label: '남색', hex: '#6366f1' },
  { label: '보라', hex: '#a855f7' },
  { label: '분홍', hex: '#ec4899' },
  { label: '흰색', hex: '#f4f4f5' },
  { label: '회색', hex: '#71717a' },
  { label: '검정', hex: '#18181b' }
]

export function Sidebar(): React.JSX.Element {
  const { tags, tagCounts, fetchTags, deleteTag } = useTagStore()
  const { types, tagIds, colors, colorTolerance, setFilter } = useFilterStore()

  function toggleTypeFilter(type: AssetType): void {
    const next = types.includes(type) ? types.filter((t) => t !== type) : [...types, type]
    setFilter({ types: next })
  }

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  function toggleTagFilter(tagId: string): void {
    const next = tagIds.includes(tagId) ? tagIds.filter((id) => id !== tagId) : [...tagIds, tagId]
    setFilter({ tagIds: next })
  }

  function toggleColorFilter(hex: string): void {
    const next = colors.includes(hex) ? colors.filter((c) => c !== hex) : [...colors, hex]
    setFilter({ colors: next })
  }

  async function handleDelete(tagId: string): Promise<void> {
    await deleteTag(tagId)
    if (tagIds.includes(tagId)) {
      setFilter({ tagIds: tagIds.filter((id) => id !== tagId) })
    }
  }

  function getTagMenu(tagId: string): MenuProps {
    return {
      items: [
        {
          key: 'delete',
          label: '태그 삭제',
          icon: <Trash2 size={12} />,
          danger: true,
          onClick: () => handleDelete(tagId)
        }
      ]
    }
  }

  return (
    <>
      {/* 타입 필터 섹션 */}
      <div className="px-3 py-3 border-b border-zinc-700">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={13} className="text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">타입</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {ASSET_TYPES.map(({ type, label, className }) => {
            const isActive = types.includes(type)
            return (
              <button
                key={type}
                onClick={() => toggleTypeFilter(type)}
                className={`
                  text-[10px] font-bold px-1.5 py-0.5 rounded transition-opacity
                  ${className}
                  ${isActive ? 'opacity-100 ring-1 ring-white/40' : 'opacity-40 hover:opacity-70'}
                `}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

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
                <Dropdown key={tag.id} menu={getTagMenu(tag.id)} trigger={['contextMenu']}>
                  <div
                    className={`
                      group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors
                      ${isActive ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'}
                    `}
                    onClick={() => toggleTagFilter(tag.id)}
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
                </Dropdown>
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

        <Row gutter={[6, 6]} style={{ marginBottom: 12 }}>
          {PRESET_COLORS.map(({ label, hex }) => {
            const isActive = colors.includes(hex)
            return (
              <Col key={hex} span={4}>
                <button
                  title={label}
                  onClick={() => toggleColorFilter(hex)}
                  className={`
                    w-6 h-6 rounded-full border-2 transition-transform hover:scale-110
                    ${isActive ? 'border-white scale-110' : 'border-zinc-600'}
                  `}
                  style={{ backgroundColor: hex }}
                />
              </Col>
            )
          })}
        </Row>

        {/* 선택된 색상 칩 */}
        {colors.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {colors.map((hex) => {
              const label = PRESET_COLORS.find((p) => p.hex === hex)?.label ?? hex
              return (
                <AntTag
                  key={hex}
                  closable
                  onClose={() => toggleColorFilter(hex)}
                  color={hex}
                  style={{ marginInlineEnd: 0 }}
                >
                  {label}
                </AntTag>
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
          <Slider
            min={0.05}
            max={0.5}
            step={0.05}
            value={colorTolerance}
            onChange={(val) => setFilter({ colorTolerance: val })}
            tooltip={{ formatter: (val) => `${Math.round((val ?? 0) * 100)}%` }}
          />
        </div>
      </div>
    </>
  )
}
