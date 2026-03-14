import type { Asset } from '../../../../../shared/types'

interface Props {
  asset: Asset
}

export function VideoPreview({ asset }: Props): React.JSX.Element {
  return (
    <video
      src={`local-file://${asset.path}`}
      autoPlay
      muted
      loop
      playsInline
      className="w-full max-h-72 rounded object-contain bg-black"
    />
  )
}
