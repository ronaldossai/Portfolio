import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import emailjs from '@emailjs/browser';

const Contact = () => {
  const formRef = useRef();
  const [form, setForm] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(false);

    // You'll need to sign up for EmailJS and replace these with your actual service ID, template ID, and public key
    emailjs.sendForm(
      'YOUR_SERVICE_ID', 
      'YOUR_TEMPLATE_ID', 
      formRef.current, 
      'YOUR_PUBLIC_KEY'
    )
    .then(() => {
      setLoading(false);
      setSuccess(true);
      setForm({
        name: '',
        email: '',
        message: '',
      });
    })
    .catch((error) => {
      setLoading(false);
      setError(true);
      console.error('Email send failed:', error);
    });
  };

  return (
    <section id="contact" className="py-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-2 flex items-center">
            <span className="text-secondary font-mono mr-2">04.</span>
            <span className="text-light">Contact</span>
            <span className="h-px bg-tertiary flex-grow ml-4"></span>
          </h2>
          
          <div className="mt-12 grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-light mb-4">Get In Touch</h3>
              <p className="text-dark mb-6">
                I'm currently looking for new opportunities. Whether you have a question or just want to say hi, 
                I'll do my best to get back to you!
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-tertiary rounded-full flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div>
                    <p className="text-dark text-sm">Email</p>
                    <a href="mailto:ronjjossai@gmail.com" className="text-light hover:text-secondary transition-colors">
                      ronjjossai@gmail.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-tertiary rounded-full flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-dark text-sm">GitHub</p>
                    <a href="https://github.com/ronaldossai" target="_blank" rel="noopener noreferrer" className="text-light hover:text-secondary transition-colors">
                      github.com/ronaldossai
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-tertiary rounded-full flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </div>
                  <div>
                    <p className="text-dark text-sm">LinkedIn</p>
                    <a href="https://www.linkedin.com/in/ronald-ossai-b66670206/" target="_blank" rel="noopener noreferrer" className="text-light hover:text-secondary transition-colors">
                      linkedin.com/in/ronald-ossai-b66670206/
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-light mb-2">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="What's your name?"
                    className="w-full px-4 py-3 bg-tertiary text-light rounded border border-dark focus:border-secondary focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-light mb-2">Your Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="What's your email address?"
                    className="w-full px-4 py-3 bg-tertiary text-light rounded border border-dark focus:border-secondary focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-light mb-2">Your Message</label>
                  <textarea
                    name="message"
                    rows="5"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="What would you like to say?"
                    className="w-full px-4 py-3 bg-tertiary text-light rounded border border-dark focus:border-secondary focus:outline-none resize-none"
                    required
                  ></textarea>
                </div>
                
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 px-6 bg-secondary text-primary font-medium rounded hover:bg-secondary/90 transition-all duration-300 disabled:opacity-70"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </motion.button>
                
                {success && (
                  <p className="text-green-400 text-center">
                    Thank you! I will get back to you as soon as possible.
                  </p>
                )}
                
                {error && (
                  <p className="text-red-400 text-center">
                    Something went wrong. Please try again later.
                  </p>
                )}
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
