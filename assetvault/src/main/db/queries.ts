import { getDatabase } from './schema'
import type { Asset, Tag, AssetFilter } from '../../shared/types'

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
    importedAt: row.imported_at,
  }
}

export function upsertAsset(
  asset: Omit<Asset, 'tags' | 'colors'> & { colors?: string[] }
): void {
  const db = getDatabase()
  db.prepare(`
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
  `).run({
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
    importedAt: asset.importedAt,
  })
}

export function updateAssetThumbnail(
  id: string,
  thumbnail: string,
  colors: string[]
): void {
  const db = getDatabase()
  db.prepare(`
    UPDATE assets SET thumbnail = ?, colors = ? WHERE id = ?
  `).run(thumbnail, JSON.stringify(colors), id)
}

export function getAssets(filter: AssetFilter): Asset[] {
  const db = getDatabase()

  const conditions: string[] = []
  const params: Record<string, unknown> = {}

  if (filter.types && filter.types.length > 0) {
    const { SUPPORTED_FORMATS } = require('../../shared/types')
    const exts = filter.types.flatMap((t) => SUPPORTED_FORMATS[t] as string[])
    const placeholders = exts.map((_, i) => `@ext${i}`).join(', ')
    exts.forEach((e, i) => { params[`ext${i}`] = e })
    conditions.push(`a.ext IN (${placeholders})`)
  }

  if (filter.folderId) {
    conditions.push(`EXISTS (
      SELECT 1 FROM folder_assets fa WHERE fa.folder_id = @folderId AND fa.asset_id = a.id
    )`)
    params.folderId = filter.folderId
  }

  if (filter.tagIds && filter.tagIds.length > 0) {
    const placeholders = filter.tagIds.map((_, i) => `@tagId${i}`).join(', ')
    filter.tagIds.forEach((id, i) => { params[`tagId${i}`] = id })
    conditions.push(`EXISTS (
      SELECT 1 FROM asset_tags at2 WHERE at2.asset_id = a.id AND at2.tag_id IN (${placeholders})
    )`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const sortColumn: Record<string, string> = {
    name: 'a.name',
    size: 'a.size',
    createdAt: 'a.created_at',
    importedAt: 'a.imported_at',
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
  const row = db.prepare(`
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
  `).get(id) as AssetRow | undefined

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
  const { v4: uuidv4 } = require('uuid')
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
      db.prepare(`INSERT OR IGNORE INTO asset_tags (asset_id, tag_id) VALUES (?, ?)`).run(assetId, tagId)
    }
  })
  update()
}

export function getTagAssetCounts(): Record<string, number> {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT tag_id, COUNT(*) as cnt FROM asset_tags GROUP BY tag_id
  `).all() as { tag_id: string; cnt: number }[]
  return Object.fromEntries(rows.map((r) => [r.tag_id, r.cnt]))
}
