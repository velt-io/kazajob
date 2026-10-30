'use client'
/**
 * Carte 3D du parcours (React Three Fiber) : île volcanique stylisée,
 * sentier lumineux en spirale jusqu'au cratère du Piton, une gemme par chapitre.
 * Chargée uniquement côté client (cf. QuestMap.tsx).
 */
import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Html, Line, OrbitControls, Sparkles, Stars } from '@react-three/drei'
import * as THREE from 'three'
import type { Chapter } from '@/lib/quest-journey'
import { ROMAN } from '@/lib/quest-journey'

const ISLAND_TOP = 0.6
const VOLCANO_R = 2.3
const VOLCANO_H = 3.1

/** Altitude du relief à une distance r du centre. */
function surfaceY(r: number) {
  return r < VOLCANO_R ? ISLAND_TOP + (1 - r / VOLCANO_R) * VOLCANO_H : ISLAND_TOP
}

/** Positions des chapitres : spirale du rivage jusqu'au sommet. */
function chapterPositions(n: number): THREE.Vector3[] {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    const angle = -Math.PI / 2 + t * Math.PI * 2.35
    const r = 5.0 * (1 - t) + 0.25 * t
    return new THREE.Vector3(Math.cos(angle) * r, surfaceY(r) + 0.35, Math.sin(angle) * r)
  })
}

const STATUS_COLOR = { done: '#FACC15', current: '#E879F9', open: '#7C3AED' } as const

// Décor de l'île : [x, z, échelle] pour les arbres, [x, z, hauteur, couleur] pour les cristaux.
const TREES: [number, number, number][] = [
  [3.2, 2.6, 1], [3.8, 1.9, 0.8], [-3.6, 2.2, 1.1], [-4.1, 1.3, 0.85], [-2.9, -3.4, 1],
  [-3.6, -2.6, 0.75], [2.6, -3.9, 0.9], [4.4, -1.2, 1.05], [-1.2, 4.6, 0.9], [0.6, -4.8, 0.8],
]
const CRYSTALS: [number, number, number, string][] = [
  [5.1, 0.6, 0.7, '#22D3EE'], [-5.0, -0.9, 0.9, '#E879F9'], [1.6, 5.0, 0.6, '#FACC15'], [-1.9, -4.9, 0.8, '#22D3EE'],
]

function Island() {
  return (
    <group>
      {/* Socle de l'île */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[5.8, 4.4, 1.2, 9]} />
        <meshStandardMaterial color="#3B0764" emissive="#2E1065" emissiveIntensity={0.4} flatShading roughness={0.9} />
      </mesh>
      {/* Plateau herbeux */}
      <mesh position={[0, ISLAND_TOP + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.75, 9]} />
        <meshStandardMaterial color="#5B21B6" emissive="#4C1D95" emissiveIntensity={0.35} flatShading />
      </mesh>
      {/* Volcan */}
      <mesh position={[0, ISLAND_TOP + VOLCANO_H / 2, 0]}>
        <coneGeometry args={[VOLCANO_R, VOLCANO_H, 9, 1, true]} />
        <meshStandardMaterial color="#6D28D9" emissive="#581C87" emissiveIntensity={0.35} flatShading roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Lave au cratère */}
      <mesh position={[0, ISLAND_TOP + VOLCANO_H - 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.32, 16]} />
        <meshBasicMaterial color="#FB923C" />
      </mesh>
      <pointLight position={[0, ISLAND_TOP + VOLCANO_H + 0.4, 0]} color="#FB923C" intensity={6} distance={6} />
      {/* Forêt stylisée (positions fixes, hors du sentier) */}
      {TREES.map(([x, z, s], i) => (
        <group key={`t${i}`} position={[x, ISLAND_TOP, z]} scale={s}>
          <mesh position={[0, 0.45, 0]}>
            <coneGeometry args={[0.28, 0.9, 6]} />
            <meshStandardMaterial color="#0F766E" emissive="#14B8A6" emissiveIntensity={0.25} flatShading />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.16, 5]} />
            <meshStandardMaterial color="#3B0764" />
          </mesh>
        </group>
      ))}
      {/* Cristaux arcaniques au bord de l'île */}
      {CRYSTALS.map(([x, z, h, c], i) => (
        <mesh key={`c${i}`} position={[x, ISLAND_TOP + h / 2, z]} rotation={[0.15 * (i % 3), i, 0.1]}>
          <octahedronGeometry args={[h / 2, 0]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.2} transparent opacity={0.85} roughness={0.1} />
        </mesh>
      ))}
      {/* Liseré lumineux du rivage */}
      <mesh position={[0, ISLAND_TOP + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.6, 5.8, 9]} />
        <meshBasicMaterial color="#E879F9" transparent opacity={0.55} />
      </mesh>
      {/* Racines rocheuses sous l'île */}
      <mesh position={[0, -1.6, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[4.4, 2.8, 9]} />
        <meshStandardMaterial color="#1E0B3B" flatShading />
      </mesh>
    </group>
  )
}

