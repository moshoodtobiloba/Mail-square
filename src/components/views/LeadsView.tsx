import { useState } from 'react';
import { Upload, Trash2, Search, UserPlus, Users } from 'lucide-react';
import { parseEmailNames } from '../../utils/parser';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function LeadsView() {
  const [leads, setLeads] = useLocalStorage<{email: string, firstName: string, lastName: string}[]>('lead_database', []);
  const [newLead, setNewLead] = useState('');

  const handleAdd = () => {
    if (!newLead.includes('@')) return;
    const { firstName, lastName } = parseEmailNames(newLead);
    setLeads([{ email: newLead, firstName, lastName }, ...leads]);
    setNewLead('');
  }

  const clearLeads = () => setLeads([]);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight">Lead Database</h2>
          <p className="text-gray-500 mt-1">Import, search, and manage your contacts using smart extraction.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={clearLeads} className="px-4 py-2 border border-red-200 text-red-600 rounded-full text-sm font-medium hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer">
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
          
          <div className="relative">
            <input 
              type="file" 
              accept=".csv"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              onChange={(e) => {
                if(e.target.files && e.target.files.length > 0) {
                  // Mock import
                  setLeads([{ email: 'imported@csv.com', firstName: 'Imported', lastName: 'User' }, ...leads]);
                }
              }}
            />
            <button className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-black flex items-center gap-2 shadow-sm transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 cursor-pointer pointer-events-none">
              <Upload className="w-4 h-4" /> Import CSV
            </button>
          </div>
        </div>
      </div>

      <div className="utility-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search leads..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-shadow"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <input 
               type="email" 
               placeholder="Add single email..."
               className="w-full sm:w-64 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-shadow"
               value={newLead}
               onChange={(e) => setNewLead(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
             />
             <button onClick={handleAdd} className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer">
               <UserPlus className="w-4 h-4" />
             </button>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-[2fr_1fr_1fr] p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50/20">
            <div>Email</div>
            <div>Extracted First Name</div>
            <div>Extracted Last Name</div>
          </div>
          {leads.length === 0 ? (
            <div className="p-12 text-center">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-medium">No leads in database</p>
                <p className="text-gray-400 text-xs mt-1">Import via CSV or add single emails manually.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {leads.map((lead, i) => (
                <div key={i} className="grid grid-cols-[2fr_1fr_1fr] p-4 text-sm font-mono hover:bg-gray-50 transition-colors items-center group cursor-pointer">
                  <div className="text-gray-900 font-medium group-hover:text-blue-600 transition-colors">{lead.email}</div>
                  <div className="text-gray-600">{lead.firstName || <span className="text-gray-300 italic">None</span>}</div>
                  <div className="text-gray-600">{lead.lastName || <span className="text-gray-300 italic">None</span>}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
