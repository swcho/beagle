import { AutoComplete, Button, Tag as AntTag, Tooltip } from 'antd'
import { FolderOpen, Tag as TagIcon, X, ScrollText, ExternalLink } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'

import type { Asset, Tag } from '@shared/types'

import { useTagStore } from '@renderer/stores/tagStore'

import { AudioPreview } from './preview/AudioPreview'

const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'])

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

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const suggestions = tags.filter(
    (t) =>
      t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
      !asset.tags.some((at) => at.id === t.id)
  )

  const autoOptions = useMemo(
    () =>
      suggestions.map((t) => ({
        value: t.id,
        label: (
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: t.color }}
            />
            {t.name}
          </div>
        )
      })),
    [suggestions]
  )

  async function addTag(tag: Tag): Promise<void> {
    setTagInput('')
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

  function handleTagSelect(tagId: string): void {
    const tag = tags.find((t) => t.id === tagId)
    if (tag) void addTag(tag)
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      void (async () => {
        const existing = tags.find((t) => t.name.toLowerCase() === tagInput.trim().toLowerCase())
        if (existing && !asset.tags.some((at) => at.id === existing.id)) {
          await addTag(existing)
        } else if (!existing) {
          const colorOptions = [
            '#6B7280',
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#EF4444',
            '#8B5CF6',
            '#EC4899'
          ]
          const color = colorOptions[Math.floor(Math.random() * colorOptions.length)]
          const newTag = await createTag(tagInput.trim(), color)
          await addTag(newTag)
        }
      })()
    } else if (e.key === 'Escape') {
      setTagInput('')
    }
  }

  const hasThumbnail = asset.thumbnail && isFileThumbnail(asset.thumbnail)

  return (
    <div className="w-full h-full flex flex-col bg-zinc-850 border-l border-zinc-700 overflow-y-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <span className="text-sm font-medium text-zinc-200">에셋 정보</span>
        <Button
          type="text"
          size="small"
          icon={<X size={16} />}
          onClick={onClose}
          className="text-zinc-500"
        />
      </div>

      {/* 썸네일 */}
      {!AUDIO_EXTS.has(asset.ext.toLowerCase()) && (
        <div className="w-full aspect-square bg-zinc-700 flex items-center justify-center">
          {hasThumbnail ? (
            <img
              src={`file://${asset.thumbnail}`}
              alt={asset.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-zinc-500 text-xs uppercase">{asset.ext}</span>
          )}
        </div>
      )}

      {/* 오디오 플레이어 */}
      {AUDIO_EXTS.has(asset.ext.toLowerCase()) && (
        <div className="p-3 border-b border-zinc-700">
          <AudioPreview key={asset.id} asset={asset} autoPlay />
        </div>
      )}

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
                <Tooltip key={c} title={c}>
                  <div
                    className="w-7 h-7 rounded-md border border-zinc-600 cursor-pointer"
                    style={{ backgroundColor: c }}
                  />
                </Tooltip>
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
              <AntTag
                key={tag.id}
                closable
                onClose={() => removeTag(tag.id)}
                color={tag.color}
                style={{ marginInlineEnd: 0 }}
              >
                {tag.name}
              </AntTag>
            ))}
          </div>

          {/* 태그 추가 인풋 */}
          <AutoComplete
            value={tagInput}
            onChange={setTagInput}
            onSelect={handleTagSelect}
            onKeyDown={handleTagKeyDown}
            options={autoOptions}
            placeholder="태그 추가... (Enter)"
            size="small"
            className="w-full"
            defaultActiveFirstOption={false}
            filterOption={false}
          />
        </div>

        {/* Attribution */}
        {asset.attribution && (
          <div>
            <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
              <ScrollText size={11} /> Attribution
            </p>
            <div className="flex flex-col gap-1 text-xs bg-zinc-800 rounded-md p-2.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">저작자</span>
                <span className="text-zinc-300">{asset.attribution.author}</span>
              </div>
              {asset.attribution.license && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">라이선스</span>
                  <span className="text-zinc-300">{asset.attribution.license}</span>
                </div>
              )}
              {asset.attribution.url && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">URL</span>
                  <button
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 truncate max-w-[160px]"
                    onClick={() => window.open(asset.attribution!.url, '_blank')}
                    title={asset.attribution.url}
                  >
                    <ExternalLink size={10} className="shrink-0" />
                    <span className="truncate">
                      {asset.attribution.url.replace(/^https?:\/\//, '')}
                    </span>
                  </button>
                </div>
              )}
              {asset.attribution.note && (
                <p className="text-zinc-400 text-[10px] leading-relaxed mt-0.5">
                  {asset.attribution.note}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 파인더에서 보기 */}
        <Button
          block
          icon={<FolderOpen size={13} />}
          onClick={() => window.api.showInFinder(asset.path)}
        >
          파인더에서 보기
        </Button>
      </div>
    </div>
  )
}
