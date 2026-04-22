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
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 prose prose-blue max-w-none"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            Last updated: April 20, 2026
          </p>
          
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              Welcome to MailSquare ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your data when you use our unified mail dashboard.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Data Access & Gmail Integration</h2>
            <p className="text-gray-600 leading-relaxed">
              MailSquare uses Google OAuth and the Gmail API to provide its core services. Specifically:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
              <li><strong>Email Content:</strong> We access your Gmail messages to display them in our unified dashboard.</li>
              <li><strong>Send Permissions:</strong> If granted, we use the API to send emails on your behalf when you use the compose/reply features.</li>
              <li><strong>Isolation:</strong> Your email data is processed locally in your browser and is never stored on our external servers for longer than necessary to facilitate real-time updates.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Data Sharing</h2>
            <p className="text-gray-600 leading-relaxed">
              We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. Your data is used strictly to provide you with the MailSquare interface and functionality.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Google API Disclosure</h2>
            <p className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 text-blue-900 font-medium italic">
              MailSquare's use and transfer to any other app of information received from Google APIs will adhere to the Google API Service User Data Policy, including the Limited Use requirements.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at moshoodabdulmujibtobiloba@gmail.com.
            </p>
          </section>
        </motion.div>
      </main>

      <footer className="py-8 border-top border-gray-100 text-center text-gray-400 text-sm">
        &copy; 2026 MailSquare. All rights reserved.
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
