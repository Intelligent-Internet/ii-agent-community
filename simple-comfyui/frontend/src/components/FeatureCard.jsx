import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const FeatureCard = ({ feature, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      className="glass-effect rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 group cursor-pointer"
      whileHover={{ scale: 1.02, y: -5 }}
    >
      <motion.div
        className="mb-6 p-3 rounded-xl bg-white/5 w-fit"
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        {feature.icon}
      </motion.div>
      
      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-gray-100 transition-colors">
        {feature.title}
      </h3>
      
      <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
        {feature.description}
      </p>
    </motion.div>
  );
};

export default FeatureCard;