import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AnimatedTechScene = () => {
  // Animation variants for different elements
  debugger;
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
    
    return (
      <motion.div
        className="relative w-28 h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 bg-dark rounded-md flex items-center justify-center shadow-lg overflow-hidden"
        whileHover={{ scale: 1.05, rotate: 2 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
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
        
        {/* CPU Pins - Left Side */}
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
        
        {/* CPU Pins - Right Side */}
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
        
        {/* CPU Pins - Top Side */}
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
        
        {/* CPU Pins - Bottom Side */}
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
          {[...Array(16)].map((_, i) => (
            <motion.div 
              key={i}
              className="bg-secondary/80" 
              initial={{ opacity: 0.3 }}
              animate={{ 
                opacity: isHovered ? [0.3, 1, 0.3] : [0.3, 0.7, 0.3],
                scale: isHovered ? [1, 1.05, 1] : 1
              }}
              transition={{ 
                opacity: {
                  duration: isHovered ? 0.5 : 2, 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  delay: i * (isHovered ? 0.05 : 0.1) % (isHovered ? 0.5 : 1)
                },
                scale: {
                  duration: 0.5,
                  repeat: isHovered ? Infinity : 0,
                  repeatType: "reverse"
                }
              }}
            />
          ))}
        </motion.div>
      </motion.div>
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
