import React from 'react';
import { motion } from 'framer-motion';
import profilePic from '../assets/A735C23F-774D-4938-8640-E32BB7A55D15.JPG';

const About = () => {
  return (
    <section id="about" className="py-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-2 flex items-center">
            <span className="text-light">About Me</span>
            <span className="h-px bg-tertiary flex-grow ml-4"></span>
          </h2>
          
          <div className="grid md:grid-cols-5 gap-8 mt-12">
            <div className="md:col-span-3">
              <p className="text-dark mb-4">
                Hello! My name is Ronald Ossai and I enjoy creating things that live on Computers. 
                My interest in technology started at a very young age. I started learning how to code in 2015 when I decided to try making a 2d football game with 
                python and pygame. It was nothing novel and it was terminal based but it was the catalyst to the life i currently call 
                my reality.
              </p>
              <p className="text-dark mb-4"> 
                I have earned my Bsc at the University of Sussex, where I studied Computer Science and Artifical Intelligence. 
                My main focus these days is building accessible, inclusive products and digital experiences.
              </p>
              <p className="text-dark mb-4">
                Here are a few technologies I've been working with recently:
              </p>
              
              <ul className="grid grid-cols-2 gap-2 text-dark">
                <li className="flex items-center">
                  <span className="text-secondary mr-2">▹</span> JavaScript (ES6+)
                </li>
                <li className="flex items-center">
                  <span className="text-secondary mr-2">▹</span> React
                </li>
                <li className="flex items-center">
                  <span className="text-secondary mr-2">▹</span> Node.js
                </li>
                <li className="flex items-center">
                  <span className="text-secondary mr-2">▹</span> Tailwind CSS
                </li>
                <li className="flex items-center">
                  <span className="text-secondary mr-2">▹</span> TypeScript
                </li>
                <li className="flex items-center">
                  <span className="text-secondary mr-2">▹</span> Next.js
                </li>
              </ul>
            </div>
            
            <div className="md:col-span-2 relative group">              <div className="relative z-10">
                <div className="bg-secondary/20 absolute inset-0 rounded group-hover:bg-transparent transition-all duration-300"></div>
                <img 
                  src={profilePic}
                  alt="Personal pic" 
                  className="rounded grayscale group-hover:grayscale-0 transition-all duration-300"
                />
              </div>
              <div className="absolute border-2 border-secondary rounded w-full h-full top-4 left-4 -z-10 group-hover:top-2 group-hover:left-2 transition-all duration-300"></div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
