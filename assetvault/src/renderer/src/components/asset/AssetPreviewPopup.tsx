import { useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'

import type { Asset } from '../../../../shared/types'

import { AudioPreview } from './preview/AudioPreview'
import { FontPreview } from './preview/FontPreview'
import { ImagePreview } from './preview/ImagePreview'
import { Model3DPreview } from './preview/Model3DPreview'
import { VideoPreview } from './preview/VideoPreview'

interface Props {
  asset: Asset
  x: number
  y: number
}

const POPUP_W = 400
const POPUP_MAX_H = 420
const OFFSET = 16

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'bmp', 'ico'])
const GIF_EXTS = new Set(['gif'])
const SVG_EXTS = new Set(['svg'])
const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'])
const VIDEO_EXTS = new Set(['mp4', 'webm', 'mov'])
const FONT_EXTS = new Set(['ttf', 'otf', 'woff', 'woff2'])
const MODEL_EXTS = new Set(['obj', 'glb', 'gltf'])

function PreviewContent({ asset }: { asset: Asset }): React.JSX.Element {
  const ext = asset.ext.toLowerCase()

  if (IMAGE_EXTS.has(ext) || GIF_EXTS.has(ext) || SVG_EXTS.has(ext)) {
    return <ImagePreview asset={asset} />
  }
  if (AUDIO_EXTS.has(ext)) return <AudioPreview asset={asset} />
  if (VIDEO_EXTS.has(ext)) return <VideoPreview asset={asset} />
  if (FONT_EXTS.has(ext)) return <FontPreview asset={asset} />
  if (MODEL_EXTS.has(ext)) return <Model3DPreview asset={asset} />

  return <div className="p-4 text-zinc-400 text-sm">미리보기를 지원하지 않는 형식입니다.</div>
}

export function AssetPreviewPopup({ asset, x, y }: Props): React.JSX.Element {
  const popupRef = useRef<HTMLDivElement>(null)

  const { left, top } = useMemo(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    let left = x + OFFSET
    let top = y - POPUP_MAX_H / 2

    // 오른쪽 공간 부족 → 왼쪽 flip
    if (left + POPUP_W > vw - 8) left = x - POPUP_W - OFFSET
    // 세로 클리핑 방지
    if (top < 8) top = 8
    if (top + POPUP_MAX_H > vh - 8) top = vh - POPUP_MAX_H - 8

    return { left, top }
  }, [x, y])

  return createPortal(
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        left,
        top,
        width: POPUP_W,
        maxHeight: POPUP_MAX_H,
        zIndex: 9999
      }}
      className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-y-auto p-3"
    >
      <p className="text-xs font-medium text-zinc-300 truncate mb-2 px-1">
        {asset.name}.{asset.ext}
      </p>
      <PreviewContent asset={asset} />
    </div>,
    document.body
  )
}
