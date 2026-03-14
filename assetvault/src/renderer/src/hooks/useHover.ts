import { useRef, useState, useCallback } from 'react'

interface HoverState {
  isHovered: boolean
  x: number
  y: number
}

interface UseHoverReturn {
  hoverState: HoverState
  hoverProps: {
    onMouseEnter: (e: React.MouseEvent) => void
    onMouseLeave: () => void
    onMouseMove: (e: React.MouseEvent) => void
  }
}

export function useHover(delay = 300): UseHoverReturn {
  const [hoverState, setHoverState] = useState<HoverState>({ isHovered: false, x: 0, y: 0 })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      const x = e.clientX
      const y = e.clientY
      timerRef.current = setTimeout(() => {
        setHoverState({ isHovered: true, x, y })
      }, delay)
    },
    [delay]
  )

  const onMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setHoverState((prev) => ({ ...prev, isHovered: false }))
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    setHoverState((prev) => (prev.isHovered ? { ...prev, x: e.clientX, y: e.clientY } : prev))
  }, [])

  return { hoverState, hoverProps: { onMouseEnter, onMouseLeave, onMouseMove } }
}
