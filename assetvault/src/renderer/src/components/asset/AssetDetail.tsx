import { X, FolderOpen, Tag as TagIcon } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

import type { Asset, Tag } from '@shared/types'

import { useTagStore } from '@renderer/stores/tagStore'

interface Props {
  asset: Asset
  onClose: () => void
  onAssetUpdate: () => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function isFileThumbnail(path: string): boolean {
  return Boolean(path) && !path.startsWith('__placeholder:')
}

export function AssetDetail({ asset, onClose, onAssetUpdate }: Props): React.JSX.Element {
  const { tags, fetchTags, createTag, updateAssetTags } = useTagStore()
  const [tagInput, setTagInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const suggestions = tags.filter(
    (t) =>
      t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
      !asset.tags.some((at) => at.id === t.id)
  )

  async function addTag(tag: Tag): Promise<void> {
    setTagInput('')
    setShowSuggestions(false)
    await updateAssetTags(
      asset.id,
      [...asset.tags, tag].map((t) => t.id)
    )
    onAssetUpdate()
  }

  async function removeTag(tagId: string): Promise<void> {
    await updateAssetTags(
      asset.id,
      asset.tags.filter((t) => t.id !== tagId).map((t) => t.id)
    )
    onAssetUpdate()
  }

  async function handleTagInputKeyDown(e: React.KeyboardEvent): Promise<void> {
    if (e.key === 'Enter' && tagInput.trim()) {
      const existing = tags.find((t) => t.name.toLowerCase() === tagInput.trim().toLowerCase())
      if (existing) {
        await addTag(existing)
      } else {
        const colors = ['#6B7280', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
        const color = colors[Math.floor(Math.random() * colors.length)]
        const newTag = await createTag(tagInput.trim(), color)
        await addTag(newTag)
      }
    } else if (e.key === 'Escape') {
      setTagInput('')
      setShowSuggestions(false)
    }
  }

  const hasThumbnail = asset.thumbnail && isFileThumbnail(asset.thumbnail)

  return (
    <div className="w-72 flex flex-col bg-zinc-850 border-l border-zinc-700 overflow-y-auto shrink-0">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <span className="text-sm font-medium text-zinc-200">에셋 정보</span>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* 썸네일 */}
      <div className="w-full aspect-square bg-zinc-700 flex items-center justify-center">
        {hasThumbnail ? (
          <img
            src={`local-file://${asset.thumbnail}`}
            alt={asset.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-zinc-500 text-xs uppercase">{asset.ext}</span>
        )}
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* 파일명 */}
        <div>
          <p className="text-xs text-zinc-500 mb-1">파일명</p>
          <p className="text-sm text-zinc-200 break-all">
            {asset.name}.{asset.ext}
          </p>
        </div>

        {/* 메타데이터 */}
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">크기</span>
            <span className="text-zinc-300">{formatBytes(asset.size)}</span>
          </div>
          {asset.width && (
            <div className="flex justify-between">
              <span className="text-zinc-500">해상도</span>
              <span className="text-zinc-300">
                {asset.width} × {asset.height}px
              </span>
            </div>
          )}
          {asset.duration && (
            <div className="flex justify-between">
              <span className="text-zinc-500">길이</span>
              <span className="text-zinc-300">{asset.duration.toFixed(1)}초</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-500">임포트</span>
            <span className="text-zinc-300">{formatDate(asset.importedAt)}</span>
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-zinc-500">경로</span>
            <span className="text-zinc-400 break-all text-[10px] leading-relaxed">
              {asset.path}
            </span>
          </div>
        </div>

        {/* 색상 팔레트 */}
        {asset.colors.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 mb-2">주요 색상</p>
            <div className="flex gap-2">
              {asset.colors.map((c) => (
                <div
                  key={c}
                  title={c}
                  className="w-7 h-7 rounded-md border border-zinc-600 cursor-pointer"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 태그 */}
        <div>
          <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
            <TagIcon size={11} /> 태그
          </p>

          {/* 현재 태그 목록 */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {asset.tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => removeTag(tag.id)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white hover:opacity-75 transition-opacity"
                style={{ backgroundColor: tag.color }}
                title="클릭하여 제거"
              >
                {tag.name}
                <X size={10} />
              </button>
            ))}
          </div>

          {/* 태그 추가 인풋 */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value)
                setShowSuggestions(e.target.value.length > 0)
              }}
              onKeyDown={handleTagInputKeyDown}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="태그 추가... (Enter)"
              className="w-full px-2.5 py-1.5 bg-zinc-700 border border-zinc-600 rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-700 border border-zinc-600 rounded shadow-lg z-10 max-h-32 overflow-y-auto">
                {suggestions.map((tag) => (
                  <button
                    key={tag.id}
                    onMouseDown={() => addTag(tag)}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-600 transition-colors text-left"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 파인더에서 보기 */}
        <button
          onClick={() => window.api.showInFinder(asset.path)}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-zinc-300 transition-colors"
        >
          <FolderOpen size={13} />
          파인더에서 보기
        </button>
      </div>
    </div>
  )
}
