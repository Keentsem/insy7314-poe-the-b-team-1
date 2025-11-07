/**
 * Cubes Component - Task 3 Employee Portal
 * 3D animated cube grid background with interactive ripple effects
 * Uses GSAP for smooth animations
 */

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './Cubes.css';

const Cubes = ({
  gridSize = 8,
  faceColor = '#0a0a1a',
  rippleColor = '#4338ca',
  border = '1px solid #4338ca',
  autoAnimate = true,
  clickRipple = true,
}) => {
  const containerRef = useRef(null);
  const [cubes, setCubes] = useState([]);

  // Initialize cube grid
  useEffect(() => {
    const cubeArray = [];
    for (let i = 0; i < gridSize * gridSize; i++) {
      cubeArray.push({
        id: i,
        row: Math.floor(i / gridSize),
        col: i % gridSize,
      });
    }
    setCubes(cubeArray);
  }, [gridSize]);

  // Auto-animate cubes on mount
  useEffect(() => {
    if (!autoAnimate || cubes.length === 0) return;

    const cubeElements = containerRef.current?.querySelectorAll('.cube');
    if (!cubeElements) return;

    // Staggered entrance animation
    gsap.fromTo(
      cubeElements,
      {
        scale: 0,
        rotationX: -180,
        rotationY: -180,
        opacity: 0,
      },
      {
        scale: 1,
        rotationX: 0,
        rotationY: 0,
        opacity: 1,
        duration: 1,
        ease: 'back.out(1.7)',
        stagger: {
          amount: 1.5,
          from: 'center',
          grid: [gridSize, gridSize],
        },
      }
    );

    // Continuous floating animation
    cubeElements.forEach((cube, index) => {
      gsap.to(cube, {
        y: Math.sin(index) * 10,
        rotationX: Math.sin(index * 0.5) * 5,
        rotationY: Math.cos(index * 0.5) * 5,
        duration: 3 + Math.random() * 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: Math.random() * 2,
      });
    });
  }, [cubes, autoAnimate, gridSize]);

  // Handle click ripple effect
  const handleCubeClick = (event, index) => {
    if (!clickRipple) return;

    const cubeElements = containerRef.current?.querySelectorAll('.cube');
    if (!cubeElements) return;

    const clickedCube = cubeElements[index];
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    // Ripple outward from clicked cube
    cubeElements.forEach((cube, i) => {
      const cubeRow = Math.floor(i / gridSize);
      const cubeCol = i % gridSize;
      const distance = Math.sqrt(Math.pow(cubeRow - row, 2) + Math.pow(cubeCol - col, 2));

      gsap.to(cube, {
        scale: 1.3,
        rotationX: 180,
        rotationY: 180,
        duration: 0.6,
        delay: distance * 0.05,
        ease: 'back.out(1.7)',
        onComplete: () => {
          gsap.to(cube, {
            scale: 1,
            rotationX: 0,
            rotationY: 0,
            duration: 0.6,
            ease: 'back.in(1.7)',
          });
        },
      });
    });
  };

  return (
    <div className="cubes-container" ref={containerRef}>
      <div
        className="cubes-grid"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {cubes.map((cube, index) => (
          <div key={cube.id} className="cube-wrapper">
            <div
              className="cube"
              style={{
                '--cube-size': `${100 / gridSize}px`,
              }}
              onClick={e => handleCubeClick(e, index)}
            >
              {/* Front face */}
              <div
                className="cube-face front"
                style={{
                  backgroundColor: faceColor,
                  border: border,
                }}
              ></div>

              {/* Back face */}
              <div
                className="cube-face back"
                style={{
                  backgroundColor: rippleColor,
                  border: border,
                }}
              ></div>

              {/* Right face */}
              <div
                className="cube-face right"
                style={{
                  backgroundColor: faceColor,
                  border: border,
                }}
              ></div>

              {/* Left face */}
              <div
                className="cube-face left"
                style={{
                  backgroundColor: faceColor,
                  border: border,
                }}
              ></div>

              {/* Top face */}
              <div
                className="cube-face top"
                style={{
                  backgroundColor: rippleColor,
                  border: border,
                }}
              ></div>

              {/* Bottom face */}
              <div
                className="cube-face bottom"
                style={{
                  backgroundColor: faceColor,
                  border: border,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cubes;
