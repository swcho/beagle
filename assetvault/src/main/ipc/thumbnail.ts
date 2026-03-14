import { ipcMain, BrowserWindow } from 'electron'
import { getAssetById, updateAssetThumbnail } from '../db/queries'
import { generateThumbnail } from '../services/thumbnailer'
import { extractColors } from '../services/colorExtract'

const COLOR_EXTRACTABLE = new Set(['png', 'jpg', 'jpeg', 'webp', 'bmp'])

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
          colors,
        })
      } catch (err) {
        console.error(`썸네일 생성 실패 [${asset.name}]:`, err)
      }
    }
  })
}
