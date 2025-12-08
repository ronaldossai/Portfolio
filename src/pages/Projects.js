import React from 'react';
import { motion } from 'framer-motion';
import QuboxImage from '../assets/Quboximage.png';
import CTRLLIFEimage from '../assets/CTRLLIFEimage.png';
import PropertyTycoon from '../assets/PropertyTycoon.png';

const Projects = () => {
  const projects = [
    {      title: "Toy Quantum Ciruit Simulator",
      description: "A desktop application that allows users to simulate quantum logic gates and recieve the state vector output. Built with OpenQASM & Python packages PyQt6, Numpy and Matplotlob.",
      tags: ["Python", "PyQt6", "Numpy", "Matplotlib", "OpenQASM"],
      image: QuboxImage,
      liveLink: "https://github.com/ronaldossai/Qubox-Toy-Quantum-circuit-editor",
      githubLink: "https://github.com/ronaldossai/Qubox-Toy-Quantum-circuit-editor"
    },
    {      title: "CTRL + LIFE",
      description: "An Interactive threejs experience, showing 3D and Web Development skillset. Built with threejs, bootstrap, blender, and php.",
      tags: ["ThreeJS", "Bootstrap", "PHP", "SQL"],
      image: CTRLLIFEimage,
      liveLink: "https://github.com/ronaldossai/Web-3D-app",
      githubLink: "https://github.com/ronaldossai/Web-3D-app"
    },
    {      title: "Monopoly tribute Game",
      description: "A monopoly tribute game built Java. The game features a fully functional board, console based player interacction and property management.",
      tags: ["Java", "JavaFX", "Java Swing"],
      image: PropertyTycoon,
      liveLink: "https://github.com/ronaldossai/property_tycoon",
      githubLink: "https://github.com/ronaldossai/property_tycoon"
    }
  ];

  return (
    <section id="projects" className="py-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-2 flex items-center">
            <span className="text-light">Projects</span>
            <span className="h-px bg-tertiary flex-grow ml-4"></span>
          </h2>
          
          <div className="mt-12 space-y-24">
            {projects.map((project, index) => (
              <motion.div 
                key={project.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative grid md:grid-cols-12 gap-4 items-center ${
                  index % 2 === 0 ? '' : 'md:text-right'
                }`}
              >
                {/* Project Image */}
                <div className={`md:col-span-7 relative z-10 ${
                  index % 2 === 0 ? 'md:order-2' : 'md:order-1'
                }`}>
                  <a 
                    href={project.liveLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block relative group"
                  >
                    <div className="absolute inset-0 bg-secondary/20 group-hover:bg-transparent transition-all duration-300 rounded"></div>
                    <img 
                      src={project.image} 
                      alt={project.title} 
                      className="w-full h-full object-cover rounded shadow-lg"
                    />
                  </a>
                </div>
                
                {/* Project Content */}
                <div className={`md:col-span-6 ${
                  index % 2 === 0 ? 'md:order-1 md:text-right' : 'md:order-2 md:text-left'
                } relative z-20`}>
                  <p className="text-secondary font-mono mb-1">Featured Project</p>
                  <h3 className="text-2xl font-bold text-light mb-4">{project.title}</h3>
                  
                  <div className="bg-tertiary p-6 rounded shadow-lg mb-4">
                    <p className="text-dark">{project.description}</p>
                  </div>
                  
                  <ul className={`flex flex-wrap gap-2 mb-4 ${
                    index % 2 === 0 ? 'justify-end' : 'justify-start'
                  }`}>
                    {project.tags.map(tag => (
                      <li key={tag} className="text-dark font-mono text-sm">
                        {tag}
                      </li>
                    ))}
                  </ul>
                  
                  <div className={`flex gap-4 ${
                    index % 2 === 0 ? 'justify-end' : 'justify-start'
                  }`}>
                    <a 
                      href={project.githubLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-light hover:text-secondary transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                      </svg>
                    </a>
                    <a 
                      href={project.liveLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-light hover:text-secondary transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <p className="text-dark text-lg mb-6">
              Want to see more of my work?
            </p>
            <motion.a
              href="https://github.com/ronaldossai"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block py-3 px-6 border-2 border-secondary text-secondary font-medium rounded hover:bg-secondary/10 transition-all duration-300"
            >
              View More on GitHub
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Projects;
