import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Zap, Settings, Mail as MailIcon, Bell, Trash2 } from 'lucide-react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
    { id: 'Analytics', icon: Zap, label: 'Leads' },
    { id: 'Mail', icon: MailIcon, label: 'Mail' },
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
          <div className="h-[100dvh] flex flex-col overflow-hidden bg-white">
            {/* Top Application Header (Minimal, with Notification Bell) */}
            <header className="h-14 sm:h-16 bg-white border-b border-gray-100 flex items-center justify-between px-3 sm:px-6 shrink-0 z-50">
              <div className="flex items-center gap-2 sm:gap-3">
                <Logo size={24} />
                <LogoText className="text-base sm:text-xl" />
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4 relative">
                   <div className="relative flex items-center">
                     <button 
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                      className="p-1.5 sm:p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors cursor-pointer outline-none relative" 
                      title="Notifications"
                     >
                       <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                       {notifications.length > 0 && (
                         <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                       )}
                     </button>
                     
                     {/* Notification Dropdown */}
                     {isNotifOpen && (
                       <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
                        <div className="absolute right-0 top-full mt-2 w-72 sm:w-96 bg-white border border-gray-100 shadow-2xl rounded-2xl p-0 text-left z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                               <h3 className="font-bold text-gray-900 text-sm">Activity Feed</h3>
                               <button 
                                 onClick={() => setNotifications([])}
                                 className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider"
                               >
                                 Clear All
                               </button>
                            </div>
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center">
                                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                <p className="text-xs text-gray-500">All caught up! No notifications.</p>
                              </div>
                            ) : (
                              <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-50">
                                 {notifications.map(n => (
                                   <div 
                                     key={n.id} 
                                     className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors group/notif"
                                     onClick={() => {
                                       setActiveTab(n.link);
                                       setIsNotifOpen(false);
                                     }}
                                   >
                                     <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.type === 'alert' ? 'bg-amber-500' : 'bg-blue-500'} shadow`}></div>
                                     <div className="flex-1 cursor-pointer">
                                       <p className="text-sm font-bold text-gray-900 leading-tight">{n.title}</p>
                                       <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.desc}</p>
                                     </div>
                                     <button 
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         setNotifications(notifications.filter(x => x.id !== n.id));
                                       }}
                                       className="text-gray-300 hover:text-red-500 p-1 rounded transition-colors"
                                     >
                                       <Trash2 className="w-4 h-4" />
                                     </button>
                                   </div>
                                 ))}
                              </div>
                            )}
                        </div>
                       </>
                     )}
                   </div>
                 
                 {/* Profile Picture & Menu Dropdown */}
                 <div tabIndex={0} className="w-8 h-8 rounded-full bg-blue-600 text-white font-medium flex items-center justify-center text-sm shadow-inner cursor-pointer hover:ring-2 hover:ring-blue-100 group relative outline-none">
                    {user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
                    
                    <div className="hidden group-focus:block absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 shadow-xl rounded-xl p-2 text-left z-50 cursor-default">
                       <div className="px-4 py-3 border-b border-gray-50 mb-1 pointer-events-none">
                          <p className="font-medium text-gray-900 text-sm">{user.displayName || 'App User'}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                       </div>
                       <button onClick={() => setActiveTab('Settings')} onMouseDown={(e) => { e.preventDefault(); setActiveTab('Settings'); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                          Account Settings
                       </button>
                       <button 
                          onClick={logOut}
                          onMouseDown={(e) => { e.preventDefault(); logOut(); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer mt-1"
                       >
                          Sign Out
                       </button>
                    </div>
                 </div>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto w-full max-w-[1600px] mx-auto pb-24 lg:pb-0 lg:pl-[104px] bg-white p-2 sm:p-4">
              <div className="h-full mt-2">
                {renderView()}
              </div>
            </main>

            {/* Floating Bottom Navigation (Mobile) / Side Pill (Desktop) inspired by Google Photos */}
            <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-4 lg:top-1/2 lg:-translate-y-1/2 lg:bottom-auto bg-gray-900/90 backdrop-blur-md lg:bg-[#eff3fa] rounded-full px-2 py-2 flex lg:flex-col gap-2 z-50 overflow-x-auto min-w-[320px] max-w-[95vw] shadow-2xl hide-scrollbar lg:shadow-none lg:max-w-none border border-white/10 lg:border-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 px-3 lg:px-6 py-2 lg:py-3 rounded-full transition-all duration-300 group ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg scale-105' 
                        : 'text-gray-400 hover:text-gray-100 lg:text-gray-500 lg:hover:text-blue-600 lg:hover:bg-blue-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                    <span className={`text-[10px] lg:text-sm font-bold uppercase tracking-tighter lg:tracking-widest lg:capitalize ${isActive ? 'opacity-100' : 'opacity-70 lg:opacity-100'}`}>
                      {tab.id}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>
        )
      } />
    </Routes>
  );
}
