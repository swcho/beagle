import { Button, Form, Input, Modal, Select } from 'antd'
import { useEffect, useState } from 'react'

import type { Attribution } from '@shared/types'

import { useAttributionStore } from '@renderer/stores/attributionStore'

const COMMON_LICENSES = [
  'CC0 1.0',
  'CC BY 4.0',
  'CC BY-SA 4.0',
  'CC BY-NC 4.0',
  'CC BY-NC-SA 4.0',
  'MIT',
  'Apache 2.0',
  'OFL 1.1',
  'Custom'
]

interface Props {
  directoryPath: string
  existingAttribution?: Attribution
  open: boolean
  onClose: () => void
  onApplied: () => void
}

export function AttributionModal({
  directoryPath,
  existingAttribution,
  open,
  onClose,
  onApplied
}: Props): React.JSX.Element {
  const { attributions, fetchAttributions, createAttribution, updateAttribution, setDirectoryAttribution } =
    useAttributionStore()

  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [selectedId, setSelectedId] = useState<string | undefined>(existingAttribution?.id)
  const [author, setAuthor] = useState(existingAttribution?.author ?? '')
  const [url, setUrl] = useState(existingAttribution?.url ?? '')
  const [license, setLicense] = useState(existingAttribution?.license ?? '')
  const [note, setNote] = useState(existingAttribution?.note ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      void fetchAttributions()
      if (existingAttribution) {
        setMode('existing')
        setSelectedId(existingAttribution.id)
        setAuthor(existingAttribution.author)
        setUrl(existingAttribution.url ?? '')
        setLicense(existingAttribution.license ?? '')
        setNote(existingAttribution.note ?? '')
      } else {
        setMode('new')
        setSelectedId(undefined)
        setAuthor('')
        setUrl('')
        setLicense('')
        setNote('')
      }
    }
  }, [open, existingAttribution, fetchAttributions])

  async function handleSave(): Promise<void> {
    setSaving(true)
    try {
      let attribution: Attribution
      if (mode === 'existing' && selectedId) {
        attribution = await updateAttribution(selectedId, { author, url, license, note })
      } else {
        attribution = await createAttribution({ author, url, license, note })
      }
      await setDirectoryAttribution(directoryPath, attribution.id)
      onApplied()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(): Promise<void> {
    setSaving(true)
    try {
      await setDirectoryAttribution(directoryPath, null)
      onApplied()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  function handleSelectExisting(id: string): void {
    setSelectedId(id)
    const found = attributions.find((a) => a.id === id)
    if (found) {
      setAuthor(found.author)
      setUrl(found.url ?? '')
      setLicense(found.license ?? '')
      setNote(found.note ?? '')
    }
  }

  const dirName = directoryPath.split('/').pop() ?? directoryPath
  const canSave = author.trim().length > 0

  return (
    <Modal
      open={open}
      title={`Attribution 설정 — ${dirName}`}
      onCancel={onClose}
      footer={null}
      width={480}
    >
      <div className="flex flex-col gap-4 pt-2">
        {/* 기존 attribution 재사용 */}
        {attributions.length > 0 && (
          <div className="flex gap-2 mb-1">
            <Button
              size="small"
              type={mode === 'new' ? 'primary' : 'default'}
              onClick={() => setMode('new')}
            >
              새로 만들기
            </Button>
            <Button
              size="small"
              type={mode === 'existing' ? 'primary' : 'default'}
              onClick={() => setMode('existing')}
            >
              기존 재사용
            </Button>
          </div>
        )}

        {mode === 'existing' && (
          <Form.Item label="Attribution 선택" className="mb-0">
            <Select
              value={selectedId}
              onChange={handleSelectExisting}
              options={attributions.map((a) => ({
                value: a.id,
                label: `${a.author}${a.license ? ` · ${a.license}` : ''}`
              }))}
              placeholder="선택..."
              className="w-full"
            />
          </Form.Item>
        )}

        <Form layout="vertical" className="flex flex-col gap-0">
          <Form.Item label="저작자 *" required className="mb-3">
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="예: Kenney Vleugels"
            />
          </Form.Item>
          <Form.Item label="URL" className="mb-3">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="예: https://kenney.nl"
            />
          </Form.Item>
          <Form.Item label="라이선스" className="mb-3">
            <Select
              value={license || undefined}
              onChange={(v) => setLicense(v ?? '')}
              options={COMMON_LICENSES.map((l) => ({ value: l, label: l }))}
              placeholder="선택 또는 직접 입력"
              allowClear
              showSearch
            />
          </Form.Item>
          <Form.Item label="메모" className="mb-0">
            <Input.TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="추가 정보..."
            />
          </Form.Item>
        </Form>

        <div className="flex justify-between pt-2">
          {existingAttribution ? (
            <Button danger onClick={handleRemove} loading={saving}>
              Attribution 제거
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button onClick={onClose}>취소</Button>
            <Button type="primary" disabled={!canSave} loading={saving} onClick={handleSave}>
              적용
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
