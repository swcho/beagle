import type { Asset } from '@shared/types'

interface Props {
  asset: Asset
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ImagePreview({ asset }: Props): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <img
        src={`local-file://${asset.path}`}
        alt={asset.name}
        className="w-full max-h-72 object-contain rounded"
      />
      <div className="flex gap-3 text-xs text-zinc-400 px-1">
        {asset.width && (
          <span>
            {asset.width} × {asset.height}px
          </span>
        )}
        <span>{formatBytes(asset.size)}</span>
      </div>
    </div>
  )
}
