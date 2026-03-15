import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import {
  FileImage,
  Music,
  Video,
  Type,
  Box,
  FileText,
  File,
  AlertTriangle,
  FolderInput,
  FolderMinus
} from 'lucide-react'
import { useRef, useState } from 'react'

import type { Asset, AssetType } from '@shared/types'

import { useHover } from '@renderer/hooks/useHover'
import { useLazy3DThumbnail } from '@renderer/hooks/useLazy3DThumbnail'
import { useFolderStore } from '@renderer/stores/folderStore'
import { useUIStore } from '@renderer/stores/uiStore'

import { AssetPreviewPopup } from './AssetPreviewPopup'

interface AssetCardProps {
  asset: Asset
  mode?: 'grid' | 'list'
}

const TYPE_BADGE: Record<AssetType, { label: string; className: string }> = {
  image: { label: 'IMG', className: 'bg-blue-900 text-blue-300' },
  audio: { label: 'SND', className: 'bg-green-900 text-green-300' },
  video: { label: 'VID', className: 'bg-purple-900 text-purple-300' },
  font: { label: 'FONT', className: 'bg-yellow-900 text-yellow-300' },
  model3d: { label: '3D', className: 'bg-orange-900 text-orange-300' },
  doc: { label: 'DOC', className: 'bg-red-900 text-red-300' }
}

