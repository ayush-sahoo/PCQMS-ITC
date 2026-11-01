'use client';

import React, { useState, useEffect, useRef } from 'react';

// Replaces google.script.run. Returns a promise resolving to the server JSON.
async function callServer(url, body) {
  try {
    const res = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({ success: false, error: 'Bad response' }));
    return json;
  } catch (e) {
    return { success: false, error: 'Network error' };
  }
}

const alarmAudio = typeof Audio !== 'undefined'
  ? new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg')
  : null;
if (alarmAudio) alarmAudio.loop = true;

const unlockAudio = () => {
  if (!alarmAudio) return;
  alarmAudio.play().then(() => {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  }).catch(e => console.log("Audio unlock pending..."));
};

const playAlarm = () => { if (alarmAudio) alarmAudio.play().catch(e => console.log(e)); };
const stopAlarm = () => { if (alarmAudio) { alarmAudio.pause(); alarmAudio.currentTime = 0; } };

const THEMES = {
  default: {
    appBg: "bg-slate-50 text-slate-800", header: "bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-lg",
    card: "bg-white border-slate-200 shadow-sm", label: "text-slate-600",
    input: "bg-slate-50 border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-800 shadow-sm",
    inputReadonly: "bg-blue-50 border-blue-200 text-blue-700 shadow-inner",
    btnPrimary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg",
    btnStop: "bg-red-600 hover:bg-red-700 text-white shadow-lg",
    btnReset: "bg-slate-200 text-slate-600 hover:bg-slate-300",
    btnOutline: "bg-slate-50 text-blue-700 border-slate-200 hover:bg-slate-100",
    navBg: "border-t border-slate-200 bg-white/95", navActive: "text-blue-700 scale-110 stroke-[2.5px]",
    navInactive: "text-slate-400 hover:text-slate-600 stroke-2",
    titleActive: "text-blue-700 bg-blue-50/50 border-b border-blue-100", titleInactive: "text-slate-700 hover:bg-slate-50",
    iconUnit: "text-slate-400", alertCard: "border-red-200 bg-red-50 text-red-700"
  },
  electric: {
    appBg: "bg-slate-900 text-slate-200", header: "bg-slate-900 text-cyan-400 border-b border-slate-800 shadow-md",
    card: "bg-slate-800 border-slate-700 shadow-[0_0_15px_rgba(56,189,248,0.05)]", label: "text-slate-400",
    input: "bg-slate-900 border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]",
    inputReadonly: "bg-slate-900 border-cyan-500 text-cyan-400 shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]",
    btnPrimary: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_4px_14px_0_rgba(6,182,212,0.39)]",
    btnStop: "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-[0_4px_14px_0_rgba(225,29,72,0.39)]",
    btnReset: "bg-slate-700 text-slate-300 hover:bg-slate-600",
    btnOutline: "bg-slate-900 text-cyan-500 border-slate-700 hover:bg-slate-800",
    navBg: "border-t border-slate-800 bg-slate-900/95", navActive: "text-cyan-400 scale-110 stroke-[2.5px]",
    navInactive: "text-slate-500 hover:text-slate-300 stroke-2",
    titleActive: "text-cyan-400 bg-slate-800 border-b border-slate-700", titleInactive: "text-slate-300 hover:bg-slate-800",
    iconUnit: "text-cyan-500", alertCard: "border-rose-500 bg-rose-950/40 text-rose-400"
  },
  corporate: {
    appBg: "bg-slate-50 text-slate-800", header: "bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-md border-b border-indigo-700/50",
    card: "bg-white border-slate-200 shadow-sm", label: "text-slate-500",
    input: "bg-white border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-slate-800 shadow-sm",
    inputReadonly: "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner",
    btnPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_10px_20px_-5px_rgba(67,56,202,0.4)]",
    btnStop: "bg-slate-800 hover:bg-slate-900 text-white shadow-md",
    btnReset: "bg-slate-200 text-slate-600 hover:bg-slate-300",
    btnOutline: "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50",
    navBg: "border-t border-slate-200/60 bg-white/90 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.03)]", navActive: "text-indigo-600 scale-110 stroke-[2.5px]",
    navInactive: "text-slate-400 hover:text-slate-600 stroke-2",
    titleActive: "text-indigo-800 bg-indigo-50/50 border-b border-indigo-100", titleInactive: "text-slate-700 hover:bg-slate-50",
    iconUnit: "text-indigo-400", alertCard: "border-red-200 bg-red-50 text-red-700"
  },
  amber: {
    appBg: "bg-amber-50/50 text-slate-900", header: "bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md border-b border-amber-400",
    card: "bg-white border-amber-100 shadow-sm", label: "text-amber-800",
    input: "bg-white border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 text-slate-800 shadow-sm",
    inputReadonly: "bg-amber-100 border-amber-300 text-amber-900 shadow-inner",
    btnPrimary: "bg-amber-500 hover:bg-amber-400 text-amber-950 font-black shadow-[0_8px_15px_-5px_rgba(245,158,11,0.5)]",
    btnStop: "bg-red-500 hover:bg-red-400 text-white font-black shadow-[0_8px_15px_-5px_rgba(239,68,68,0.5)]",
    btnReset: "bg-amber-200 text-amber-900 hover:bg-amber-300",
    btnOutline: "bg-white text-amber-800 border-amber-200 hover:bg-amber-50",
    navBg: "border-t border-amber-200/50 bg-amber-50/90", navActive: "text-amber-600 scale-110 stroke-[2.5px]",
    navInactive: "text-amber-900/40 hover:text-amber-900/60 stroke-2",
    titleActive: "text-amber-900 bg-amber-100/50 border-b border-amber-200", titleInactive: "text-slate-800 hover:bg-amber-50",
    iconUnit: "text-amber-500", alertCard: "border-red-300 bg-red-50 text-red-800"
  }
};

const Stopwatch = ({ label, value, onChange, targetTime, t }) => {
  const [isActive, setIsActive] = useState(false);
  const [isAlarming, setIsAlarming] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setTime(tv => {
          const nextTime = tv + 1;
          if (targetTime && nextTime === targetTime) {
            setIsAlarming(true);
            playAlarm();
          }
          return nextTime;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, targetTime]);

  useEffect(() => {
    if (!isActive && value && value.includes(':')) {
      const parts = value.split(':');
      if (parts.length === 2) setTime(parseInt(parts[0]) * 60 + parseInt(parts[1]));
    }
  }, [value, isActive]);

  const toggle = (e) => {
    e.preventDefault();
    if (isActive) {
      setIsActive(false);
      setIsAlarming(false);
      stopAlarm();
      const mm = String(Math.floor(time / 60)).padStart(2, '0');
      const ss = String(time % 60).padStart(2, '0');
      onChange(`${mm}:${ss}`);
    } else {
      unlockAudio();
      setIsActive(true);
      setIsAlarming(false);
    }
  };

  const reset = (e) => {
    e.preventDefault();
    setIsActive(false);
    setIsAlarming(false);
    stopAlarm();
    setTime(0);
    onChange("");
  };

  const mm = String(Math.floor(time / 60)).padStart(2, '0');
  const ss = String(time % 60).padStart(2, '0');
  const displayTime = isActive ? `${mm}:${ss}` : (value || "");

  const inputStyles = isAlarming
    ? "w-full border-2 border-red-500 rounded-xl p-3 bg-red-50 font-mono text-center tracking-widest text-lg shadow-sm text-red-700 animate-pulse outline-none min-w-0"
    : `w-full rounded-xl p-3 font-mono text-center tracking-widest text-lg transition-all outline-none border min-w-0 ${t.input}`;

  return (
    <div className="mb-4">
      <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wide ${t.label}`}>{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-grow min-w-0">
          <input type="text" className={inputStyles}
            value={displayTime} onChange={(e) => { if(!isActive) onChange(e.target.value); }} placeholder="00:00" readOnly={isActive} />
          {(isActive && !isAlarming) && <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>}
          {isAlarming && <div className="absolute top-3.5 right-3.5"><svg className="w-5 h-5 text-red-600 animate-bounce" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg></div>}
        </div>
        <button onClick={toggle} className={`px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap min-w-[80px] ${isActive ? t.btnStop : t.btnPrimary}`}>
          {isActive ? 'Stop' : 'Start'}
        </button>
        <button onClick={reset} disabled={isActive} className={`px-3 py-3 rounded-xl font-bold transition-all ${t.btnReset}`}>
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
      </div>
    </div>
  );
};

const BlastFreezerTracker = ({ data = {}, onUpdate, t }) => {
  const [isActive, setIsActive] = useState(false);
  const [isAlarming, setIsAlarming] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (data.bfStartTime && data.bfStopTime) {
      const startParts = data.bfStartTime.split(':');
      const stopParts = data.bfStopTime.split(':');
      if (startParts.length === 2 && stopParts.length === 2) {
         const startMins = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
         const stopMins = parseInt(stopParts[0], 10) * 60 + parseInt(stopParts[1], 10);
         let diff = stopMins - startMins;
         if (diff < 0) diff += 24 * 60;
         if (data.bfTotalDuration !== diff) {
           onUpdate('bfTotalDuration', diff);
         }
      }
    }
  }, [data.bfStartTime, data.bfStopTime]);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1;
          if (next === 1790) {
            setIsAlarming(true);
            playAlarm();
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handleStart = (e) => {
    e.preventDefault();
    unlockAudio();
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    onUpdate('bfStartTime', `${hh}:${mm}`);
    onUpdate('bfStopTime', '');
    onUpdate('bfTotalDuration', '');
    setIsActive(true);
    setIsAlarming(false);
    setElapsed(0);
  };

  const handleStop = (e) => {
    e.preventDefault();
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    onUpdate('bfStopTime', `${hh}:${mm}`);
    setIsActive(false);
    setIsAlarming(false);
    stopAlarm();
  };

  const inputStyles = isAlarming
    ? "w-full border-2 border-red-500 rounded-xl p-3 bg-red-50 font-mono text-center tracking-widest shadow-sm text-red-700 animate-pulse outline-none min-w-0"
    : `w-full rounded-xl p-3 font-bold transition-all outline-none border min-w-0 ${t.input}`;

  return (
    <div className={`mb-6 p-4 rounded-xl border ${t.card}`}>
      <div className="grid grid-cols-2 gap-3 mb-4">
         <div className="min-w-0">
           <label className={`block text-[10px] font-bold mb-1 uppercase tracking-wider truncate ${t.label}`}>Start (HH:MM)</label>
           <input type="time" className={inputStyles} value={data.bfStartTime || ''} onChange={e => onUpdate('bfStartTime', e.target.value)} />
         </div>
         <div className="min-w-0">
           <label className={`block text-[10px] font-bold mb-1 uppercase tracking-wider truncate ${t.label}`}>Stop (HH:MM)</label>
           <input type="time" className={inputStyles} value={data.bfStopTime || ''} onChange={e => onUpdate('bfStopTime', e.target.value)} />
         </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
         <button onClick={handleStart} disabled={isActive} className={`py-3 rounded-xl font-bold transition-all shadow-md ${isActive ? 'bg-slate-500 opacity-50 text-white' : t.btnPrimary}`}>
            {isActive ? 'Freezing...' : '▶ Start'}
         </button>
         <button onClick={handleStop} disabled={!isActive} className={`py-3 rounded-xl font-bold text-white transition-all shadow-md ${!isActive ? 'bg-slate-500 opacity-50' : isAlarming ? 'bg-red-500 animate-pulse' : t.btnStop}`}>
            ■ Stop
         </button>
      </div>
      <div className="pt-3 border-t border-slate-200/50">
         <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wide ${t.label}`}>Total Duration (Auto Mins)</label>
         <input type="number" readOnly className={`w-full rounded-xl p-3 font-black text-xl text-center tracking-wider outline-none border min-w-0 ${t.inputReadonly}`} value={data.bfTotalDuration !== undefined ? data.bfTotalDuration : ''} placeholder="0" />
      </div>
    </div>
  );
};

