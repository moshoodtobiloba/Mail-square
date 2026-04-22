import { Activity, Mail, Users, MousePointer2, GitMerge } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function DashboardView() {
  const [leads] = useLocalStorage<{email: string}[]>('lead_database', []);
  const [inboxes] = useLocalStorage<{email: string, health: number, status: string}[]>('connected_inboxes', []);
  
  const stats = [
    { label: 'Emails Sent', value: '0', icon: Mail },
    { label: 'Active Leads', value: leads.length.toString(), icon: Users },
    { label: 'Follow-ups Sent', value: '0', icon: GitMerge },
    { label: 'Click Rate', value: '0.0%', icon: Activity },
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight">Overview</h2>
          <p className="text-gray-500 mt-1">Track your campaign progress and email health.</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">Last 30 Days</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <button key={i} className="utility-card p-6 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer text-left focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <div className="flex justify-between items-start w-full">
                <span className="text-xs uppercase tracking-wider font-semibold text-gray-500">{stat.label}</span>
                <Icon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="mt-4 w-full">
                <span className="text-4xl font-light tracking-tight text-gray-900">{stat.value}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="utility-card p-6 lg:col-span-2">
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-medium text-gray-900">Recent Campaigns & Follow-ups</h3>
             <button className="text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors cursor-pointer">View All</button>
           </div>
           <div className="space-y-4">
              <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                <GitMerge className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-gray-900 font-medium mb-1">No Active Campaigns</h3>
                <p className="text-sm text-gray-500">You haven't launched any sequences yet.</p>
              </div>
           </div>
        </div>
        <div className="utility-card p-6">
           <h3 className="font-medium text-gray-900 mb-6">Inbox Health Overview</h3>
           <div className="space-y-6">
               {inboxes.length === 0 ? (
                 <div className="text-center py-6">
                    <p className="text-sm text-gray-500 mb-4">No connected Email Inboxes.</p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer">
                      Connect Gmail
                    </button>
                 </div>
               ) : (
                 inboxes.map((inbox, idx) => (
                   <div key={idx}>
                     <div className="flex justify-between text-sm mb-2">
                       <span className="text-gray-600 font-mono text-xs">{inbox.email}</span>
                       <span className={`${inbox.health >= 80 ? 'text-emerald-600' : inbox.health >= 60 ? 'text-amber-600' : 'text-red-500'} font-medium font-mono text-xs`}>{inbox.health}% {inbox.status}</span>
                     </div>
                     <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div className={`h-full ${inbox.health >= 80 ? 'bg-emerald-500' : inbox.health >= 60 ? 'bg-amber-500' : 'bg-red-500'} rounded-full`} style={{ width: `${inbox.health}%` }}></div>
                     </div>
                   </div>
                 ))
               )}
           </div>
        </div>
      </div>
    </div>
  )
}
