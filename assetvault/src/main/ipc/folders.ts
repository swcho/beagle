import { ipcMain } from 'electron'

import {
  addAssetsToFolder,
  createFolder,
  deleteFolder,
  getFolderAssetCounts,
  getFolders,
  removeAssetsFromFolder,
  renameFolder
} from '../db/queries'

export function registerFolderHandlers(): void {
  ipcMain.handle('get-folders', () => getFolders())

  ipcMain.handle('create-folder', (_e, name: string, parentId?: string) =>
    createFolder(name, parentId)
  )

  ipcMain.handle('delete-folder', (_e, id: string) => deleteFolder(id))

  ipcMain.handle('rename-folder', (_e, id: string, name: string) => renameFolder(id, name))

  ipcMain.handle('add-assets-to-folder', (_e, folderId: string, assetIds: string[]) =>
    addAssetsToFolder(folderId, assetIds)
  )

  ipcMain.handle('remove-assets-from-folder', (_e, folderId: string, assetIds: string[]) =>
    removeAssetsFromFolder(folderId, assetIds)
  )

  ipcMain.handle('get-folder-asset-counts', () => getFolderAssetCounts())
}
