import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Builds a jagged polyline from the origin outward along `angle`, nudging each
// vertex sideways so it reads as a lightning bolt rather than a straight ray.
const buildBolt = (angle, length, segments, jitter) => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return Array.from({ length: segments + 1 }, (_, i) => {
    const along = (length * i) / segments;
    const offset = i === 0 ? 0 : (Math.random() - 0.5) * 2 * jitter;
    return [along * cos - offset * sin, along * sin + offset * cos];
  });
};

const toPath = (points) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

// One burst = a ring of bolts radiating from the CPU, each with a small fork.
const createLightningBurst = () => {
  const count = 6 + Math.floor(Math.random() * 3);
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
    const points = buildBolt(angle, 150 + Math.random() * 110, 9, 14);
    const [forkX, forkY] = points[3 + Math.floor(Math.random() * 3)];
    const forkAngle = angle + (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.4);
    const fork = buildBolt(forkAngle, 50 + Math.random() * 50, 5, 10)
      .map(([x, y]) => [x + forkX, y + forkY]);
    return { main: toPath(points), fork: toPath(fork), delay: Math.random() * 0.08 };
  });
};

const LIGHTNING_DURATION_MS = 600;

const AnimatedTechScene = () => {
  // Animation variants for different elements
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const pulseVariants = {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.05, 1],
      transition: { 
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" 
      }
    }
  };

  const rotateVariants = {
    initial: { rotate: 0 },
    animate: { 
      rotate: 360,
      transition: { 
        duration: 8, 
        repeat: Infinity,
        ease: "linear" 
      }
    }
  };

  const floatVariants = {
    initial: { y: 0 },
    animate: { 
      y: [0, -10, 0],
      transition: { 
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut" 
      }
    }
  };

  // CPU component with all its elements
  const CpuComponent = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [bursts, setBursts] = useState([]);
    const burstTimers = useRef([]);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => () => burstTimers.current.forEach(clearTimeout), []);

    const triggerLightning = () => {
      if (prefersReducedMotion) return;
      const id = `${Date.now()}-${Math.random()}`;
      setBursts((prev) => [...prev, { id, bolts: createLightningBurst() }]);
      burstTimers.current.push(setTimeout(() => {
        setBursts((prev) => prev.filter((burst) => burst.id !== id));
      }, LIGHTNING_DURATION_MS + 150));
    };

    // Per-core randomized timing so the grid flickers like independent CPU cores
    // under load, rather than pulsing in lockstep.
    const coreCells = useMemo(() => Array.from({ length: 16 }, () => ({
      peak: 0.6 + Math.random() * 0.4,
      flashDuration: 0.25 + Math.random() * 0.35,
      restDuration: 0.6 + Math.random() * 2.2,
      initialDelay: Math.random() * 2,
    })), []);

    return (
      <div className="relative">
        {/* Lightning (click only) - sits behind the chip so bolts emerge from under it */}
        <svg
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          width="600"
          height="600"
          viewBox="-300 -300 600 600"
          style={{ overflow: 'visible' }}
          aria-hidden="true"
        >
          <defs>
            <filter id="cpu-lightning-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          {bursts.map((burst) => (
            <g key={burst.id}>
              {burst.bolts.map((bolt, i) => (
                <g key={i}>
                  {[bolt.main, bolt.fork].map((d, j) => (
                    <React.Fragment key={j}>
                      <motion.path
                        d={d}
                        fill="none"
                        stroke={i % 2 ? "#818cf8" : "#38bdf8"}
                        strokeWidth={j ? 4 : 7}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#cpu-lightning-glow)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: [0, 0.9, 0.3, 0.8, 0] }}
                        transition={{
                          pathLength: { duration: 0.12, delay: bolt.delay + j * 0.06, ease: "easeOut" },
                          opacity: { duration: LIGHTNING_DURATION_MS / 1000, delay: bolt.delay, times: [0, 0.15, 0.4, 0.55, 1] }
                        }}
                      />
                      <motion.path
                        d={d}
                        fill="none"
                        stroke="#f0f9ff"
                        strokeWidth={j ? 1 : 1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: [0, 1, 0.4, 1, 0] }}
                        transition={{
                          pathLength: { duration: 0.12, delay: bolt.delay + j * 0.06, ease: "easeOut" },
                          opacity: { duration: LIGHTNING_DURATION_MS / 1000, delay: bolt.delay, times: [0, 0.15, 0.4, 0.55, 1] }
                        }}
                      />
                    </React.Fragment>
                  ))}
                </g>
              ))}
            </g>
          ))}
        </svg>

      <motion.div
        className="relative w-28 h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 bg-dark rounded-md flex items-center justify-center shadow-lg overflow-hidden cursor-pointer"
        whileHover={{ scale: 1.05, rotate: 2 }}
        whileTap={{ scale: 0.97 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onTap={triggerLightning}
      >
        {/* Brief discharge flash across the chip on click */}
        {bursts.length > 0 && (
          <motion.div
            key={bursts[bursts.length - 1].id}
            className="absolute inset-0 bg-sky-100 pointer-events-none z-20"
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        )}

        {/* CPU Corner Notch */}
        <div className="absolute top-0 left-0 w-4 h-4 bg-tertiary rounded-br-md" />
        
        {/* Subtle Circuit Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-0 w-full h-[1px] bg-secondary/70"></div>
          <div className="absolute top-2/4 left-0 w-full h-[1px] bg-secondary/70"></div>
          <div className="absolute top-3/4 left-0 w-full h-[1px] bg-secondary/70"></div>
          <div className="absolute left-1/4 top-0 h-full w-[1px] bg-secondary/70"></div>
          <div className="absolute left-2/4 top-0 h-full w-[1px] bg-secondary/70"></div>
          <div className="absolute left-3/4 top-0 h-full w-[1px] bg-secondary/70"></div>
        </div>
        
        {/* CPU Pins mapped to the Left Side */}
        <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 h-3/4 flex flex-col justify-around">
          {[...Array(8)].map((_, i) => (
            <motion.div 
              key={`pin-left-${i}`}
              className="w-2 h-1 rounded-sm shadow-sm"
              style={{ backgroundColor: isHovered ? "#38bdf8" : "#71717a" }}
              initial={{ x: 0 }}
              animate={{ 
                x: [-1, 0, -1],
                backgroundColor: isHovered 
                  ? ["#71717a", "#38bdf8", "#818cf8", "#71717a"]
                  : "#71717a"
              }}
              transition={{ 
                x: {
                  duration: 3, 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  delay: i * 0.2 % 1.5
                },
                backgroundColor: {
                  duration: 0.8,
                  repeat: isHovered ? Infinity : 0,
                  repeatType: "reverse"
                }
              }}
            />
          ))}
        </div>
        
        {/* CPU Pins mapped to the Right Side */}
        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 h-3/4 flex flex-col justify-around">
          {[...Array(8)].map((_, i) => (
            <motion.div 
              key={`pin-right-${i}`}
              className="w-2 h-1 rounded-sm shadow-sm"
              style={{ backgroundColor: isHovered ? "#38bdf8" : "#71717a" }}
              initial={{ x: 0 }}
              animate={{ 
                x: [1, 0, 1],
                backgroundColor: isHovered 
                  ? ["#71717a", "#38bdf8", "#818cf8", "#71717a"]
                  : "#71717a"
              }}
              transition={{ 
                x: {
                  duration: 3, 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  delay: i * 0.15 % 1.2
                },
                backgroundColor: {
                  duration: 0.8,
                  repeat: isHovered ? Infinity : 0,
                  repeatType: "reverse",
                  delay: i * 0.05
                }
              }}
            />
          ))}
        </div>
        
        {/* CPU Pins mapped to the Top Side */}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3/4 flex justify-around">
          {[...Array(6)].map((_, i) => (
            <motion.div 
              key={`pin-top-${i}`}
              className="h-2 w-1 rounded-sm shadow-sm"
              style={{ backgroundColor: isHovered ? "#38bdf8" : "#71717a" }}
              initial={{ y: 0 }}
              animate={{ 
                y: [-1, 0, -1],
                backgroundColor: isHovered 
                  ? ["#71717a", "#38bdf8", "#818cf8", "#71717a"]
                  : "#71717a"
              }}
              transition={{ 
                y: {
                  duration: 2.5, 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  delay: i * 0.25 % 1.8
                },
                backgroundColor: {
                  duration: 0.8,
                  repeat: isHovered ? Infinity : 0,
                  repeatType: "reverse",
                  delay: i * 0.1
                }
              }}
            />
          ))}
        </div>
        
        {/* CPU Pins mapped to the Bottom Side */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3/4 flex justify-around">
          {[...Array(6)].map((_, i) => (
            <motion.div 
              key={`pin-bottom-${i}`}
              className="h-2 w-1 rounded-sm shadow-sm"
              style={{ backgroundColor: isHovered ? "#38bdf8" : "#71717a" }}
              initial={{ y: 0 }}
              animate={{ 
                y: [1, 0, 1],
                backgroundColor: isHovered 
                  ? ["#71717a", "#38bdf8", "#818cf8", "#71717a"]
                  : "#71717a"
              }}
              transition={{ 
                y: {
                  duration: 2.8, 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  delay: i * 0.18 % 1.4
                },
                backgroundColor: {
                  duration: 0.8,
                  repeat: isHovered ? Infinity : 0,
                  repeatType: "reverse",
                  delay: i * 0.15
                }
              }}
            />
          ))}
        </div>
        
        {/* CPU Label */}
        <div className="absolute top-2 right-2 text-[8px] text-secondary/80 font-mono">
          RO-CPU 9000
        </div>
        
        {/* CPU Core */}
        <motion.div 
          className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-secondary/20 rounded-sm grid grid-cols-4 grid-rows-4 gap-0.5 p-1"
        >
          {coreCells.map((cell, i) => (
            <motion.div
              key={i}
              className="bg-secondary/80"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, cell.peak] }}
              transition={{
                duration: isHovered ? cell.flashDuration * 0.6 : cell.flashDuration,
                repeat: Infinity,
                repeatType: "reverse",
                repeatDelay: isHovered ? cell.restDuration * 0.25 : cell.restDuration,
                delay: cell.initialDelay,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </motion.div>
      </div>
    );
  };

  return (
    <div className="h-64 md:h-96 lg:h-[30rem] w-full flex items-center justify-center">
      <motion.div 
        className="relative w-full h-full bg-tertiary rounded-lg shadow-xl flex items-center justify-center overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Background grid pattern */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-10">
          {[...Array(36)].map((_, i) => (
            <div key={i} className="border border-secondary/30"></div>
          ))}
        </div>
        
        {/* Center Circuit Board */}
        <motion.div 
          className="relative z-10 w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-secondary/10 rounded-full flex items-center justify-center"
          variants={pulseVariants}
          initial="initial"
          animate="animate"
        >
          {/* Rotating rings */}
          <motion.div 
            className="absolute w-64 h-64 md:w-72 md:h-72 lg:w-[22rem] lg:h-[22rem] rounded-full border-2 border-dashed border-secondary/40"
            variants={rotateVariants}
            initial="initial"
            animate="animate"
          />
          <motion.div 
            className="absolute w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full border-2 border-dashed border-primary/40"
            variants={rotateVariants}
            initial="initial"
            animate="animate"
            style={{ animationDirection: "reverse" }}
          />
          <motion.div 
            className="absolute w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full border-2 border-dashed border-dark/30"
            variants={rotateVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />

          {/* Tech elements */}
          <motion.div 
            className="absolute top-12 left-6"
            variants={floatVariants}
            initial="initial"
            animate="animate"
          >
            <div className="w-8 h-8 bg-primary/80 rounded-md"></div>
          </motion.div>

          <motion.div 
            className="absolute bottom-16 right-10"
            variants={floatVariants}
            initial="initial"
            animate="animate"
          >
            <div className="w-6 h-6 bg-secondary/80 rounded-full"></div>
          </motion.div>

          <motion.div 
            className="absolute top-8 right-14"
            variants={floatVariants}
            initial="initial"
            animate="animate"
          >
            <div className="w-10 h-5 bg-tertiary/80 rounded-sm"></div>
          </motion.div>
          
          {/* CPU Component */}
          <CpuComponent />
        </motion.div>
        
        {/* Floating elements */}
        <motion.div 
          className="absolute top-12 left-12 md:top-16 md:left-16 w-8 h-8 bg-primary/60 rounded-full"
          variants={itemVariants}
          whileHover={{ scale: 1.2, backgroundColor: "rgba(var(--color-primary), 0.8)" }}
        />

        <motion.div 
          className="absolute bottom-16 left-20 md:bottom-24 md:left-28 w-10 h-4 bg-secondary/60 rounded-sm"
          variants={itemVariants}
          whileHover={{ scale: 1.2, backgroundColor: "rgba(var(--color-secondary), 0.8)" }}
        />

        <motion.div 
          className="absolute top-1/4 right-14 md:right-20 w-12 h-12 bg-tertiary/80 rounded-md"
          variants={itemVariants}
          whileHover={{ scale: 1.2, rotate: 45 }}
        />

        <motion.div 
          className="absolute bottom-16 right-16 md:bottom-24 md:right-24 w-6 h-14 bg-primary/60 rounded-md"
          variants={itemVariants}
          whileHover={{ scale: 1.2 }}
        />
        
        <motion.div 
          className="absolute top-1/2 left-8 md:left-12 w-5 h-16 bg-dark/60 rounded-md"
          variants={itemVariants}
          whileHover={{ scale: 1.2, rotate: -15 }}
        />

        <motion.div 
          className="absolute top-20 right-1/4 w-10 h-10 bg-primary/40 rounded-full"
          variants={itemVariants}
          whileHover={{ scale: 1.2 }}
        />
      </motion.div>
    </div>
  );
};

export default AnimatedTechScene;
