import { useState } from 'react'
import { FileImage, Music, Video, Type, Box, FileText, File, AlertTriangle } from 'lucide-react'
import type { Asset, AssetType } from '../../../../shared/types'
import { useUIStore } from '../../stores/uiStore'
import { useHover } from '../../hooks/useHover'
import { AssetPreviewPopup } from './AssetPreviewPopup'

interface AssetCardProps {
  asset: Asset
}

const TYPE_BADGE: Record<AssetType, { label: string; className: string }> = {
  image:   { label: 'IMG',  className: 'bg-blue-900 text-blue-300' },
  audio:   { label: 'SND',  className: 'bg-green-900 text-green-300' },
  video:   { label: 'VID',  className: 'bg-purple-900 text-purple-300' },
  font:    { label: 'FONT', className: 'bg-yellow-900 text-yellow-300' },
  model3d: { label: '3D',   className: 'bg-orange-900 text-orange-300' },
  doc:     { label: 'DOC',  className: 'bg-red-900 text-red-300' },
}

const TYPE_ICON: Record<AssetType, React.ReactNode> = {
  image:   <FileImage size={32} className="text-zinc-500" />,
  audio:   <Music size={32} className="text-zinc-500" />,
  video:   <Video size={32} className="text-zinc-500" />,
  font:    <Type size={32} className="text-zinc-500" />,
  model3d: <Box size={32} className="text-zinc-500" />,
  doc:     <FileText size={32} className="text-zinc-500" />,
}

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp'])
const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'])
const VIDEO_EXTS = new Set(['mp4', 'webm', 'mov'])
const FONT_EXTS  = new Set(['ttf', 'otf', 'woff', 'woff2'])
const MODEL_EXTS = new Set(['obj', 'glb', 'gltf'])

function getAssetType(ext: string): AssetType {
  const e = ext.toLowerCase()
  if (IMAGE_EXTS.has(e)) return 'image'
  if (AUDIO_EXTS.has(e)) return 'audio'
  if (VIDEO_EXTS.has(e)) return 'video'
  if (FONT_EXTS.has(e))  return 'font'
  if (MODEL_EXTS.has(e)) return 'model3d'
  return 'doc'
}

function isFileThumbnail(path: string): boolean {
  return Boolean(path) && !path.startsWith('__placeholder:')
}

export function AssetCard({ asset }: AssetCardProps): React.JSX.Element {
  const { selectedIds, toggleSelect, setSelectedAssetId } = useUIStore()
  const { hoverState, hoverProps } = useHover(300)
  const isSelected = selectedIds.has(asset.id)
  const assetType = getAssetType(asset.ext)
  const badge = TYPE_BADGE[assetType]
  const icon = TYPE_ICON[assetType] ?? <File size={32} className="text-zinc-500" />
  const hasThumbnail = asset.thumbnail && isFileThumbnail(asset.thumbnail)
  const [imgError, setImgError] = useState(false)

  return (
    <>
      <div
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey) {
            toggleSelect(asset.id)
          } else {
            setSelectedAssetId(asset.id)
          }
        }}
        {...hoverProps}
        className={`
          group relative flex flex-col bg-zinc-800 rounded-lg overflow-hidden cursor-pointer
          border-2 transition-colors duration-150
          ${isSelected ? 'border-blue-500' : 'border-transparent hover:border-zinc-600'}
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
          <span className={`absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.className}`}>
            {badge.label}
          </span>

          {/* 선택 체크 */}
          {isSelected && (
            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>

        {/* 파일명 */}
        <div className="px-2 py-1.5">
          <p className="text-xs text-zinc-300 truncate leading-tight">{asset.name}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">.{asset.ext}</p>
        </div>
      </div>

      {hoverState.isHovered && (
        <AssetPreviewPopup asset={asset} x={hoverState.x} y={hoverState.y} />
      )}
    </>
  )
}
