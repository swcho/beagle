import { Play, Pause } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { Asset } from '@shared/types'

interface Props {
  asset: Asset
  autoPlay?: boolean
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function AudioPreview({ asset, autoPlay = false }: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const duration = asset.duration ?? 0

  // 자동 재생
  useEffect(() => {
    if (!autoPlay) return
    const audio = audioRef.current
    if (!audio) return
    audio.play().then(() => setIsPlaying(true)).catch(() => {})
  }, [autoPlay])

  // 언마운트 시 정지
  useEffect(() => {
    const audio = audioRef.current
    return () => {
      audio?.pause()
    }
  }, [])

  // 웨이브폼 렌더링
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let audioCtx: AudioContext | null = null

    async function drawWaveform(): Promise<void> {
      audioCtx = new AudioContext()
      try {
        const response = await fetch(`file://${asset.path}`)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
        const data = audioBuffer.getChannelData(0)

        const w = canvas!.width
        const h = canvas!.height
        const step = Math.ceil(data.length / w)

        ctx!.clearRect(0, 0, w, h)
        ctx!.fillStyle = '#3f3f46' // zinc-700
        ctx!.fillRect(0, 0, w, h)

        ctx!.strokeStyle = '#60a5fa' // blue-400
        ctx!.lineWidth = 1
        ctx!.beginPath()

        for (let i = 0; i < w; i++) {
          let min = 1,
            max = -1
          for (let j = 0; j < step; j++) {
            const datum = data[i * step + j] ?? 0
            if (datum < min) min = datum
            if (datum > max) max = datum
          }
          const yMin = ((1 + min) / 2) * h
          const yMax = ((1 + max) / 2) * h
          ctx!.moveTo(i, yMin)
          ctx!.lineTo(i, yMax)
        }
        ctx!.stroke()
      } catch {
        // 웨이브폼 실패 시 빈 캔버스 유지
        ctx!.fillStyle = '#3f3f46'
        ctx!.fillRect(0, 0, canvas!.width, canvas!.height)
      }
    }

    drawWaveform()

    return () => {
      audioCtx?.close()
    }
  }, [asset.path])

  function togglePlay(): void {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  function handleTimeUpdate(): void {
    setCurrentTime(audioRef.current?.currentTime ?? 0)
  }

  function handleEnded(): void {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex flex-col gap-3 p-1">
      <canvas ref={canvasRef} width={360} height={80} className="w-full rounded" />

      <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-400 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-full transition-colors"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <span className="text-xs text-zinc-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={`file://${asset.path}`}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />
    </div>
  )
}
