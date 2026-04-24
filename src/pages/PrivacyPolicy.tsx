import React from 'react';
import { motion } from 'motion/react';
import { Logo, LogoText } from '../components/ui/Logo';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <LogoText className="text-lg" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] border border-gray-100 p-8 md:p-16 max-w-none"
        >
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Logo size={20} />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Compliance & Trust</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight uppercase italic">Privacy Policy</h1>
            <div className="flex items-center gap-4 text-sm font-bold text-gray-400 uppercase tracking-widest">
              <span>Version 1.2.0</span>
              <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
              <span>Updated April 24, 2026</span>
            </div>
          </div>
          
          <div className="space-y-12">
            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-3">
                <span className="text-blue-600">01.</span> Commitment to Privacy
              </h2>
              <p className="text-gray-600 leading-relaxed font-medium">
                At MailSquare ("we," "our," or "us"), privacy is not a feature—it is our core infrastructure. We are committed to protecting your personal information and your right to privacy. This policy dictates our strict protocols for data collection and security.
              </p>
            </section>

            <section className="bg-blue-50/50 rounded-3xl p-8 border border-blue-100/50">
              <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-3">
                <span className="text-blue-600">02.</span> Google API Disclosure
              </h2>
              <div className="space-y-4">
                <p className="text-gray-900 font-bold leading-relaxed">
                  MailSquare's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-600 underline" target="_blank">Google API Service User Data Policy</a>, including the Limited Use requirements.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  We strictly comply with Google's requirements for handling sensitive OAuth scopes. Your data is restricted to providing you with the unified dashboard interface and is never shared for advertising or unauthorized purposes.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-3">
                <span className="text-blue-600">03.</span> Data Governance & Gmail Integration
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-3">Email Synchronization</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">We access message metadata and content via Gmail API to facilitate real-time synchronization across your connected accounts.</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-3">Transmission Protocols</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">Outbound communications are processed strictly upon user initiation using authenticated OAuth tokens.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-3">
                <span className="text-blue-600">04.</span> Information Security
              </h2>
              <p className="text-gray-600 leading-relaxed font-medium">
                We implement industry-standard encryption for data in transit and at rest. Access to your data is strictly limited to automated processes required to serve the application interface.
              </p>
            </section>

            <section className="pt-8 border-t border-gray-100">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h2 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Contact Information</h2>
                  <p className="text-gray-500 font-medium tracking-tight">Direct all legal and privacy inquiries to our data protection officer.</p>
                </div>
                <a 
                  href="mailto:moshoodabdulmujib9@gmail.com" 
                  className="px-8 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-gray-200"
                >
                  Contact Data Officer
                </a>
              </div>
            </section>
          </div>
        </motion.div>
      </main>

      <footer className="py-8 border-top border-gray-100 text-center text-gray-400 text-sm">
        &copy; 2026 MailSquare. All rights reserved.
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
