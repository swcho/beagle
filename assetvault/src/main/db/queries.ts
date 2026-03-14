import { v4 as uuidv4 } from 'uuid'

import { SUPPORTED_FORMATS } from '../../shared/types'
import type { Asset, AssetFilter, Folder, Tag } from '../../shared/types'

import { getDatabase } from './schema'

interface AssetRow {
  id: string
  path: string
  name: string
  ext: string
  size: number
  width: number | null
  height: number | null
  duration: number | null
  thumbnail: string | null
  colors: string
  created_at: number
  imported_at: number
  tags_json: string | null
}

function rowToAsset(row: AssetRow): Asset {
  let tags: Tag[] = []
  try {
    tags = row.tags_json ? JSON.parse(row.tags_json) : []
  } catch {
    tags = []
  }

  let colors: string[] = []
  try {
    colors = JSON.parse(row.colors || '[]')
  } catch {
    colors = []
  }

  return {
    id: row.id,
    path: row.path,
    name: row.name,
    ext: row.ext,
    size: row.size,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    duration: row.duration ?? undefined,
    thumbnail: row.thumbnail ?? undefined,
    colors,
    tags,
    createdAt: row.created_at,
    importedAt: row.imported_at
  }
}

export function upsertAsset(asset: Omit<Asset, 'tags' | 'colors'> & { colors?: string[] }): void {
  const db = getDatabase()
  db.prepare(
    `
    INSERT INTO assets (id, path, name, ext, size, width, height, duration, thumbnail, colors, created_at, imported_at)
    VALUES (@id, @path, @name, @ext, @size, @width, @height, @duration, @thumbnail, @colors, @createdAt, @importedAt)
    ON CONFLICT(path) DO UPDATE SET
      name       = excluded.name,
      ext        = excluded.ext,
      size       = excluded.size,
      width      = excluded.width,
      height     = excluded.height,
      duration   = excluded.duration,
      created_at = excluded.created_at
  `
  ).run({
    id: asset.id,
    path: asset.path,
    name: asset.name,
    ext: asset.ext,
    size: asset.size,
    width: asset.width ?? null,
    height: asset.height ?? null,
    duration: asset.duration ?? null,
    thumbnail: asset.thumbnail ?? null,
    colors: JSON.stringify(asset.colors ?? []),
    createdAt: asset.createdAt,
    importedAt: asset.importedAt
  })

  // FTS 인덱스 업데이트
  const row = db.prepare(`SELECT rowid FROM assets WHERE id = ?`).get(asset.id) as
    | { rowid: number }
    | undefined
  if (row) {
    db.prepare(`INSERT OR REPLACE INTO assets_fts(rowid, name) VALUES (?, ?)`).run(
      row.rowid,
      asset.name
    )
  }
}

export function updateAssetThumbnail(id: string, thumbnail: string, colors: string[]): void {
  const db = getDatabase()
  db.prepare(
    `
    UPDATE assets SET thumbnail = ?, colors = ? WHERE id = ?
  `
  ).run(thumbnail, JSON.stringify(colors), id)
}

