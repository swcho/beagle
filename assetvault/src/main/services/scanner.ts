import { promises as fs } from 'fs'
import { join, extname, basename } from 'path'
import sharp from 'sharp'
import { parseFile } from 'music-metadata'
import { SUPPORTED_FORMATS } from '../../shared/types'

export interface ScannedFile {
  path: string
  name: string
  ext: string
  size: number
  createdAt: number
  width?: number
  height?: number
  duration?: number
}

const ALL_SUPPORTED = new Set(
  Object.values(SUPPORTED_FORMATS)
    .flat()
    .map((e) => e.toLowerCase())
)

const IMAGE_EXTS = new Set(SUPPORTED_FORMATS.image.map((e) => e.toLowerCase()))
const AUDIO_EXTS = new Set(SUPPORTED_FORMATS.audio.map((e) => e.toLowerCase()))

export async function* scanDirectory(dirPath: string): AsyncGenerator<ScannedFile> {
  let entries: import('fs').Dirent[]
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name)

    if (entry.isDirectory()) {
      yield* scanDirectory(fullPath)
    } else if (entry.isFile()) {
      const ext = extname(entry.name).replace('.', '').toLowerCase()
      if (!ALL_SUPPORTED.has(ext)) continue

      let stat: import('fs').Stats
      try {
        stat = await fs.stat(fullPath)
      } catch {
        continue
      }

      const file: ScannedFile = {
        path: fullPath,
        name: basename(entry.name, extname(entry.name)),
        ext,
        size: stat.size,
        createdAt: Math.floor(stat.birthtimeMs / 1000),
      }

      if (IMAGE_EXTS.has(ext) && ext !== 'svg' && ext !== 'ico') {
        try {
          const meta = await sharp(fullPath).metadata()
          file.width = meta.width
          file.height = meta.height
        } catch {
          // 이미지 메타 추출 실패 시 무시
        }
      }

      if (AUDIO_EXTS.has(ext)) {
        try {
          const meta = await parseFile(fullPath, { duration: true })
          file.duration = meta.format.duration
        } catch {
          // 오디오 메타 추출 실패 시 무시
        }
      }

      yield file
    }
  }
}
