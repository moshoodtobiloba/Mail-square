import { useState, useMemo } from 'react';
import { Play, Type, Paperclip, Link2, Plus, Zap, GripVertical, File, Calendar, X } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAuth } from '../../lib/AuthContext';
import { Logo } from '../ui/Logo';
import { motion, AnimatePresence } from 'motion/react';

export default function CampaignsView() {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [steps, setSteps] = useLocalStorage('campaign_steps', [
    { 
      id: 1, 
      name: 'Initial Outreach Mail', 
      delay: 'Send immediately', 
      subject: 'Quick question about {Company}', 
      content: 'Hi {First Name},\n\nInterested in improving {Company}?',
      status: 'Scheduled',
      schedule: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        times: ['09:00'],
        recurring: true
      },
      analytics: { sent: 124, opened: 48, replied: 12, bounced: 2 }
    },
    { 
      id: 2, 
      name: 'Follow-up Mail', 
      delay: 'Wait 3 days if no reply', 
      subject: 'Re: Quick question about {Company}', 
      content: 'Hi {First Name},\n\nJust following up on my previous note. Any thoughts?',
      status: 'Scheduled',
      schedule: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        times: ['10:00'],
        recurring: false
      },
      analytics: { sent: 42, opened: 21, replied: 4, bounced: 0 }
    }
  ]);

  const [templates, setTemplates] = useLocalStorage('email_templates', [
    { id: '1', name: 'Cold Intro', subject: 'Connecting with {Company}', content: 'Hi {First Name},\n\nI saw what you are doing at {Company}...' },
    { id: '2', name: 'Product Demo', subject: 'Demo for {Company}', content: 'Hi {First Name},\n\nWould you be open to a quick demo of our solution?' }
  ]);
  
  const rawStep = (steps.find((s: any) => s.id === activeStep) || steps[0] || {}) as any;
  const currentStep: any = {
    ...rawStep,
    schedule: rawStep.schedule || { days: [], times: [], recurring: false },
    analytics: rawStep.analytics || { sent: 0, opened: 0, replied: 0, bounced: 0 },
    status: rawStep.status || 'Scheduled'
  };

  const updateCurrentStep = (key: string, value: string) => {
    setSteps(steps.map(s => s.id === activeStep ? { ...s, [key]: value } : s));
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('step-content') as HTMLTextAreaElement;
    if (!textarea) {
      updateCurrentStep('content', currentStep.content + ` {${variable}} `);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newContent = before + ` {${variable}} ` + after;
    updateCurrentStep('content', newContent);
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + variable.length + 3;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const insertLink = () => {
    const url = prompt("Enter the URL:", "https://");
    if (!url) return;
    const textarea = document.getElementById('step-content') as HTMLTextAreaElement;
    if (!textarea) {
      updateCurrentStep('content', currentStep.content + ` ${url} `);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newContent = before + ` ${url} ` + after;
    updateCurrentStep('content', newContent);
  };

  const variables = ['First Name', 'Last Name', 'Company', 'Country', 'Job Title'];

  const saveAsTemplate = () => {
    const name = prompt("Enter template name:", currentStep.name);
    if (!name) return;
    const newTemplate = {
      id: Date.now().toString(),
      name,
      subject: currentStep.subject,
      content: currentStep.content
    };
    setTemplates([...templates, newTemplate]);
    alert("Template saved!");
  };

  const loadTemplate = (id: string) => {
    const t = templates.find(temp => temp.id === id);
    if (!t) return;
    updateCurrentStep('subject', t.subject);
    updateCurrentStep('content', t.content);
  };

  const updateSchedule = (key: string, value: any) => {
    const newSchedule = { ...currentStep.schedule, [key]: value };
    setSteps(steps.map(s => s.id === activeStep ? { ...s, schedule: newSchedule } : s));
  };

  const addNewStep = () => {
    const newId = Date.now();
    const newStep = { 
      id: newId, 
      name: `Step ${steps.length + 1}`, 
      delay: 'Wait X days', 
      subject: '', 
      content: '',
      status: 'Scheduled',
      schedule: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        times: ['09:00'],
        recurring: false
      },
      analytics: { sent: 0, opened: 0, replied: 0, bounced: 0 }
    };
    setSteps([...steps, newStep]);
    setActiveStep(newId);
  };

  const sequenceStrength = useMemo(() => {
    let score = 20;
    if (currentStep.content.includes('{First Name}')) score += 30;
    if (currentStep.content.length > 100) score += 20;
    if (currentStep.subject.length > 5) score += 15;
    if (currentStep.schedule.days.length >= 5) score += 15;
    return score;
  }, [currentStep.content, currentStep.subject, currentStep.schedule.days]);

  const getPreviewContent = () => {
    let content = currentStep.content;
    const sample = { 'First Name': 'John', 'Last Name': 'Doe', 'Company': 'Acme Corp', 'Country': 'USA', 'Job Title': 'Director' } as any;
    variables.forEach(v => {
      content = content.replace(new RegExp(`{${v}}`, 'g'), sample[v] || `{${v}}`);
    });
    return content;
  };

  const sendTestEmail = () => {
    const email = prompt("Enter email address to send test to:", user?.email || "");
    if (!email) return;
    alert(`Testing Relay Transmission...\n\nDispatching sequence step to ${email} via enterprise bridge.\n\nHandshake: OK\nDelivery: Verified`);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-gray-900 leading-none">Dispatch Chain</h2>
          <p className="text-gray-500 mt-2 font-medium">Engineer high-conversion automated outreach sequences.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-4 py-2 border-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer ${
              isPreviewMode ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
            }`}
          >
             {isPreviewMode ? 'Exit Preview' : 'Preview Live'}
          </button>
          <button onClick={addNewStep} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-2 cursor-pointer active:scale-95">
            <Plus className="w-4 h-4" /> Add Sequence Step
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Sequence Steps List */}
        <div className="w-full lg:w-80 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col shrink-0 overflow-hidden">
           <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
             <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Active Chain</h3>
             <span className="text-[10px] font-black text-blue-500 uppercase">{steps.length} Nodes</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             <AnimatePresence mode="popLayout">
               {steps.map((step, index) => (
                 <motion.div 
                   layout
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   key={step.id} 
                   onClick={() => setActiveStep(step.id)}
                   className={`group border-2 ${activeStep === step.id ? 'border-blue-500 bg-blue-50/30 shadow-md' : 'border-gray-50 hover:border-gray-100 bg-white'} rounded-2xl p-4 cursor-pointer relative transition-all duration-300 active:scale-95`}
                 >
                    <div className="flex items-center justify-between mb-2">
                       <span className={`text-[9px] uppercase font-black tracking-widest ${activeStep === step.id ? 'text-blue-600' : 'text-gray-400'}`}>Step {index + 1}</span>
                       <GripVertical className={`w-4 h-4 ${activeStep === step.id ? 'text-blue-300' : 'text-gray-200'}`} />
                    </div>
                    <p className={`text-sm font-black tracking-tight ${activeStep === step.id ? 'text-gray-900' : 'text-gray-600'}`}>{step.name}</p>
                    
                    <div className="mt-4 grid grid-cols-2 gap-3">
                       <div className="bg-white/50 p-2 rounded-xl border border-gray-100/50">
                          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Total Sent</p>
                          <p className="text-xs font-black text-gray-900">{step.analytics?.sent || 0}</p>
                       </div>
                       <div className="bg-white/50 p-2 rounded-xl border border-gray-100/50">
                          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Replies</p>
                          <p className="text-xs font-black text-emerald-600">{step.analytics?.replied || 0}</p>
                       </div>
                    </div>
  
                    <div className="mt-3 flex items-center justify-between">
                      <p className={`text-[10px] font-bold uppercase tracking-tight ${activeStep === step.id ? 'text-blue-500' : 'text-gray-400'}`}>{step.delay}</p>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                        step.status === 'Sending' ? 'bg-blue-100 text-blue-700' :
                        step.status === 'Paused' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {step.status}
                      </span>
                    </div>
                 </motion.div>
               ))}
             </AnimatePresence>
          </div>
        </div>

        {/* Builder Area */}
        <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col p-6 sm:p-10 overflow-y-auto">
            {!isPreviewMode ? (
              <>
                <div className="mb-10 flex flex-col sm:flex-row justify-between items-start gap-6">
                 <div>
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-xl font-black text-gray-900 tracking-tighter">Node Configuration</h3>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${sequenceStrength > 70 ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Strength: {sequenceStrength}%</span>
                      </div>
                      <select 
                        value={currentStep.status}
                        onChange={(e) => updateCurrentStep('status', e.target.value)}
                        className="text-[10px] font-black uppercase tracking-widest bg-blue-50 border-2 border-blue-100 text-blue-600 px-4 py-1.5 rounded-full outline-none focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Sending">Active</option>
                        <option value="Paused">Paused</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <p className="text-sm text-gray-400 font-medium tracking-tight">Refining delivery logic for {currentStep.name}</p>
                 </div>
                 <div className="flex gap-3 w-full sm:w-auto">
                   <button 
                     onClick={saveAsTemplate}
                     className="flex-1 sm:flex-none px-6 py-3 bg-white border-2 border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500 rounded-2xl shadow-sm hover:border-gray-200 transition-all cursor-pointer flex items-center justify-center gap-2"
                   >
                     <File className="w-4 h-4" /> Save Local Template
                   </button>
                   <button onClick={sendTestEmail} className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 cursor-pointer active:scale-95">
                     <Zap className="w-4 h-4" /> Send Test Dispatch
                   </button>
                 </div>
               </div>
               
               <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Friendly Step Name</label>
                      <input 
                        type="text" 
                        value={currentStep.name}
                        onChange={e => updateCurrentStep('name', e.target.value)}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:bg-white focus:border-blue-100 transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Template Switcher</label>
                       <select 
                        onChange={e => loadTemplate(e.target.value)}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:bg-white focus:border-blue-100 transition-all cursor-pointer appearance-none"
                        defaultValue=""
                      >
                        <option value="" disabled>Load existing logic...</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
    
                  <div className="p-8 bg-blue-50/30 border-2 border-blue-50 rounded-[2.5rem] space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Distribution Logic
                      </h4>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={currentStep.schedule.recurring}
                          onChange={e => updateSchedule('recurring', e.target.checked)}
                        />
                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${currentStep.schedule.recurring ? 'bg-blue-600' : 'bg-gray-200'}`}>
                           <div className={`w-3 h-3 bg-white rounded-full transition-transform ${currentStep.schedule.recurring ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Recurring Chain</span>
                      </label>
                    </div>
    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Transmission Windows (Days)</p>
                        <div className="flex flex-wrap gap-2">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                            const isSelected = currentStep.schedule.days.includes(day);
                            return (
                              <button 
                                key={day}
                                onClick={() => {
                                  const next = isSelected 
                                    ? currentStep.schedule.days.filter((d: string) => d !== day)
                                    : [...currentStep.schedule.days, day];
                                  updateSchedule('days', next);
                                }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all shadow-sm ${
                                  isSelected ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-400 hover:border-blue-200'
                                }`}
                              >
                                {day.slice(0, 3)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
    
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bridge Pulse Time (UTC)</p>
                          <button 
                            onClick={() => {
                              const time = prompt("Enter time (HH:MM):", "09:00");
                              if (time) updateSchedule('times', [...currentStep.schedule.times, time]);
                            }}
                            className="text-[10px] font-black text-blue-600 uppercase hover:underline underline-offset-4 tracking-widest"
                          >
                            + ADD PULSE
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {currentStep.schedule.times.map((time: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 px-4 py-2 bg-white border border-blue-100 rounded-xl text-[10px] font-black text-gray-700 shadow-sm group">
                              {time}
                              <button 
                                onClick={() => updateSchedule('times', currentStep.schedule.times.filter((_: any, i: number) => i !== idx))}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
    
                  <div className="space-y-3">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Subject Header</label>
                   <input 
                     type="text" 
                     value={currentStep.subject}
                     onChange={e => updateCurrentStep('subject', e.target.value)}
                     className="w-full px-6 py-5 bg-white border-2 border-gray-100 rounded-[2rem] font-black text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-blue-200 transition-all placeholder:text-gray-300" 
                     placeholder="Connecting with..."
                   />
                 </div>
                 
                 <div className="flex-1 flex flex-col space-y-4">
                   <div className="flex items-center justify-between">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transmission Payload</label>
                     <div className="flex items-center gap-3">
                       <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition-all cursor-pointer" title="Insert Link" onClick={insertLink}><Link2 className="w-5 h-5" /></button>
                       <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition-all cursor-pointer" title="Attach Document"><Paperclip className="w-5 h-5" /></button>
                     </div>
                   </div>
                   
                   <div className="relative group">
                     <textarea 
                       id="step-content"
                       className="w-full min-h-[400px] px-8 py-8 bg-white border-2 border-gray-100 rounded-[2.5rem] font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-blue-200 resize-none transition-all leading-relaxed"
                       value={currentStep.content}
                       onChange={e => updateCurrentStep('content', e.target.value)}
                       placeholder="Draft your outreach intelligence here..."
                     />
                     <div className="absolute top-6 right-6">
                       <Zap className="w-5 h-5 text-blue-200 group-focus-within:text-blue-500 transition-colors" />
                     </div>
                   </div>
                   
                   <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Type className="w-3 h-3 text-blue-500" /> Dynamic Variable Interjections</p>
                     <div className="flex flex-wrap gap-2">
                       {variables.map(v => (
                         <button 
                           key={v}
                           onClick={() => insertVariable(v)}
                           className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-600 uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 shadow-sm transition-all cursor-pointer active:scale-95"
                         >
                           {`{${v}}`}
                         </button>
                       ))}
                     </div>
                   </div>
                 </div>
               </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-in zoom-in-95 duration-500">
                <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.1)] border-t-[12px] border-blue-600 overflow-hidden">
                   <div className="p-10 border-b border-gray-50 bg-gray-50/20">
                      <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center gap-3">
                            <Logo size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">MailSquare Relay Preview</span>
                         </div>
                         <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">Step {steps.findIndex(s => s.id === activeStep) + 1}</span>
                      </div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tighter mb-2">{currentStep.subject || '(No Subject)'}</h2>
                      <p className="text-xs font-bold text-gray-400 truncate">Recipient (Example): john.doe@acmecorp.com</p>
                   </div>
                   <div className="p-10 min-h-[300px]">
                      <div className="whitespace-pre-wrap text-lg font-medium text-gray-700 leading-relaxed font-sans">
                         {getPreviewContent() || <span className="text-gray-300 italic">No content drafted yet.</span>}
                      </div>
                   </div>
                   <div className="p-10 bg-gray-50/50 flex justify-end">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Encryption Handshake Verified</p>
                   </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setIsPreviewMode(false)} className="px-10 py-4 bg-white border-2 border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all cursor-pointer">Return to Layout</button>
                  <button onClick={sendTestEmail} className="px-12 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all cursor-pointer">Dispatch Live Test</button>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
