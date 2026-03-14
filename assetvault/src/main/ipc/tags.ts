import { ipcMain } from 'electron'
import { getTags, createTag, deleteTag, updateAssetTags, getTagAssetCounts } from '../db/queries'

export function registerTagHandlers(): void {
  ipcMain.handle('get-tags', () => getTags())

  ipcMain.handle('create-tag', (_event, name: string, color: string) =>
    createTag(name, color)
  )

  ipcMain.handle('delete-tag', (_event, id: string) => deleteTag(id))

  ipcMain.handle('update-asset-tags', (_event, assetId: string, tagIds: string[]) =>
    updateAssetTags(assetId, tagIds)
  )

  ipcMain.handle('get-tag-asset-counts', () => getTagAssetCounts())
}
