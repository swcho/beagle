import { Bounds, Center, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useLoader } from '@react-three/fiber'
import { Suspense } from 'react'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

import type { Asset } from '@shared/types'

interface Props {
  asset: Asset
}

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
  const url = `local-file://${asset.path}`
  const ext = asset.ext.toLowerCase()

  if (ext === 'obj') return <OBJModel url={url} />
  return <GLTFModel url={url} />
}

export function Model3DPreview({ asset }: Props): React.JSX.Element {
  return (
    <div className="w-[300px] h-[300px] rounded overflow-hidden">
      <Canvas camera={{ fov: 45 }}>
        <color attach="background" args={['#27272a']} />
        <ambientLight intensity={0.6} />
        <directionalLight intensity={0.8} position={[5, 10, 7.5]} />
        <Suspense fallback={null}>
          <Bounds fit clip observe>
            <SceneModel asset={asset} />
          </Bounds>
        </Suspense>
        <OrbitControls enableDamping makeDefault />
      </Canvas>
    </div>
  )
}
