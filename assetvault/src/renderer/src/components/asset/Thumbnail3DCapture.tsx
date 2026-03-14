import { Center, useGLTF } from '@react-three/drei'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef } from 'react'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

import type { Asset } from '@shared/types'

import { useThumbnail3DQueue } from '@renderer/stores/thumbnail3DQueueStore'

function OBJModel({ url }: { url: string }): React.JSX.Element {
  const obj = useLoader(OBJLoader, url)
  return (
    <Center>
      <primitive object={obj} />
    </Center>
  )
}

function GLTFModel({ url }: { url: string }): React.JSX.Element {
  const { scene } = useGLTF(url)
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  )
}

function SceneModel({ asset }: { asset: Asset }): React.JSX.Element {
  const url = `file://${asset.path}`
  if (asset.ext.toLowerCase() === 'obj') return <OBJModel url={url} />
  return <GLTFModel url={url} />
}

function CaptureFrame({
  asset,
  onDone
}: {
  asset: Asset
  onDone: () => void
}): null {
  const { gl } = useThree()
  const captured = useRef(false)

  useEffect(() => {
    captured.current = false
  }, [asset.id])

  useEffect(() => {
    // Wait 200ms for the Bounds camera fit to settle and r3f to render several frames
    const timer = setTimeout(async () => {
      if (captured.current) return
      captured.current = true

      const dataUrl = gl.domElement.toDataURL('image/png')
      const base64 = dataUrl.split(',')[1]
      const binary = atob(base64)
      const buf = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i)

      try {
        await window.api.saveThumbnailBuffer(asset.id, buf)
      } catch (err) {
        console.error(`3D 썸네일 캡처 실패 [${asset.name}]:`, err)
      }

      onDone()
    }, 200)

    return () => clearTimeout(timer)
  }, [asset, gl, onDone])

  return null
}

export function Thumbnail3DCapture(): React.JSX.Element {
  const current = useThumbnail3DQueue((s) => s.current)
  const markDone = useThumbnail3DQueue((s) => s.markDone)

  if (!current) return <></>

  return (
    <div
      key={current.id}
      style={{
        position: 'fixed',
        left: -9999,
        top: -9999,
        width: 200,
        height: 200,
        pointerEvents: 'none'
      }}
    >
      <Canvas
        gl={{ preserveDrawingBuffer: true }}
        camera={{ fov: 45 }}
        style={{ width: 200, height: 200 }}
      >
        <color attach="background" args={['#27272a']} />
        <ambientLight intensity={0.6} />
        <directionalLight intensity={0.8} position={[5, 10, 7.5]} />
        <Suspense fallback={null}>
          <SceneModel asset={current} />
          <CaptureFrame asset={current} onDone={markDone} />
        </Suspense>
      </Canvas>
    </div>
  )
}