export function getAssets(filter: AssetFilter & { _ids?: string[] }): Asset[] {
  const db = getDatabase()

  const conditions: string[] = []
  const params: Record<string, unknown> = {}

  // 검색 결과 ID 목록 제한
  if (filter._ids && filter._ids.length > 0) {
    const placeholders = filter._ids.map((_, i) => `@_id${i}`).join(', ')
    filter._ids.forEach((id, i) => {
      params[`_id${i}`] = id
    })
    conditions.push(`a.id IN (${placeholders})`)
  }

  if (filter.types && filter.types.length > 0) {
    const exts = filter.types.flatMap((t) => SUPPORTED_FORMATS[t] as readonly string[])
    const placeholders = exts.map((_, i) => `@ext${i}`).join(', ')
    exts.forEach((e, i) => {
      params[`ext${i}`] = e
    })
    conditions.push(`a.ext IN (${placeholders})`)
  }

  if (filter.folderId) {
    conditions.push(`EXISTS (
      SELECT 1 FROM folder_assets fa WHERE fa.folder_id = @folderId AND fa.asset_id = a.id
    )`)
    params.folderId = filter.folderId
  }

  if (filter.directory) {
    conditions.push(`a.path LIKE @directoryPrefix`)
    params.directoryPrefix = filter.directory + '/%'
  }

  if (filter.tagIds && filter.tagIds.length > 0) {
    const placeholders = filter.tagIds.map((_, i) => `@tagId${i}`).join(', ')
    filter.tagIds.forEach((id, i) => {
      params[`tagId${i}`] = id
    })
    conditions.push(`EXISTS (
      SELECT 1 FROM asset_tags at2 WHERE at2.asset_id = a.id AND at2.tag_id IN (${placeholders})
    )`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const sortColumn: Record<string, string> = {
    name: 'a.name',
    size: 'a.size',
    createdAt: 'a.created_at',
    importedAt: 'a.imported_at'
  }
  const sortBy = sortColumn[filter.sortBy ?? 'importedAt'] ?? 'a.imported_at'
  const sortOrder = filter.sortOrder === 'asc' ? 'ASC' : 'DESC'

  const limit = filter.limit ?? 500
  const offset = filter.offset ?? 0

  const sql = `
    SELECT
      a.*,
      json_group_array(
        CASE WHEN t.id IS NOT NULL
          THEN json_object('id', t.id, 'name', t.name, 'color', t.color)
          ELSE NULL
        END
      ) FILTER (WHERE t.id IS NOT NULL) AS tags_json
    FROM assets a
    LEFT JOIN asset_tags at3 ON at3.asset_id = a.id
    LEFT JOIN tags t ON t.id = at3.tag_id
    ${where}
    GROUP BY a.id
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT @limit OFFSET @offset
  `

  const rows = db.prepare(sql).all({ ...params, limit, offset }) as AssetRow[]
  return rows.map(rowToAsset)
}

export function getAssetById(id: string): Asset | null {
  const db = getDatabase()
  const row = db
    .prepare(
      `
    SELECT
      a.*,
      json_group_array(
        CASE WHEN t.id IS NOT NULL
          THEN json_object('id', t.id, 'name', t.name, 'color', t.color)
          ELSE NULL
        END
      ) FILTER (WHERE t.id IS NOT NULL) AS tags_json
    FROM assets a
    LEFT JOIN asset_tags at3 ON at3.asset_id = a.id
    LEFT JOIN tags t ON t.id = at3.tag_id
    WHERE a.id = ?
    GROUP BY a.id
  `
    )
    .get(id) as AssetRow | undefined

  return row ? rowToAsset(row) : null
}

export function deleteAssets(ids: string[]): void {
  const db = getDatabase()
  const placeholders = ids.map(() => '?').join(', ')
  db.prepare(`DELETE FROM assets WHERE id IN (${placeholders})`).run(...ids)
}

// ── 태그 ────────────────────────────────────────────────────────────

export function getTags(): Tag[] {
  const db = getDatabase()
  return db.prepare(`SELECT * FROM tags ORDER BY name`).all() as Tag[]
}

export function createTag(name: string, color: string): Tag {
  const db = getDatabase()
  const id = uuidv4()
  db.prepare(`INSERT INTO tags (id, name, color) VALUES (?, ?, ?)`).run(id, name, color)
  return { id, name, color }
}

export function deleteTag(id: string): void {
  const db = getDatabase()
  db.prepare(`DELETE FROM tags WHERE id = ?`).run(id)
}

export function updateAssetTags(assetId: string, tagIds: string[]): void {
  const db = getDatabase()
  const update = db.transaction(() => {
    db.prepare(`DELETE FROM asset_tags WHERE asset_id = ?`).run(assetId)
    for (const tagId of tagIds) {
      db.prepare(`INSERT OR IGNORE INTO asset_tags (asset_id, tag_id) VALUES (?, ?)`).run(
        assetId,
        tagId
      )
    }
  })
  update()
}

// ── 검색 ────────────────────────────────────────────────────────────

export function searchAssets(query: string): Asset[] {
  const db = getDatabase()

  // FTS5 쿼리 — 특수문자 이스케이프 후 prefix 검색
  const escaped = query.replace(/['"*]/g, ' ').trim()
  if (!escaped) return []

  const ftsQuery = escaped
    .split(/\s+/)
    .map((w) => `"${w}"*`)
    .join(' ')

  const rows = db
    .prepare(
      `
    SELECT
      a.*,
      json_group_array(
        CASE WHEN t.id IS NOT NULL
          THEN json_object('id', t.id, 'name', t.name, 'color', t.color)
          ELSE NULL
        END
      ) FILTER (WHERE t.id IS NOT NULL) AS tags_json
    FROM assets a
    JOIN assets_fts fts ON fts.rowid = a.rowid
    LEFT JOIN asset_tags at3 ON at3.asset_id = a.id
    LEFT JOIN tags t ON t.id = at3.tag_id
    WHERE assets_fts MATCH ?
    GROUP BY a.id
    ORDER BY rank
    LIMIT 200
  `
    )
    .all(ftsQuery) as AssetRow[]

  return rows.map(rowToAsset)
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h, s, l]
}

function hslDistance(a: [number, number, number], b: [number, number, number]): number {
  const dh = Math.min(Math.abs(a[0] - b[0]), 1 - Math.abs(a[0] - b[0]))
  const ds = a[1] - b[1]
  const dl = a[2] - b[2]
  return Math.sqrt(dh * dh + ds * ds + dl * dl)
}

export function searchByColor(hex: string, tolerance: number): Asset[] {
  const db = getDatabase()
  const target = hexToHsl(hex)

  const rows = db
    .prepare(
      `
    SELECT
      a.*,
      json_group_array(
        CASE WHEN t.id IS NOT NULL
          THEN json_object('id', t.id, 'name', t.name, 'color', t.color)
          ELSE NULL
        END
      ) FILTER (WHERE t.id IS NOT NULL) AS tags_json
    FROM assets a
    LEFT JOIN asset_tags at3 ON at3.asset_id = a.id
    LEFT JOIN tags t ON t.id = at3.tag_id
    WHERE a.colors != '[]'
    GROUP BY a.id
  `
    )
    .all() as AssetRow[]

  return rows.map(rowToAsset).filter((asset) =>
    asset.colors.some((c) => {
      try {
        return hslDistance(hexToHsl(c), target) <= tolerance
      } catch {
        return false
      }
    })
  )
}

// ── 폴더 ────────────────────────────────────────────────────────────

export function getFolders(): Folder[] {
  const db = getDatabase()
  const rows = db
    .prepare(
      `SELECT id, name, parent_id as parentId, icon, sort_order as sortOrder FROM folders ORDER BY sort_order, name`
    )
    .all() as Folder[]
  return rows
}

export function createFolder(name: string, parentId?: string): Folder {
  const db = getDatabase()
  const id = uuidv4()
  const maxOrder = (
    db
      .prepare(
        `SELECT COALESCE(MAX(sort_order), -1) as m FROM folders WHERE parent_id IS @parentId`
      )
      .get({ parentId: parentId ?? null }) as { m: number }
  ).m
  db.prepare(
    `INSERT INTO folders (id, name, parent_id, icon, sort_order) VALUES (?, ?, ?, ?, ?)`
  ).run(id, name, parentId ?? null, '📁', maxOrder + 1)
  return { id, name, parentId, icon: '📁', sortOrder: maxOrder + 1 }
}

export function deleteFolder(id: string): void {
  const db = getDatabase()
  db.prepare(`DELETE FROM folders WHERE id = ?`).run(id)
}

export function renameFolder(id: string, name: string): void {
  const db = getDatabase()
  db.prepare(`UPDATE folders SET name = ? WHERE id = ?`).run(name, id)
}

export function addAssetsToFolder(folderId: string, assetIds: string[]): void {
  const db = getDatabase()
  const insert = db.prepare(
    `INSERT OR IGNORE INTO folder_assets (folder_id, asset_id) VALUES (?, ?)`
  )
  const insertMany = db.transaction((ids: string[]) => {
    for (const assetId of ids) insert.run(folderId, assetId)
  })
  insertMany(assetIds)
}

export function removeAssetsFromFolder(folderId: string, assetIds: string[]): void {
  const db = getDatabase()
  const del = db.prepare(`DELETE FROM folder_assets WHERE folder_id = ? AND asset_id = ?`)
  const deleteMany = db.transaction((ids: string[]) => {
    for (const assetId of ids) del.run(folderId, assetId)
  })
  deleteMany(assetIds)
}

export function getFolderAssetCounts(): Record<string, number> {
  const db = getDatabase()
  const rows = db
    .prepare(`SELECT folder_id, COUNT(*) as cnt FROM folder_assets GROUP BY folder_id`)
    .all() as { folder_id: string; cnt: number }[]
  return Object.fromEntries(rows.map((r) => [r.folder_id, r.cnt]))
}

export function getAssetPaths(): string[] {
  const db = getDatabase()
  const rows = db.prepare(`SELECT path FROM assets`).all() as { path: string }[]
  return rows.map((r) => r.path)
}

export function getTagAssetCounts(): Record<string, number> {
  const db = getDatabase()
  const rows = db
    .prepare(
      `
    SELECT tag_id, COUNT(*) as cnt FROM asset_tags GROUP BY tag_id
  `
    )
    .all() as { tag_id: string; cnt: number }[]
  return Object.fromEntries(rows.map((r) => [r.tag_id, r.cnt]))
}
