import React from 'react';
import { motion } from 'framer-motion';

const Skills = () => {
  const skills = [
    {
      category: "Programming Languages",
      items: ["Python", "JavaScript", "Java", "PHP", "C#", "R", "SQL", "HTML & CSS", "TypeScript"]
    },
    {
      category: "Frameworks & Technologies",
      items: ["Django", "React/Tailwind/Vercel", "Web 3D applications (Threejs + Bootstrap)", "Kotlin", "Unity", "Node.js", "Express.js", "RESTful APIs", "GraphQL"]
    },
    {
      category: "Software & Tools",
      items: ["Microsoft Excel", "Microsoft Access", "Visio", "Power BI", "Blender", "Windows OS", "Linux", "Unix", "CNC Machinery", "UI/UX"]
    },
    {
      category: "Technical Areas",
      items: ["Machine Learning", "Computer Vision", "Computer Graphics", "Computer Architecture", "Computer Engineering", "Cybersecurity", "Electronics"]
    },
    {
      category: "Programming Paradigms",
      items: ["Object Oriented Programming", "Functional Programming", "Imperative Programming", "Procedural Programming", "AGILE"]
    },
    {
      category: "Academic",
      items: ["Applied Mathematics", "Theoretical Physics", "Logical thinking"]
    },
    {
      category: "Soft Skills",
      items: ["Teamwork", "Problem Solving", "Public Speaking and Extrovert", "Adaptive Learning", "Grit", "Compassion", "Time management", "Conceptual Thinking", "Report Writing"]
    },
    {
      category: "Media",
      items: ["Video Editing, Music Production, Graphic Design"]
    }
  ];

  return (
    <section id="skills" className="py-20 px-4 md:px-8 lg:px-16 bg-primary">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-2 flex items-center">
            <span className="text-light">Skills</span>
            <span className="h-px bg-tertiary flex-grow ml-4"></span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {skills.map((skillGroup, index) => (
              <motion.div
                key={skillGroup.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-tertiary p-6 rounded-lg shadow-lg"
              >
                <h3 className="text-xl font-bold text-secondary mb-4">{skillGroup.category}</h3>
                <ul className="space-y-2">
                  {skillGroup.items.map((skill) => (
                    <li key={skill} className="flex items-center text-dark">
                      <span className="text-secondary mr-2">▹</span> {skill}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <p className="text-dark text-lg mb-6">
              I'm always learning and adding new skills to my repertoire.
              Currently exploring advanced applications in Computer Vision and Machine Learning. And research in Quantum Computing.
            </p>
            <motion.a
              href="#projects"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block py-3 px-6 border-2 border-secondary text-secondary font-medium rounded hover:bg-secondary/10 transition-all duration-300"
            >
              See My Work
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Skills;
