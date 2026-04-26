import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAuth } from '../../lib/AuthContext';
import { AlertTriangle, Trash2, Bell, BellOff, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

export default function SettingsView() {
  const [dailyLimit, setDailyLimit] = useLocalStorage('settings_daily_limit', 250);
  const [smartNames, setSmartNames] = useLocalStorage('settings_smart_names', true);
  const [strictHealth, setStrictHealth] = useLocalStorage('settings_strict_health', true);
  const [autoRouting, setAutoRouting] = useLocalStorage('settings_auto_routing', true);
  const { logOut } = useAuth();
  const { token, requestPermission, error: notificationError } = useNotifications();
  
  const handleWipeData = async () => {
    if (window.confirm("Are you sure you want to delete all your account data? This action is irreversible.")) {
       localStorage.clear();
       await logOut();
       window.location.reload();
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset all algorithm preferences to factory defaults? Your connected accounts will remain active.")) {
      setDailyLimit(250);
      setSmartNames(true);
      setStrictHealth(true);
      setAutoRouting(true);
      alert("Settings reset to defaults.");
    }
  };

  const [customName, setCustomName] = useLocalStorage('profile_custom_name', '');
  const [customPhoto, setCustomPhoto] = useLocalStorage('profile_custom_photo', '');
  const [inboxes, setInboxes] = useLocalStorage<{email: string, health: number, status: string, name: string, photoURL?: string}[]>('connected_inboxes', []);
  const { signIn } = useAuth();

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight">Global Settings</h2>
          <p className="text-gray-500 mt-1">Manage behaviors, templates, and algorithms for MailSquare.</p>
        </div>
        <button 
          onClick={handleResetDefaults}
          className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Reset Defaults
        </button>
      </div>

      <div className="utility-card p-8">
        <h3 className="text-lg font-medium border-b border-gray-100 pb-4 mb-6 flex items-center justify-between">
          Connected Gmail Accounts
          <button 
            onClick={signIn}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Add Account
          </button>
        </h3>
        <div className="space-y-4">
          {inboxes.length === 0 ? (
            <p className="text-sm text-gray-500 italic p-4 text-center bg-gray-50 rounded-xl">No accounts connected yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {inboxes.map((acc, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold overflow-hidden border border-blue-100 shrink-0">
                      {acc.photoURL ? <img src={acc.photoURL} alt="" className="w-full h-full object-cover" /> : acc.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{acc.name}</p>
                      <p className="text-xs text-gray-500">{acc.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${acc.health > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {acc.status} ({acc.health}%)
                      </p>
                      <div className="w-24 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div className={`h-full ${acc.health > 80 ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${acc.health}%` }}></div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (window.confirm(`Disconnect ${acc.email}?`)) {
                          setInboxes(inboxes.filter((_, idx) => idx !== i));
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      title="Remove Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="utility-card p-8">
        <h3 className="text-lg font-medium border-b border-gray-100 pb-4 mb-6">My Profile (Local Customization)</h3>
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
              {customPhoto ? <img src={customPhoto} alt="Avatar" className="w-full h-full object-cover" /> : <Trash2 className="w-8 h-8 text-gray-300" />}
            </div>
            <div className="flex-1 space-y-3">
               <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Custom Name</label>
                 <input 
                   type="text" 
                   value={customName} 
                   onChange={e => setCustomName(e.target.value)} 
                   placeholder="Overwrites Google Display Name"
                   className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                 />
               </div>
               <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Profile Photo URL</label>
                 <input 
                   type="text" 
                   value={customPhoto} 
                   onChange={e => setCustomPhoto(e.target.value)} 
                   placeholder="Direct image URL (e.g. from Unsplash or Imgur)"
                   className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                 />
               </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 italic italic">Note: These changes only affect how you appear inside the MailSquare dashboard. Recipients will still see your official Google profile information when receiving emails.</p>
        </div>
      </div>

      <div className="utility-card p-8 bg-blue-50/30 border-blue-100">
        <h3 className="text-lg font-medium border-b border-blue-100 pb-4 mb-6 text-blue-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-blue-500" />
          How Auto-Send Works
        </h3>
        <div className="space-y-4 text-sm text-blue-800 leading-relaxed">
          <p>
            MailSquare uses a <strong>Staggered Sending Algorithm</strong> to protect your Gmail reputation:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Randomized Intervals:</strong> Emails are sent with a "human delay" of 45-120 seconds between each message.</li>
            <li><strong>Warm-Up Mode:</strong> For new accounts, we start by sending only 5-10 emails/day and progressively increase to your Daily Limit over 2 weeks.</li>
            <li><strong>Health Blocking:</strong> If the API detects a "Message Rejected" error or high spam filtering, all automated sending is paused for 24 hours to let the domain "cool down".</li>
          </ul>
        </div>
      </div>

      <div className="utility-card p-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Real-time Push Notifications
          </h3>
          {token ? (
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
              Disabled
            </span>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-tight">Stay alerts on replies</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Get notified instantly when you receive a reply to your campaign or a new high-priority message arrives in your synchronized inboxes.
            </p>
            {notificationError && (
              <p className="mt-2 text-xs text-red-500 font-medium">Error: {notificationError.message}</p>
            )}
          </div>
          <div className="shrink-0">
            <button
              onClick={requestPermission}
              disabled={!!token}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                token 
                ? 'bg-emerald-50 text-emerald-600 cursor-default' 
                : 'bg-gray-900 text-white hover:bg-blue-600 shadow-xl shadow-gray-200 cursor-pointer'
              }`}
            >
              {token ? (
                <>Enabled <Bell className="w-3.5 h-3.5" /></>
              ) : (
                <>Enable Notifications <BellOff className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
        </div>
        {token && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Device Registration Token</p>
             <p className="text-[10px] font-mono text-gray-400 break-all">{token}</p>
          </div>
        )}
      </div>

      <div className="utility-card p-8">
        <h3 className="text-lg font-medium border-b border-gray-100 pb-4 mb-6">Algorithm Preferences & Auto-Send</h3>
        
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-8">
            <div>
              <p className="font-medium text-gray-900 text-base">Daily Auto-Send Limit</p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">Set the exact maximum number of automated emails to send per active inbox per day.</p>
            </div>
            <div className="shrink-0">
              <input type="number" value={dailyLimit} onChange={e => setDailyLimit(Number(e.target.value))} className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex items-start justify-between gap-8 pt-4 border-t border-gray-50">
            <div>
              <p className="font-medium text-gray-900 text-base">Smart Auto-Fallback Names</p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">If a First Name format is unreadable (e.g. `ABC1@`), gracefully fall back to an empty string or standard salutation so emails don't look automated.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input type="checkbox" className="sr-only peer" checked={smartNames} onChange={e => setSmartNames(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
            </label>
          </div>

          <div className="flex items-start justify-between gap-8 pt-4 border-t border-gray-50">
            <div>
              <p className="font-medium text-gray-900 text-base">Strict Health Limiter</p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">If a connected inbox drops below 60% strength score, auto-sending from that inbox halts instantly to protect domain reputation.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input type="checkbox" className="sr-only peer" checked={strictHealth} onChange={e => setStrictHealth(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
            </label>
          </div>
          
          <div className="flex items-start justify-between gap-8 pt-4 border-t border-gray-50">
            <div>
              <p className="font-medium text-gray-900 text-base">Auto-Routing (Manual View)</p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">In manual sending, clicking 'Send Next via Gmail' will automatically formulate the mailto: link and execute it, switching you to your selected default client immediately.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input type="checkbox" className="sr-only peer" checked={autoRouting} onChange={e => setAutoRouting(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
            </label>
          </div>
        </div>
      </div>
      
      {/* Danger Zone */}
      <div className="utility-card border-red-100 overflow-hidden mt-8">
        <div className="bg-red-50 p-6 border-b border-red-100">
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-red-100 text-red-600 rounded-lg">
               <AlertTriangle className="w-5 h-5" />
             </div>
             <h3 className="text-xl font-medium text-red-900 tracking-tight">Danger Zone</h3>
           </div>
           <p className="text-sm text-red-700 ml-12">Destructive actions regarding your personal data and application state.</p>
        </div>
        <div className="p-8">
           <div className="flex items-start justify-between gap-8">
             <div>
               <p className="font-medium text-gray-900 text-base">Erase All Account Data</p>
               <p className="text-sm text-gray-500 mt-1 leading-relaxed max-w-xl">
                 Permanently delete all connected Gmail accounts, configurations, API keys, leads, and synced emails. 
                 This clears your entire storage and signs you out. This action cannot be undone.
               </p>
             </div>
             <button 
               onClick={handleWipeData}
               className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer flex items-center gap-2 shrink-0"
             >
               <Trash2 className="w-4 h-4" /> Delete All Data
             </button>
           </div>
        </div>
      </div>

      <p className="text-xs text-center font-mono text-gray-400 pt-8 uppercase tracking-widest">MailSquare Platform &middot; Foundation Build 1.0.0</p>
    </div>
  )
}
