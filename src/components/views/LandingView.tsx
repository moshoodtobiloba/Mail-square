import { Mail, Zap, Shield, ArrowRight, Users } from 'lucide-react';
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
        <div className="flex items-center gap-8">
          <Link to="/privacy" className="hidden md:block text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hidden md:block text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Terms of Service</Link>
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
      
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gray-900 rounded-[3rem] p-12 md:p-20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
            <div className="relative z-10 max-w-2xl">
              <span className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-6 block">Security Architecture</span>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tighter italic uppercase">Engineered for Privacy.</h2>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10">
                    <Zap className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-tight">Direct API Integration</h3>
                    <p className="text-gray-400 leading-relaxed font-medium">MailSquare communicates directly with Google APIs. Your email content is processed in your local browser session and is never stored on our servers.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10">
                    <Users className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-tight">Limited Use Compliance</h3>
                    <p className="text-gray-400 leading-relaxed font-medium">We strictly adhere to Google's Limited Use requirements. We do not use your data for advertising, market research, or any purpose outside of the unified dashboard functionality.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-gray-100 bg-[#fcfdfe]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col gap-2">
             <div className="flex items-center gap-2 justify-center md:justify-start">
               <Logo size={20} />
               <span className="font-black text-gray-900 tracking-tighter uppercase text-sm">MailSquare</span>
             </div>
             <p className="text-xs text-gray-400 font-medium tracking-tight">&copy; {new Date().getFullYear()} Precision Outreach Infrastructure. All protocols verified.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <Link to="/privacy" className="text-xs font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-xs font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Terms of Service</Link>
            <a href="mailto:moshoodabdulmujib9@gmail.com" className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

