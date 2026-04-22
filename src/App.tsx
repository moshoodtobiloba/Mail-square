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

  const tabs = [
    { id: 'Home', icon: LayoutDashboard, label: 'Overview' },
    { id: 'Analytics', icon: Zap, label: 'Analytics' },
    { id: 'Mail', icon: MailIcon, label: 'Mail' },
    { id: 'Campaigns', icon: Zap, label: 'Campaign Sequences' },
    { id: 'Settings', icon: Settings, label: 'Settings' },
  ];

  const renderView = () => {
    switch (activeTab) {
      case 'Home': return <DashboardView />;
      case 'Analytics': return <LeadsView />; // Temporarily remapping while refactoring
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
            <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 shrink-0 z-50">
              <div className="flex items-center gap-3">
                <Logo size={28} />
                <LogoText className="text-lg" />
              </div>
              
              <div className="flex items-center gap-3 relative">
                   <div tabIndex={0} role="button" className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors cursor-pointer group outline-none" title="Notifications">
                     <Bell className="w-5 h-5" />
                     {notifications.length > 0 && (
                       <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                     )}
                     
                     {/* Notification Dropdown */}
                     <div className="hidden group-focus:block absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 shadow-xl rounded-xl p-4 text-left z-50 cursor-default">
                        <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-2">Notifications</h3>
                        {notifications.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No new notifications</p>
                        ) : (
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                             {notifications.map(n => (
                               <div key={n.id} className="flex items-start gap-3 group/notif">
                                 <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.type === 'alert' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                 <div 
                                   className="flex-1 cursor-pointer"
                                   onClick={() => setActiveTab(n.link)}
                                 >
                                   <p className="text-sm font-medium text-gray-900 hover:underline">{n.title}</p>
                                   <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                                 </div>
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setNotifications(notifications.filter(x => x.id !== n.id));
                                   }}
                                   className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover/notif:opacity-100 transition-opacity rounded cursor-pointer"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               </div>
                             ))}
                          </div>
                        )}
                     </div>
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
            <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-4 lg:top-1/2 lg:-translate-y-1/2 lg:bottom-auto bg-gray-100 lg:bg-[#eff3fa]  rounded-full px-2 py-2 flex lg:flex-col gap-2 z-50 overflow-x-auto min-w-[320px] max-w-[95vw] shadow-md hide-scrollbar lg:shadow-none lg:max-w-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center justify-center flex-1 min-w-[64px] lg:min-w-0 lg:w-20 h-14 lg:h-20 rounded-2xl transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? 'text-[#001d35]' 
                        : 'text-[#444746] hover:text-gray-900 lg:hover:bg-gray-200/50'
                    }`}
                  >
                    <div className={`w-12 h-7 lg:w-14 lg:h-8 rounded-full flex items-center justify-center mb-1 transition-colors ${isActive ? 'bg-[#c2e7ff]' : 'hover:bg-gray-200/50'}`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'fill-[#c2e7ff] text-[#001d35]' : ''}`} />
                    </div>
                    <span className={`text-[10px] lg:text-[11px] font-medium tracking-tight px-1 text-center truncate w-full ${isActive ? 'font-bold' : ''}`}>
                      {tab.label}
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