const TYPE_ICON: Record<AssetType, React.ReactNode> = {
  image: <FileImage size={32} className="text-zinc-500" />,
  audio: <Music size={32} className="text-zinc-500" />,
  video: <Video size={32} className="text-zinc-500" />,
  font: <Type size={32} className="text-zinc-500" />,
  model3d: <Box size={32} className="text-zinc-500" />,
  doc: <FileText size={32} className="text-zinc-500" />
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp'])
const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'])
const VIDEO_EXTS = new Set(['mp4', 'webm', 'mov'])
const FONT_EXTS = new Set(['ttf', 'otf', 'woff', 'woff2'])
const MODEL_EXTS = new Set(['obj', 'glb', 'gltf'])

function getAssetType(ext: string): AssetType {
  const e = ext.toLowerCase()
  if (IMAGE_EXTS.has(e)) return 'image'
  if (AUDIO_EXTS.has(e)) return 'audio'
  if (VIDEO_EXTS.has(e)) return 'video'
  if (FONT_EXTS.has(e)) return 'font'
  if (MODEL_EXTS.has(e)) return 'model3d'
  return 'doc'
}

function isFileThumbnail(path: string): boolean {
  return Boolean(path) && !path.startsWith('__placeholder:')
}

export function AssetCard({ asset, mode = 'grid' }: AssetCardProps): React.JSX.Element {
  const { selectedIds, toggleSelect, setSelectedAssetId, selectedAssetId } = useUIStore()
  const { folders, selectedFolderId, addAssetsToFolder, removeAssetsFromFolder } = useFolderStore()
  const { hoverState, hoverProps } = useHover(300)
  const isSelected = selectedIds.has(asset.id)
  const isFocused = asset.id === selectedAssetId
  const cardRef = useRef<HTMLDivElement>(null)
  useLazy3DThumbnail(asset, cardRef)
  const assetType = getAssetType(asset.ext)
  const badge = TYPE_BADGE[assetType]
  const icon = TYPE_ICON[assetType] ?? <File size={32} className="text-zinc-500" />
  const hasThumbnail = asset.thumbnail && isFileThumbnail(asset.thumbnail)
  const [imgError, setImgError] = useState(false)

  function getContextMenu(): MenuProps {
    const idsToAct = isSelected ? [...selectedIds] : [asset.id]
    const addItems = folders.map((f) => ({
      key: `add-${f.id}`,
      label: f.name,
      icon: <span className="text-sm">{f.icon}</span>,
      onClick: () => addAssetsToFolder(f.id, idsToAct)
    }))
    const items: MenuProps['items'] = [
      {
        key: 'add-to-folder',
        label: `폴더에 추가${idsToAct.length > 1 ? ` (${idsToAct.length}개)` : ''}`,
        icon: <FolderInput size={12} />,
        children:
          addItems.length > 0 ? addItems : [{ key: 'none', label: '폴더 없음', disabled: true }]
      }
    ]
    if (selectedFolderId) {
      items.push({
        key: 'remove-from-folder',
        label: '현재 폴더에서 제거',
        icon: <FolderMinus size={12} />,
        danger: true,
        onClick: () => removeAssetsFromFolder(selectedFolderId, idsToAct)
      })
    }
    return { items }
  }

  const clickHandler = (e: React.MouseEvent): void => {
    if (e.metaKey || e.ctrlKey) {
      toggleSelect(asset.id)
    } else {
      setSelectedAssetId(asset.id)
    }
  }

  if (mode === 'list') {
    return (
      <>
        <Dropdown menu={getContextMenu()} trigger={['contextMenu']}>
          <div
            ref={cardRef}
            onClick={clickHandler}
            {...hoverProps}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
              border transition-colors duration-150
              ${isSelected ? 'bg-blue-950 border-blue-500' : isFocused ? 'bg-zinc-700 border-blue-400' : 'bg-zinc-800 border-transparent hover:border-zinc-600'}
            `}
          >
            {/* 작은 썸네일 */}
            <div className="relative w-10 h-10 shrink-0 bg-zinc-700 rounded flex items-center justify-center overflow-hidden">
              {hasThumbnail && !imgError ? (
                <img
                  src={`file://${asset.thumbnail}`}
                  alt={asset.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={() => setImgError(true)}
                />
              ) : imgError ? (
                <AlertTriangle size={16} className="text-amber-600" />
              ) : (
                <div className="scale-50">{icon}</div>
              )}
            </div>

            {/* 타입 뱃지 */}
            <span
              className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.className}`}
            >
              {badge.label}
            </span>

            {/* 파일명 */}
            <p className="flex-1 text-sm text-zinc-300 truncate font-mono">{asset.name}</p>

            {/* 확장자 */}
            <span className="shrink-0 text-xs text-zinc-500 w-12 text-right font-mono">.{asset.ext}</span>

            {/* 파일 크기 */}
            <span className="shrink-0 text-xs text-zinc-500 w-16 text-right">
              {formatSize(asset.size)}
            </span>

            {/* 선택 체크 */}
            {isSelected && (
              <div className="shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        </Dropdown>

        {hoverState.isHovered && !selectedAssetId && (
          <AssetPreviewPopup asset={asset} x={hoverState.x} y={hoverState.y} />
        )}
      </>
    )
  }

  return (
    <>
      <Dropdown menu={getContextMenu()} trigger={['contextMenu']}>
        <div
          ref={cardRef}
          onClick={clickHandler}
          {...hoverProps}
          className={`
            group relative flex flex-col bg-zinc-800 rounded-lg overflow-hidden cursor-pointer
            border-2 transition-colors duration-150
            ${isSelected ? 'border-blue-500' : isFocused ? 'border-blue-400 ring-2 ring-blue-400/30' : 'border-transparent hover:border-zinc-600'}
          `}
        >
          {/* 썸네일 영역 */}
          <div className="relative w-full aspect-square bg-zinc-700 flex items-center justify-center overflow-hidden">
            {hasThumbnail && !imgError ? (
              <img
                src={`file://${asset.thumbnail}`}
                alt={asset.name}
                className="w-full h-full object-contain"
                loading="lazy"
                onError={() => setImgError(true)}
              />
            ) : imgError ? (
              <div className="flex flex-col items-center gap-1 text-zinc-500">
                <AlertTriangle size={24} className="text-amber-600" />
                <span className="text-[10px]">파일 없음</span>
              </div>
            ) : (
              icon
            )}

            {/* 타입 뱃지 */}
            <span
              className={`absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.className}`}
            >
              {badge.label}
            </span>

            {/* 선택 체크 */}
            {isSelected && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* 파일명 */}
          <div className="px-2 py-1.5">
            <p className="text-xs text-zinc-300 truncate leading-tight font-mono">{asset.name}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">.{asset.ext}</p>
          </div>
        </div>
      </Dropdown>

      {hoverState.isHovered && !selectedAssetId && (
        <AssetPreviewPopup asset={asset} x={hoverState.x} y={hoverState.y} />
      )}
    </>
  )
}
