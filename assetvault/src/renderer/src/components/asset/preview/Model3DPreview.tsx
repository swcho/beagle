import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Asset } from '../../../../../shared/types'

interface Props { asset: Asset }

export function Model3DPreview({ asset }: Props): React.JSX.Element {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const W = 300, H = 300

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x27272a) // zinc-800

    // Camera
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 1000)
    camera.position.set(0, 1, 3)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(W, H)
    mount.appendChild(renderer.domElement)

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dir = new THREE.DirectionalLight(0xffffff, 0.8)
    dir.position.set(5, 10, 7.5)
    scene.add(dir)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    // Load model
    const ext = asset.ext.toLowerCase()
    const url = `file://${asset.path}`

    function fitCamera(object: THREE.Object3D): void {
      const box = new THREE.Box3().setFromObject(object)
      const size = box.getSize(new THREE.Vector3()).length()
      const center = box.getCenter(new THREE.Vector3())
      object.position.sub(center)
      camera.position.set(0, size * 0.4, size * 1.2)
      camera.near = size * 0.01
      camera.far = size * 100
      camera.updateProjectionMatrix()
      controls.maxDistance = size * 10
    }

    if (ext === 'obj') {
      new OBJLoader().load(url, (obj) => {
        fitCamera(obj)
        scene.add(obj)
      })
    } else if (ext === 'glb' || ext === 'gltf') {
      new GLTFLoader().load(url, (gltf) => {
        fitCamera(gltf.scene)
        scene.add(gltf.scene)
      })
    }

    let animId: number
    function animate(): void {
      animId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [asset.path, asset.ext])

  return <div ref={mountRef} className="w-[300px] h-[300px] rounded overflow-hidden" />
}