function Gem({ chapter, position, selected, onSelect }: {
  chapter: Chapter; position: THREE.Vector3; selected: boolean; onSelect: (id: string) => void
}) {
  const ref = useRef<THREE.Mesh>(null)
  const [hover, setHover] = useState(false)
  const color = STATUS_COLOR[chapter.status]
  const legendary = chapter.rarity === 'legendaire'

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * (chapter.status === 'current' ? 1.6 : 0.6)
    const pulse = chapter.status === 'current' ? 1 + Math.sin(clock.elapsedTime * 3) * 0.12 : 1
    const s = (selected || hover ? 1.35 : 1) * pulse * (legendary ? 1.35 : 1)
    ref.current.scale.setScalar(s)
  })

  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0} floatIntensity={0.35}>
        <mesh
          ref={ref}
          onClick={(e) => { e.stopPropagation(); onSelect(chapter.id) }}
          onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { setHover(false); document.body.style.cursor = '' }}
        >
          <octahedronGeometry args={[0.26, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={chapter.status === 'open' ? 0.35 : 1.4} roughness={0.25} metalness={0.4} />
        </mesh>
        {(selected || chapter.status === 'current' || hover) && (
          <Html center distanceFactor={9} position={[0, 0.62, 0]} style={{ pointerEvents: 'none' }}>
            <div className="whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide text-white border"
              style={{ background: 'rgba(18,8,34,0.85)', borderColor: color, boxShadow: `0 0 16px -4px ${color}` }}>
              {ROMAN[chapter.index - 1]} · {chapter.title}
            </div>
          </Html>
        )}
      </Float>
      {/* Socle lumineux */}
      <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, selected ? 0.42 : 0.32, 24]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.9 : 0.45} />
      </mesh>
    </group>
  )
}

function Path({ points, doneCount }: { points: THREE.Vector3[]; doneCount: number }) {
  const { done, rest } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points)
    const samples = curve.getPoints(160)
    const cut = Math.round(((Math.max(doneCount, 0)) / (points.length - 1)) * 160)
    return { done: samples.slice(0, Math.max(cut + 1, 1)), rest: samples.slice(cut) }
  }, [points, doneCount])
  return (
    <>
      {done.length > 1 && <Line points={done} color="#FACC15" lineWidth={3} transparent opacity={0.95} />}
      {rest.length > 1 && <Line points={rest} color="#A855F7" lineWidth={2} dashed dashSize={0.18} gapSize={0.12} transparent opacity={0.6} />}
    </>
  )
}

export default function QuestMap3D({ chapters, selectedId, onSelect, interactive = true }: {
  chapters: Chapter[]
  selectedId: string | null
  onSelect: (id: string) => void
  interactive?: boolean
}) {
  const positions = useMemo(() => chapterPositions(chapters.length), [chapters.length])
  // Le sentier doré s'arrête à la quête principale (chapitres consécutifs terminés).
  const doneCount = Math.max(0, chapters.findIndex((c) => c.status !== 'done'))
  const reachedAll = chapters.every((c) => c.status === 'done')

  return (
    <Canvas camera={{ position: [0, 8.5, 13], fov: 42 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
      <fog attach="fog" args={['#0B0614', 14, 34]} />
      <ambientLight intensity={0.55} color="#C4B5FD" />
      <directionalLight position={[6, 10, 4]} intensity={1.1} color="#F5D0FE" />
      <directionalLight position={[-8, 4, -6]} intensity={0.6} color="#22D3EE" />

      <Stars radius={60} depth={30} count={1800} factor={3} saturation={0} fade speed={0.6} />
      <Sparkles count={80} scale={[14, 6, 14]} size={2.5} speed={0.4} color="#E879F9" position={[0, 2, 0]} />

      <Island />
      <Path points={positions} doneCount={reachedAll ? chapters.length - 1 : doneCount} />
      {chapters.map((c, i) => (
        <Gem key={c.id} chapter={c} position={positions[i]} selected={selectedId === c.id} onSelect={onSelect} />
      ))}

      {/* Mer de nébuleuse */}
      <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[30, 48]} />
        <meshStandardMaterial color="#1E1B4B" transparent opacity={0.55} roughness={0.2} metalness={0.6} />
      </mesh>

      <OrbitControls
        enablePan={false}
        enableZoom={interactive}
        enableRotate={interactive}
        minDistance={9}
        maxDistance={20}
        minPolarAngle={0.5}
        maxPolarAngle={Math.PI / 2.15}
        autoRotate
        autoRotateSpeed={0.45}
      />
    </Canvas>
  )
}
