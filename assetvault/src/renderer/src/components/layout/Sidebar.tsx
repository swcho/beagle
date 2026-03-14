import { Col, Dropdown, Input, Row, Slider, Tag as AntTag } from 'antd'
import type { MenuProps } from 'antd'
import {
  Tag,
  Trash2,
  Palette,
  Layers,
  FolderOpen,
  Folder as FolderIcon,
  Plus,
  HardDrive,
  ChevronRight,
  ChevronDown,
  ScrollText
} from 'lucide-react'
import { useEffect, useState } from 'react'

import type { AssetType, Attribution, DirectoryNode, Folder } from '@shared/types'

import { useFilterStore } from '@renderer/stores/filterStore'
import { useFolderStore } from '@renderer/stores/folderStore'
import { useTagStore } from '@renderer/stores/tagStore'
import { useUIStore } from '@renderer/stores/uiStore'
import { AttributionModal } from '@renderer/components/asset/AttributionModal'

const ASSET_TYPES: { type: AssetType; label: string; className: string }[] = [
  { type: 'image', label: 'IMG', className: 'bg-blue-900 text-blue-300' },
  { type: 'audio', label: 'SND', className: 'bg-green-900 text-green-300' },
  { type: 'video', label: 'VID', className: 'bg-purple-900 text-purple-300' },
  { type: 'font', label: 'FONT', className: 'bg-yellow-900 text-yellow-300' },
  { type: 'model3d', label: '3D', className: 'bg-orange-900 text-orange-300' },
  { type: 'doc', label: 'DOC', className: 'bg-red-900 text-red-300' }
]

const PRESET_COLORS = [
  { label: '빨강', hex: '#ef4444' },
  { label: '주황', hex: '#f97316' },
  { label: '노랑', hex: '#eab308' },
  { label: '초록', hex: '#22c55e' },
  { label: '파랑', hex: '#3b82f6' },
  { label: '남색', hex: '#6366f1' },
  { label: '보라', hex: '#a855f7' },
  { label: '분홍', hex: '#ec4899' },
  { label: '흰색', hex: '#f4f4f5' },
  { label: '회색', hex: '#71717a' },
  { label: '검정', hex: '#18181b' }
]

function compactChain(node: DirectoryNode): { label: string; leaf: DirectoryNode } {
  let label = node.name
  let current = node
  while (current.children.length === 1) {
    current = current.children[0]
    label += '/' + current.name
  }
  return { label, leaf: current }
}

function DirNode({
  node,
  depth,
  selectedDirectory,
  directoryAttributions,
  onSelect,
  onSetAttribution
}: {
  node: DirectoryNode
  depth: number
  selectedDirectory: string | undefined
  directoryAttributions: Map<string, Attribution>
  onSelect: (path: string | undefined) => void
  onSetAttribution: (path: string, existing?: Attribution) => void
}): React.JSX.Element {
  const { label, leaf } = compactChain(node)
  const [expanded, setExpanded] = useState(depth === 0)
  const isActive = selectedDirectory === leaf.path
  const hasChildren = leaf.children.length > 0
  const existing = directoryAttributions.get(leaf.path)

  const contextMenu: MenuProps = {
    items: [
      {
        key: 'attribution',
        label: existing ? 'Attribution 편집' : 'Attribution 설정',
        icon: <ScrollText size={12} />,
        onClick: () => onSetAttribution(leaf.path, existing)
      }
    ]
  }

  return (
    <div>
      <Dropdown menu={contextMenu} trigger={['contextMenu']}>
        <div
          className={`
            flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-colors text-xs
            ${isActive ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'}
          `}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
          onClick={() => onSelect(isActive ? undefined : leaf.path)}
        >
          {hasChildren ? (
            <button
              className="shrink-0 text-zinc-500 hover:text-zinc-300"
              onClick={(e) => {
                e.stopPropagation()
                setExpanded((v) => !v)
              }}
            >
              {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </button>
          ) : (
            <span className="w-3 shrink-0" />
          )}
          <FolderIcon size={12} className="shrink-0 text-zinc-500" />
          <span className="flex-1 truncate">{label}</span>
          {existing && (
            <ScrollText size={10} className="shrink-0 text-zinc-500" title={`Attribution: ${existing.author}`} />
          )}
          <span className="text-[10px] text-zinc-600 shrink-0">{leaf.count}</span>
        </div>
      </Dropdown>
      {expanded &&
        leaf.children.map((child) => (
          <DirNode
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedDirectory={selectedDirectory}
            directoryAttributions={directoryAttributions}
            onSelect={onSelect}
            onSetAttribution={onSetAttribution}
          />
        ))}
    </div>
  )
}

function FolderTree({ folders }: { folders: Folder[] }): React.JSX.Element {
  const { selectedFolderId, folderCounts, deleteFolder, renameFolder, selectFolder } =
    useFolderStore()
  const { setFilter } = useFilterStore()
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  function handleSelect(id: string | null): void {
    selectFolder(id)
    setFilter({ folderId: id ?? undefined })
  }

  function startRename(folder: Folder): void {
    setRenamingId(folder.id)
    setRenameValue(folder.name)
  }

  async function commitRename(): Promise<void> {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null)
      return
    }
    await renameFolder(renamingId, renameValue.trim())
    setRenamingId(null)
  }

  function getFolderMenu(folder: Folder): MenuProps {
    return {
      items: [
        {
          key: 'rename',
          label: '이름 변경',
          icon: <FolderIcon size={12} />,
          onClick: () => startRename(folder)
        },
        {
          key: 'delete',
          label: '폴더 삭제',
          icon: <Trash2 size={12} />,
          danger: true,
          onClick: () => deleteFolder(folder.id)
        }
      ]
    }
  }

  const isAllActive = selectedFolderId === null

  return (
    <div className="flex flex-col gap-0.5">
      {/* All Assets */}
      <div
        className={`
          flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors
          ${isAllActive ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'}
        `}
        onClick={() => handleSelect(null)}
      >
        <FolderOpen size={13} className="shrink-0" />
        <span className="text-xs flex-1 truncate">전체 에셋</span>
      </div>

      {/* Folder list */}
      {folders.map((folder) => {
        const isActive = selectedFolderId === folder.id
        const count = folderCounts[folder.id] ?? 0

        return (
          <Dropdown key={folder.id} menu={getFolderMenu(folder)} trigger={['contextMenu']}>
            <div
              className={`
                group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors
                ${isActive ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'}
              `}
              onClick={() => handleSelect(folder.id)}
            >
              <span className="text-sm shrink-0">{folder.icon}</span>
              {renamingId === folder.id ? (
                <Input
                  size="small"
                  value={renameValue}
                  autoFocus
                  className="h-5 text-xs px-1 py-0 bg-zinc-600 border-zinc-500 text-zinc-100"
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onPressEnter={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setRenamingId(null)
                    e.stopPropagation()
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="text-xs flex-1 truncate">{folder.name}</span>
              )}
              {count > 0 && renamingId !== folder.id && (
                <span className="text-[10px] text-zinc-500 bg-zinc-700 px-1.5 py-0.5 rounded-full shrink-0">
                  {count}
                </span>
              )}
            </div>
          </Dropdown>
        )
      })}
    </div>
  )
}

