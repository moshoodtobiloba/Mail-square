import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAuth } from '../../lib/AuthContext';
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function SettingsView() {
  const [dailyLimit, setDailyLimit] = useLocalStorage('settings_daily_limit', 250);
  const [smartNames, setSmartNames] = useLocalStorage('settings_smart_names', true);
  const [strictHealth, setStrictHealth] = useLocalStorage('settings_strict_health', true);
  const [autoRouting, setAutoRouting] = useLocalStorage('settings_auto_routing', true);
  const { logOut } = useAuth();
  
  const handleWipeData = async () => {
    if (window.confirm("Are you sure you want to delete all your account data? This action is irreversible.")) {
       localStorage.clear();
       await logOut();
       window.location.reload();
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-light tracking-tight">Global Settings</h2>
        <p className="text-gray-500 mt-1">Manage behaviors, templates, and algorithms for MailSquare.</p>
      </div>

      <div className="utility-card p-8">
        <h3 className="text-lg font-medium border-b border-gray-100 pb-4 mb-6">Brand Assets & Verification</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 text-base">Application Logo</p>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">Download the official MailSquare logo for use in Google Cloud Console / OAuth verification.</p>
          </div>
          <a 
            href="/logo.svg" 
            download="mailsquare-logo.svg"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            Download SVG
          </a>
        </div>
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
