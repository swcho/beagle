import { create } from 'zustand'

import type { Asset } from '@shared/types'

interface Thumbnail3DQueueState {
  queue: Asset[]
  current: Asset | null
  inflight: Record<string, true>
  enqueue: (asset: Asset) => void
  markDone: () => void
}

export const useThumbnail3DQueue = create<Thumbnail3DQueueState>((set, get) => ({
  queue: [],
  current: null,
  inflight: {},

  enqueue: (asset: Asset) => {
    const { inflight, current, queue } = get()
    if (inflight[asset.id]) return
    const newInflight = { ...inflight, [asset.id]: true as const }
    if (!current) {
      set({ current: asset, inflight: newInflight })
    } else {
      set({ queue: [...queue, asset], inflight: newInflight })
    }
  },

  markDone: () => {
    const { queue } = get()
    if (queue.length === 0) {
      set({ current: null })
    } else {
      const [next, ...rest] = queue
      set({ current: next, queue: rest })
    }
  }
}))
