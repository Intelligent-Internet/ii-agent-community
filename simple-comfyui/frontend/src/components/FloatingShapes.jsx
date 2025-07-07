import { motion } from 'framer-motion';

const FloatingShapes = () => {
  const shapes = [
    { id: 1, type: 'circle', size: 60, x: '10%', y: '20%', duration: 20 },
    { id: 2, type: 'square', size: 40, x: '80%', y: '15%', duration: 25 },
    { id: 3, type: 'triangle', size: 50, x: '15%', y: '70%', duration: 18 },
    { id: 4, type: 'circle', size: 35, x: '85%', y: '80%', duration: 22 },
    { id: 5, type: 'square', size: 45, x: '50%', y: '10%', duration: 28 },
    { id: 6, type: 'triangle', size: 38, x: '75%', y: '50%', duration: 24 },
  ];

  const getShapeElement = (shape) => {
    const baseClasses = "absolute opacity-10";
    
    switch (shape.type) {
      case 'circle':
        return (
          <div
            className={`${baseClasses} rounded-full bg-gradient-to-br from-grey-400 to-grey-500`}
            style={{ width: shape.size, height: shape.size }}
          />
        );
      case 'square':
        return (
          <div
            className={`${baseClasses} bg-gradient-to-br from-emerald-400 to-grey-500`}
            style={{ width: shape.size, height: shape.size }}
          />
        );
      case 'triangle':
        return (
          <div
            className={`${baseClasses}`}
            style={{
              width: 0,
              height: 0,
              borderLeft: `${shape.size / 2}px solid transparent`,
              borderRight: `${shape.size / 2}px solid transparent`,
              borderBottom: `${shape.size}px solid rgba(168, 85, 247, 0.1)`,
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-10">
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute"
          style={{
            left: shape.x,
            top: shape.y,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {getShapeElement(shape)}
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingShapes;