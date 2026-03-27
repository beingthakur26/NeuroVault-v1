import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BrainCircuit, Search, Share2, Sparkles, ChevronRight, Zap, Network } from 'lucide-react'

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="bg-indigo-500 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
          <BrainCircuit size={20} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">NeuroVault</span>
      </div>
      
      <div className="hidden md:flex space-x-8">
        <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Features</a>
        <a href="#how-it-works" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">How it Works</a>
        <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Documentation</a>
      </div>

      <div className="flex items-center space-x-4">
        <Link to="/sign-in" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Log in</Link>
        <Link to="/sign-up" className="px-4 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-gray-200 transition-transform hover:scale-105 shadow-xl shadow-white/5">
          Sign up
        </Link>
      </div>
    </div>
  </nav>
)

const FeatureCard = ({ icon: Icon, title, desc }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/5 hover:border-white/10 transition-colors group relative overflow-hidden shadow-xl shadow-black/50"
  >
    <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="mb-4 inline-block p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 transition-colors">
      <Icon size={24} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
    </div>
    <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">{title}</h3>
    <p className="text-gray-400 leading-relaxed text-sm">{desc}</p>
  </motion.div>
)

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 w-full h-px bg-linear-to-r from-transparent via-indigo-500/30 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold uppercase tracking-widest text-indigo-300 mb-8 inline-block shadow-lg shadow-indigo-500/10">
              Introducing NeuroVault v1.0
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-tight">
              A Second Brain <br/>
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400">
                Powered by AI
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Capture web pages, PDFs, and YouTube videos seamlessly with our extension. Let Mistral AI auto-summarize your data and explore concepts via interactive 3D Knowledge Graphs.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/sign-up" className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-transform hover:scale-105 flex items-center justify-center shadow-xl shadow-white/10">
                Start Building Your Brain <ChevronRight size={18} className="ml-2" />
              </Link>
              <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white font-medium rounded-full hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center">
                Explore Features
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 relative z-10 bg-[#050505] border-y border-white/5">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Everything you need to think better.</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-lg leading-relaxed">
              NeuroVault isn't just a bookmark manager. It's an intelligent semantic engine that natively understands context, meaning, and relationships across what you save.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Zap}
              title="Instant Extraction"
              desc="Save articles, YouTube transcripts, and PDFs with one click using our Chrome Extension. Raw data is scrubbed and cleaned."
            />
            <FeatureCard 
              icon={Sparkles}
              title="Mistral AI Summaries"
              desc="Heavy background queues process your saves, generating concise conceptual summaries and automatically detecting tags."
            />
            <FeatureCard 
              icon={Search}
              title="Semantic Vector Search"
              desc="Powered by Qdrant and Jina Embeddings. Search for concepts and meanings, not just exact keyword matches seamlessly."
            />
            <FeatureCard 
              icon={Network}
              title="3D Knowledge Graph"
              desc="Visualize the connections within your brain. See how semantic tags link thousands of documents together in a beautiful web."
            />
            <FeatureCard 
              icon={BrainCircuit}
              title="Automated Clusters"
              desc="Your dashboard automatically groups related documents out-of-the-box. Or, take control and build your own manual collections."
            />
            <FeatureCard 
              icon={Share2}
              title="Time-Decay Resurfacing"
              desc="Never lose a great read again. Our algorithm pulls forgotten, highly-relevant data points back to your dashboard naturally."
            />
          </div>
        </div>
      </section>

      {/* How it works simple section */}
      <section id="how-it-works" className="py-32 px-6 relative z-10">
         <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold tracking-tight mb-8">Ready to augment your memory?</h2>
            <p className="text-gray-400 mb-12 text-lg">
              NeuroVault's proprietary pipeline converts unstructured internet chaos into a beautifully organized, searchable knowledge base exclusively accessible on your private account securely.
            </p>
            <Link to="/sign-up" className="px-10 py-5 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-colors shadow-2xl shadow-indigo-500/20 text-lg">
              Create Your Free Account
            </Link>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 relative z-10 text-center bg-black">
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} NeuroVault Inc. Built for deep thinkers. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
