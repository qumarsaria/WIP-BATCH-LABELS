import React, { useState, useEffect, useMemo } from 'react';
import { 
  MOCK_WIP_DATABASE, 
  SUPERVISORS, 
  SHELF_LIFE_DAYS
} from './constants';
import { 
  addDays, 
  formatDate, 
  formatDateDisplay, 
  getTodayString 
} from './utils';
import { 
  BatchRecord, 
  LabelConfig
} from './types';
import Label from './components/Label';
import { identifyMixName } from './services/geminiService';
import { 
  Printer, 
  Calendar, 
  User, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Scale,
  Database,
  Loader2,
  Edit2,
  Download
} from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [wipCode, setWipCode] = useState('');
  const [mixName, setMixName] = useState('');
  const [prepDate, setPrepDate] = useState(getTodayString());
  const [supervisor, setSupervisor] = useState<string>('');
  const [qaQuantity, setQaQuantity] = useState<string>('');
  const [loadingMix, setLoadingMix] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  // History
  const [batchHistory, setBatchHistory] = useState<BatchRecord[]>([]);

  // Print Queue State
  const [printQueue, setPrintQueue] = useState<LabelConfig[]>([]);

  // --- Effects ---

  // 1. Listen for PWA Install Prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // 2. Trigger Print Dialog when Print Queue updates
  useEffect(() => {
    if (printQueue.length > 0) {
      // Use a timeout to ensure the DOM is fully painted with the new labels
      // before opening the print dialog. 500ms is a safe buffer.
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printQueue]);

  // --- Derived State ---
  
  // Check if the current WIP code is in the database
  const isKnownCode = useMemo(() => {
    return MOCK_WIP_DATABASE.some(item => item.code === wipCode);
  }, [wipCode]);

  // Calculate Labels to Print based on Business Logic
  const { labelsToPrint, warningMessage } = useMemo(() => {
    const qty = parseFloat(qaQuantity);
    if (isNaN(qty)) {
      return { labelsToPrint: 0, warningMessage: null };
    }

    // New Logic: Range 1kg - 500kg
    if (qty < 1 || qty > 500) {
      return { 
        labelsToPrint: 0, 
        warningMessage: "Quantity must be between 1kg and 500kg." 
      };
    }

    // Logic: Every 20kg = 1 label, rounded up.
    // e.g. 5kg -> 1, 20kg -> 1, 21kg -> 2, 40kg -> 2, 50kg -> 3
    const calculatedLabels = Math.ceil(qty / 20);
    
    return { labelsToPrint: calculatedLabels, warningMessage: null };
  }, [qaQuantity]);

  // Calculate Use By Date
  const useByDate = useMemo(() => {
    if (!prepDate) return '';
    const dateObj = new Date(prepDate);
    return formatDate(addDays(dateObj, SHELF_LIFE_DAYS));
  }, [prepDate]);

  // --- Handlers ---

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleWipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase();
    setWipCode(code);

    // Try Local Lookup
    const localMatch = MOCK_WIP_DATABASE.find(item => item.code === code);
    if (localMatch) {
      setMixName(localMatch.name);
    } else {
       // If not found, clear mix name to allow manual entry
       setMixName(''); 
    }
  };

  const handleAISearch = async () => {
    if (!wipCode) return;
    setLoadingMix(true);
    try {
      const name = await identifyMixName(wipCode);
      setMixName(name);
    } finally {
      setLoadingMix(false);
    }
  };

  const handleGenerate = () => {
    // Validation
    if (!wipCode || !mixName || !prepDate || !supervisor || !qaQuantity) return;
    if (labelsToPrint === 0) return;
    
    // Generate ID safely
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newRecord: BatchRecord = {
      id: uniqueId,
      wipCode,
      mixName,
      prepDate,
      useByDate,
      supervisor,
      qaQuantity: parseFloat(qaQuantity),
      labelCount: labelsToPrint,
      createdAt: Date.now()
    };

    // Save to History
    setBatchHistory(prev => [newRecord, ...prev]);

    // Prepare Print Queue (This will trigger the useEffect to print)
    const labels: LabelConfig[] = [];
    for (let i = 1; i <= labelsToPrint; i++) {
      labels.push({
        wipCode,
        mixName,
        prepDate,
        useByDate,
        supervisor,
        copyNumber: i,
        totalCopies: labelsToPrint
      });
    }
    
    // Setting state with a new array reference triggers the Effect
    setPrintQueue(labels);
  };

  const canSubmit = wipCode && 
                    mixName && 
                    prepDate && 
                    supervisor && 
                    qaQuantity && 
                    !loadingMix && 
                    labelsToPrint > 0;

  return (
    <div className="min-h-screen pb-32"> {/* pb-32 for sticky footer space */}
      
      {/* --- Print Area (Hidden on Screen) --- */}
      <div id="print-area">
        {printQueue.map((labelData, idx) => (
          <Label key={idx} data={labelData} />
        ))}
      </div>

      {/* --- Main UI --- */}
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Printer className="w-6 h-6 text-blue-400" />
            <h1 className="text-lg font-bold">Batch Label Gen</h1>
          </div>
          <div className="flex items-center space-x-3">
             {installPrompt && (
              <button 
                onClick={handleInstall}
                className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-full transition-colors font-medium"
              >
                <Download className="w-3 h-3" />
                <span>Install App</span>
              </button>
             )}
             <div className="text-xs text-slate-400">v1.5.2</div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Section A: Input Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center space-x-2">
            <Database className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-700">Batch Details</h2>
          </div>
          
          <div className="p-4 space-y-5">
            
            {/* WIP Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                WIP Code <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={wipCode}
                  onChange={handleWipCodeChange}
                  placeholder="e.g. WIP-1001"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all uppercase font-mono"
                  list="wip-suggestions"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                <datalist id="wip-suggestions">
                    {MOCK_WIP_DATABASE.map(item => (
                        <option key={item.code} value={item.code}>{item.name}</option>
                    ))}
                </datalist>
              </div>
            </div>

            {/* Mix Name (Editable) */}
            <div className="space-y-2">
               <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-700 flex items-center">
                    Mix Name <span className="text-red-500 ml-1">*</span>
                  </label>
                  {isKnownCode ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Auto-Matched</span>
                  ) : (
                      <span className="text-xs text-slate-400">Manual Entry</span>
                  )}
               </div>
              
              <div className="relative">
                <input
                  type="text"
                  value={mixName}
                  onChange={(e) => setMixName(e.target.value)}
                  placeholder="Enter Mix Name..."
                  className={`
                    w-full pl-10 pr-20 py-3 rounded-lg border transition-all
                    ${isKnownCode 
                        ? 'bg-blue-50 border-blue-200 text-blue-900 font-medium focus:ring-2 focus:ring-blue-200' 
                        : 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }
                  `}
                />
                <Edit2 className={`w-5 h-5 absolute left-3 top-3.5 ${isKnownCode ? 'text-blue-300' : 'text-slate-400'}`} />
                
                {/* AI / Auto Button */}
                {!isKnownCode && wipCode.length > 3 && !mixName && (
                     <button 
                        onClick={handleAISearch}
                        disabled={loadingMix}
                        className="absolute right-2 top-2 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-full flex items-center hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loadingMix ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <span className="mr-1">✨</span>}
                        Auto
                    </button>
                )}
              </div>
            </div>

            {/* Prep Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                Prep Date <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={prepDate}
                  onChange={(e) => setPrepDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Supervisor */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                Shift Supervisor <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <select
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="">Select Supervisor...</option>
                  {SUPERVISORS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <User className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {/* QA Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                QA Quantity (kg) <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={qaQuantity}
                  onChange={(e) => setQaQuantity(e.target.value)}
                  placeholder="1.0 - 500.0"
                  step="0.1"
                  min="0"
                  max="500"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg"
                />
                <Scale className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              </div>
              <div className="flex justify-between text-xs text-slate-400 ml-1">
                 <span>Range: 1kg - 500kg</span>
                 <span>1 label / 20kg</span>
              </div>
            </div>

          </div>
        </div>

        {/* Section B: Results & Feedback */}
        <div className="space-y-4">
             {/* Warning Panel */}
            {warningMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-red-800">Invalid Quantity</h3>
                        <p className="text-sm text-red-700 mt-1">{warningMessage}</p>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-100 p-4 rounded-xl text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase">Use By Date</p>
                    <p className="text-lg font-bold text-slate-800 mt-1">
                        {useByDate ? formatDateDisplay(useByDate) : '--'}
                    </p>
                </div>
                <div className={`p-4 rounded-xl text-center border-2 ${labelsToPrint > 0 ? 'bg-green-50 border-green-200' : 'bg-slate-100 border-transparent'}`}>
                    <p className="text-xs text-slate-500 font-bold uppercase">Labels to Print</p>
                    <div className="flex items-center justify-center space-x-2 mt-1">
                        <span className={`text-2xl font-black ${labelsToPrint > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                            {labelsToPrint}
                        </span>
                        {labelsToPrint > 0 && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </div>
                </div>
            </div>
        </div>

        {/* History List */}
        {batchHistory.length > 0 && (
            <div className="pt-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Batches</h3>
                <div className="space-y-2">
                    {batchHistory.map(batch => (
                        <div key={batch.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center opacity-75 hover:opacity-100 transition-opacity">
                            <div>
                                <div className="font-bold text-slate-800 text-sm">{batch.wipCode}</div>
                                <div className="text-xs text-slate-500 truncate max-w-[150px]">{batch.mixName}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{batch.qaQuantity}kg</div>
                                <div className="text-[10px] text-slate-400 mt-1">{formatDateDisplay(batch.createdAt)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </main>

      {/* Sticky Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-8 safe-area-pb shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="max-w-md mx-auto">
            <button
                onClick={handleGenerate}
                disabled={!canSubmit}
                className={`
                    w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98]
                    ${canSubmit 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }
                `}
            >
                <Printer className="w-6 h-6" />
                <span>Generate & Print Labels</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default App;