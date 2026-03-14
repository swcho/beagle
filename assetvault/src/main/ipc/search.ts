import { ipcMain } from 'electron'
import { searchAssets, searchByColor, getAssets } from '../db/queries'
import type { AssetFilter } from '../../shared/types'

export function registerSearchHandlers(): void {
  ipcMain.handle('search-assets', (_event, query: string) => searchAssets(query))

  ipcMain.handle('search-by-color', (_event, hex: string, tolerance: number) =>
    searchByColor(hex, tolerance)
  )

  // 복합 검색: query + color 교집합 처리 후 getAssets 호출
  ipcMain.handle('search-combined', (_event, filter: AssetFilter) => {
    let candidateIds: Set<string> | null = null

    // FTS 검색
    if (filter.query && filter.query.trim()) {
      const ftsResults = searchAssets(filter.query)
      const ids = new Set(ftsResults.map((a) => a.id))
      candidateIds = candidateIds ? new Set([...candidateIds].filter((id) => ids.has(id))) : ids
    }

    // 색상 검색 (colors 배열의 각 색에 대해 OR, 전체와는 AND)
    if (filter.colors && filter.colors.length > 0) {
      const tolerance = filter.colorTolerance ?? 0.25
      const colorIds = new Set<string>()
      for (const hex of filter.colors) {
        const results = searchByColor(hex, tolerance)
        results.forEach((a) => colorIds.add(a.id))
      }
      candidateIds = candidateIds
        ? new Set([...candidateIds].filter((id) => colorIds.has(id)))
        : colorIds
    }

    // 후보 ID가 있으면 getAssets에 id 목록으로 전달
    if (candidateIds !== null) {
      if (candidateIds.size === 0) return []
      return getAssets({ ...filter, query: undefined, colors: undefined, _ids: [...candidateIds] } as AssetFilter & { _ids?: string[] })
    }

    return getAssets(filter)
  })
}