export default function App() {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const t = THEMES[currentTheme];

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pcqms_theme');
      if (saved && THEMES[saved]) setCurrentTheme(saved);
    } catch (_) {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('pcqms_theme', currentTheme); } catch (_) {}
    document.body.className = t.appBg;
  }, [currentTheme, t.appBg]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('batchPrep');
  const [expandedBlock, setExpandedBlock] = useState('General Info');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const [submittedBatchId, setSubmittedBatchId] = useState(null);

  const [existingBatchIds, setExistingBatchIds] = useState([]);
  const [activeBatchesList, setActiveBatchesList] = useState([]);
  const [selectedActiveBatch, setSelectedActiveBatch] = useState('');

  const [reportType, setReportType] = useState('');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [fetchedReportData, setFetchedReportData] = useState({});
  const [reportBatch, setReportBatch] = useState('ALL');

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [packWeights, setPackWeights] = useState(Array(10).fill(''));

  const defaultBatchData = {
    'General Info': {}, 'Dry Blending': {}, 'Oil Blending': {}, 'Wet Blending': {},
    'Final Blending': {}, 'Quality Checks': {}, 'Environment': {}, 'Sign off': {}
  };
  const [batchData, setBatchData] = useState(defaultBatchData);

  const defaultInProcessData = {
    'Ball Cutting - In Process Check': {}, 'Pressing Section - In Process Check': {},
    'Packing In Process Check': {}, 'Pack Quality': {}, 'Blast Freezer Shifting & Storage': {},
    'Batch Sensory': {}, 'Sign off': {}
  };
  const [inProcessData, setInProcessData] = useState(defaultInProcessData);

  const totals = {
    totalDry: (Number(batchData['Dry Blending'].atta) || 0) +
              (Number(batchData['Dry Blending'].dmg) || 0) +
              (Number(batchData['Oil Blending'].sunflowerOil) || 0) +
              (Number(batchData['Final Blending'].remainingOil) || 0) +
              (Number(batchData['Wet Blending'].glycerol) || 0) +
              (Number(batchData['Wet Blending'].salt) || 0) +
              (Number(batchData['Wet Blending'].ascorbicAcid) || 0),
    totalWater: (Number(batchData['Wet Blending'].water1) || 0) +
                (Number(batchData['Wet Blending'].water2) || 0),
    totalDough: 0
  };
  totals.totalDough = totals.totalDry + totals.totalWater;

  useEffect(() => {
    if (isLoggedIn) {
      callServer('/api/batches/ids').then((res) => {
        if (res.success) setExistingBatchIds(res.allBatches);
      });

      if (activeTab === 'inProcess') {
        setLoading(true);
        callServer('/api/batches/active').then((res) => {
          setLoading(false);
          if (res.success) setActiveBatchesList(res.activeBatches);
        });
      }
    }
  }, [isLoggedIn, activeTab]);

  useEffect(() => {
    if (reportStartDate && reportEndDate) {
       setLoading(true);
       setReportBatch('ALL');
       callServer(`/api/reports?start=${encodeURIComponent(reportStartDate)}&end=${encodeURIComponent(reportEndDate)}`).then((res) => {
         setLoading(false);
         if (res.success) {
           setFetchedReportData(res.data);
         } else {
           alert("Error fetching data");
           setFetchedReportData({});
         }
       });
    }
  }, [reportStartDate, reportEndDate]);

  const generateBatchCode = () => {
    const info = batchData['General Info'];
    if (!info.factoryCode || !info.date || !info.shift) return 'Pending...';
    const dateObj = new Date(info.date);
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yy = String(dateObj.getFullYear()).slice(-2);
    return `${info.factoryCode}${info.shift}${dd}${mm}${yy}`;
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    callServer('/api/login', { username: loginForm.username, password: loginForm.password }).then((result) => {
      setLoading(false);
      if (result.success) { setIsLoggedIn(true); setCurrentUser(result.username); }
      else setError(result.error);
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setCurrentUser(null);
    setLoginForm({ username: '', password: '' });
    setBatchData(defaultBatchData);
    setSubmittedBatchId(null);
    setActiveTab('batchPrep');
    setExpandedBlock('General Info');
    stopAlarm();
  };

  const submitPrepBatch = () => {
    setLoading(true);
    const batchId = `${generateBatchCode()}-${batchData['General Info'].mixNumber || '00'}`;
    const finalPayloadData = { ...batchData, Totals: totals };
    callServer('/api/batches/prep', { batchId: batchId, data: finalPayloadData, user: currentUser, date: batchData['General Info'].date }).then((result) => {
      setLoading(false);
      if (result.success) {
        setSubmittedBatchId(result.batchId);
        setBatchData(defaultBatchData);
        setExistingBatchIds(prev => [...prev, result.batchId]);
      } else alert("Error: " + result.error);
    });
  };

  const submitInProcessBatch = () => {
    setLoading(true);
    const sensory = inProcessData['Batch Sensory'] || {};
    const totalSensory = (Number(sensory.appearance) || 0) +
                         (Number(sensory.aroma) || 0) +
                         (Number(sensory.pliability) || 0) +
                         (Number(sensory.tearingStrength) || 0) +
                         (Number(sensory.eatingQuality) || 0);

    const payloadToSubmit = { ...inProcessData, 'Batch Sensory': { ...sensory, overallQuality: totalSensory } };

    callServer('/api/batches/inprocess', { batchId: selectedActiveBatch, data: payloadToSubmit, user: currentUser }).then((result) => {
      setLoading(false);
      if (result.success) {
        alert("In-Process Data Submitted Successfully. Batch is now Closed.");
        setInProcessData(defaultInProcessData);
        setSelectedActiveBatch('');
        callServer('/api/batches/active').then(r => setActiveBatchesList(r.activeBatches));
      } else alert("Error: " + result.error);
    });
  };

  const REPORT_SCHEMA = {
    'General Info': ['factoryCode', 'date', 'shift', 'mixNumber'],
    'Dry Blending': ['atta', 'dmg', 'dryTime'],
    'Oil Blending': ['sunflowerOil', 'oilTime'],
    'Wet Blending': ['water1', 'glycerol', 'water2', 'salt', 'ascorbicAcid', 'wetTime'],
    'Final Blending': ['remainingOil', 'finalTime'],
    'Totals': ['totalDry', 'totalWater', 'totalDough'],
    'Quality Checks': ['doughMoisture', 'doughAroma', 'doughTemp', 'waterTemp', 'waterTDS', 'waterPH', 'waterOdour'],
    'Environment': ['roomTemp', 'roomRH'],
    'Prep Sign off': ['doneBy', 'verifiedBy'],
    'Ball Cutting - In Process Check': ['startTime', 'stopTime', 'doughTempStart', 'ballWeight', 'ballOdour', 'fmVisual', 'remarks'],
    'Pressing Section - In Process Check': ['setPressingTemp', 'actualPressingTemp', 'pressingTime', 'setPlatePressure', 'chapatiDia', 'chapatiThickness', 'chapatiTemp', 'cookingUniform', 'shapeSize', 'fmVisual', 'chapatiTempDusting', 'firstDusting', 'secondDusting', 'pressingRoomTemp', 'pressingRoomRH', 'coolingRoomTemp', 'coolingRoomRH', 'remarks'],
    'Packing In Process Check': ['chapatiDiaBefore', 'chapatiThicknessBefore', 'chapatiTempBefore', 'cookingUniform', 'shapeSize', 'fmVisual', 'packingRoomTemp', 'packingRoomRH', 'remarks'],
    'Pack Quality': ['variant', 'sku', 'startTime', 'stopTime', 'sealerNo', 'pouchArtwork', 'pouchShade', 'pouchWeight', 'pouchLength', 'pouchWidth', 'printQuality', 'mrpCheck', 'countPerPack', 'grossWeight', 'sealingQuality', 'productionCount', 'frsKept', 'finalProductOdour', 'finalProductSensory', 'remarks'],
    'Blast Freezer Shifting & Storage': ['bfStartTime', 'bfStopTime', 'bfTotalDuration', 'bfSetTemp', 'productTempShifting', 'chillerSetTemp', 'cratesCleaning', 'remarks'],
    'Batch Sensory': ['appearance', 'aroma', 'pliability', 'tearingStrength', 'eatingQuality', 'overallQuality', 'remarks'],
    'In-Process Sign off': ['doneBy', 'verifiedBy']
  };

  const ORDERED_BLOCKS = Object.keys(REPORT_SCHEMA);
  const PREP_BLOCKS = ['General Info', 'Dry Blending', 'Oil Blending', 'Wet Blending', 'Final Blending', 'Totals', 'Quality Checks', 'Environment', 'Prep Sign off'];
  const IP_BLOCKS = ['Ball Cutting - In Process Check', 'Pressing Section - In Process Check', 'Packing In Process Check', 'Pack Quality', 'Blast Freezer Shifting & Storage', 'Batch Sensory', 'In-Process Sign off'];

  const percentFields = ['doughMoisture', 'roomRH', 'pressingRoomRH', 'coolingRoomRH', 'packingRoomRH'];
  const tempFields = ['doughTemp', 'waterTemp', 'roomTemp', 'doughTempStart', 'setPressingTemp', 'actualPressingTemp', 'chapatiTemp', 'chapatiTempDusting', 'pressingRoomTemp', 'coolingRoomTemp', 'chapatiTempBefore', 'packingRoomTemp', 'bfSetTemp', 'productTempShifting', 'chillerSetTemp'];

  const formatLabel = (str) => {
    const result = str.replace(/([A-Z])/g, " $1").trim();
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  const getFullLabel = (key) => {
    let l = formatLabel(key);
    if (percentFields.includes(key)) return `${l} (%)`;
    if (tempFields.includes(key)) return `${l} (°C)`;
    return l;
  };

  const formatValWithUnit = (key, val) => {
    if (val === undefined || val === null || val === '') return '-';
    if (percentFields.includes(key)) return `${val} %`;
    if (tempFields.includes(key)) return `${val} °C`;
    return val;
  };

  const handleGenerateReport = (reportArray, title, action, rType) => {
    let htmlStr = '\x3C!DOCTYPE html>\n\x3Chtml>\x3Chead>\x3Ctitle>' + title + '\x3C/title>';
    htmlStr += '\x3Cstyle>@page { size: A4 portrait; margin: 15mm; } body { font-family: "Segoe UI", Tahoma, sans-serif; font-size: 10pt; color: #1e293b; line-height: 1.3; } h1 { text-align: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 10px; text-transform: uppercase; margin-bottom: 20px;} .hdr { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; color: #475569; } h2 { color: #1d4ed8; font-size: 12pt; background: #f8fafc; padding: 4px 8px; margin-top: 15px; margin-bottom: 8px; border-bottom: 1px solid #bfdbfe; } table { width: 100%; border-collapse: collapse; margin-bottom: 10px; page-break-inside: avoid; } th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; } th { background-color: #f1f5f9; width: 45%; font-weight: bold; } td { width: 55%; } .page-break { page-break-after: always; padding-top: 20px; }\x3C/style>\x3C/head>\x3Cbody>';

    reportArray.forEach((batch, index) => {
        htmlStr += '\x3Ch1>' + title + '\x3C/h1>';
        htmlStr += '\x3Cdiv class="hdr">\x3Cdiv>\x3Cstrong>Batch ID:\x3C/strong> ' + batch.id + '\x3C/div>\x3Cdiv>\x3Cstrong>Generated:\x3C/strong> ' + new Date().toLocaleString() + '\x3C/div>\x3C/div>';

        ORDERED_BLOCKS.forEach(block => {
           if (rType === 'prep' && !PREP_BLOCKS.includes(block)) return;
           if (rType === 'inProcess' && !IP_BLOCKS.includes(block)) return;

           htmlStr += '\x3Ch2>' + block + '\x3C/h2>\x3Ctable>';
           REPORT_SCHEMA[block].forEach(key => {
              let val = formatValWithUnit(key, batch.data[block]?.[key]);
              htmlStr += '\x3Ctr>\x3Cth>' + getFullLabel(key) + '\x3C/th>\x3Ctd>' + val + '\x3C/td>\x3C/tr>';
           });
           htmlStr += '\x3C/table>';
        });
        if (index < reportArray.length - 1) htmlStr += '\x3Cdiv class="page-break">\x3C/div>';
    });

    if (action === 'pdf') htmlStr += '\x3Cscript>window.onload = function() { window.print(); }\x3C/script>';
    htmlStr += '\x3C/body>\x3C/html>';

    const win = window.open('', '_blank');
    win.document.write(htmlStr);
    win.document.close();
  };

  const handleDownloadCSV = (reportArray, title, rType) => {
    const CSV_HEADERS = [
      'Form_Type', 'Factory_Code_(XX)', 'Date_(DD-MM-YYYY)', 'Shift_(S)', 'Batch_Code_(XXSDDMMYY)', 'Batch_(Mix_Number)', 'Batch_Identification',
      'Select_Atta_-_NP_(gms)', 'DMG_(gms)', 'Dry_Blending_Time_(mm:_ss)', 'Sunflower_Oil_(gms)', 'Oil_Blending_Time_(mm:_ss)',
      'Water_-_1_(gms)', 'Glycerol_(gms)', 'Water_-_2_(gms)', 'Salt_(gms)', 'Ascorbic_Acid_(gms)', 'Wet_Blending_Time_(mm:_ss)',
      'Remaining_Oil_(gms)', 'Blending_Time_(mm:_ss)', 'Total_Dry_(gms)', 'Total_Water_(gms)', 'Total_Dough_(gms)',
      'Dough_Moisture_(%)', 'Dough_Aroma_(Okay_/_Not_Okay)', 'Dough_Temperature_(Deg._C)', 'Water_Temperature_(Deg._C.)', 'Water_TDS', 'Water_Ph', 'Water_Odour',
      'Batching_Room_Temperature_(Deg._Cel.)', 'Batching_Room_Temperature_RH_(%)', 'Batch_Start_time_(Issue_time)',
      'Atta', 'DMG', 'Oil', 'Glycerol', 'Salt', 'Ascorbic_Acid',
      'Done_By_Prep', 'Verified_By_Prep',
      'Start_Time_(hh:mm)_Ball_Cutting', 'Stop_Time_(hh:mm)_Ball_Cutting', 'Dough_Temperature_-_While_Starting_(Deg._Cel.)', 'Ball_Weight_-_Avg._of_10_Balls_(gms)', 'Ball_Odour_(Okay_/_Not_Okay)', 'FM_(Visual)_Ball_Cutting', 'Remarks_Ball_Cutting',
      'Set_Pressing_Temperature_(Deg._Cel.)', 'Actual_Pressing_Temperature_(Deg._Cel.)', 'Pressing_Time_(mm:ss)', 'Set_Plate_Pressure_(Bar)', 'Chapati_Dia_-_After_Press_(mm)', 'Chapati_Thickness_-_After_Press_(mm)', 'Chapati_Temperature_-_After_Press_(Deg._Cel.)', 'Cooking_Uniform_(Y/N)_Pressing', 'Shape_&_Size_(Okay_/_Not_Okay)_Pressing', 'FM_(Visual)_Pressing', 'Chapati_Temperature_-_During_1st_Dusting_(Deg._Cel.)', '1st_dusting_(Okay_/_Not_Okay)', '2nd_Dusting_(Okay_/_Not_Okay)', 'Pressing_Room_Temperature_(Deg._Cel.)', 'Pressing_Room_RH_(%)', 'Cooling_Room_Temperature_(Deg._Cel.)', 'Cooling_Room_RH_(%)', 'Remarks_Pressing',
      'Chapati_Dia_-_Before_Packing_(mm)', 'Chapati_Thickness_-_Before_Packing_(mm)', 'Chapati_Temperature_-_Before_Packing_(mm)', 'Cooking_Uniform_(Y/N)_Packing', 'Shape_&_Size_(Okay_/_Not_Okay)_Packing', 'FM_(Visual)_Packing', 'Packing_Room_Temperature_(Deg._Cel.)', 'Packing_Room_RH_(%)', 'Remarks_Packing',
      'Variant', 'SKU', 'Start_Time_(hh:mm)_Pack', 'Stop_Time_(hh:mm)_Pack', 'Sealer_No.', 'Pouch_Artwork_(Okay_/_Not_Okay)', 'Pouch_Shade_(Okay_/_Not_Okay)', 'Pouch_weight_(gms)', 'Pouch_length_(mm)', 'Pouch_width_(mm)', 'Print_Quality_(Okay_/_Not_Okay)', 'MRP_&_Rs._Per_Kg_(Okay_/_Not_Okay)', 'Count_Per_Pack', 'Gross_Weight_-_Avg._of_10_Packs_(gms)', 'Sealing_Quality_(Okay_/_Not_Okay)', 'Production_from_batch_(Count)', 'FRS_Kept_(Y/N)', 'Final_Product_Odour_-_Batch_(Okay_/_Not_Okay)', 'Final_Product_Sensory_-_Batch_(Okay_/_Not_Okay)', 'Remarks_Pack_Quality',
      'Blast_Freezing_-_Start_Time_(hh:mm)', 'Blast_Freezing_-_Stop_Time_(hh:mm)', 'Total_Blast_freezing_duration_(minutes)', 'Blast_Freezer_Temperature_-_Set_Value_(Deg._Cel.)', 'Product_Temprature_while_shifting_to_chiller_(Deg._Cel)', 'Chiller_Room_Temperature_-_Set_Value_(Deg._Cel.)', 'Crates_Cleaning_Status_(Okay_/_Not_Okay)', 'Remarks_Freezer',
      'Appearance_(N/10)', 'Aroma_(N/10)', 'Pliability_(N/10)', 'Tearing_Strength_(N/10)', 'Eating_Quality_(N/20)', 'Overall_Quality_(N/60)', 'Remarks_Sensory',
      'Done_By_InProcess', 'Verified_By_InProcess'
    ];

    const CSV_MAP = [
      {h:'Form_Type', b:null, f:null}, {h:'Factory_Code_(XX)', b:'General Info', f:'factoryCode'}, {h:'Date_(DD-MM-YYYY)', b:'General Info', f:'date'}, {h:'Shift_(S)', b:'General Info', f:'shift'}, {h:'Batch_Code_(XXSDDMMYY)', b:null, f:null}, {h:'Batch_(Mix_Number)', b:'General Info', f:'mixNumber'}, {h:'Batch_Identification', b:null, f:null},
      {h:'Select_Atta_-_NP_(gms)', b:'Dry Blending', f:'atta'}, {h:'DMG_(gms)', b:'Dry Blending', f:'dmg'}, {h:'Dry_Blending_Time_(mm:_ss)', b:'Dry Blending', f:'dryTime'},
      {h:'Sunflower_Oil_(gms)', b:'Oil Blending', f:'sunflowerOil'}, {h:'Oil_Blending_Time_(mm:_ss)', b:'Oil Blending', f:'oilTime'},
      {h:'Water_-_1_(gms)', b:'Wet Blending', f:'water1'}, {h:'Glycerol_(gms)', b:'Wet Blending', f:'glycerol'}, {h:'Water_-_2_(gms)', b:'Wet Blending', f:'water2'}, {h:'Salt_(gms)', b:'Wet Blending', f:'salt'}, {h:'Ascorbic_Acid_(gms)', b:'Wet Blending', f:'ascorbicAcid'}, {h:'Wet_Blending_Time_(mm:_ss)', b:'Wet Blending', f:'wetTime'},
      {h:'Remaining_Oil_(gms)', b:'Final Blending', f:'remainingOil'}, {h:'Blending_Time_(mm:_ss)', b:'Final Blending', f:'finalTime'},
      {h:'Total_Dry_(gms)', b:'Totals', f:'totalDry'}, {h:'Total_Water_(gms)', b:'Totals', f:'totalWater'}, {h:'Total_Dough_(gms)', b:'Totals', f:'totalDough'},
      {h:'Dough_Moisture_(%)', b:'Quality Checks', f:'doughMoisture'}, {h:'Dough_Aroma_(Okay_/_Not_Okay)', b:'Quality Checks', f:'doughAroma'}, {h:'Dough_Temperature_(Deg._C)', b:'Quality Checks', f:'doughTemp'}, {h:'Water_Temperature_(Deg._C.)', b:'Quality Checks', f:'waterTemp'}, {h:'Water_TDS', b:'Quality Checks', f:'waterTDS'}, {h:'Water_Ph', b:'Quality Checks', f:'waterPH'}, {h:'Water_Odour', b:'Quality Checks', f:'waterOdour'},
      {h:'Batching_Room_Temperature_(Deg._Cel.)', b:'Environment', f:'roomTemp'}, {h:'Batching_Room_Temperature_RH_(%)', b:'Environment', f:'roomRH'}, {h:'Batch_Start_time_(Issue_time)', b:null, f:null},
      {h:'Atta', b:'Dry Blending', f:'atta'}, {h:'DMG', b:'Dry Blending', f:'dmg'}, {h:'Oil', b:'Consumption', f:'oil'}, {h:'Glycerol', b:'Wet Blending', f:'glycerol'}, {h:'Salt', b:'Wet Blending', f:'salt'}, {h:'Ascorbic_Acid', b:'Wet Blending', f:'ascorbicAcid'},
      {h:'Done_By_Prep', b:'Prep Sign off', f:'doneBy'}, {h:'Verified_By_Prep', b:'Prep Sign off', f:'verifiedBy'},
      {h:'Start_Time_(hh:mm)_Ball_Cutting', b:'Ball Cutting - In Process Check', f:'startTime'}, {h:'Stop_Time_(hh:mm)_Ball_Cutting', b:'Ball Cutting - In Process Check', f:'stopTime'}, {h:'Dough_Temperature_-_While_Starting_(Deg._Cel.)', b:'Ball Cutting - In Process Check', f:'doughTempStart'}, {h:'Ball_Weight_-_Avg._of_10_Balls_(gms)', b:'Ball Cutting - In Process Check', f:'ballWeight'}, {h:'Ball_Odour_(Okay_/_Not_Okay)', b:'Ball Cutting - In Process Check', f:'ballOdour'}, {h:'FM_(Visual)_Ball_Cutting', b:'Ball Cutting - In Process Check', f:'fmVisual'}, {h:'Remarks_Ball_Cutting', b:'Ball Cutting - In Process Check', f:'remarks'},
      {h:'Set_Pressing_Temperature_(Deg._Cel.)', b:'Pressing Section - In Process Check', f:'setPressingTemp'}, {h:'Actual_Pressing_Temperature_(Deg._Cel.)', b:'Pressing Section - In Process Check', f:'actualPressingTemp'}, {h:'Pressing_Time_(mm:ss)', b:'Pressing Section - In Process Check', f:'pressingTime'}, {h:'Set_Plate_Pressure_(Bar)', b:'Pressing Section - In Process Check', f:'setPlatePressure'}, {h:'Chapati_Dia_-_After_Press_(mm)', b:'Pressing Section - In Process Check', f:'chapatiDia'}, {h:'Chapati_Thickness_-_After_Press_(mm)', b:'Pressing Section - In Process Check', f:'chapatiThickness'}, {h:'Chapati_Temperature_-_After_Press_(Deg._Cel.)', b:'Pressing Section - In Process Check', f:'chapatiTemp'}, {h:'Cooking_Uniform_(Y/N)_Pressing', b:'Pressing Section - In Process Check', f:'cookingUniform'}, {h:'Shape_&_Size_(Okay_/_Not_Okay)_Pressing', b:'Pressing Section - In Process Check', f:'shapeSize'}, {h:'FM_(Visual)_Pressing', b:'Pressing Section - In Process Check', f:'fmVisual'}, {h:'Chapati_Temperature_-_During_1st_Dusting_(Deg._Cel.)', b:'Pressing Section - In Process Check', f:'chapatiTempDusting'}, {h:'1st_dusting_(Okay_/_Not_Okay)', b:'Pressing Section - In Process Check', f:'firstDusting'}, {h:'2nd_Dusting_(Okay_/_Not_Okay)', b:'Pressing Section - In Process Check', f:'secondDusting'}, {h:'Pressing_Room_Temperature_(Deg._Cel.)', b:'Pressing Section - In Process Check', f:'pressingRoomTemp'}, {h:'Pressing_Room_RH_(%)', b:'Pressing Section - In Process Check', f:'pressingRoomRH'}, {h:'Cooling_Room_Temperature_(Deg._Cel.)', b:'Pressing Section - In Process Check', f:'coolingRoomTemp'}, {h:'Cooling_Room_RH_(%)', b:'Pressing Section - In Process Check', f:'coolingRoomRH'}, {h:'Remarks_Pressing', b:'Pressing Section - In Process Check', f:'remarks'},
      {h:'Chapati_Dia_-_Before_Packing_(mm)', b:'Packing In Process Check', f:'chapatiDiaBefore'}, {h:'Chapati_Thickness_-_Before_Packing_(mm)', b:'Packing In Process Check', f:'chapatiThicknessBefore'}, {h:'Chapati_Temperature_-_Before_Packing_(mm)', b:'Packing In Process Check', f:'chapatiTempBefore'}, {h:'Cooking_Uniform_(Y/N)_Packing', b:'Packing In Process Check', f:'cookingUniform'}, {h:'Shape_&_Size_(Okay_/_Not_Okay)_Packing', b:'Packing In Process Check', f:'shapeSize'}, {h:'FM_(Visual)_Packing', b:'Packing In Process Check', f:'fmVisual'}, {h:'Packing_Room_Temperature_(Deg._Cel.)', b:'Packing In Process Check', f:'packingRoomTemp'}, {h:'Packing_Room_RH_(%)', b:'Packing In Process Check', f:'packingRoomRH'}, {h:'Remarks_Packing', b:'Packing In Process Check', f:'remarks'},
      {h:'Variant', b:'Pack Quality', f:'variant'}, {h:'SKU', b:'Pack Quality', f:'sku'}, {h:'Start_Time_(hh:mm)_Pack', b:'Pack Quality', f:'startTime'}, {h:'Stop_Time_(hh:mm)_Pack', b:'Pack Quality', f:'stopTime'}, {h:'Sealer_No.', b:'Pack Quality', f:'sealerNo'}, {h:'Pouch_Artwork_(Okay_/_Not_Okay)', b:'Pack Quality', f:'pouchArtwork'}, {h:'Pouch_Shade_(Okay_/_Not_Okay)', b:'Pack Quality', f:'pouchShade'}, {h:'Pouch_weight_(gms)', b:'Pack Quality', f:'pouchWeight'}, {h:'Pouch_length_(mm)', b:'Pack Quality', f:'pouchLength'}, {h:'Pouch_width_(mm)', b:'Pack Quality', f:'pouchWidth'}, {h:'Print_Quality_(Okay_/_Not_Okay)', b:'Pack Quality', f:'printQuality'}, {h:'MRP_&_Rs._Per_Kg_(Okay_/_Not_Okay)', b:'Pack Quality', f:'mrpCheck'}, {h:'Count_Per_Pack', b:'Pack Quality', f:'countPerPack'}, {h:'Gross_Weight_-_Avg._of_10_Packs_(gms)', b:'Pack Quality', f:'grossWeight'}, {h:'Sealing_Quality_(Okay_/_Not_Okay)', b:'Pack Quality', f:'sealingQuality'}, {h:'Production_from_batch_(Count)', b:'Pack Quality', f:'productionCount'}, {h:'FRS_Kept_(Y/N)', b:'Pack Quality', f:'frsKept'}, {h:'Final_Product_Odour_-_Batch_(Okay_/_Not_Okay)', b:'Pack Quality', f:'finalProductOdour'}, {h:'Final_Product_Sensory_-_Batch_(Okay_/_Not_Okay)', b:'Pack Quality', f:'finalProductSensory'}, {h:'Remarks_Pack_Quality', b:'Pack Quality', f:'remarks'},
      {h:'Blast_Freezing_-_Start_Time_(hh:mm)', b:'Blast Freezer Shifting & Storage', f:'bfStartTime'}, {h:'Blast_Freezing_-_Stop_Time_(hh:mm)', b:'Blast Freezer Shifting & Storage', f:'bfStopTime'}, {h:'Total_Blast_freezing_duration_(minutes)', b:'Blast Freezer Shifting & Storage', f:'bfTotalDuration'}, {h:'Blast_Freezer_Temperature_-_Set_Value_(Deg._Cel.)', b:'Blast Freezer Shifting & Storage', f:'bfSetTemp'}, {h:'Product_Temprature_while_shifting_to_chiller_(Deg._Cel)', b:'Blast Freezer Shifting & Storage', f:'productTempShifting'}, {h:'Chiller_Room_Temperature_-_Set_Value_(Deg._Cel.)', b:'Blast Freezer Shifting & Storage', f:'chillerSetTemp'}, {h:'Crates_Cleaning_Status_(Okay_/_Not_Okay)', b:'Blast Freezer Shifting & Storage', f:'cratesCleaning'}, {h:'Remarks_Freezer', b:'Blast Freezer Shifting & Storage', f:'remarks'},
      {h:'Appearance_(N/10)', b:'Batch Sensory', f:'appearance'}, {h:'Aroma_(N/10)', b:'Batch Sensory', f:'aroma'}, {h:'Pliability_(N/10)', b:'Batch Sensory', f:'pliability'}, {h:'Tearing_Strength_(N/10)', b:'Batch Sensory', f:'tearingStrength'}, {h:'Eating_Quality_(N/20)', b:'Batch Sensory', f:'eatingQuality'}, {h:'Overall_Quality_(N/60)', b:'Batch Sensory', f:'overallQuality'}, {h:'Remarks_Sensory', b:'Batch Sensory', f:'remarks'},
      {h:'Done_By_InProcess', b:'In-Process Sign off', f:'doneBy'}, {h:'Verified_By_InProcess', b:'In-Process Sign off', f:'verifiedBy'}
    ];

    let csv = CSV_HEADERS.map(h => `"${h}"`).join(',') + '\n';

    reportArray.forEach(batch => {
        const bData = batch.data;
        const getVal = (block, field) => bData[block] && bData[block][field] !== undefined ? String(bData[block][field]).replace(/,/g, '') : '';

        let formType = rType === 'inProcess' ? "In-Process Report" : rType === 'consolidated' ? "Consolidated Report" : "Preparation Report";
        const batchCode = batch.id.split('-')[0] || '';
        const oilConsumption = (Number(getVal('Oil Blending', 'sunflowerOil')) || 0) + (Number(getVal('Final Blending', 'remainingOil')) || 0);

        const rowVals = CSV_MAP.map(m => {
           if(m.h === 'Form_Type') return formType;
           if(m.h === 'Batch_Code_(XXSDDMMYY)') return batchCode;
           if(m.h === 'Batch_Identification') return batch.id;
           if(m.h === 'Oil' && m.b === 'Consumption') return oilConsumption || '';
           if(m.b === null) return '';
           return getVal(m.b, m.f);
        });

        const formattedRowStr = rowVals.map((val, i) => {
           if (val === '') return `""`;
           const header = CSV_HEADERS[i];
           if (header.includes('(%)')) return `"${val} %"`;
           if (header.includes('(Deg')) return `"${val} °C"`;
           return `"${val}"`;
        }).join(',');

        csv += formattedRowStr + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${title.replace(/ /g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeReport = (action) => {
    let batchesToProcess = [];
    if (reportBatch === 'ALL') {
       batchesToProcess = Object.keys(fetchedReportData);
    } else {
       batchesToProcess = [reportBatch];
    }

    if (batchesToProcess.length === 0) return alert("No batches found.");

    let reportArray = [];

    batchesToProcess.forEach(bId => {
        const p = fetchedReportData[bId]?.prep || {};
        const ip = fetchedReportData[bId]?.inProcess || {};
        let dataToPrint = {};

        if (reportType === 'prep') {
          dataToPrint = { ...p };
        } else if (reportType === 'inProcess') {
          dataToPrint = { ...ip };
        } else if (reportType === 'consolidated') {
          dataToPrint = { ...p, ...ip };
        }

        dataToPrint['Prep Sign off'] = p['Sign off'] || {};
        dataToPrint['In-Process Sign off'] = ip['Sign off'] || {};

        reportArray.push({ id: bId, data: dataToPrint });
    });

    if (action === 'csv') {
       handleDownloadCSV(reportArray, `${reportType.toUpperCase()}_REPORT`, reportType);
    } else {
       handleGenerateReport(reportArray, `${reportType.toUpperCase()} REPORT`, action, reportType);
    }
  };

  const updateField = (setStateObj, block, field, value) => {
    setStateObj(prev => ({ ...prev, [block]: { ...prev[block], [field]: value } }));
  };

  const handleSensoryChange = (field, value, maxVal) => {
    let numStr = value;
    if (numStr !== '') {
      let num = Number(numStr);
      if (num > maxVal) numStr = maxVal.toString();
      if (num < 0) numStr = "0";
    }

    setInProcessData(prev => {
      const updatedBlock = { ...prev['Batch Sensory'], [field]: numStr };
      const total = (Number(updatedBlock.appearance) || 0) +
                    (Number(updatedBlock.aroma) || 0) +
                    (Number(updatedBlock.pliability) || 0) +
                    (Number(updatedBlock.tearingStrength) || 0) +
                    (Number(updatedBlock.eatingQuality) || 0);
      updatedBlock.overallQuality = total;
      return { ...prev, ['Batch Sensory']: updatedBlock };
    });
  };

  const renderSensoryInput = (label, field, maxVal) => (
    <div className="mb-4" key={field}>
      <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wide ${t.label}`}>
         {label} (Max: {maxVal})
      </label>
      <input type="number" max={maxVal} min="0"
        className={`w-full rounded-xl p-3 font-bold transition-all outline-none border min-w-0 ${t.input}`}
        value={inProcessData['Batch Sensory']?.[field] ?? ''}
        onChange={e => handleSensoryChange(field, e.target.value, maxVal)}
        placeholder={`0 - ${maxVal}`} />
    </div>
  );

  // isTimeMask parameter automatically formats MM:SS text inputs
  const renderInput = (state, setStateObj, label, block, field, type="text", options=null, isTimeMask=false) => {
    let unit = null;
    if (label.includes('(%)')) unit = '%';
    if (label.includes('(Deg')) unit = '°C';

    const handleChange = (e) => {
      let val = e.target.value;
      if (type === 'text' && field === 'factoryCode') {
        val = val.toUpperCase();
      } else if (isTimeMask) {
        val = val.replace(/\D/g, '');
        if (val.length > 4) val = val.slice(0, 4);
        if (val.length > 2) val = val.slice(0, 2) + ':' + val.slice(2);
      }
      updateField(setStateObj, block, field, val);
    };

    return (
      <div className="mb-4" key={field}>
        <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wide ${t.label}`}>{label}</label>
        <div className="relative min-w-0">
          {options ? (
            <select className={`w-full rounded-xl p-3 transition-all outline-none border min-w-0 ${t.input}`}
              value={state[block][field] || ''} onChange={handleChange}>
              <option value="">Select...</option>
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input type={type} className={`w-full rounded-xl p-3 transition-all outline-none border min-w-0 ${t.input} ${unit ? 'pr-10' : ''} ${isTimeMask ? 'font-mono tracking-widest' : ''}`}
              value={state[block][field] || ''} onChange={handleChange} placeholder={isTimeMask ? "00:00" : ""} />
          )}
          {unit && !options && <span className={`absolute right-4 top-3.5 font-bold pointer-events-none ${t.iconUnit}`}>{unit}</span>}
        </div>
      </div>
    );
  };

  const renderBatchBlock = (blockName) => {
    switch(blockName) {
      case 'General Info': {
        const currentBatchCode = generateBatchCode();
        const currentMixNumber = batchData['General Info']?.mixNumber;
        const currentBatchId = currentMixNumber ? `${currentBatchCode}-${currentMixNumber}` : null;
        const isDuplicateBatch = currentBatchId && existingBatchIds.includes(currentBatchId);

        return (
          <React.Fragment>
            {renderInput(batchData, setBatchData, 'Factory Code (XX)', blockName, 'factoryCode')}
            {renderInput(batchData, setBatchData, 'Date (DD-MM-YYYY)', blockName, 'date', 'date')}
            {renderInput(batchData, setBatchData, 'Shift (S)', blockName, 'shift', 'text', ['A', 'B'])}
            {renderInput(batchData, setBatchData, 'Batch (Mix Number)', blockName, 'mixNumber', 'number')}
            <div className={`mt-5 pt-4 border-t-2 p-4 rounded-xl text-center transition-colors ${isDuplicateBatch ? t.alertCard : t.inputReadonly}`}>
              <span className={`text-xs font-bold uppercase tracking-wider`}>
                {isDuplicateBatch ? '⚠️ DUPLICATE BATCH ID DETECTED' : 'Auto-Generated Batch ID'}
              </span>
              <div className={`text-xl font-mono font-bold mt-1 ${isDuplicateBatch ? 'line-through opacity-70' : ''}`}>
                {currentBatchId || `${currentBatchCode}-...`}
              </div>
              {isDuplicateBatch && <div className="text-xs font-bold mt-2">This Mix Number is already in use. Please enter a new one.</div>}
            </div>
          </React.Fragment>
        );
      }
      case 'Dry Blending':
        return (
          <React.Fragment>
            {renderInput(batchData, setBatchData, 'Select Atta - NP (gms)', blockName, 'atta', 'number')}
            {renderInput(batchData, setBatchData, 'DMG (gms)', blockName, 'dmg', 'number')}
            <Stopwatch label="Dry Blending Time (mm:ss)" targetTime={175} value={batchData[blockName]['dryTime']} onChange={(v) => updateField(setBatchData, blockName, 'dryTime', v)} t={t} />
          </React.Fragment>
        );
      case 'Oil Blending':
        return (
          <React.Fragment>
            {renderInput(batchData, setBatchData, 'Sunflower Oil (gms)', blockName, 'sunflowerOil', 'number')}
            <Stopwatch label="Oil Blending Time (mm:ss)" targetTime={235} value={batchData[blockName]['oilTime']} onChange={(v) => updateField(setBatchData, blockName, 'oilTime', v)} t={t} />
          </React.Fragment>
        );
      case 'Wet Blending':
        return (
          <React.Fragment>
            {renderInput(batchData, setBatchData, 'Water - 1 (gms)', blockName, 'water1', 'number')}
            {renderInput(batchData, setBatchData, 'Glycerol (gms)', blockName, 'glycerol', 'number')}
            {renderInput(batchData, setBatchData, 'Water - 2 (gms)', blockName, 'water2', 'number')}
            {renderInput(batchData, setBatchData, 'Salt (gms)', blockName, 'salt', 'number')}
            {renderInput(batchData, setBatchData, 'Ascorbic Acid (gms)', blockName, 'ascorbicAcid', 'number')}
            <Stopwatch label="Wet Blending Time (mm:ss)" targetTime={145} value={batchData[blockName]['wetTime']} onChange={(v) => updateField(setBatchData, blockName, 'wetTime', v)} t={t} />
          </React.Fragment>
        );
      case 'Final Blending':
        return (
          <React.Fragment>
            {renderInput(batchData, setBatchData, 'Remaining Oil (gms)', blockName, 'remainingOil', 'number')}
            <Stopwatch label="Blending Time (mm:ss)" targetTime={55} value={batchData[blockName]['finalTime']} onChange={(v) => updateField(setBatchData, blockName, 'finalTime', v)} t={t} />
          </React.Fragment>
        );
      case 'Totals':
        return (
          <div className={`space-y-3 font-mono text-sm p-3 rounded-lg border min-w-0 ${t.inputReadonly}`}>
            <div className="flex justify-between opacity-80"><span>Total Dry:</span> <span className="font-bold">{totals.totalDry.toFixed(3)} gms</span></div>
            <div className="flex justify-between opacity-80"><span>Total Water:</span> <span className="font-bold">{totals.totalWater.toFixed(3)} gms</span></div>
            <div className="flex justify-between border-t border-current/20 pt-3 text-base">
              <span className="font-bold">Total Dough:</span> <span className="font-bold">{totals.totalDough.toFixed(3)} gms</span>
            </div>
          </div>
        );
      case 'Quality Checks':
        return (
          <React.Fragment>
            {renderInput(batchData, setBatchData, 'Dough Moisture (%)', blockName, 'doughMoisture', 'number')}
            {renderInput(batchData, setBatchData, 'Dough Aroma', blockName, 'doughAroma', 'text', ['Okay', 'Not Okay'])}
            {renderInput(batchData, setBatchData, 'Dough Temperature (Deg. Cel.)', blockName, 'doughTemp', 'number')}
            {renderInput(batchData, setBatchData, 'Water Temperature (Deg. Cel.)', blockName, 'waterTemp', 'number')}
            {renderInput(batchData, setBatchData, 'Water TDS', blockName, 'waterTDS', 'number')}
            {renderInput(batchData, setBatchData, 'Water pH', blockName, 'waterPH', 'number')}
            {renderInput(batchData, setBatchData, 'Water Odour', blockName, 'waterOdour', 'text', ['Okay', 'Not Okay'])}
          </React.Fragment>
        );
      case 'Environment':
        return (
          <React.Fragment>
            {renderInput(batchData, setBatchData, 'Batching Room Temperature (Deg. Cel.)', blockName, 'roomTemp', 'number')}
            {renderInput(batchData, setBatchData, 'Batching Room RH (%)', blockName, 'roomRH', 'number')}
          </React.Fragment>
        );
      case 'Sign off': {
        const isDuplicateBatchSignOff = existingBatchIds.includes(`${generateBatchCode()}-${batchData['General Info']?.mixNumber}`);
        return (
          <React.Fragment>
            {renderInput(batchData, setBatchData, 'Done By', blockName, 'doneBy')}
            {renderInput(batchData, setBatchData, 'Verified By', blockName, 'verifiedBy')}
            <button onClick={submitPrepBatch} disabled={loading || isDuplicateBatchSignOff} className={`w-full font-bold py-4 px-4 rounded-xl mt-4 transition-transform ${isDuplicateBatchSignOff ? 'opacity-50 cursor-not-allowed text-white bg-slate-500' : `hover:-translate-y-0.5 ${t.btnPrimary}`}`}>
              {loading ? 'Submitting...' : isDuplicateBatchSignOff ? 'Cannot Submit Duplicate' : 'Submit Batch Record'}
            </button>
          </React.Fragment>
        );
      }
      default: return null;
    }
  };

  const renderInProcessBlock = (blockName) => {
    switch(blockName) {
      case 'Ball Cutting - In Process Check':
        return (
          <React.Fragment>
            {renderInput(inProcessData, setInProcessData, 'Start Time (hh:mm)', blockName, 'startTime', 'time')}
            {renderInput(inProcessData, setInProcessData, 'Stop Time (hh:mm)', blockName, 'stopTime', 'time')}
            {renderInput(inProcessData, setInProcessData, 'Dough Temperature - While Starting (Deg. Cel.)', blockName, 'doughTempStart', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Ball Weight - Avg. of 10 Balls (gms)', blockName, 'ballWeight', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Ball Odour (Okay / Not Okay)', blockName, 'ballOdour', 'text', ['Okay', 'Not Okay'])}
            {renderInput(inProcessData, setInProcessData, 'FM (Visual) (Y/N)', blockName, 'fmVisual', 'text', ['Y', 'N'])}
            {renderInput(inProcessData, setInProcessData, 'Remarks', blockName, 'remarks', 'text')}
          </React.Fragment>
        );
      case 'Pressing Section - In Process Check':
        return (
          <React.Fragment>
            {renderInput(inProcessData, setInProcessData, 'Set Pressing Temperature (Deg. Cel.)', blockName, 'setPressingTemp', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Actual Pressing Temperature (Deg. Cel.)', blockName, 'actualPressingTemp', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Pressing Time (mm:ss)', blockName, 'pressingTime', 'text', null, true)}
            {renderInput(inProcessData, setInProcessData, 'Set Plate Pressure (Bar)', blockName, 'setPlatePressure', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Chapati Dia - After Press (mm)', blockName, 'chapatiDia', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Chapati Thickness - After Press (mm)', blockName, 'chapatiThickness', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Chapati Temperature - After Press (Deg. Cel.)', blockName, 'chapatiTemp', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Cooking Uniform (Y/N)', blockName, 'cookingUniform', 'text', ['Y', 'N'])}
            {renderInput(inProcessData, setInProcessData, 'Shape & Size (Okay / Not Okay)', blockName, 'shapeSize', 'text', ['Okay', 'Not Okay'])}
            {renderInput(inProcessData, setInProcessData, 'FM (Visual) (Y/N)', blockName, 'fmVisual', 'text', ['Y', 'N'])}
            {renderInput(inProcessData, setInProcessData, 'Chapati Temperature - During 1st Dusting (Deg. Cel.)', blockName, 'chapatiTempDusting', 'number')}
            {renderInput(inProcessData, setInProcessData, '1st dusting (Okay / Not Okay)', blockName, 'firstDusting', 'text', ['Okay', 'Not Okay'])}
            {renderInput(inProcessData, setInProcessData, '2nd Dusting (Okay / Not Okay)', blockName, 'secondDusting', 'text', ['Okay', 'Not Okay'])}
            {renderInput(inProcessData, setInProcessData, 'Pressing Room Temperature (Deg. Cel.)', blockName, 'pressingRoomTemp', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Pressing Room RH (%)', blockName, 'pressingRoomRH', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Cooling Room Temperature (Deg. Cel.)', blockName, 'coolingRoomTemp', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Cooling Room RH (%)', blockName, 'coolingRoomRH', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Remarks', blockName, 'remarks', 'text')}
          </React.Fragment>
        );
      case 'Packing In Process Check':
        return (
          <React.Fragment>
            {renderInput(inProcessData, setInProcessData, 'Chapati Dia - Before Packing (mm)', blockName, 'chapatiDiaBefore', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Chapati Thickness - Before Packing (mm)', blockName, 'chapatiThicknessBefore', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Chapati Temperature - Before Packing (mm)', blockName, 'chapatiTempBefore', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Cooking Uniform (Y/N)', blockName, 'cookingUniform', 'text', ['Y', 'N'])}
            {renderInput(inProcessData, setInProcessData, 'Shape & Size (Okay / Not Okay)', blockName, 'shapeSize', 'text', ['Okay', 'Not Okay'])}
            {renderInput(inProcessData, setInProcessData, 'FM (Visual) (Y/N)', blockName, 'fmVisual', 'text', ['Y', 'N'])}
            {renderInput(inProcessData, setInProcessData, 'Packing Room Temperature (Deg. Cel.)', blockName, 'packingRoomTemp', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Packing Room RH (%)', blockName, 'packingRoomRH', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Remarks', blockName, 'remarks', 'text')}
          </React.Fragment>
        );
      case 'Pack Quality':
        return (
          <React.Fragment>
            {renderInput(inProcessData, setInProcessData, 'Variant', blockName, 'variant', 'text')}
            {renderInput(inProcessData, setInProcessData, 'SKU', blockName, 'sku', 'text')}
            {renderInput(inProcessData, setInProcessData, 'Start Time (hh:mm)', blockName, 'startTime', 'time')}
            {renderInput(inProcessData, setInProcessData, 'Stop Time (hh:mm)', blockName, 'stopTime', 'time')}
            {renderInput(inProcessData, setInProcessData, 'Sealer No.', blockName, 'sealerNo', 'text')}
            {renderInput(inProcessData, setInProcessData, 'Pouch Artwork (Okay / Not Okay)', blockName, 'pouchArtwork', 'text', ['Okay', 'Not Okay'])}
            {renderInput(inProcessData, setInProcessData, 'Pouch Shade (Okay / Not Okay)', blockName, 'pouchShade', 'text', ['Okay', 'Not Okay'])}
            {renderInput(inProcessData, setInProcessData, 'Pouch weight (gms)', blockName, 'pouchWeight', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Pouch length (mm)', blockName, 'pouchLength', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Pouch width (mm)', blockName, 'pouchWidth', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Print Quality (Okay / Not Okay)', blockName, 'printQuality', 'text', ['Okay', 'Not Okay'])}
            {renderInput(inProcessData, setInProcessData, 'MRP & Rs. Per Kg (Okay / Not Okay)', blockName, 'mrpCheck', 'text', ['Okay', 'Not Okay'])}
            {renderInput(inProcessData, setInProcessData, 'Count Per Pack', blockName, 'countPerPack', 'number')}

            <div className="mb-4" key="grossWeight">
              <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wide ${t.label}`}>Gross Weight - Avg. of 10 Packs (gms)</label>
              <input type="text" readOnly className={`w-full rounded-xl p-3 font-bold transition-all outline-none border min-w-0 ${t.input} cursor-pointer text-center`}
                value={inProcessData['Pack Quality']['grossWeight'] ? `${inProcessData['Pack Quality']['grossWeight']} gms` : ''}
                onClick={() => setShowWeightModal(true)}
                placeholder="Tap here to record 10 packs" />
            </div>

            {renderInput(inProcessData, setInProcessData, 'Sealing Quality (Okay / Not Okay)', blockName, 'sealingQuality', 'text', ['Okay', 'Not Okay'])}
            {renderInput(inProcessData, setInProcessData, 'Production from batch (Count)', blockName, 'productionCount', 'number')}
            {renderInput(inProcessData, setInProcessData, 'FRS Kept (Y/N)', blockName, 'frsKept', 'text', ['Y', 'N'])}
            {renderInput(inProcessData, setInProcessData, 'Final Product Odour - Batch (Okay / Not Okay)', blockName, 'finalProductOdour', 'text', ['Okay', 'Not Okay'])}
            {renderInput(inProcessData, setInProcessData, 'Final Product Sensory - Batch (Okay / Not Okay)', blockName, 'finalProductSensory', 'text', ['Okay', 'Not Okay'])}
            {renderInput(inProcessData, setInProcessData, 'Remarks', blockName, 'remarks', 'text')}
          </React.Fragment>
        );
      case 'Blast Freezer Shifting & Storage':
        return (
          <React.Fragment>
            <BlastFreezerTracker data={inProcessData[blockName]} onUpdate={(field, val) => updateField(setInProcessData, blockName, field, val)} t={t} />
            {renderInput(inProcessData, setInProcessData, 'Blast Freezer Temperature - Set Value (Deg. Cel.)', blockName, 'bfSetTemp', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Product Temprature while shifting to chiller (Deg. Cel.)', blockName, 'productTempShifting', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Chiller Room Temperature - Set Value (Deg. Cel.)', blockName, 'chillerSetTemp', 'number')}
            {renderInput(inProcessData, setInProcessData, 'Crates Cleaning Status (Okay / Not Okay)', blockName, 'cratesCleaning', 'text', ['Okay', 'Not Okay'])}
            {renderInput(inProcessData, setInProcessData, 'Remarks', blockName, 'remarks', 'text')}
          </React.Fragment>
        );
      case 'Batch Sensory':
        return (
          <React.Fragment>
            {renderSensoryInput('Appearance', 'appearance', 10)}
            {renderSensoryInput('Aroma', 'aroma', 10)}
            {renderSensoryInput('Pliability', 'pliability', 10)}
            {renderSensoryInput('Tearing Strength', 'tearingStrength', 10)}
            {renderSensoryInput('Eating Quality', 'eatingQuality', 20)}

            <div className="mb-4 pt-3 mt-4 border-t border-slate-200/50">
              <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wide ${t.label}`}>
                Overall Quality (Max: 60) - Auto Calculated
              </label>
              <input type="number" readOnly
                className={`w-full rounded-xl p-3 font-black text-xl text-center tracking-wider outline-none border min-w-0 ${t.inputReadonly}`}
                value={inProcessData['Batch Sensory']?.overallQuality || 0} />
            </div>

            {renderInput(inProcessData, setInProcessData, 'Remarks', blockName, 'remarks', 'text')}
          </React.Fragment>
        );
      case 'Sign off':
        return (
          <React.Fragment>
            {renderInput(inProcessData, setInProcessData, 'Done By', blockName, 'doneBy')}
            {renderInput(inProcessData, setInProcessData, 'Verified By', blockName, 'verifiedBy')}
            <button onClick={submitInProcessBatch} disabled={loading} className={`w-full font-bold py-4 rounded-xl mt-4 transition-transform hover:-translate-y-0.5 ${t.btnPrimary}`}>
              {loading ? 'Submitting...' : 'Sign Off & Complete Batch'}
            </button>
          </React.Fragment>
        );
      default:
        return null;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 transition-colors ${t.appBg}`}>
        <form onSubmit={handleLogin} className={`p-8 rounded-3xl w-full max-w-sm border transition-colors ${t.card}`}>
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 text-blue-500 flex justify-center"><div className="bg-blue-100 p-3 rounded-full"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg></div></div>
            <h2 className="text-3xl font-extrabold tracking-tight">PCQMS Login</h2>
            <p className={`text-sm mt-1 ${t.label}`}>Authenticate via FLAuthenticationlist</p>
          </div>
          {error && <div className={`p-3 rounded-xl mb-6 text-sm font-bold border flex items-center ${t.alertCard}`}>{error}</div>}
          <div className="mb-5 min-w-0">
            <label className={`block text-xs font-bold mb-2 uppercase tracking-wide ${t.label}`}>USERNAME</label>
            <input type="text" required className={`w-full rounded-xl p-3.5 transition-all outline-none border min-w-0 ${t.input}`} value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
          </div>
          <div className="mb-8 min-w-0">
            <label className={`block text-xs font-bold mb-2 uppercase tracking-wide ${t.label}`}>PASSWORD</label>
            <input type="password" required className={`w-full rounded-xl p-3.5 transition-all outline-none border min-w-0 ${t.input}`} value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
          </div>
          <button type="submit" className={`w-full font-bold py-4 rounded-xl transition-all ${t.btnPrimary}`}>{loading ? 'Authenticating...' : 'Secure Login'}</button>
        </form>
      </div>
    );
  }

  const batchPrepBlocksList = ['General Info', 'Dry Blending', 'Oil Blending', 'Wet Blending', 'Final Blending', 'Totals', 'Quality Checks', 'Environment', 'Sign off'];
  const inProcessBlocksList = ['Ball Cutting - In Process Check', 'Pressing Section - In Process Check', 'Packing In Process Check', 'Pack Quality', 'Blast Freezer Shifting & Storage', 'Batch Sensory', 'Sign off'];

  return (
    <div className={`min-h-screen pb-24 transition-colors ${t.appBg}`}>
      <header className={`p-4 sticky top-0 flex justify-between items-center z-10 transition-colors ${t.header}`}>
        <h1 className="font-extrabold text-lg tracking-tight">PCQMS Mobile</h1>
        <div className="flex items-center gap-3">

          <div className="relative">
            <button onClick={() => setShowThemeMenu(!showThemeMenu)} className="text-white/80 hover:text-white transition-colors p-1" title="Settings / Theme">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </button>
            {showThemeMenu && (
              <div className="absolute right-0 mt-3 w-48 rounded-2xl shadow-2xl bg-white border border-slate-200 overflow-hidden z-50 animate-[fadeIn_0.15s_ease-out]">
                 <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">UI Themes</div>
                 <button onClick={()=>{setCurrentTheme('default'); setShowThemeMenu(false);}} className="block w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">Default Blue</button>
                 <button onClick={()=>{setCurrentTheme('electric'); setShowThemeMenu(false);}} className="block w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-900 hover:text-cyan-400 transition-colors">Electric Industrial</button>
                 <button onClick={()=>{setCurrentTheme('corporate'); setShowThemeMenu(false);}} className="block w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">Corporate Indigo</button>
                 <button onClick={()=>{setCurrentTheme('amber'); setShowThemeMenu(false);}} className="block w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-600 transition-colors">Vibrant Amber</button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm min-w-0">
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.8)]"></div>
            <span className="text-xs font-bold truncate max-w-[80px] sm:max-w-xs">{currentUser}</span>
          </div>
          <button onClick={handleLogout} className="text-white/80 hover:text-white transition-colors" title="Logout"><svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg></button>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {activeTab === 'batchPrep' && (
          <div className="animate-[fadeIn_0.3s_ease-in-out]">
            {submittedBatchId ? (
              <div className={`text-center py-10 rounded-3xl border p-6 mt-4 ${t.card}`}>
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-2xl font-extrabold mb-2">Batch Submitted!</h3>
                <p className={`font-mono mb-8 p-3 rounded-xl min-w-0 break-all ${t.inputReadonly}`}>{submittedBatchId}</p>
                <button onClick={() => setSubmittedBatchId(null)} className={`w-full font-bold py-4 px-4 rounded-xl border ${t.btnOutline}`}>Start Next Batch</button>
              </div>
            ) : (
              <>
                <h2 className="text-xl md:text-2xl font-extrabold mb-5 tracking-tight whitespace-nowrap">Batch Preparation Record</h2>
                {batchPrepBlocksList.map(block => (
                  <div key={block} className={`rounded-2xl mb-4 overflow-hidden transition-all duration-200 border ${t.card}`}>
                    <button className={`w-full text-left px-5 py-4 font-bold flex justify-between items-center transition-colors ${expandedBlock === block ? t.titleActive : t.titleInactive}`} onClick={() => setExpandedBlock(expandedBlock === block ? null : block)}>
                      {block} <span className={`text-xl transition-transform duration-300 ${expandedBlock === block ? 'rotate-180' : 'opacity-50'}`}>▼</span>
                    </button>
                    {expandedBlock === block && (<div className="p-5">{renderBatchBlock(block)}</div>)}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'inProcess' && (
          <div className="animate-[fadeIn_0.3s_ease-in-out]">
            <h2 className="text-xl md:text-2xl font-extrabold mb-5 tracking-tight whitespace-nowrap">Batch In Process Check</h2>
            <div className={`p-5 rounded-2xl mb-5 border ${t.card}`}>
              <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${t.label}`}>Select Active Batch ID</label>
              {loading && activeBatchesList.length === 0 ? (
                 <div className="text-sm font-bold animate-pulse opacity-70">Loading active batches...</div>
              ) : (
                <select className={`w-full rounded-xl p-3.5 outline-none transition-all border min-w-0 ${t.input}`}
                        value={selectedActiveBatch} onChange={(e) => setSelectedActiveBatch(e.target.value)}>
                  <option value="">-- Choose Batch --</option>
                  {activeBatchesList.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              )}
            </div>

            {!selectedActiveBatch ? (
              <div className={`text-center p-8 rounded-2xl border border-dashed ${t.card}`}>
                <svg className="w-12 h-12 opacity-20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <p className={`font-medium ${t.label}`}>Please select an Active Batch from the dropdown above to continue.</p>
              </div>
            ) : (
              <>
                {inProcessBlocksList.map(block => (
                  <div key={block} className={`rounded-2xl mb-3 overflow-hidden transition-all duration-200 border ${t.card}`}>
                    <button className={`w-full text-left px-5 py-4 font-bold flex justify-between items-center transition-colors ${expandedBlock === block ? t.titleActive : t.titleInactive}`}
                            onClick={() => setExpandedBlock(expandedBlock === block ? null : block)}>
                      {block} <span className={`text-xl transition-transform duration-300 ${expandedBlock === block ? 'rotate-180' : 'opacity-50'}`}>▼</span>
                    </button>
                    {expandedBlock === block && (
                      <div className="p-5">
                         {renderInProcessBlock(block)}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="animate-[fadeIn_0.3s_ease-in-out]">
            <h2 className="text-xl md:text-2xl font-extrabold mb-5 tracking-tight whitespace-nowrap">Reports Generator</h2>

            <div className={`p-5 rounded-3xl mb-5 border ${t.card}`}>
              <div className="mb-6">
                <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${t.label}`}>1. Select Report Type</label>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setReportType('prep')} className={`py-3 px-4 rounded-xl font-bold border transition-all ${reportType === 'prep' ? t.btnPrimary : t.btnOutline}`}>Batch Preparation Report</button>
                  <button onClick={() => setReportType('inProcess')} className={`py-3 px-4 rounded-xl font-bold border transition-all ${reportType === 'inProcess' ? t.btnPrimary : t.btnOutline}`}>Batch In-Process Check Report</button>
                  <button onClick={() => setReportType('consolidated')} className={`py-3 px-4 rounded-xl font-bold border transition-all ${reportType === 'consolidated' ? t.btnPrimary : t.btnOutline}`}>Consolidated Batch Report</button>
                </div>
              </div>

              {reportType && (
                <div className="mb-6 border-t border-slate-200/50 pt-5">
                  <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${t.label}`}>2. Select Period</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="min-w-0">
                       <span className={`text-[10px] font-bold block mb-1 uppercase tracking-wider opacity-60 ${t.label}`}>From</span>
                       <input type="date" className={`w-full rounded-xl p-3 font-bold transition-all outline-none border min-w-0 ${t.input}`}
                         value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} />
                    </div>
                    <div className="min-w-0">
                       <span className={`text-[10px] font-bold block mb-1 uppercase tracking-wider opacity-60 ${t.label}`}>To</span>
                       <input type="date" className={`w-full rounded-xl p-3 font-bold transition-all outline-none border min-w-0 ${t.input}`}
                         value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} />
                    </div>
                  </div>
                  {loading && <div className="text-sm font-bold animate-pulse mt-3 opacity-70">Fetching batch records...</div>}
                </div>
              )}

              {(reportStartDate && reportEndDate && !loading) && (
                <div className="mb-6 border-t border-slate-200/50 pt-5">
                  <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${t.label}`}>3. Select Batch ID</label>
                  {Object.keys(fetchedReportData).length === 0 ? (
                     <div className="text-red-500 text-sm font-bold">No records found for this period.</div>
                  ) : (
                     <select className={`w-full rounded-xl p-3 font-mono font-bold outline-none transition-all border min-w-0 ${t.input}`}
                             value={reportBatch} onChange={(e) => setReportBatch(e.target.value)}>
                       <option value="ALL">All Batches (Bulk Export)</option>
                       {Object.keys(fetchedReportData).map(b => <option key={b} value={b}>{b}</option>)}
                     </select>
                  )}
                </div>
              )}

              {(reportBatch && Object.keys(fetchedReportData).length > 0) && (
                  <div className="border-t border-slate-200/50 pt-5">
                     <label className={`block text-xs font-bold mb-3 uppercase tracking-wider ${t.label}`}>4. Export Options</label>
                     <div className="grid grid-cols-3 gap-2">
                       <button onClick={() => executeReport('view')} className={`font-bold py-3 rounded-xl border flex items-center justify-center gap-1 transition-all ${t.btnOutline}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg> <span className="hidden sm:inline">View</span>
                       </button>
                       <button onClick={() => executeReport('pdf')} className={`font-bold py-3 rounded-xl flex items-center justify-center gap-1 transition-all ${t.btnStop}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> <span className="hidden sm:inline">PDF</span>
                       </button>
                       <button onClick={() => executeReport('csv')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-1 transition-all hover:-translate-y-0.5">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> <span className="hidden sm:inline">CSV</span>
                       </button>
                     </div>
                  </div>
              )}
            </div>
          </div>
        )}
      </main>

      <nav className={`fixed bottom-0 w-full glass-nav flex justify-around px-1 py-2 pb-safe z-20 transition-colors ${t.navBg}`}>
        <button onClick={() => {setActiveTab('batchPrep'); setExpandedBlock('General Info');}} className={`flex flex-col items-center justify-center w-full py-1.5 px-1 transition-all duration-300 ${activeTab === 'batchPrep' ? t.navActive : t.navInactive}`}>
          <div className="relative">
            {activeTab === 'batchPrep' && <div className="absolute inset-[-8px] opacity-10 rounded-lg animate-pulse" style={{backgroundColor: 'currentColor'}}></div>}
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mb-1 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-center leading-tight mt-1">Batch Preparation<br/>Record</span>
        </button>
        <button onClick={() => setActiveTab('inProcess')} className={`flex flex-col items-center justify-center w-full py-1.5 px-1 border-l border-r border-slate-300/30 transition-all duration-300 ${activeTab === 'inProcess' ? t.navActive : t.navInactive}`}>
          <div className="relative">
            {activeTab === 'inProcess' && <div className="absolute inset-[-8px] opacity-10 rounded-lg animate-pulse" style={{backgroundColor: 'currentColor'}}></div>}
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mb-1 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-center leading-tight mt-1">Batch In Process<br/>Check</span>
        </button>
        <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center justify-center w-full py-1.5 px-1 transition-all duration-300 ${activeTab === 'reports' ? t.navActive : t.navInactive}`}>
          <div className="relative">
            {activeTab === 'reports' && <div className="absolute inset-[-8px] opacity-10 rounded-lg animate-pulse" style={{backgroundColor: 'currentColor'}}></div>}
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mb-1 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-center leading-tight mt-1">Reports</span>
        </button>
      </nav>

      {showWeightModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-3xl shadow-2xl flex flex-col max-h-[90vh] border ${t.card}`}>
            <div className={`p-5 border-b rounded-t-3xl flex justify-between items-center ${t.titleActive}`}>
              <h3 className="font-extrabold text-lg">Record 10 Pack Weights</h3>
              <button onClick={() => setShowWeightModal(false)} className="text-2xl font-black opacity-70 hover:opacity-100">&times;</button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {packWeights.map((w, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-16 text-xs font-bold tracking-wider ${t.label}`}>Pack {i + 1}</span>
                  <input type="number" className={`flex-1 rounded-xl p-3 font-bold transition-all outline-none border min-w-0 ${t.input}`}
                    value={w} onChange={e => {
                      const newW = [...packWeights];
                      newW[i] = e.target.value;
                      setPackWeights(newW);
                    }} placeholder="gms" />
                </div>
              ))}
            </div>
            <div className={`p-5 border-t rounded-b-3xl ${t.navBg}`}>
              <button onClick={() => {
                const vW = packWeights.map(Number).filter(n => n > 0);
                if (vW.length > 0) {
                  const avg = vW.reduce((a, b) => a + b, 0) / vW.length;
                  updateField(setInProcessData, 'Pack Quality', 'grossWeight', avg.toFixed(2));
                }
                setShowWeightModal(false);
              }} className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg hover:-translate-y-0.5 ${t.btnPrimary}`}>
                Calculate Average & Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
