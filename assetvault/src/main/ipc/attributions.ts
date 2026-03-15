import { ipcMain } from 'electron'

import type { Attribution } from '../../shared/types'
import {
  getAttributions,
  createAttribution,
  updateAttribution,
  deleteAttribution,
  setDirectoryAttribution,
  getDirectoryAttributionMap
} from '../db/queries'

export function registerAttributionHandlers(): void {
  ipcMain.handle('get-attributions', () => getAttributions())

  ipcMain.handle('create-attribution', (_event, data: Omit<Attribution, 'id' | 'createdAt'>) =>
    createAttribution(data)
  )

  ipcMain.handle(
    'update-attribution',
    (_event, id: string, data: Partial<Omit<Attribution, 'id' | 'createdAt'>>) =>
      updateAttribution(id, data)
  )

  ipcMain.handle('delete-attribution', (_event, id: string) => deleteAttribution(id))

  ipcMain.handle(
    'set-directory-attribution',
    (_event, directoryPath: string, attributionId: string | null) =>
      setDirectoryAttribution(directoryPath, attributionId)
  )

  ipcMain.handle('get-directory-attribution-map', () => getDirectoryAttributionMap())
}
