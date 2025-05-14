import React from 'react';
import { motion } from 'framer-motion';

const EmailLink = () => {
  return (
    <motion.div 
      className="fixed right-6 bottom-0 hidden lg:flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 1.2 }}
    >
      <a 
        href="mailto:ronjjossai@gmail.com" 
        className="font-mono text-light hover:text-secondary transition-colors tracking-widest my-24 vertical-text"
        style={{ writingMode: 'vertical-rl' }}
      >
        ronjjossai@gmail.com
      </a>
      <div className="w-px h-24 bg-light"></div>
    </motion.div>
  );
};

export default EmailLink;
