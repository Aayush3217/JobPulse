import React, { useEffect, useRef, useState } from 'react';

/**
 * 3D Interactive Tilting Card Wrapper.
 * Tilts in 3D perspective space based on mouse position.
 */
export function TiltCard({ children, className = '' }) {
  const cardRef = useRef(null);
  const [style, setStyle] = useState({});

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; // X position inside card
    const y = e.clientY - rect.top;  // Y position inside card
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation angles (max 8 degrees tilt)
    const rotateX = ((centerY - y) / centerY) * 8;
    const rotateY = ((x - centerX) / centerX) * 8;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`,
      transition: 'transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)',
      boxShadow: '0 20px 30px -10px rgba(139, 92, 246, 0.15)',
      borderColor: 'rgba(139, 92, 246, 0.35)',
      zIndex: 10
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      className={`transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * 3D Particle Mesh Sphere Background.
 * Renders on a canvas with real Y/X axis 3D rotations, perspective translation, fov scaling, and cursor parallax tracking.
 */
export function Hero3DBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    // Ease coordinates for cursor parallax
    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Fibonacci Sphere (Golden ratio spacing)
    const particleCount = 140;
    const particles = [];
    const radius = Math.min(width, height) * 0.38;

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

      particles.push({
        x3d: radius * Math.sin(phi) * Math.cos(theta),
        y3d: radius * Math.sin(phi) * Math.sin(theta),
        z3d: radius * Math.cos(phi),
        color: i % 3 === 0 ? 'rgba(139, 92, 246, 0.45)' : i % 3 === 1 ? 'rgba(99, 102, 241, 0.3)' : 'rgba(167, 139, 250, 0.2)'
      });
    }

    const angleY = 0.0018;
    const angleX = 0.0008;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Interpolate mouse coordinates (smooth lag)
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      // Adjust rotation angles based on cursor offset
      const currentAngleY = angleY + (mouse.x - width / 2) * 0.000015;
      const currentAngleX = angleX + (mouse.y - height / 2) * 0.000015;

      const cx = width / 2;
      const cy = height / 2;
      const fov = 350; // Perspective zoom distance

      const projected = [];

      // Rotate and project 3D sphere points to 2D
      particles.forEach((p) => {
        // Y-axis rotation
        const cosY = Math.cos(currentAngleY);
        const sinY = Math.sin(currentAngleY);
        let x1 = p.x3d * cosY - p.z3d * sinY;
        let z1 = p.x3d * sinY + p.z3d * cosY;

        // X-axis rotation
        const cosX = Math.cos(currentAngleX);
        const sinX = Math.sin(currentAngleX);
        let y2 = p.y3d * cosX - z1 * sinX;
        let z2 = p.y3d * sinX + z1 * cosX;

        // Update 3D points
        p.x3d = x1;
        p.y3d = y2;
        p.z3d = z2;

        const zTranslate = z2 + 420; // depth offset
        if (zTranslate > 0) {
          const scale = fov / zTranslate;
          projected.push({
            x: cx + x1 * scale,
            y: cy + y2 * scale,
            size: scale * 1.6,
            color: p.color,
            z: zTranslate
          });
        }
      });

      // Draw connection lines to create a grid/neural net appearance
      ctx.lineWidth = 0.65;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 75) {
            // Fade lines dynamically depending on depth and proximity
            const alpha = (1 - dist / 75) * 0.14 * (300 / ((projected[i].z + projected[j].z) / 2));
            ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.stroke();
          }
        }
      }

      // Render sphere points
      projected.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.6, p.size), 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-40 select-none z-0"
    />
  );
}

/**
 * Interactive 3D HTML Tag Cloud.
 * Renders keywords on a sphere surface rotating in 3D perspective space.
 * Accelerates rotation based on cursor hover positioning.
 */
export function ThreeDTagCloud({ onTagSelect }) {
  const tags = ['React', 'NodeJS', 'Python', 'Delhi', 'Java', 'Remote', 'Marketing', 'Design', 'Full-Time', 'Bangalore', 'SQL', 'Git'];
  const [angles, setAngles] = useState({ x: 0.005, y: 0.005 });
  const [positions, setPositions] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const count = tags.length;
    const temp = [];
    const radius = 95; // Spherical radius offset

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

      temp.push({
        text: tags[i],
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi)
      });
    }
    setPositions(temp);
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Scale rotation angles speed based on cursor distance from center
    setAngles({
      x: (cy - y) * 0.00008,
      y: (x - cx) * 0.00008
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setPositions((prev) =>
        prev.map((p) => {
          // Y-axis rotation
          const cosY = Math.cos(angles.y);
          const sinY = Math.sin(angles.y);
          let x1 = p.x * cosY - p.z * sinY;
          let z1 = p.x * sinY + p.z * cosY;

          // X-axis rotation
          const cosX = Math.cos(angles.x);
          const sinX = Math.sin(angles.x);
          let y2 = p.y * cosX - z1 * sinX;
          let z2 = p.y * sinX + z1 * cosX;

          return { ...p, x: x1, y: y2, z: z2 };
        })
      );
    }, 16); // Approx. 60 FPS
    
    return () => clearInterval(interval);
  }, [angles]);

  const fov = 180;
  const maxDepth = 95;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setAngles({ x: 0.003, y: 0.003 })}
      className="relative w-64 h-64 mx-auto flex items-center justify-center cursor-pointer select-none"
      style={{ perspective: '800px' }}
    >
      {positions.map((p, idx) => {
        const zTranslate = p.z + 180;
        const scale = fov / zTranslate;
        const opacity = ((p.z + maxDepth) / (maxDepth * 2)) * 0.7 + 0.3; // depth-based opacity fading
        
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onTagSelect(p.text)}
            style={{
              position: 'absolute',
              transform: `translate3d(${p.x}px, ${p.y}px, ${p.z}px) scale(${scale})`,
              opacity: opacity,
              zIndex: Math.round(p.z + 180),
              pointerEvents: opacity > 0.45 ? 'auto' : 'none'
            }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-500/10 hover:bg-brand-600 text-brand-400 hover:text-white border border-brand-500/20 hover:border-brand-500 transition-all duration-150 shadow-sm"
          >
            {p.text}
          </button>
        );
      })}
    </div>
  );
}
