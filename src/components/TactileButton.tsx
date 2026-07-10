import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function TactileButton({ children, className = '', onClick, ...props }: TactileButtonProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setRipples((prev) => [...prev, { id: Date.now() + Math.random(), x, y }]);

    if (onClick) {
      onClick(e);
    }
  };

  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples((prev) => prev.slice(1));
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [ripples]);

  return (
    <motion.button
      whileHover={{ scale: 1.02, transition: { duration: 0.15, ease: 'easeOut' } }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1, ease: 'easeOut' } }}
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {/* Ripple element list */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-white/25 rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '100px',
            height: '100px',
            marginLeft: '-50px',
            marginTop: '-50px',
          }}
        />
      ))}
      <span className="relative z-10 flex items-center justify-center gap-1.5 w-full h-full">
        {children}
      </span>
    </motion.button>
  );
}
