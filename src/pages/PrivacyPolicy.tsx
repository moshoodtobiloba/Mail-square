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
                <span className="text-blue-600">01.</span> Data Collection & Usage
              </h2>
              <div className="space-y-4">
                <p className="text-gray-600 leading-relaxed font-medium">
                  At MailSquare ("we," "our," or "us"), we collect personal information that you provide to us, including your name, email address, and profile information obtained through Google OAuth.
                </p>
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-3">How We Use Your Data</h3>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-2 font-medium">
                    <li>To provide and maintain our service interface.</li>
                    <li>To synchronize your Gmail messages for display in your unified dashboard.</li>
                    <li>To allow you to send and manage emails directly from the MailSquare platform.</li>
                    <li>To notify you about changes to our application.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-blue-50/50 rounded-3xl p-8 border border-blue-100/50">
              <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-3">
                <span className="text-blue-600">02.</span> Google API Disclosure & Limited Use
              </h2>
              <div className="space-y-4">
                <p className="text-gray-900 font-bold leading-relaxed">
                  MailSquare's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-600 underline" target="_blank">Google API Service User Data Policy</a>, including the Limited Use requirements.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  We use Gmail API data strictly to provide user-facing features (reading/sending emails as initiated by the user). We do NOT transfer this data to third parties, especially for advertising, data brokers, or any uses prohibited by Google’s policies.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-3">
                <span className="text-blue-600">03.</span> Data Sharing, Retention & Deletion
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-3">No Data Sharing</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">We do not sell, rent, or trade your data. We do not share your Google user data with third parties unless required by law.</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-3">Retention & Deletion</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">We retain your data only for as long as your account is active. You may request data deletion at any time by contacting us, and we will purge all stored tokens and metadata within 30 days.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-3">
                <span className="text-blue-600">04.</span> Information Security
              </h2>
              <p className="text-gray-600 leading-relaxed font-medium">
                We implement industry-standard encryption (SSL/TLS) to protect your data during transmission. Your Google OAuth tokens are stored securely in an encrypted database (Firebase Firestore) to ensure only you have access to your synced content.
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
