import { Mail, Zap, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { Logo, LogoText } from '../ui/Logo';
import { Link } from 'react-router-dom';

export default function LandingView() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="h-16 flex items-center justify-between px-6 lg:px-12 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Logo size={32} />
          <LogoText className="text-xl" />
        </div>
        <div>
          <button 
            onClick={signIn}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all shadow-sm cursor-pointer"
          >
            Sign In / Join Now
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center text-center px-6 py-20 lg:py-32 bg-gradient-to-b from-white to-[#f8fbff]">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-5xl lg:text-6xl font-semibold tracking-tight text-gray-900 leading-[1.1]">
            Scale your outreach <br className="hidden md:block" /> with maximum deliverability.
          </h2>
          <p className="text-lg lg:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            MailSquare connects all of your Gmail inboxes into one unified smart-queue. Protect your domain health while automating sophisticated, personalized campaign sequences at scale.
          </p>
          
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={signIn}
              className="w-full sm:w-auto px-8 py-3.5 bg-gray-900 hover:bg-black text-white rounded-full font-medium text-lg flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer hover:shadow-xl"
            >
              Sign in to Dashboard <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto text-left">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Unlimited Inboxes</h3>
            <p className="text-gray-500 leading-relaxed">Connect as many Gmail workspaces as you need. Our system cycles through them to maintain sender reputation and volume.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Health Monitoring</h3>
            <p className="text-gray-500 leading-relaxed">Advanced algorithms constantly ping your inbox health. If a domain dips, sending pauses automatically.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Smart Sequences</h3>
            <p className="text-gray-500 leading-relaxed">Build intelligent follow-up tracks that automatically stop when a prospect replies, with instant variable parsing.</p>
          </div>
        </div>
      </main>
      
      <footer className="py-8 text-center border-t border-gray-100 bg-white">
        <div className="flex justify-center gap-6 mb-4">
          <Link to="/privacy" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">Terms of Service</Link>
        </div>
        <p className="text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} MailSquare. Built for advanced volume.
        </p>
      </footer>
    </div>
  )
}