export function Sidebar(): React.JSX.Element {
  const { tags, tagCounts, fetchTags, deleteTag } = useTagStore()
  const { types, tagIds, directory, colors, colorTolerance, setFilter } = useFilterStore()
  const { folders, fetchFolders, createFolder, directoryTree, fetchDirectories } = useFolderStore()
  const { selectedIds } = useUIStore()
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [attributionModal, setAttributionModal] = useState<{
    path: string
    existing?: Attribution
  } | null>(null)
  const [directoryAttributions, setDirectoryAttributions] = useState<Map<string, Attribution>>(
    new Map()
  )

  async function refreshDirectoryAttributions(): Promise<void> {
    const map = await window.api.getDirectoryAttributionMap()
    setDirectoryAttributions(new Map(Object.entries(map)))
  }

  function handleSetAttribution(path: string, existing?: Attribution): void {
    setAttributionModal({ path, existing })
  }

  function handleAttributionApplied(): void {
    void refreshDirectoryAttributions()
  }

  function toggleTypeFilter(type: AssetType): void {
    const next = types.includes(type) ? types.filter((t) => t !== type) : [...types, type]
    setFilter({ types: next })
  }

  useEffect(() => {
    fetchTags()
    fetchFolders()
    fetchDirectories()
    void refreshDirectoryAttributions()
  }, [fetchTags, fetchFolders, fetchDirectories])

  function toggleTagFilter(tagId: string): void {
    const next = tagIds.includes(tagId) ? tagIds.filter((id) => id !== tagId) : [...tagIds, tagId]
    setFilter({ tagIds: next })
  }

  function toggleColorFilter(hex: string): void {
    const next = colors.includes(hex) ? colors.filter((c) => c !== hex) : [...colors, hex]
    setFilter({ colors: next })
  }

  async function handleDelete(tagId: string): Promise<void> {
    await deleteTag(tagId)
    if (tagIds.includes(tagId)) {
      setFilter({ tagIds: tagIds.filter((id) => id !== tagId) })
    }
  }

  function getTagMenu(tagId: string): MenuProps {
    return {
      items: [
        {
          key: 'delete',
          label: '태그 삭제',
          icon: <Trash2 size={12} />,
          danger: true,
          onClick: () => handleDelete(tagId)
        }
      ]
    }
  }

  async function commitNewFolder(): Promise<void> {
    const name = newFolderName.trim()
    if (name) await createFolder(name)
    setCreatingFolder(false)
    setNewFolderName('')
  }

  return (
    <>
      {attributionModal && (
        <AttributionModal
          directoryPath={attributionModal.path}
          existingAttribution={attributionModal.existing}
          open={true}
          onClose={() => setAttributionModal(null)}
          onApplied={handleAttributionApplied}
        />
      )}
      {/* 라이브러리 (폴더) 섹션 */}
      <div className="px-3 py-3 border-b border-zinc-700">
        <div className="flex items-center gap-2 mb-2">
          <FolderIcon size={13} className="text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex-1">
            라이브러리
          </span>
          {selectedIds.size > 0 && (
            <span className="text-[10px] text-zinc-500">{selectedIds.size}개 선택됨</span>
          )}
          <button
            title="새 폴더"
            onClick={() => setCreatingFolder(true)}
            className="text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>

        <FolderTree folders={folders} />

        {creatingFolder && (
          <div className="mt-1">
            <Input
              size="small"
              placeholder="폴더 이름"
              value={newFolderName}
              autoFocus
              className="text-xs"
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={commitNewFolder}
              onPressEnter={commitNewFolder}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setCreatingFolder(false)
                  setNewFolderName('')
                }
              }}
            />
          </div>
        )}
      </div>

      {/* 파일 시스템 섹션 */}
      {directoryTree.length > 0 && (
        <div className="px-3 py-3 border-b border-zinc-700">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive size={13} className="text-zinc-500" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex-1">
              파일 시스템
            </span>
            {directory && (
              <button
                className="text-[10px] text-zinc-500 hover:text-zinc-300"
                onClick={() => setFilter({ directory: undefined })}
              >
                해제
              </button>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            {directoryTree.map((node) => (
              <DirNode
                key={node.path}
                node={node}
                depth={0}
                selectedDirectory={directory}
                directoryAttributions={directoryAttributions}
                onSelect={(path) => setFilter({ directory: path })}
                onSetAttribution={handleSetAttribution}
              />
            ))}
          </div>
        </div>
      )}

      {/* 타입 필터 섹션 */}
      <div className="px-3 py-3 border-b border-zinc-700">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={13} className="text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">타입</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {ASSET_TYPES.map(({ type, label, className }) => {
            const isActive = types.includes(type)
            return (
              <button
                key={type}
                onClick={() => toggleTypeFilter(type)}
                className={`
                  text-[10px] font-bold px-1.5 py-0.5 rounded transition-opacity
                  ${className}
                  ${isActive ? 'opacity-100 ring-1 ring-white/40' : 'opacity-40 hover:opacity-70'}
                `}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 태그 섹션 */}
      <div className="px-3 py-3 border-b border-zinc-700">
        <div className="flex items-center gap-2 mb-2">
          <Tag size={13} className="text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">태그</span>
        </div>

        {tags.length === 0 ? (
          <p className="text-xs text-zinc-600 px-1">태그 없음</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {tags.map((tag) => {
              const isActive = tagIds.includes(tag.id)
              const count = tagCounts[tag.id] ?? 0
              return (
                <Dropdown key={tag.id} menu={getTagMenu(tag.id)} trigger={['contextMenu']}>
                  <div
                    className={`
                      group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors
                      ${isActive ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'}
                    `}
                    onClick={() => toggleTagFilter(tag.id)}
                  >
                    <label
                      className="w-3 h-3 rounded-full shrink-0 cursor-pointer"
                      style={{ backgroundColor: tag.color }}
                      onClick={(e) => e.stopPropagation()}
                      title="색상 변경"
                    >
                      <input
                        type="color"
                        className="opacity-0 w-0 h-0 absolute"
                        defaultValue={tag.color}
                      />
                    </label>
                    <span className="text-xs flex-1 truncate">{tag.name}</span>
                    {count > 0 && (
                      <span className="text-[10px] text-zinc-500 bg-zinc-700 px-1.5 py-0.5 rounded-full shrink-0">
                        {count}
                      </span>
                    )}
                  </div>
                </Dropdown>
              )
            })}
          </div>
        )}
      </div>

      {/* 색상 필터 섹션 */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Palette size={13} className="text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">색상</span>
        </div>

        <Row gutter={[6, 6]} style={{ marginBottom: 12 }}>
          {PRESET_COLORS.map(({ label, hex }) => {
            const isActive = colors.includes(hex)
            return (
              <Col key={hex} span={4}>
                <button
                  title={label}
                  onClick={() => toggleColorFilter(hex)}
                  className={`
                    w-6 h-6 rounded-full border-2 transition-transform hover:scale-110
                    ${isActive ? 'border-white scale-110' : 'border-zinc-600'}
                  `}
                  style={{ backgroundColor: hex }}
                />
              </Col>
            )
          })}
        </Row>

        {/* 선택된 색상 칩 */}
        {colors.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {colors.map((hex) => {
              const label = PRESET_COLORS.find((p) => p.hex === hex)?.label ?? hex
              return (
                <AntTag
                  key={hex}
                  closable
                  onClose={() => toggleColorFilter(hex)}
                  color={hex}
                  style={{ marginInlineEnd: 0 }}
                >
                  {label}
                </AntTag>
              )
            })}
          </div>
        )}

        {/* tolerance 슬라이더 */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>유사도</span>
            <span>{Math.round(colorTolerance * 100)}%</span>
          </div>
          <Slider
            min={0.05}
            max={0.5}
            step={0.05}
            value={colorTolerance}
            onChange={(val) => setFilter({ colorTolerance: val })}
            tooltip={{ formatter: (val) => `${Math.round((val ?? 0) * 100)}%` }}
          />
        </div>
      </div>
    </>
  )
}
