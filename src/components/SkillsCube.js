import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import {
  SiPython, SiJavascript, SiTypescript, SiReact, SiNextdotjs, SiNodedotjs,
  SiExpress, SiDjango, SiGraphql, SiThreedotjs, SiTailwindcss, SiCplusplus,
  SiKotlin, SiPhp, SiHtml5, SiCss3, SiUnity, SiVercel, SiBlender, SiLinux
} from 'react-icons/si';

const TECHS = [
  { name: 'Python', Icon: SiPython, color: '#3776AB' },
  { name: 'JavaScript', Icon: SiJavascript, color: '#F7DF1E' },
  { name: 'TypeScript', Icon: SiTypescript, color: '#3178C6' },
  { name: 'React', Icon: SiReact, color: '#61DAFB' },
  { name: 'Next.js', Icon: SiNextdotjs, color: '#F5F5F5' },
  { name: 'Node.js', Icon: SiNodedotjs, color: '#5FA04E' },
  { name: 'Express', Icon: SiExpress, color: '#F5F5F5' },
  { name: 'Django', Icon: SiDjango, color: '#44B78B' },
  { name: 'GraphQL', Icon: SiGraphql, color: '#E10098' },
  { name: 'Three.js', Icon: SiThreedotjs, color: '#F5F5F5' },
  { name: 'Tailwind', Icon: SiTailwindcss, color: '#38BDF8' },
  { name: 'C++', Icon: SiCplusplus, color: '#00599C' },
  { name: 'Kotlin', Icon: SiKotlin, color: '#B266FF' },
  { name: 'PHP', Icon: SiPhp, color: '#8993BE' },
  { name: 'HTML5', Icon: SiHtml5, color: '#E34F26' },
  { name: 'CSS3', Icon: SiCss3, color: '#2965F1' },
  { name: 'Unity', Icon: SiUnity, color: '#F5F5F5' },
  { name: 'Vercel', Icon: SiVercel, color: '#F5F5F5' },
  { name: 'Blender', Icon: SiBlender, color: '#F5792E' },
  { name: 'Linux', Icon: SiLinux, color: '#FDD835' },
];

const CUBE_SIZE = 3.6;
const SURFACE_OFFSET = 0.45;

// Evenly distribute N points on a unit sphere, then project onto a cube's surface
// so each icon sits flush on one of the six faces.
function cubeSurfacePoints(count, halfSize) {
  const points = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    const scale = halfSize / Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
    points.push([x * scale, y * scale, z * scale]);
  }

  return points;
}

function WireframeCube() {
  return (
    <mesh rotation={[Math.PI / 8, Math.PI / 6, 0]}>
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE, 4, 4, 4]} />
      <meshBasicMaterial color="#FFD700" wireframe transparent opacity={0.25} />
    </mesh>
  );
}

function TechIcon({ name, Icon, color, position, hovered, onHover }) {
  return (
    <Html position={position} center distanceFactor={undefined} zIndexRange={[10, 0]}>
      <div
        className="flex flex-col items-center gap-1 cursor-pointer select-none"
        onPointerEnter={() => onHover(name)}
        onPointerLeave={() => onHover(null)}
        style={{ transform: hovered ? 'scale(1.25)' : 'scale(1)', transition: 'transform 0.15s ease' }}
      >
        <div
          className="w-10 h-10 rounded-xl bg-tertiary/90 border border-white/10 flex items-center justify-center backdrop-blur-sm"
          style={{ boxShadow: hovered ? `0 0 18px ${color}99` : `0 0 6px ${color}33` }}
        >
          <Icon size={20} color={color} />
        </div>
        <span
          className="text-[10px] font-mono text-light whitespace-nowrap bg-primary/80 px-1.5 py-0.5 rounded"
          style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s ease' }}
        >
          {name}
        </span>
      </div>
    </Html>
  );
}

const SkillsCube = () => {
  const [hovered, setHovered] = useState(null);
  const positions = useMemo(
    () => cubeSurfacePoints(TECHS.length, CUBE_SIZE / 2 + SURFACE_OFFSET),
    []
  );

  return (
    <div className="relative h-[420px] md:h-[480px] w-full rounded-lg overflow-hidden bg-black/20">
      <Canvas camera={{ position: [0, 0.5, 8], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.7} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color="#FFD700" />
        <group>
          <WireframeCube />
          {TECHS.map((tech, i) => (
            <TechIcon
              key={tech.name}
              {...tech}
              position={positions[i]}
              hovered={hovered === tech.name}
              onHover={setHovered}
            />
          ))}
        </group>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.8}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
        />
      </Canvas>
      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-dark/70 font-mono pointer-events-none">
        drag to explore
      </p>
    </div>
  );
};

export default SkillsCube;
