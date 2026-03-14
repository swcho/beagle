import { useEffect, useState } from 'react'

import type { Asset } from '../../../../../shared/types'

interface Props {
  asset: Asset
}

const SAMPLE_SIZES = [12, 18, 28, 40]
const SAMPLE_TEXT = 'Aa 가나다 AaBbCc 0123'

export function FontPreview({ asset }: Props): React.JSX.Element {
  const [fontFamily, setFontFamily] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const family = `preview-${asset.id}`
    const font = new FontFace(family, `url("local-file://${asset.path}")`)

    font
      .load()
      .then((loadedFont) => {
        document.fonts.add(loadedFont)
        setFontFamily(family)
      })
      .catch(() => setError(true))
  }, [asset.id, asset.path])

  if (error) {
    return <p className="text-xs text-zinc-500 p-2">폰트를 불러올 수 없습니다.</p>
  }

  if (!fontFamily) {
    return <p className="text-xs text-zinc-500 p-2">폰트 로딩 중...</p>
  }

  return (
    <div className="flex flex-col gap-3 p-1 max-h-72 overflow-y-auto">
      {SAMPLE_SIZES.map((size) => (
        <p
          key={size}
          style={{ fontFamily, fontSize: size }}
          className="text-zinc-100 leading-tight"
        >
          {SAMPLE_TEXT}
        </p>
      ))}
    </div>
  )
}
