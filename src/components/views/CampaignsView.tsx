import { useState } from 'react';
import { Play, Type, Paperclip, Link2, Plus, Zap, GripVertical, File, Calendar, X } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function CampaignsView() {
  const [activeStep, setActiveStep] = useState(1);
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

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Campaign Sequences</h2>
          <p className="text-gray-500 mt-1">Build email structures and design sophisticated automated outreach.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer">
          <Plus className="w-4 h-4" /> New Sequence
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Sequence Steps List */}
        <div className="w-full lg:w-80 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col shrink-0">
           <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
             <h3 className="font-medium text-gray-900">Steps</h3>
             <span className="text-xs font-semibold text-gray-500">{steps.length} Actions</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[300px] lg:max-h-none">
             {steps.map((step, index) => (
               <div 
                 key={step.id} 
                 onClick={() => setActiveStep(step.id)}
                 className={`border ${activeStep === step.id ? 'border-blue-200 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'} rounded-lg p-3 cursor-pointer shadow-sm relative transition-colors`}
               >
                  {activeStep === step.id && <div className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-l-lg"></div>}
                  <div className="flex items-center justify-between mb-1">
                     <span className={`text-[10px] uppercase font-bold tracking-wider ${activeStep === step.id ? 'text-blue-700' : 'text-gray-500'}`}>Step {index + 1}</span>
                     <GripVertical className={`w-4 h-4 ${activeStep === step.id ? 'text-blue-300' : 'text-gray-300'}`} />
                  </div>
                  <p className={`text-sm font-medium ${activeStep === step.id ? 'text-blue-900' : 'text-gray-900'}`}>{step.name}</p>
                  
                  {/* Step Analytics */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                     <div className="bg-gray-50/50 p-1.5 rounded border border-gray-100">
                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Sent</p>
                        <p className="text-xs font-black text-gray-700">{step.analytics?.sent || 0}</p>
                     </div>
                     <div className="bg-gray-50/50 p-1.5 rounded border border-gray-100">
                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Opened</p>
                        <p className="text-xs font-black text-blue-600">{step.analytics?.opened || 0}</p>
                     </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <p className={`text-[10px] ${activeStep === step.id ? 'text-blue-600' : 'text-gray-500'}`}>{step.delay}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                      step.status === 'Sending' ? 'bg-blue-100 text-blue-700' :
                      step.status === 'Paused' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {step.status}
                    </span>
                  </div>
               </div>
             ))}
             
             <button onClick={addNewStep} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer mt-4">
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Next Step</span>
             </button>
          </div>
        </div>

        {/* Builder Area */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col p-4 sm:p-6 overflow-y-auto">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
             <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">Configure Outreach Frame</h3>
                  <select 
                    value={currentStep.status}
                    onChange={(e) => updateCurrentStep('status', e.target.value)}
                    className="text-[10px] font-black uppercase tracking-widest bg-gray-50 border-2 border-gray-200 px-3 py-1 rounded-full outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Sending">Sending</option>
                    <option value="Paused">Paused</option>
                    <option value="Completed">Completed</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
                <p className="text-sm text-gray-500">Edit the email behavior and variables for {currentStep.name}</p>
             </div>
             <div className="flex gap-2 w-full sm:w-auto">
               <button 
                 onClick={saveAsTemplate}
                 className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all cursor-pointer flex items-center justify-center gap-2"
               >
                 <File className="w-4 h-4" /> Save Template
               </button>
               <button className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                 <Play className="w-4 h-4" /> Save & Launch
               </button>
             </div>
           </div>
           
           <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Step Name</label>
                  <input 
                    type="text" 
                    value={currentStep.name}
                    onChange={e => updateCurrentStep('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Library</label>
                  <select 
                    onChange={e => loadTemplate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue=""
                  >
                    <option value="" disabled>Select a template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-[#f8fbff] border-2 border-blue-50 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Advanced Scheduling
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={currentStep.schedule.recurring}
                      onChange={e => updateSchedule('recurring', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Recurring Weekly</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Delivery Days</p>
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
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${
                              isSelected ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-400 hover:border-blue-200'
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dispatch Windows</p>
                      <button 
                        onClick={() => {
                          const time = prompt("Enter time (HH:MM):", "09:00");
                          if (time) updateSchedule('times', [...currentStep.schedule.times, time]);
                        }}
                        className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                      >
                        + Add Time
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentStep.schedule.times.map((time: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-700 shadow-sm">
                          {time}
                          <button 
                            onClick={() => updateSchedule('times', currentStep.schedule.times.filter((_: any, i: number) => i !== idx))}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject Line</label>
               <input 
                 type="text" 
                 value={currentStep.subject}
                 onChange={e => updateCurrentStep('subject', e.target.value)}
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow" 
                 placeholder="Enter subject line..."
               />
             </div>
             
             <div className="flex-1 flex flex-col">
               <div className="flex items-center justify-between mb-2">
                 <label className="block text-sm font-medium text-gray-700">Body Content</label>
                 <div className="flex items-center gap-2">
                   <button className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded transition-colors cursor-pointer" title="Insert Link" onClick={insertLink}><Link2 className="w-4 h-4" /></button>
                   <button className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded transition-colors cursor-pointer" title="Attach Document"><Paperclip className="w-4 h-4" /></button>
                 </div>
               </div>
               
               <textarea 
                 className="w-full min-h-[300px] flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y transition-shadow leading-relaxed"
                 value={currentStep.content}
                 onChange={e => updateCurrentStep('content', e.target.value)}
                 placeholder="Start typing..."
               />
               
               <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                 <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Type className="w-3 h-3 text-blue-500" /> Insert Dynamic Variables</p>
                 <div className="flex flex-wrap gap-2">
                   {variables.map(v => (
                     <button 
                       key={v}
                       onClick={() => insertVariable(v)}
                       className="px-3 py-1.5 bg-white border border-gray-300 rounded shadow-sm text-xs font-medium hover:border-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                     >
                       {`{${v}}`}
                     </button>
                   ))}
                 </div>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}
