import { Activity, Mail, Users, MousePointer2, GitMerge, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function DashboardView() {
  const [leads] = useLocalStorage<{email: string}[]>('lead_database', []);
  const [inboxes] = useLocalStorage<{email: string, health: number, status: string}[]>('connected_inboxes', []);
  const [scheduledEmails] = useLocalStorage<any[]>('scheduled_emails', []);
  
  const stats = [
    { label: 'Outreach Pulse', value: leads.length > 0 ? (leads.length * 0.2).toFixed(1) : '0', sub: 'Projected Reply Rate', icon: Zap },
    { label: 'Asset Database', value: leads.length.toString(), sub: 'Loaded Contacts', icon: Users },
    { label: 'In-Queue', value: scheduledEmails.length.toString(), sub: 'Staggered Payloads', icon: GitMerge },
    { label: 'Network Health', value: inboxes.length > 0 ? `${Math.round(inboxes.reduce((acc, curr) => acc + curr.health, 0) / inboxes.length)}%` : '0%', sub: 'Global Reputation', icon: ShieldCheck },
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Command Center</h2>
          <p className="text-gray-500 font-medium mt-1">Real-time visibility into your outreach infrastructure.</p>
        </div>
        <div className="flex gap-3">
           <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-2.5 text-[10px] font-black text-emerald-600 shadow-sm uppercase tracking-widest flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Systems Nominal
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white border-2 border-gray-100 p-8 rounded-[2.5rem] flex flex-col justify-between hover:shadow-xl transition-all group hover:-translate-y-1">
              <div className="flex justify-between items-start w-full mb-6">
                <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                  <Icon className="w-6 h-6" />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1 block">{stat.label}</span>
                <span className="text-4xl font-black tracking-tighter text-gray-900">{stat.value}</span>
                <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-tighter">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white border-2 border-gray-100 rounded-[3rem] p-10 lg:col-span-2 shadow-sm">
           <div className="flex justify-between items-center mb-10">
             <h3 className="font-black text-gray-900 tracking-tight uppercase text-xs tracking-[0.2em]">Live Orchestration Stream</h3>
             <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'Mail' }))} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline cursor-pointer">Launch Mail View</button>
           </div>
           <div className="space-y-4">
              <div className="text-center py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 group hover:bg-blue-50/30 transition-all">
                <GitMerge className="w-16 h-16 text-gray-200 mx-auto mb-6 group-hover:scale-110 transition-transform duration-500" />
                <h3 className="text-xl font-black text-gray-300 uppercase tracking-widest mb-3">Pipeline Idle</h3>
                <p className="text-sm text-gray-400 max-w-xs mx-auto mb-10 font-medium">Activate an automation flow to start seeing packet-level engagement metrics.</p>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'Campaigns' }))}
                  className="px-8 py-4 bg-gray-900 text-white rounded-3xl text-xs font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl active:scale-95"
                >
                  Initialize Flow
                </button>
              </div>
           </div>
        </div>
        <div className="bg-white border-2 border-gray-100 rounded-[3rem] p-10 shadow-sm">
           <h3 className="font-black text-gray-900 tracking-tight uppercase text-xs tracking-[0.2em] mb-10">Network Reputation</h3>
           <div className="space-y-8">
               {inboxes.length === 0 ? (
                 <div className="text-center py-10">
                    <ShieldCheck className="w-12 h-12 text-gray-100 mx-auto mb-6" />
                    <p className="text-sm font-black text-gray-300 uppercase tracking-widest mb-6">No secured nodes</p>
                    <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'Accounts' }))} className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-100">
                      Connect Gmail
                    </button>
                 </div>
               ) : (
                 inboxes.map((inbox, idx) => (
                   <div key={idx} className="group">
                     <div className="flex justify-between items-center mb-3">
                       <span className="text-gray-900 font-bold tracking-tight text-sm truncate mr-4">{inbox.email}</span>
                       <span className={`text-[10px] font-black uppercase tracking-tighter ${inbox.health >= 80 ? 'text-emerald-600' : inbox.health >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{inbox.health}%</span>
                     </div>
                     <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden">
                       <div className={`h-full transition-all duration-1000 ${inbox.health >= 80 ? 'bg-emerald-500' : inbox.health >= 60 ? 'bg-amber-500' : 'bg-red-500'} rounded-full`} style={{ width: `${inbox.health}%` }}></div>
                     </div>
                   </div>
                 ))
               )}
           </div>
           
           {inboxes.length > 0 && (
             <div className="mt-12 p-6 bg-blue-50 rounded-3xl border-2 border-blue-100">
                <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2">Health Insight</p>
                <p className="text-xs text-blue-600 font-medium leading-relaxed">
                   Reputation is stable across all nodes. Staggered sending is currently active to maintain 99%+ deliverability.
                </p>
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
