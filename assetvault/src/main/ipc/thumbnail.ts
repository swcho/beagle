import { promises as fs } from 'fs'
import { join } from 'path'

import { app, ipcMain, BrowserWindow } from 'electron'
import sharp from 'sharp'

import { getAssetById, updateAssetThumbnail } from '../db/queries'
import { extractColors } from '../services/colorExtract'
import { generateThumbnail } from '../services/thumbnailer'

const COLOR_EXTRACTABLE = new Set(['png', 'jpg', 'jpeg', 'webp', 'bmp'])

function getThumbnailDir(): string {
  return join(app.getPath('userData'), 'thumbnails')
}

export function registerThumbnailHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle('generate-thumbnails', async (_event, assetIds: string[]) => {
    for (const assetId of assetIds) {
      const asset = getAssetById(assetId)
      if (!asset) continue

      try {
        const thumbnailPath = await generateThumbnail(asset)

        let colors: string[] = []
        if (COLOR_EXTRACTABLE.has(asset.ext.toLowerCase())) {
          colors = await extractColors(asset.path)
        }

        updateAssetThumbnail(assetId, thumbnailPath, colors)

        mainWindow.webContents.send('thumbnail-ready', {
          assetId,
          thumbnailPath,
          colors
        })
      } catch (err) {
        console.error(`썸네일 생성 실패 [${asset.name}]:`, err)
      }
    }
  })

  ipcMain.handle(
    'save-thumbnail-buffer',
    async (_event, assetId: string, buffer: Uint8Array) => {
      try {
        const thumbDir = getThumbnailDir()
        await fs.mkdir(thumbDir, { recursive: true })
        const thumbPath = join(thumbDir, `${assetId}.webp`)

        await sharp(Buffer.from(buffer))
          .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(thumbPath)

        const colors = await extractColors(thumbPath)
        updateAssetThumbnail(assetId, thumbPath, colors)

        mainWindow.webContents.send('thumbnail-ready', {
          assetId,
          thumbnailPath: thumbPath,
          colors
        })
      } catch (err) {
        console.error(`3D 썸네일 저장 실패 [${assetId}]:`, err)
      }
    }
  )
}
