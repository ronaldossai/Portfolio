import React from 'react';
import { motion } from 'framer-motion';
import AnimatedTechScene from '../components/AnimatedTechScene';

const Home = () => {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center px-4 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto w-full">        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center md:text-left w-full md:w-1/2 mb-8 md:mb-0"
          >
          <p className="text-secondary font-mono mb-4">Hi, my name is</p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-light mb-4">
            Ronald Ossai
          </h1>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-dark mb-6">
            I build things for computers.
          </h2>
          <p className="text-dark max-w-xl mb-8 text-lg">
            I'm a Computer Scientist and Software Developer specializing in building exceptional digital experiences.
            I want to make sure to always deliver the best solutions to problems.
          </p>
          <div className="flex flex-col items-center space-y-4 md:flex-row md:space-x-4 md:space-y-0 md:items-start">
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block py-4 px-8 border-2 border-secondary text-secondary font-medium rounded hover:bg-secondary/10 transition-all duration-300"
            >
              Get In Touch
            </motion.a>
            <motion.a
              href="/assets/Ronald ossai CV and Resume 1 1 (3).pdf"
              download
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block py-4 px-8 border-2 border-secondary text-secondary font-medium rounded hover:bg-secondary/10 transition-all duration-300"
            >
              Download CV
            </motion.a>
          </div>
          </motion.div>          {/* Animated Tech Scene */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full md:w-1/2 md:pl-4"
          >
            <AnimatedTechScene />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Home;
