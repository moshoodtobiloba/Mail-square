import React, { useState } from 'react';
import { Upload, Trash2, Search, UserPlus, Users, AlertCircle } from 'lucide-react';
import { parseEmailNames } from '../../utils/parser';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import Papa from 'papaparse';

export default function LeadsView() {
  const [leads, setLeads] = useLocalStorage<{email: string, firstName: string, lastName: string}[]>('lead_database', []);
  const [newLead, setNewLead] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleAdd = () => {
    const trimmed = newLead.trim();
    if (!trimmed || !trimmed.includes('@')) return;
    const { firstName, lastName } = parseEmailNames(trimmed);
    
    // Avoid duplicates
    if (leads.find(l => l.email.toLowerCase() === trimmed.toLowerCase())) {
      alert("This lead is already in your database.");
      return;
    }

    setLeads([{ email: trimmed, firstName, lastName }, ...leads]);
    setNewLead('');
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const newLeads: any[] = [];
        results.data.forEach((row: any) => {
          const email = row.email || row.Email || row.EMAIL || Object.values(row).find(v => typeof v === 'string' && v.includes('@'));
          if (email && typeof email === 'string') {
            const firstName = row.firstName || row.first_name || row['First Name'] || '';
            const lastName = row.lastName || row.last_name || row['Last Name'] || '';
            
            if (!leads.find(l => l.email.toLowerCase() === email.toLowerCase())) {
              newLeads.push({ 
                email: email.trim(), 
                firstName: firstName.trim() || parseEmailNames(email).firstName, 
                lastName: lastName.trim() || parseEmailNames(email).lastName 
              });
            }
          }
        });

        if (newLeads.length > 0) {
          setLeads(prev => [...newLeads, ...prev]);
          setImportStatus('success');
          setTimeout(() => setImportStatus('idle'), 3000);
        } else {
          alert("No new valid leads found in CSV.");
        }
      },
      error: (err) => {
        console.error("CSV Parse Error:", err);
        setImportStatus('error');
      }
    });
  };

  const filteredLeads = leads.filter(l => 
    l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clearLeads = () => {
    if (confirm("Are you sure you want to wipe your entire lead database?")) {
      setLeads([]);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Lead Intelligence</h2>
          <p className="text-gray-500 font-medium mt-1">Manage {leads.length} high-intent contacts with smart relay matching.</p>
        </div>
        <div className="flex gap-2">
          {leads.length > 0 && (
            <button onClick={clearLeads} className="px-5 py-2 border-2 border-red-100 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-50 flex items-center gap-2 transition-all cursor-pointer active:scale-95">
              <Trash2 className="w-4 h-4" /> Wipe Database
            </button>
          )}
          
          <div className="relative">
            <input 
              type="file" 
              accept=".csv"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              onChange={handleFileUpload}
            />
            <button className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl transition-all cursor-pointer pointer-events-none ${importStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white hover:bg-black'}`}>
              <Upload className="w-4 h-4" /> {importStatus === 'success' ? 'Imported!' : 'Import CSV'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-6 justify-between bg-gray-50/30">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border-2 border-transparent focus:border-blue-500 rounded-2xl text-sm font-bold outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
             <input 
               type="email" 
               placeholder="Add single email..."
               className="w-full sm:w-72 px-5 py-3 bg-white border-2 border-transparent focus:border-blue-500 rounded-2xl text-sm font-bold outline-none transition-all shadow-sm"
               value={newLead}
               onChange={(e) => setNewLead(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
             />
             <button onClick={handleAdd} className="px-5 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-100 active:scale-95">
               <UserPlus className="w-5 h-5" />
             </button>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-[2fr_1fr_1fr_120px] px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 bg-gray-50/10">
            <div>Email Identity</div>
            <div>First Name</div>
            <div>Last Name</div>
            <div className="text-right">Action</div>
          </div>
          {filteredLeads.length === 0 ? (
            <div className="p-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-gray-200" />
                </div>
                <p className="text-xl font-black text-gray-300 uppercase tracking-widest">No matching leads</p>
                <p className="text-sm text-gray-400 mt-2 font-medium">Try a different search or import a list.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredLeads.map((lead, i) => (
                <div key={i} className="grid grid-cols-[2fr_1fr_1fr_120px] px-8 py-5 text-sm hover:bg-blue-50/30 transition-all items-center group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-black text-xs">
                      {lead.email[0].toUpperCase()}
                    </div>
                    <div className="text-gray-900 font-bold tracking-tight truncate">{lead.email}</div>
                  </div>
                  <div className="text-gray-600 font-medium">{lead.firstName || <span className="text-gray-300 italic">Auto</span>}</div>
                  <div className="text-gray-600 font-medium">{lead.lastName || <span className="text-gray-300 italic">Auto</span>}</div>
                  <div className="text-right">
                    <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         alert(`Launching automation for ${lead.email}...`);
                      }}
                      className="px-4 py-1.5 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black underline uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:no-underline transition-all"
                    >
                      Outreach
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
