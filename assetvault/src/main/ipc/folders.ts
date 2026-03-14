import { dirname } from 'path'

import { ipcMain } from 'electron'

import type { DirectoryNode } from '../../shared/types'
import {
  addAssetsToFolder,
  createFolder,
  deleteFolder,
  getFolderAssetCounts,
  getFolders,
  getAssetPaths,
  removeAssetsFromFolder,
  renameFolder
} from '../db/queries'

function buildDirectoryTree(paths: string[]): DirectoryNode[] {
  // Count assets per directory (direct + recursive)
  const dirCounts = new Map<string, number>()
  const allDirs = new Set<string>()

  for (const p of paths) {
    let dir = dirname(p)
    while (dir && dir !== dirname(dir)) {
      dirCounts.set(dir, (dirCounts.get(dir) ?? 0) + 1)
      allDirs.add(dir)
      dir = dirname(dir)
    }
  }

  // Build tree: find root dirs (those whose parent has no assets)
  const dirArray = [...allDirs].sort()
  const nodeMap = new Map<string, DirectoryNode>()

  for (const d of dirArray) {
    nodeMap.set(d, {
      path: d,
      name: d.split('/').pop() ?? d,
      children: [],
      count: dirCounts.get(d) ?? 0
    })
  }

  const roots: DirectoryNode[] = []
  for (const d of dirArray) {
    const parent = dirname(d)
    if (nodeMap.has(parent)) {
      nodeMap.get(parent)!.children.push(nodeMap.get(d)!)
    } else {
      roots.push(nodeMap.get(d)!)
    }
  }

  return roots
}

export function registerFolderHandlers(): void {
  ipcMain.handle('get-asset-directories', () => {
    const paths = getAssetPaths()
    return buildDirectoryTree(paths)
  })

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
