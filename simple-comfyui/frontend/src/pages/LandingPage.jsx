import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { gsap } from 'gsap';
import { 
  LogIn, 
  ArrowRight, 
  Workflow,
  Zap,
  Sparkles,
  Video,
  Image,
  Type,
  Globe,
  Users,
  ChevronDown
} from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import FloatingShapes from '../components/FloatingShapes';
import FeatureCard from '../components/FeatureCard';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -50]);

  useEffect(() => {
    const tl = gsap.timeline();
    
    tl.fromTo(titleRef.current, 
      { opacity: 0, y: 100 },
      { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }
    )
    .fromTo(subtitleRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      "-=0.6"
    );
  }, []);

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  const features = [
    {
      icon: <Workflow className="w-8 h-8 text-white" />,
      title: "Visual Workflow Builder",
      description: "Create complex AI workflows with our intuitive drag-and-drop interface. Connect nodes to build powerful media generation pipelines."
    },
    {
      icon: <Type className="w-8 h-8 text-gray-300" />,
      title: "Text-to-Media Generation",
      description: "Transform your ideas into stunning visuals and videos using state-of-the-art AI models powered by fal.ai and OpenAI."
    },
    {
      icon: <Image className="w-8 h-8 text-gray-400" />,
      title: "Image Processing",
      description: "Edit, enhance, and transform images with text prompts. Apply complex modifications with simple natural language commands."
    },
    {
      icon: <Video className="w-8 h-8 text-gray-500" />,
      title: "Video Creation",
      description: "Generate dynamic videos from text descriptions or transform static images into engaging animated content."
    },
    {
      icon: <Zap className="w-8 h-8 text-white" />,
      title: "Real-time Processing",
      description: "See your creations come to life instantly with our optimized processing pipeline and real-time feedback."
    },
    {
      icon: <Globe className="w-8 h-8 text-gray-300" />,
      title: "Cloud-Powered",
      description: "Access powerful AI models from anywhere. Your workflows are saved securely in the cloud for seamless collaboration."
    }
  ];

  const workflowExamples = [
    {
      title: "Text → Image → Video",
      description: "Create a complete video story from a simple text prompt",
      steps: ["Write description", "Generate image", "Animate to video"]
    },
    {
      title: "Image + Text → Enhanced Image",
      description: "Transform existing images with AI-powered edits",
      steps: ["Upload image", "Add edit prompt", "Get enhanced result"]
    },
    {
      title: "Multi-Text → Summary",
      description: "Combine multiple text inputs into coherent content",
      steps: ["Multiple inputs", "AI processing", "Unified output"]
    }
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />
      <FloatingShapes />
      
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center">
        <motion.div 
          style={{ y }}
          className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          
          <motion.div
            ref={titleRef}
            className="mb-6"
          >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white mb-4 leading-none">
              NODE
              <span className="block text-gray-400">MEDIA</span>
              <span className="block text-gradient">GENERATOR</span>
            </h1>
          </motion.div>
          
          <motion.p
            ref={subtitleRef}
            className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Build powerful visual workflows that transform ideas into stunning media. 
            Connect AI models with simple drag-and-drop.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <motion.button
              onClick={handleGetStarted}
              className="btn-primary group relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </motion.button>
            
            <motion.button
              onClick={handleSignIn}
              className="btn-secondary group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogIn className="mr-2 w-5 h-5 transition-transform group-hover:scale-110" />
              Sign In
            </motion.button>
          </motion.div>
        </motion.div>
        
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6 text-gray-500" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Built for
              <span className="block text-gradient">Creators</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Everything you need to build sophisticated AI-powered media generation workflows.
              No limits, just pure creative freedom.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Examples */}
      <section className="py-32 bg-gradient-to-b from-transparent to-gray-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Popular
              <span className="block text-gradient">Workflows</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Discover the most effective ways to combine AI models for amazing results
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {workflowExamples.map((example, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-effect rounded-2xl p-8 hover:bg-white/10 transition-all duration-500"
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <h3 className="text-2xl font-bold text-white mb-4">{example.title}</h3>
                <p className="text-gray-400 mb-6 leading-relaxed">{example.description}</p>
                <div className="space-y-3">
                  {example.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex items-center text-gray-300">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black text-sm font-bold mr-4">
                        {stepIndex + 1}
                      </div>
                      {step}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-8">
              Ready to
              <span className="block text-gradient">Create?</span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of creators who are already building amazing AI workflows.
              Start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <motion.button
                onClick={handleGetStarted}
                className="btn-primary group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center">
                  Start Creating Now
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              </motion.button>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link
                  to="/login"
                  className="btn-secondary inline-flex items-center"
                >
                  Already have an account?
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;