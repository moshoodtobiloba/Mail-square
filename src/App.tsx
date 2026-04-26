import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Zap, Settings, Mail as MailIcon, Bell, Trash2 } from 'lucide-react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import DashboardView from './components/views/DashboardView.tsx';
import LeadsView from './components/views/LeadsView.tsx';
import CampaignsView from './components/views/CampaignsView.tsx';
import SettingsView from './components/views/SettingsView.tsx';
import MailView from './components/views/MailView.tsx';
import LandingView from './components/views/LandingView.tsx';
import PrivacyPolicy from './pages/PrivacyPolicy.tsx';
import TermsOfService from './pages/TermsOfService.tsx';
import { useLocalStorage } from './hooks/useLocalStorage.ts';
import { useAuth } from './lib/AuthContext.tsx';
import { SplashScreen } from './components/ui/SplashScreen.tsx';
import { Logo, LogoText } from './components/ui/Logo.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('Mail');
  const { user, loading, logOut } = useAuth();
  const [notifications, setNotifications] = useLocalStorage('app_notifications', [] as any[]);
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Show splash for 2.5 seconds on first load
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        setIsServerHealthy(res.ok);
      } catch (e) {
        setIsServerHealthy(false);
      }
    };
    checkHealth();
  }, []);

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      const last = notifications[notifications.length - 1];
      if (document.hidden && Notification.permission === "granted") {
        new Notification(last.title, { body: last.desc });
      }
    }
  }, [notifications]);

  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  const tabs = [
    { id: 'Home', icon: LayoutDashboard, label: 'Home' },
    { id: 'Analytics', icon: Zap, label: 'Intelligence' }, // Renamed for better branding
    { id: 'Mail', icon: MailIcon, label: 'Inbox' },
    { id: 'Campaigns', icon: Zap, label: 'Sequences' },
    { id: 'Settings', icon: Settings, label: 'Settings' },
  ];

  const renderView = () => {
    switch (activeTab) {
      case 'Home': return <DashboardView />;
      case 'Analytics': return <LeadsView />;
      case 'Mail': return <MailView />;
      case 'Campaigns': return <CampaignsView />;
      case 'Settings': return <SettingsView />;
      default: return <MailView />;
    }
  };

  if (showSplash) {
    return <SplashScreen isVisible={showSplash} />;
  }

  if (loading) {
     return <div className="min-h-screen bg-white flex items-center justify-center font-sans">
       <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
     </div>
  }

  return (
    <Routes>
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="*" element={
        !user ? (
          <LandingView />
        ) : (
          <div className="h-[100dvh] flex flex-col lg:flex-row overflow-hidden bg-[#f8f9fa]">
            {/* Desktop Navigation Sidebar (Stable & Professional) */}
            <aside className="hidden lg:flex w-72 bg-white border-r border-gray-100 flex-col shrink-0 z-50">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                  <Logo size={28} />
                  <LogoText className="text-xl" />
                </div>
                
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 font-bold' 
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                        <span className="text-sm tracking-tight">{tab.label}</span>
                        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </button>
                    )
                  })}
                </nav>
              </div>

              <div className="mt-auto p-6 space-y-4">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Network Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isServerHealthy === false ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                    <span className="text-xs font-bold text-gray-600">
                      {isServerHealthy === false ? 'Relay Disconnected' : 'Enterprise Relay Active'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-2">
                   <div tabIndex={0} className="w-10 h-10 rounded-xl bg-gray-900 text-white font-bold flex items-center justify-center text-sm shadow-lg cursor-pointer hover:ring-4 hover:ring-blue-50 group relative outline-none transition-all">
                      {user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
                      
                      <div className="hidden group-focus:block absolute left-0 bottom-full mb-3 w-64 bg-white border border-gray-100 shadow-2xl rounded-2xl p-2 text-left z-50 cursor-default animate-in slide-in-from-bottom-2 duration-300">
                         <div className="px-4 py-3 border-b border-gray-50 mb-1 pointer-events-none">
                            <p className="font-bold text-gray-900 text-sm">{user.displayName || 'App User'}</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                         </div>
                         <button onClick={() => setActiveTab('Settings')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer font-medium">
                            Account Settings
                         </button>
                         <button 
                            onClick={logOut}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer mt-1 font-bold"
                         >
                            Sign Out
                         </button>
                      </div>
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{user.displayName || 'Relay User'}</p>
                      <button onClick={logOut} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors">Disconnect</button>
                   </div>
                </div>
              </div>
            </aside>

            {/* Main Application Container */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Top Header (Visible on ALL views) */}
              <header className="h-16 sm:h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 shrink-0 z-40">
                <div className="flex items-center gap-4 lg:hidden">
                   <Logo size={24} />
                   <LogoText className="text-lg" />
                </div>
                
                <div className="hidden lg:flex items-center gap-2">
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Workspace / </span>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">{activeTab}</span>
                </div>

                <div className="flex items-center gap-3 sm:gap-6">
                  {/* Global Search Interface (Centered feel) */}
                  <div className="hidden md:flex items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 w-80 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-200 transition-all">
                    <MailIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <input type="text" placeholder="Search entire reach..." className="bg-transparent border-none outline-none text-sm font-medium w-full text-gray-600" />
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4">
                    <button 
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                      className="p-2 sm:p-3 text-gray-500 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer outline-none relative hover:text-blue-600" 
                      title="Notifications"
                    >
                      <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                      {notifications.length > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white animate-pulse"></span>
                      )}
                    </button>
                    
                    {/* Mobile Profile Trigger */}
                    <div tabIndex={0} className="lg:hidden w-8 h-8 rounded-xl bg-gray-900 text-white font-bold flex items-center justify-center text-xs shadow-lg cursor-pointer group relative outline-none">
                      {user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
                      <div className="hidden group-focus:block absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 shadow-2xl rounded-2xl p-2 text-left z-50">
                         <div className="px-4 py-3 border-b border-gray-50 mb-1">
                            <p className="font-bold text-gray-900 text-sm">{user.displayName || 'App User'}</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                         </div>
                         <button 
                            onClick={logOut}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 font-bold"
                         >
                            Sign Out
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              {/* View Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto bg-white sm:bg-[#fcfdfe]">
                <div className="max-w-[1440px] mx-auto p-4 sm:p-8 min-h-full flex flex-col">
                  <div className="flex-1 pb-32 lg:pb-12">
                    {renderView()}
                  </div>
                  
                  {/* App Footer In-View */}
                  <footer className="mt-auto pt-12 pb-32 sm:pb-8 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col gap-1 items-center sm:items-start text-center sm:text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <Logo size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">MailSquare Enterprise</span>
                      </div>
                      <p className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter leading-none">Security Verified Precision Outreach Infrastructure</p>
                      <p className="text-[8px] font-medium text-gray-300 uppercase tracking-[0.2em] mt-1">&copy; 2026 Unified Intelligence Systems</p>
                    </div>
                    <div className="flex items-center gap-8">
                       <Link to="/privacy" className="text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Privacy Policy</Link>
                       <Link to="/terms" className="text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Terms of Service</Link>
                       <a href="mailto:moshoodabdulmujib9@gmail.com" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:opacity-70 transition-all">Verification Center</a>
                    </div>
                  </footer>
                </div>
              </div>

              {/* Floating Bottom Navigation (Mobile Only - Overhauled) */}
              <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:hidden bg-gray-900/95 backdrop-blur-xl rounded-[2rem] px-3 py-2 flex items-center gap-1 z-[60] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 max-w-[95vw]">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-blue-600 text-white scale-110 shadow-lg' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                      <span className="text-[8px] font-black uppercase tracking-widest">{tab.id === 'Analytics' ? 'Lead' : tab.id}</span>
                    </button>
                  )
                })}
              </nav>

              {/* Push System Overlay (Global for errors/notifs) */}
              <AnimatePresence>
                {isNotifOpen && (
                  <>
                     <motion.div 
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                       className="fixed inset-0 z-50 bg-black/5 backdrop-blur-[2px]" 
                       onClick={() => setIsNotifOpen(false)}
                     />
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.95, y: 10 }}
                       animate={{ opacity: 1, scale: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.95, y: 10 }}
                       className="fixed top-20 right-4 sm:right-8 w-full max-w-[420px] bg-white border border-gray-100 shadow-2xl rounded-3xl z-[60] overflow-hidden"
                     >
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                           <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest">Global Intelligence Feed</h3>
                           <button onClick={() => setNotifications([])} className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider underline">Clear Feed</button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-50 bg-white">
                           {notifications.length === 0 ? (
                             <div className="p-16 text-center">
                               <Bell className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No active interceptions</p>
                             </div>
                           ) : (
                             notifications.map(n => (
                               <div key={n.id} className="flex items-start gap-4 p-5 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { setActiveTab(n.link); setIsNotifOpen(false); }}>
                                 <div className={`w-3 h-3 mt-1 rounded-full shrink-0 ${n.type === 'alert' ? 'bg-amber-400' : 'bg-blue-500'} shadow-sm shadow-current`}></div>
                                 <div className="flex-1">
                                   <p className="text-sm font-black text-gray-900 leading-tight uppercase tracking-tight">{n.title}</p>
                                   <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">{n.desc}</p>
                                 </div>
                               </div>
                             ))
                           )}
                        </div>
                     </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        )
      } />
    </Routes>
  );
}
