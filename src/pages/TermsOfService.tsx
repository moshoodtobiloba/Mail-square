import React from 'react';
import { motion } from 'motion/react';
import { Logo, LogoText } from '../components/ui/Logo';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfService: React.FC = () => {
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
              <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Legal Agreement</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight uppercase italic">Terms of Service</h1>
            <div className="flex items-center gap-4 text-sm font-bold text-gray-400 uppercase tracking-widest">
              <span>Version 1.2.0</span>
              <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
              <span>Effective April 24, 2026</span>
            </div>
          </div>
          
          <div className="space-y-12">
            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-3">
                <span className="text-blue-600">01.</span> Agreement to Terms
              </h2>
              <p className="text-gray-600 leading-relaxed font-medium">
                These Terms of Service constitute a legally binding agreement made between you and MailSquare ("we," "us," or "our"). By accessing or using our unified dashboard interface, you agree that you have read, understood, and agreed to be bound by all of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-3">
                <span className="text-blue-600">02.</span> Scope of Service
              </h2>
              <p className="text-gray-600 leading-relaxed font-medium">
                MailSquare provides a cloud-native unified dashboard for managing multiple Google Mail (Gmail) accounts. We facilitate synchronization and interaction with your email data via the Gmail API. We do not provide email hosting services; we provide the interface and synchronization infrastructure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-3">
                <span className="text-blue-600">03.</span> User Accountability
              </h2>
              <p className="text-gray-600 leading-relaxed font-medium">
                You are strictly responsible for maintaining the security of your Google account credentials. MailSquare uses OAuth tokens for access; we never store your Google password. You must notify us immediately of any unauthorized use of your MailSquare instance.
              </p>
            </section>

            <section className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
              <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-3">
                <span className="text-blue-600">04.</span> Acceptable Use Policy
              </h2>
              <ul className="space-y-4">
                {[
                  "No automated scraping or bulk harvesting of data.",
                  "Compliance with Google's Anti-Spam algorithms and policies.",
                  "No reverse-engineering of the synchronization protocols.",
                  "Strict adherence to international data privacy laws."
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <div className="mt-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></div>
                    <span className="text-sm text-gray-600 font-bold uppercase tracking-tight">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-3">
                <span className="text-blue-600">05.</span> Intellectual Property Rights
              </h2>
              <p className="text-gray-600 leading-relaxed font-medium">
                Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, and website designs are owned or controlled by us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-3">
                <span className="text-blue-600">06.</span> Limitation of Warranties
              </h2>
              <p className="text-gray-400 leading-relaxed font-bold italic border-l-4 border-gray-200 pl-6">
                THE SERVICE IS PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICE AND OUR SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES.
              </p>
            </section>

            <section className="pt-8 border-t border-gray-100">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h2 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Legal Correspondence</h2>
                  <p className="text-gray-500 font-medium tracking-tight">Formal legal notices should be directed to our compliance team.</p>
                </div>
                <a 
                  href="mailto:moshoodabdulmujib9@gmail.com" 
                  className="px-8 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-gray-200"
                >
                  Contact Legal Team
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

export default TermsOfService;
