import React from 'react';
import { motion } from 'framer-motion';
import { FaMusic, FaCamera } from 'react-icons/fa';
import JupiterImage from '../assets/Jupiter astrophoto.jpg';
import MarsImage from '../assets/Mars astrophoto.JPG';

const Interests = () => {
  const astrophotographyImages = [
    {
      src: JupiterImage,
      alt: 'Jupiter',
      title: 'Jupiter',
      description: 'Gas giant with Great Red Spot'
    },
    {
      src: MarsImage,
      alt: 'Mars',
      title: 'Mars',
      description: 'The Red Planet'
    }
  ];

  const soundcloudTracks = [
    { title: 'P3sticide', url: 'https://soundcloud.com/n_rondon/p3sticide' },
    { title: 'Arcane', url: 'https://soundcloud.com/n_rondon/arcane' },
    { title: 'Stereosenther', url: 'https://soundcloud.com/n_rondon/stereosenther' },
    { title: 'Spinor', url: 'https://soundcloud.com/n_rondon/spinor' },
    { title: 'Monarch', url: 'https://soundcloud.com/n_rondon/monarch' },
    { title: 'Arrow of Love', url: 'https://soundcloud.com/n_rondon/arrow-of-love' }
  ];

  return (
    <section id="interests" className="min-h-screen py-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-light mb-4">
            My <span className="text-secondary">Interests</span>
          </h2>
          <p className="text-dark max-w-2xl mb-12">
            Beyond coding, I explore the universe through my telescope and create music that resonates with my soul.
          </p>
        </motion.div>

        {/* Astrophotography Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <FaCamera className="text-secondary text-3xl" />
            <h3 className="text-3xl font-bold text-light">Astrophotography</h3>
          </div>
          <p className="text-dark mb-8 max-w-2xl">
            Capturing the beauty of celestial objects through my telescope. Each image represents hours of observation, 
            imaging, and processing to reveal the wonders of our universe.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {astrophotographyImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="bg-primary-light rounded-lg overflow-hidden shadow-lg border border-secondary/20"
              >
                <div className="aspect-video bg-primary/50 flex items-center justify-center">
                  <img 
                    src={image.src} 
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-full h-full items-center justify-center">
                    <FaCamera className="text-secondary text-6xl opacity-30" />
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-bold text-light mb-2">{image.title}</h4>
                  <p className="text-dark">{image.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Music Production Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-6">
            <FaMusic className="text-secondary text-3xl" />
            <h3 className="text-3xl font-bold text-light">Music Production</h3>
          </div>
          <p className="text-dark mb-8 max-w-2xl">
            Creating beats and melodies that express emotions and tell stories. Music production allows me to 
            blend creativity with technical skills in a different medium.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {soundcloudTracks.map((track, index) => (
              <motion.div
                key={track.url}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-primary-light rounded-lg p-4 border border-secondary/20 shadow-lg"
              >
                <h4 className="text-lg font-semibold text-light mb-3">{track.title}</h4>
                <iframe
                  title={track.title}
                  width="100%"
                  height="300"
                  scrolling="no"
                  frameBorder="no"
                  allow="autoplay"
                  src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(track.url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
                ></iframe>
              </motion.div>
            ))}
          </div>

          <motion.a
            href="https://soundcloud.com/n_rondon"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block bg-secondary text-primary px-8 py-3 rounded-md font-semibold 
                     hover:bg-secondary/90 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Visit My SoundCloud
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default Interests;
