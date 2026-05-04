import React, { useState } from 'react';
import { Upload, Trash2, Search, UserPlus, Users, AlertCircle, Clipboard, X, CheckCircle2 } from 'lucide-react';
import { parseEmailNames } from '../../utils/parser';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';

export default function LeadsView() {
  const [leads, setLeads] = useLocalStorage<{email: string, firstName: string, lastName: string}[]>('lead_database', []);
  const [newLead, setNewLead] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

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

  const handleBulkAdd = () => {
    if (!bulkText.trim()) return;
    setBulkLoading(true);
    
    // Split by lines first
    const lines = bulkText.split(/\n/);
    const newLeadsToAdd: any[] = [];
    const existingEmails = new Set(leads.map(l => l.email.toLowerCase()));

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Try to find email in line
      // Simple regex for email detection
      const emailMatch = trimmedLine.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        const email = emailMatch[0].toLowerCase();
        if (!existingEmails.has(email)) {
          // Check if line has names (e.g., "John Doe john@example.com" or "john@example.com, John, Doe")
          let firstName = '';
          let lastName = '';
          
          // Basic split by common delimiters
          const parts = trimmedLine.split(/[,;\t|]/).map(p => p.trim()).filter(p => p && !p.includes('@'));
          
          if (parts.length >= 2) {
            firstName = parts[0];
            lastName = parts[1];
          } else if (parts.length === 1) {
            firstName = parts[0];
          } else {
            // Try to extract from before/after email in line if space separated
            const textWithoutEmail = trimmedLine.replace(emailMatch[0], '').trim();
            const spaceParts = textWithoutEmail.split(/\s+/).filter(p => p);
            if (spaceParts.length >= 2) {
              firstName = spaceParts[0];
              lastName = spaceParts[1];
            } else if (spaceParts.length === 1) {
              firstName = spaceParts[0];
            }
          }

          const parsedNames = parseEmailNames(email);
          newLeadsToAdd.push({
            email: email,
            firstName: firstName || parsedNames.firstName,
            lastName: lastName || parsedNames.lastName
          });
          existingEmails.add(email);
        }
      }
    });

    if (newLeadsToAdd.length > 0) {
      setLeads(prev => [...newLeadsToAdd, ...prev]);
      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 3000);
      setBulkText('');
      setIsBulkModalOpen(false);
    } else {
      alert("No new valid emails found in the pasted text.");
    }
    setBulkLoading(false);
  };

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

  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  const clearLeads = () => {
    setLeads([]);
    setShowWipeConfirm(false);
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
            <div className="relative">
              {showWipeConfirm ? (
                <div className="flex items-center gap-2 animate-in zoom-in-95">
                  <button onClick={clearLeads} className="px-4 py-2 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95">
                    Confirm Wipe
                  </button>
                  <button onClick={() => setShowWipeConfirm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowWipeConfirm(true)} className="px-5 py-2 border-2 border-red-100 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-50 flex items-center gap-2 transition-all cursor-pointer active:scale-95">
                  <Trash2 className="w-4 h-4" /> Wipe Database
                </button>
              )}
            </div>
          )}

          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="px-5 py-2 bg-blue-50 text-blue-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Clipboard className="w-4 h-4" /> Bulk Paste
          </button>
          
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

      <AnimatePresence>
        {isBulkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-blue-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <Clipboard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Bulk Identity Import</h3>
                    <p className="text-sm text-gray-500 font-medium">Paste emails or formatted text to sync with database.</p>
                  </div>
                </div>
                <button onClick={() => setIsBulkModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-amber-50 border-2 border-amber-100 p-4 rounded-2xl flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    We'll extract emails and attempt to find names automatically. Supports: <br/>
                    <code className="bg-white/50 px-1 rounded font-bold">email@example.com</code>, <br/>
                    <code className="bg-white/50 px-1 rounded font-bold">John Doe john@email.com</code>, <br/>
                    <code className="bg-white/50 px-1 rounded font-bold">email@email.com, John, Doe</code>
                  </p>
                </div>

                <textarea 
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Paste your list here..."
                  className="w-full h-80 p-6 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-3xl text-sm font-medium outline-none transition-all resize-none shadow-inner"
                />
              </div>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-8 py-3 text-sm font-black uppercase tracking-widest text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button 
                  disabled={bulkLoading || !bulkText.trim()}
                  onClick={handleBulkAdd}
                  className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {bulkLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Process {bulkText.split('\n').filter(l => l.trim()).length} Lines
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
