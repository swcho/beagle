import { promises as fs } from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import { app } from 'electron'
import type { Asset } from '../../shared/types'

const THUMB_SIZE = 200

function getThumbnailDir(): string {
  return join(app.getPath('userData'), 'thumbnails')
}

function getThumbnailPath(assetId: string): string {
  return join(getThumbnailDir(), `${assetId}.webp`)
}

async function ensureThumbnailDir(): Promise<void> {
  await fs.mkdir(getThumbnailDir(), { recursive: true })
}

export async function generateThumbnail(asset: Asset): Promise<string> {
  const thumbPath = getThumbnailPath(asset.id)

  // 캐시된 파일이 있으면 재생성 skip
  try {
    await fs.access(thumbPath)
    return thumbPath
  } catch {
    // 없으면 생성
  }

  await ensureThumbnailDir()

  const ext = asset.ext.toLowerCase()

  // SVG는 원본 경로 그대로 반환
  if (ext === 'svg') {
    return asset.path
  }

  // 이미지 타입 — sharp로 리사이즈
  const imageExts = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico'])
  if (imageExts.has(ext)) {
    await sharp(asset.path)
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(thumbPath)
    return thumbPath
  }

  // 오디오/폰트/3D/문서/비디오 — 타입별 플레이스홀더 경로 반환
  return getPlaceholder(ext)
}

function getPlaceholder(ext: string): string {
  const audioExts = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'])
  const fontExts = new Set(['ttf', 'otf', 'woff', 'woff2'])
  const model3dExts = new Set(['obj', 'glb', 'gltf'])
  const videoExts = new Set(['mp4', 'webm', 'mov'])

  if (audioExts.has(ext)) return '__placeholder:audio'
  if (fontExts.has(ext)) return '__placeholder:font'
  if (model3dExts.has(ext)) return '__placeholder:model3d'
  if (videoExts.has(ext)) return '__placeholder:video'
  return '__placeholder:doc'
}
