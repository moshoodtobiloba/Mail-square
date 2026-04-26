import React from 'react';
import { Activity, Mail, Users, MousePointer2, GitMerge, TrendingUp, ShieldCheck, Zap, ArrowUpRight, BarChart3 } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function DashboardView() {
  const [leads] = useLocalStorage<{email: string}[]>('lead_database', []);
  const [inboxes] = useLocalStorage<{email: string, health: number, status: string}[]>('connected_inboxes', []);
  const [scheduledEmails] = useLocalStorage<any[]>('scheduled_emails', []);
  
  const chartData = [
    { name: 'Mon', sent: 40, replies: 12 },
    { name: 'Tue', sent: 30, replies: 15 },
    { name: 'Wed', sent: 65, replies: 25 },
    { name: 'Thu', sent: 45, replies: 18 },
    { name: 'Fri', sent: 90, replies: 32 },
    { name: 'Sat', sent: 20, replies: 8 },
    { name: 'Sun', sent: 15, replies: 5 },
  ];

  const stats = [
    { label: 'Intelligence Pulse', value: leads.length > 0 ? (leads.length * 0.2).toFixed(1) : '0', sub: 'Projected Reply Rate', icon: Zap, trend: '+12%', color: 'text-blue-600' },
    { label: 'Relay Nodes', value: inboxes.length.toString(), sub: 'Connected Inboxes', icon: Mail, trend: 'Stable', color: 'text-emerald-600' },
    { label: 'Pipeline Drafts', value: scheduledEmails.length.toString(), sub: 'Queued Payloads', icon: GitMerge, trend: '+4', color: 'text-amber-500' },
    { label: 'Global Health', value: inboxes.length > 0 ? `${Math.round(inboxes.reduce((acc, curr) => acc + curr.health, 0) / inboxes.length)}%` : '100%', sub: 'Reputation Score', icon: ShieldCheck, trend: 'Optimal', color: 'text-blue-500' },
  ];

  return (
    <div className="animate-in fade-in duration-700 space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Operational Status: Optimal</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter leading-none">Command Center</h2>
          <p className="text-gray-500 font-medium mt-2 text-sm sm:text-base max-w-xl">Unified visibility into your reach infrastructure and intelligence-driven engagement metrics.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'Mail' }))}
             className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black text-gray-700 uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-2 group"
           >
             Launch Inbox <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
           </button>
           <button 
             onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'Campaigns' }))}
             className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black text-gray-100 uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-2"
           >
             Initialize Sequence <Zap className="w-4 h-4 fill-current text-blue-400" />
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white border border-gray-100 p-8 rounded-[2.5rem] flex flex-col justify-between hover:shadow-2xl transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                 <Icon className="w-24 h-24 text-gray-900" />
              </div>
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className={`p-4 bg-gray-50 rounded-2xl ${stat.color} group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                   {stat.trend}
                </div>
              </div>
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1 block">{stat.label}</span>
                <div className="flex items-baseline gap-2">
                   <span className="text-4xl font-black tracking-tighter text-gray-900">{stat.value}</span>
                   {stat.label.includes('Health') && <span className="text-emerald-500 font-black text-xs uppercase">Sovereign</span>}
                </div>
                <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-tighter">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white border border-gray-100 rounded-[3rem] p-8 lg:col-span-2 shadow-sm flex flex-col min-h-[450px]">
           <div className="flex justify-between items-center mb-10 px-2">
             <div>
               <h3 className="font-black text-gray-900 tracking-tight uppercase text-xs tracking-[0.2em]">Transmission Intelligence</h3>
               <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Staggered delivery & Engagement Flow</p>
             </div>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                   <span className="text-[9px] font-black text-gray-400 uppercase">Dispatches</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-300"></div>
                   <span className="text-[9px] font-black text-gray-400 uppercase">Interceptions</span>
                </div>
             </div>
           </div>
           
           <div className="flex-1 w-full min-h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#93c5fd" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis 
                   dataKey="name" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                   dy={10}
                 />
                 <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                 />
                 <Tooltip 
                   contentStyle={{ 
                     borderRadius: '16px', 
                     border: 'none', 
                     boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                     fontSize: '12px',
                     fontWeight: '700'
                   }} 
                 />
                 <Area 
                   type="monotone" 
                   dataKey="sent" 
                   stroke="#2563eb" 
                   strokeWidth={4}
                   fillOpacity={1} 
                   fill="url(#colorSent)" 
                   animationDuration={1500}
                 />
                 <Area 
                   type="monotone" 
                   dataKey="replies" 
                   stroke="#93c5fd" 
                   strokeWidth={4}
                   fillOpacity={1} 
                   fill="url(#colorReplies)" 
                   animationDuration={2000}
                 />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-sm">
           <div className="flex items-center justify-between mb-10 px-2">
             <h3 className="font-black text-gray-900 tracking-tight uppercase text-xs tracking-[0.2em]">Asset Reputation</h3>
             <BarChart3 className="w-4 h-4 text-gray-300" />
           </div>
           
           <div className="space-y-8">
               {inboxes.length === 0 ? (
                 <div className="text-center py-10">
                    <ShieldCheck className="w-16 h-16 text-gray-100 mx-auto mb-6" />
                    <p className="text-sm font-black text-gray-300 uppercase tracking-widest mb-6 leading-relaxed">No secured nodes in transmission network</p>
                    <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'Mail' }))} className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-100">
                      Connect Inbox
                    </button>
                 </div>
               ) : (
                 inboxes.map((inbox, idx) => (
                   <div key={idx} className="group">
                     <div className="flex justify-between items-center mb-3">
                       <div className="min-w-0">
                          <span className="text-gray-900 font-bold tracking-tight text-sm truncate mr-4 block">{inbox.email}</span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Verified Gmail Relay</span>
                       </div>
                       <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-lg ${inbox.health >= 80 ? 'bg-emerald-50 text-emerald-600' : inbox.health >= 60 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'}`}>{inbox.health}%</span>
                     </div>
                     <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                       <div className={`h-full transition-all duration-1000 ${inbox.health >= 80 ? 'bg-emerald-500' : inbox.health >= 60 ? 'bg-amber-500' : 'bg-red-500'} rounded-full`} style={{ width: `${inbox.health}%` }}></div>
                     </div>
                   </div>
                 ))
               )}
           </div>
           
           {inboxes.length > 0 && (
             <div className="mt-12 p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                   <Zap className="w-3 h-3 text-blue-600" />
                   <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Network Insight</p>
                </div>
                <p className="text-xs text-blue-600 font-medium leading-relaxed">
                   Encryption layer is stable. Recommended throttle: <span className="font-bold underline">12 emails/day</span> per node to maintain peak deliverability.
                </p>
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
