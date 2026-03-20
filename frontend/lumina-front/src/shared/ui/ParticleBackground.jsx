import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrame;

    const colors = {
      light: [
        '#6366f1',
        '#8b5cf6',
        '#ec4899',
        '#14b8a6',
        '#f59e0b',
        '#ef4444',
        '#3b82f6',
        '#10b981'
      ],
      dark: [
        '#818cf8',
        '#a78bfa',
        '#f472b6',
        '#2dd4bf',
        '#fbbf24',
        '#f87171',
        '#60a5fa',
        '#34d399'
      ],
      sepia: ['#b45309', '#d97706', '#f59e0b', '#fbbf24'],
      ocean: ['#0284c7', '#0891b2', '#06b6d4', '#22d3ee'],
      forest: ['#059669', '#10b981', '#34d399', '#6ee7b7']
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];

      const particleCount = theme === 'light' 
        ? Math.floor((canvas.width * canvas.height) / 8000)
        : Math.floor((canvas.width * canvas.height) / 10000);
      
      for (let i = 0; i < particleCount; i++) {
        const size = theme === 'light' 
          ? Math.random() * 6 + 3
          : Math.random() * 4 + 2;

        const opacity = theme === 'light' 
          ? Math.random() * 0.5 + 0.3 
          : Math.random() * 0.3 + 0.2; 

        const speedMultiplier = theme === 'light' ? 0.8 : 0.5;
        
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: size,
          speedX: (Math.random() - 0.5) * speedMultiplier,
          speedY: (Math.random() - 0.5) * speedMultiplier,
          color: colors[theme]?.[Math.floor(Math.random() * colors[theme].length)] || '#6366f1',
          opacity: opacity,
          flicker: Math.random() > 0.7 ? Math.random() * 0.2 + 0.1 : 0
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((particle, index) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        let currentOpacity = particle.opacity;
        if (particle.flicker > 0) {
          currentOpacity += Math.sin(Date.now() * 0.002 + index) * particle.flicker;
          currentOpacity = Math.max(0.2, Math.min(1, currentOpacity));
        }
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);

        if (theme === 'light') {
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = 15;
        } else {
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = 10;
        }
        
        ctx.fillStyle = particle.color + Math.floor(currentOpacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
        if (theme === 'light' && particle.size > 5) {
          ctx.shadowBlur = 20;
          ctx.globalAlpha = 0.3;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        
        ctx.shadowBlur = 0;
      });
      
      animationFrame = requestAnimationFrame(drawParticles);
    };

    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });

    resize();
    createParticles();
    drawParticles();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default ParticleBackground;