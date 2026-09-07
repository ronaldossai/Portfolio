import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const TimezoneClock = () => {
  const [times, setTimes] = useState({
    local: new Date(),
    utc: new Date(),
    nyc: new Date(),
    tokyo: new Date()
  });

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      setTimes({
        local: now,
        utc: new Date(now.toLocaleString('en-US', { timeZone: 'UTC' })),
        nyc: new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })),
        tokyo: new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
      });
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    const hours = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      hour12: false
    });
    const minutes = date.toLocaleTimeString('en-US', {
      minute: '2-digit'
    });
    return { hours, minutes };
  };

  const timezones = [
    { label: 'Local', time: times.local, abbr: 'LOCAL' },
    { label: 'UTC', time: times.utc, abbr: 'UTC' },
    { label: 'NYC', time: times.nyc, abbr: 'EST' },
    { label: 'Tokyo', time: times.tokyo, abbr: 'JST' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="mt-12 w-full px-4 md:px-0"
    >
      <p className="text-secondary font-mono text-xs md:text-sm mb-4 text-center md:text-left uppercase tracking-widest">
        Always available
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        {timezones.map((tz, index) => (
          <motion.div
            key={tz.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
            className="bg-gradient-to-br from-tertiary/40 to-tertiary/20 border border-secondary/30 rounded-lg p-3 md:p-4 text-center hover:border-secondary/60 hover:bg-tertiary/50 transition-all duration-300 group"
          >
            <p className="text-secondary/70 font-mono text-xs uppercase tracking-wider mb-3 group-hover:text-secondary transition-colors">
              {tz.abbr}
            </p>
            <div className="flex flex-col items-center justify-center gap-0">
              <p className="text-light font-bold text-2xl md:text-3xl lg:text-4xl font-mono leading-none">
                {formatTime(tz.time).hours}
              </p>
              <p className="text-light font-bold text-2xl md:text-3xl lg:text-4xl font-mono leading-none">
                {formatTime(tz.time).minutes}
              </p>
            </div>
            <p className="text-secondary/50 text-xs mt-1.5">
              {tz.label}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default TimezoneClock;
