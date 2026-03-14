import { useEffect, type RefObject } from 'react'

import type { Asset } from '@shared/types'

import { useThumbnail3DQueue } from '@renderer/stores/thumbnail3DQueueStore'

const MODEL_EXTS = new Set(['obj', 'glb', 'gltf'])

function hasRealThumbnail(asset: Asset): boolean {
  return Boolean(asset.thumbnail) && !asset.thumbnail!.startsWith('__placeholder:')
}

export function useLazy3DThumbnail(
  asset: Asset,
  containerRef: RefObject<HTMLElement | null>
): void {
  const enqueue = useThumbnail3DQueue((s) => s.enqueue)
  const isModel = MODEL_EXTS.has(asset.ext.toLowerCase())

  useEffect(() => {
    if (!isModel || hasRealThumbnail(asset)) return
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          enqueue(asset)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [asset, isModel, enqueue, containerRef])
}
