import { useState } from 'react';
import { Play, Type, Paperclip, Link2, Plus, Zap, GripVertical } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function CampaignsView() {
  const [activeStep, setActiveStep] = useState(1);
  const [steps, setSteps] = useLocalStorage('campaign_steps', [
    { id: 1, name: 'Initial Outreach Mail', delay: 'Send immediately', subject: 'Quick question about {Company}', content: 'Hi {First Name},\n\nInterested in improving {Company}?' },
    { id: 2, name: 'Follow-up Mail', delay: 'Wait 3 days if no reply', subject: 'Re: Quick question about {Company}', content: 'Hi {First Name},\n\nJust following up on my previous note. Any thoughts?' }
  ]);
  
  const currentStep = steps.find(s => s.id === activeStep) || steps[0];

  const updateCurrentStep = (key: string, value: string) => {
    setSteps(steps.map(s => s.id === activeStep ? { ...s, [key]: value } : s));
  };

  const insertVariable = (variable: string) => {
    updateCurrentStep('content', currentStep.content + `{${variable}} `);
  };

  const variables = ['First Name', 'Last Name', 'Company', 'Country'];

  const addNewStep = () => {
    const newId = steps.length + 1;
    setSteps([...steps, { id: newId, name: `Step ${newId}`, delay: 'Wait X days', subject: '', content: '' }]);
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
                  <p className={`text-xs mt-1 ${activeStep === step.id ? 'text-blue-600' : 'text-gray-500'}`}>{step.delay}</p>
               </div>
             ))}
             
             <button onClick={addNewStep} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer mt-4">
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Next Step</span>
             </button>
          </div>
        </div>

        {/* Builder Area */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col p-6 overflow-y-auto">
           <div className="mb-6 flex justify-between items-start">
             <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Configure Outreach Frame</h3>
                <p className="text-sm text-gray-500">Edit the email behavior and variables for {currentStep.name}</p>
             </div>
             <button className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer">
               <Play className="w-4 h-4" /> Save & Launch Automator
             </button>
           </div>
           
           <div className="space-y-6">
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
                   <button className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded transition-colors cursor-pointer" title="Insert Link"><Link2 className="w-4 h-4" /></button>
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
