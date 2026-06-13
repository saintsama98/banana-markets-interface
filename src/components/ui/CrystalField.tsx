"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Real 3D tumbling backdrop (a16z-style) — IRREGULAR jagged low-poly crystal
 * shards that rotate in perspective behind all content, on the yellow canvas.
 *
 * Each shard is an icosahedron whose vertices are randomly displaced outward, so
 * it becomes a jagged, asymmetric faceted mass (the standard technique behind
 * those angular hero shapes) — flat-shaded gold with thin ink facet edges and
 * directional lighting for real light/dark facet depth.
 *
 * Mounted once in the root layout. The shards are placed far apart in 3D
 * (opposite sides, different depths) so they NEVER intersect one another while
 * tumbling. Transparent canvas (alpha) so the page yellow shows through;
 * pointer-events-none, z-index:-5 (body's isolation lets it paint behind
 * content). Client-only via a mounted guard so it never runs during SSR.
 */

type Spin = { x: number; y: number; z: number };

/** Icosahedron with vertices jittered outward → irregular jagged faceted shard. */
function makeShard(detail: number, jag: number): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.multiplyScalar(1 + (Math.random() * 2 - 1) * jag);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function Shard({
  position,
  scale,
  spin,
  color,
  detail,
  jag,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  spin: Spin;
  color: string;
  detail: number;
  jag: number;
}) {
  const group = useRef<THREE.Group>(null);
  const geo = useMemo(() => makeShard(detail, jag), [detail, jag]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geo, 1), [geo]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.rotation.x += dt * spin.x;
    g.rotation.y += dt * spin.y;
    g.rotation.z += dt * spin.z;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh geometry={geo}>
        <meshStandardMaterial color={color} flatShading metalness={0.25} roughness={0.5} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#141412" transparent opacity={0.45} />
      </lineSegments>
    </group>
  );
}

export function CrystalField() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: -5, pointerEvents: "none" }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }} dpr={[1, 1.6]} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[6, 7, 5]} intensity={1.6} />
        <directionalLight position={[-7, -4, 2]} intensity={0.55} color="#FFF3C4" />
        {/* left shard — chunky jagged, well to the left and back */}
        <Shard
          position={[-6.8, 1.9, -2]}
          scale={[2.0, 2.9, 2.0]}
          spin={{ x: 0.1, y: 0.16, z: 0.04 }}
          color="#E8A800"
          detail={1}
          jag={0.55}
        />
        {/* right shard — larger, more facets, opposite tumble; never meets the left one */}
        <Shard
          position={[7.1, -1.7, -1]}
          scale={[2.4, 3.5, 2.4]}
          spin={{ x: 0.08, y: -0.12, z: -0.05 }}
          color="#D98E00"
          detail={2}
          jag={0.38}
        />
      </Canvas>
    </div>
  );
}
