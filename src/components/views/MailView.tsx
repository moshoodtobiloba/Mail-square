import { useState, useEffect } from 'react';
import { 
  Menu, Search, Settings, HelpCircle, LayoutGrid, 
  Inbox, Star, Clock, Send, File, Archive, Trash2, 
  MoreVertical, ChevronLeft, ChevronRight, CornerUpLeft, 
  CornerUpRight, Smile, Plus, X, Maximize2, Minimize2, Paperclip, CheckSquare, List, Tag, Users, Info, MessageSquare, AlertOctagon, Bookmark, Calendar, Send as SendIcon, Upload, Trash, Mail, Zap
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const MOCK_EMAILS: any[] = [];

import { useAuth } from '../../lib/AuthContext';

export default function MailView() {
  const { user, signIn } = useAuth();
  const [activeLabel, setActiveLabel] = useState('Primary');
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [inboxes, setInboxes] = useLocalStorage<{email: string, health: number, status: string, name: string}[]>('connected_inboxes', []);
  const [activeAccountIndex, setActiveAccountIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initialize inboxes with the currently logged-in main Firebase user if empty
  useEffect(() => {
    if (inboxes.length === 0 && user) {
      setInboxes([{
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'My Account',
        health: 100,
        status: 'Strong'
      }]);
    }
  }, [user, inboxes.length]);

  // Aggressively purge "Test User" phantom accounts leftover from local storage testing
  useEffect(() => {
    const cleanedInboxes = inboxes.filter(i => !i.name.toLowerCase().includes('test user'));
    if (cleanedInboxes.length !== inboxes.length) {
      setInboxes(cleanedInboxes);
      if (activeAccountIndex >= cleanedInboxes.length) {
        setActiveAccountIndex(0);
      }
    }
  }, [inboxes, activeAccountIndex, setInboxes]);

  const activeAccount = inboxes[activeAccountIndex] || null;

  const [realEmails, setRealEmails] = useState<any[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch real Google emails if token is available
  useEffect(() => {
    const fetchEmails = async () => {
      const token = localStorage.getItem('gmail_access_token');
      if (!token || !activeAccount) return;
      
      setLoadingEmails(true);
      setApiError(null);
      try {
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=in:inbox`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("Gmail API Error Data:", errorData);
          if (res.status === 401 || (res.status === 403 && (errorData?.error?.message?.includes('invalid authentication credentials') || errorData?.error?.message?.includes('Token might be expired')))) {
             setApiError('SESSION_EXPIRED');
             return;
          }
          const detailedMessage = errorData?.error?.message || `Failed to fetch messages (${res.status}).`;
          throw new Error(detailedMessage);
        }
        
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          const detailPromises = data.messages.map(async (msg: any) => {
            const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
               headers: { Authorization: `Bearer ${token}` }
            });
            const detailData = await detailRes.json();
            
            const headers = detailData.payload?.headers || [];
            const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
            const senderRaw = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
            const sender = senderRaw.replace(/"/g, '').split('<')[0].trim();
            const initial = sender.charAt(0).toUpperCase();

            // Check if read
            const isRead = !detailData.labelIds?.includes('UNREAD');

            // Format date slightly better
            const dateObj = new Date(parseInt(detailData.internalDate));
            const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return {
              id: msg.id,
              sender: sender || 'Unknown',
              subject,
              snippet: detailData.snippet,
              time: timeString,
              read: isRead,
              label: 'Inbox',
              initial,
              color: 'bg-[#4285f4]',
              tags: []
            };
          });
          
          const emails = await Promise.all(detailPromises);
          setRealEmails(emails);
        } else {
          setRealEmails([]);
        }
      } catch (err: any) {
        console.error("Error loading emails via Gmail API:", err);
        setApiError(err.message);
      } finally {
        setLoadingEmails(false);
      }
    };
    
    fetchEmails();
  }, [activeAccount]);

  const activeEmailData = selectedEmail ? realEmails.find(e => e.id === selectedEmail) : null;

  const handleConnectGmail = () => {
    signIn(); // Call real sign-in for additional accounts instead of mock function
  };

  return (
    <div className="flex bg-white h-[calc(100vh-64px)] overflow-hidden relative border border-gray-200 rounded-xl shadow-sm">
      
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 flex-shrink-0 border-r border-gray-100 flex flex-col bg-[#f6f8fc] overflow-y-auto overflow-x-hidden hide-scrollbar`}>
        <div className="flex-1 py-4">
          <div className="px-3 space-y-0.5">
            {( [
              { icon: Inbox, id: 'All Inboxes', count: realEmails.length, activeColor: 'bg-[#d3e3fd]' },
              { icon: Inbox, id: 'Primary', count: realEmails.length },
              { icon: Tag, id: 'Promotions', count: 0 },
              { icon: Users, id: 'Social', count: 0 },
              { icon: Info, id: 'Updates', count: null },
              { icon: MessageSquare, id: 'Forums', count: null },
            ] as any[]).map(item => (
              <button 
                key={item.id}
                onClick={() => {
                  setActiveLabel(item.id); 
                  setSelectedEmail(null);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-full cursor-pointer transition-colors ${activeLabel === item.id ? item.activeColor || 'bg-[#d3e3fd] text-[#041e49]' : 'hover:bg-gray-100 text-[#444746]'}`}
              >
                <div className="flex items-center gap-4">
                  <item.icon className={`w-4 h-4 ${activeLabel === item.id ? 'fill-current' : ''}`} />
                  <span className={`text-sm ${activeLabel === item.id ? 'font-semibold' : 'font-medium'}`}>{item.id}</span>
                </div>
                {item.count && <span className="text-[10px] sm:text-xs font-medium">{item.count}</span>}
              </button>
            ))}

            <div className="pt-2 pb-1">
              <div className="mx-4 my-1 border-t border-gray-200"></div>
            </div>

            {( [
              { icon: Star, id: 'Starred', count: null },
              { icon: Clock, id: 'Snoozed', count: null },
              { icon: Bookmark, id: 'Important', count: 0 },
              { icon: Send, id: 'Sent', count: 0 },
              { icon: Calendar, id: 'Scheduled', count: 0 },
              { icon: Upload, id: 'Outbox', count: 0 },
              { icon: File, id: 'Drafts', count: 0 },
              { icon: Mail, id: 'All Mail', count: null },
              { icon: AlertOctagon, id: 'Spam', count: 0 },
              { icon: Trash2, id: 'Trash', count: 0 },
            ] as any[]).map(item => (
              <button 
                key={item.id}
                onClick={() => {
                  setActiveLabel(item.id); 
                  setSelectedEmail(null);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-full cursor-pointer transition-colors ${activeLabel === item.id ? item.activeColor || 'bg-[#d3e3fd] text-[#041e49]' : 'hover:bg-gray-100 text-[#444746]'}`}
              >
                <div className="flex items-center gap-4">
                  <item.icon className={`w-4 h-4 ${activeLabel === item.id ? 'fill-current' : ''}`} />
                  <span className={`text-sm ${activeLabel === item.id ? 'font-semibold' : 'font-medium'}`}>{item.id}</span>
                </div>
                {item.count && <span className="text-[10px] sm:text-xs font-medium">{item.count}</span>}
              </button>
            ))}
            
            <div className="pt-2 pb-1">
               <span className="px-4 text-[10px] uppercase font-bold tracking-wider text-gray-500">Sending & Automation</span>
            </div>
            
            {( [
              { icon: SendIcon, id: 'Sending Queue', count: 0 },
              { icon: Clock, id: 'Auto-Send Settings', count: null },
              { icon: LayoutGrid, id: 'Follow-up Overview', count: null },
            ] as any[]).map(item => (
              <button 
                key={item.id}
                onClick={() => {
                  setActiveLabel(item.id); 
                  setSelectedEmail(null);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-full cursor-pointer transition-colors ${activeLabel === item.id ? 'bg-[#c2e7ff] text-[#041e49]' : 'hover:bg-gray-100 text-[#444746]'}`}
              >
                <div className="flex items-center gap-4">
                  <item.icon className={`w-4 h-4 ${activeLabel === item.id ? 'fill-current' : ''}`} />
                  <span className={`text-sm ${activeLabel === item.id ? 'font-semibold' : 'font-medium'}`}>{item.id}</span>
                </div>
                {item.count && <span className="text-[10px] sm:text-xs font-medium">{item.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white shadow-inner">
        
        {/* Top Search Bar & Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white">
          <div className="flex items-center gap-2 flex-1">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-full cursor-pointer text-gray-500">
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="max-w-2xl w-full flex items-center bg-[#f0f4f9] px-4 py-2.5 rounded-full focus-within:bg-white focus-within:shadow-md transition-all border border-transparent focus-within:border-gray-200">
              <Search className="w-5 h-5 text-gray-500 mr-3" />
              <input 
                type="text" 
                placeholder="Search in mail" 
                className="w-full bg-transparent border-none focus:outline-none text-base text-gray-700" 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 pl-4">
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hidden sm:block"><HelpCircle className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hidden sm:block"><Settings className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hidden sm:block"><LayoutGrid className="w-5 h-5" /></button>
            
            {/* Account Switcher Button */}
            <div className="relative ml-2">
              <button onClick={() => setShowAccountSwitcher(!showAccountSwitcher)} className="w-8 h-8 rounded-full bg-blue-600 text-white font-medium flex items-center justify-center text-sm cursor-pointer hover:ring-2 hover:ring-blue-100 transition-all border border-gray-200">
                {activeAccount ? activeAccount.name.charAt(0).toUpperCase() : '?'}
              </button>
              
              {/* Account Switcher Dropdown */}
              {showAccountSwitcher && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  {activeAccount ? (
                    <div className="p-6 text-center border-b border-gray-100 bg-[#f8fbff]">
                      <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-medium flex items-center justify-center text-2xl mx-auto mb-3 shadow-inner">
                        {activeAccount.name.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="font-medium text-gray-900">Hi, {activeAccount.name}!</h3>
                      <p className="text-sm text-gray-500 mb-2 truncate">{activeAccount.email}</p>
                    </div>
                  ) : (
                    <div className="p-6 text-center border-b border-gray-100 bg-[#f8fbff]">
                       <h3 className="font-medium text-gray-900">No Account Connected</h3>
                       <p className="text-sm text-gray-500">Connect a Gmail account to view your inbox.</p>
                    </div>
                  )}
                  <div className="max-h-64 overflow-y-auto">
                    {inboxes.map((acc, i) => (
                      <div key={i} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group">
                        <button 
                          onClick={() => { setActiveAccountIndex(i); setShowAccountSwitcher(false); }}
                          className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shrink-0 font-medium">
                            {acc.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{acc.name}</p>
                            <p className="text-xs text-gray-500 truncate">{acc.email}</p>
                          </div>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const newInboxes = inboxes.filter((_, idx) => idx !== i);
                            setInboxes(newInboxes);
                            if (activeAccountIndex === i) {
                               setActiveAccountIndex(0);
                            } else if (activeAccountIndex > i) {
                               setActiveAccountIndex(activeAccountIndex - 1);
                            }
                          }}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Remove Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-gray-100 bg-gray-50 flex justify-center">
                    <button onClick={handleConnectGmail} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 p-2 cursor-pointer">
                      <Plus className="w-4 h-4" /> Add another account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Content Area */}
        <div className="flex-1 overflow-y-auto bg-white relative">
          
          {activeLabel === 'Sending Queue' ? (
            <div className="p-6">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Advanced Sending Queue</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertOctagon className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-800">Email Health Monitoring Active</h4>
                    <p className="text-xs text-amber-700 mt-1 max-w-2xl leading-relaxed">
                      Scale dynamically: Your sending accounts are being monitored in real-time. If health scores drop or limits are approached, 
                      outgoing emails will be automatically paused and rescheduled here to prevent bounces and domain blacklisting.
                    </p>
                  </div>
                </div>
              </div>
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 text-sm">Active Automations</h3>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full animate-pulse">Running</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    { email: 'john.doe@company.com', status: 'Sending', color: 'text-blue-600', bg: 'bg-blue-50', icon: SendIcon },
                    { email: 'abc1@123.com', status: 'Processing', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
                    { email: 'sarah.j@startup.io', status: 'Failed (Retry in 5m)', color: 'text-red-600', bg: 'bg-red-50', icon: AlertOctagon },
                    { email: 'mike.t@agency.co', status: 'Sent', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckSquare },
                  ].map((job, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-gray-900">{job.email}</span>
                        <span className="text-xs text-gray-500 mt-0.5">Campaign: Initial Outreach Mail</span>
                      </div>
                      <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 ${job.bg}`}>
                        <job.icon className={`w-3.5 h-3.5 ${job.color}`} />
                        <span className={`text-[11px] font-bold tracking-wide uppercase ${job.color}`}>{job.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : !activeAccount ? (
             <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-xl m-4 border-2 border-dashed border-gray-200">
               <Mail className="w-16 h-16 text-gray-300 mb-4" />
               <h3 className="text-xl font-medium text-gray-900 mb-2">No Gmail Connected</h3>
               <p className="text-gray-500 max-w-md mx-auto mb-6">Connect your Gmail account to get started with MailSquare and sync your inbox.</p>
               <button onClick={handleConnectGmail} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer shadow-sm">
                 Connect Gmail
               </button>
             </div>
          ) : !selectedEmail ? (
            // List View
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
                <div className="flex items-center gap-1">
                  <CheckSquare className="w-4 h-4 text-gray-400 m-2" />
                  <span className="text-sm font-medium text-gray-600 ml-2">{activeLabel}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {loadingEmails ? 'Loading...' : `1-${realEmails.length} of ${realEmails.length}`}
                </span>
              </div>
              
              {loadingEmails ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-8 h-8 relative mt-16 mb-4">
                     <div className="w-8 h-8 rounded-full border-4 border-[#e8f0fe] absolute"></div>
                     <div className="w-8 h-8 rounded-full border-4 border-[#0b57d0] border-t-transparent animate-spin absolute"></div>
                  </div>
                  <p className="text-gray-500 font-medium text-sm">Fetching Gmail Inbox...</p>
                </div>
              ) : apiError ? (
                <div className="flex flex-col items-center justify-center text-center p-6 m-4 bg-red-50 rounded-xl border border-red-100">
                  <AlertOctagon className="w-12 h-12 text-red-500 mb-4" />
                  
                  {apiError === 'SESSION_EXPIRED' ? (
                    <>
                      <h3 className="text-lg font-medium text-red-900 mb-2">Gmail Session Expired</h3>
                      <p className="text-sm text-red-700 max-w-2xl mb-6">
                        For your security, Google access tokens are temporary and expire after some time. Your secure session needs to be refreshed to continue viewing your emails.
                      </p>
                      <button 
                        onClick={() => signIn()} 
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center gap-2 mx-auto"
                      >
                        <Zap className="w-5 h-5" /> Refresh Gmail Access
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium text-red-900 mb-2">Gmail API Not Enabled</h3>
                      <p className="text-sm text-red-700 max-w-2xl mb-4">
                        Your Firebase project successfully authenticated you, but the Gmail API is currently turned off inside your Google Cloud Console for project <strong>mailsquare-9db8c</strong>.
                      </p>
                      <div className="bg-white p-4 rounded border border-red-200 text-left w-full max-w-lg shadow-sm">
                        <p className="text-sm font-medium text-gray-900 mb-2">Final step to go live:</p>
                        <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
                          <li>Ensure your Google OAuth App is set to "Testing" and you added your email to the "Test users" list.</li>
                          <li>Go to Google Cloud console, select project <code>mailsquare-9db8c</code>.</li>
                          <li>Search "Gmail API" and click <strong>Enable</strong>.</li>
                          <li>Wait exactly 1 minute, hit Sign Out below, then Sign In again.</li>
                        </ol>
                      </div>
                      <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg">
                        I have enabled it, Refresh
                      </button>
                    </>
                  )}
                </div>
              ) : ['Inbox', 'Primary', 'All Inboxes'].includes(activeLabel) && realEmails.length > 0 ? realEmails.map(email => (
                <div 
                  key={email.id} 
                  onClick={() => setSelectedEmail(email.id)}
                  className={`flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 cursor-pointer hover:shadow-md transition-shadow group relative ${!email.read ? 'bg-white' : 'bg-[#f2f6fc]/50'}`}
                >
                  <div className="flex items-center gap-3 w-48 shrink-0">
                    <div className={`w-8 h-8 rounded-full ${email.color} text-white flex items-center justify-center font-medium text-sm`}>
                      {email.initial}
                    </div>
                    <span className={`text-sm truncate w-full ${!email.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {email.sender}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pr-4 flex items-center">
                    <span className={`text-sm truncate block ${!email.read ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                      {email.subject} <span className="font-normal text-gray-500 mx-1">-</span> <span className="font-normal text-gray-500">{email.snippet}</span>
                    </span>
                    {email.tags && email.tags.map(tag => (
                      <span key={tag} className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">{tag}</span>
                    ))}
                  </div>
                  <div className="w-16 flex justify-end shrink-0">
                    <span className={`text-xs ${!email.read ? 'font-bold text-gray-900' : 'font-medium text-gray-500'}`}>{email.time}</span>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Inbox className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nothing to see here</h3>
                  <p className="text-gray-500 text-sm">Your {activeLabel.toLowerCase()} folder is empty.</p>
                </div>
              )}
            </div>
          ) : (
            // Detail View
            <div className="flex flex-col h-full bg-white animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4 p-3 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
                <button onClick={() => setSelectedEmail(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 cursor-pointer">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600 cursor-pointer"><Archive className="w-4 h-4" /></button>
                  <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
                <h2 className="text-2xl font-normal text-gray-900 mb-6 flex items-center justify-between">
                  {activeEmailData?.subject}
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">{activeEmailData?.label}</span>
                </h2>
                
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${activeEmailData?.color} text-white flex items-center justify-center font-medium`}>
                      {activeEmailData?.initial}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {activeEmailData?.sender} <span className="text-xs font-normal text-gray-500 font-mono ml-1">&lt;{activeEmailData?.sender.toLowerCase().replace(' ', '')}@example.com&gt;</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">to me <span className="mx-1">•</span> {activeEmailData?.time}</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 cursor-pointer">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="text-gray-800 text-sm leading-relaxed border-l-[3px] border-gray-200 pl-4 py-2 bg-gray-50/50 rounded-r-lg mb-8 font-mono">
                  {activeEmailData?.snippet}
                  <br/><br/>
                  Hi {activeAccount.name.split(' ')[0]},<br/><br/>
                  We are reaching out regarding the current status of your project. Please review the attached requirements and respond at your earliest convenience.<br/><br/>
                  Best Regards,<br/>
                  {activeEmailData?.sender} Team
                </div>

                <div className="flex items-center gap-3">
                  <button className="px-5 py-2.5 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer shadow-sm transition-colors">
                    <CornerUpLeft className="w-4 h-4" /> Reply
                  </button>
                  <button className="px-5 py-2.5 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer shadow-sm transition-colors">
                    <CornerUpRight className="w-4 h-4" /> Forward
                  </button>
                  <div className="relative group/emoji">
                    <button className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer shadow-sm transition-colors" title="React with emoji">
                      <Smile className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/emoji:flex items-center gap-1 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1 z-50">
                       <button className="hover:bg-gray-100 rounded-full p-1.5 cursor-pointer text-lg">👍</button>
                       <button className="hover:bg-gray-100 rounded-full p-1.5 cursor-pointer text-lg">❤️</button>
                       <button className="hover:bg-gray-100 rounded-full p-1.5 cursor-pointer text-lg">😂</button>
                       <button className="hover:bg-gray-100 rounded-full p-1.5 cursor-pointer text-lg">👏</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Compose Button */}
      <button 
        onClick={() => setIsComposeOpen(true)}
        className="absolute bottom-28 md:bottom-6 right-6 flex items-center justify-center gap-3 bg-[#c2e7ff] hover:bg-[#b0dcf5] text-[#001d35] px-5 py-4 rounded-[20px] font-medium transition-colors cursor-pointer shadow-lg hover:shadow-xl z-40 group"
      >
        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="text-[15px] pr-1">Compose</span>
      </button>

      {/* Compose Window (Manual Sending / Real Compose) */}
      {isComposeOpen && (
        <div className="absolute bottom-0 right-16 w-[500px] bg-white rounded-t-xl shadow-2xl border border-gray-200 flex flex-col z-50 animate-in slide-in-from-bottom-8 duration-200">
          <div className="bg-[#f2f6fc] px-4 py-2.5 rounded-t-xl flex items-center justify-between border-b border-gray-200 cursor-pointer">
            <span className="text-sm font-medium text-gray-700">New Message (Manual Sending)</span>
            <div className="flex items-center gap-1">
               <button className="p-1 hover:bg-gray-200 rounded text-gray-500"><Minimize2 className="w-4 h-4" /></button>
               <button className="p-1 hover:bg-gray-200 rounded text-gray-500"><Maximize2 className="w-4 h-4" /></button>
               <button onClick={() => setIsComposeOpen(false)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex-1 flex flex-col p-2">
            <input type="text" placeholder="To" className="px-4 py-2 border-b border-gray-100 text-sm focus:outline-none focus:border-gray-300 font-medium" />
            <input type="text" placeholder="Subject" className="px-4 py-2 border-b border-gray-100 text-sm focus:outline-none focus:border-gray-300 font-medium" />
            <textarea className="flex-1 w-full p-4 text-sm focus:outline-none min-h-[250px] resize-none" placeholder="Start typing..."></textarea>
          </div>
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
               <button className="bg-[#0b57d0] hover:bg-[#0842a0] text-white px-6 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer shadow-sm">
                 Send
               </button>
               <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 cursor-pointer"><Paperclip className="w-4 h-4" /></button>
               <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 cursor-pointer"><List className="w-4 h-4" /></button>
            </div>
            <button onClick={() => setIsComposeOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 cursor-pointer" title="Discard draft"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  )
}
