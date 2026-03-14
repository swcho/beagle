import { ipcMain, BrowserWindow, dialog } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { scanDirectory, type ScannedFile } from '../services/scanner'
import { upsertAsset, getAssets, getAssetById, deleteAssets } from '../db/queries'
import type { AssetFilter } from '../../shared/types'

export function registerLibraryHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle('import-folder', async (_event, folderPath: string) => {
    // 먼저 전체 파일 수 파악 (진행률 계산용)
    const allFiles: ScannedFile[] = []
    for await (const file of scanDirectory(folderPath)) {
      allFiles.push(file)
    }

    let imported = 0
    let skipped = 0
    const total = allFiles.length

    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i]
      try {
        const now = Math.floor(Date.now() / 1000)
        upsertAsset({
          id: uuidv4(),
          path: file.path,
          name: file.name,
          ext: file.ext,
          size: file.size,
          width: file.width,
          height: file.height,
          duration: file.duration,
          createdAt: file.createdAt,
          importedAt: now,
        })
        imported++
      } catch {
        skipped++
      }

      mainWindow.webContents.send('import-progress', {
        current: i + 1,
        total,
        filename: file.name,
      })
    }

    return { imported, skipped }
  })

  ipcMain.handle('get-assets', (_event, filter: AssetFilter) => {
    return getAssets(filter)
  })

  ipcMain.handle('get-asset', (_event, id: string) => {
    return getAssetById(id)
  })

  ipcMain.handle('remove-assets', (_event, ids: string[]) => {
    deleteAssets(ids)
  })

  ipcMain.handle('open-folder-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('show-in-finder', (_event, filePath: string) => {
    const { shell } = require('electron')
    shell.showItemInFolder(filePath)
  })
}
