import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Menu, Settings, X, CheckCircle2, Search, Barcode, MapPin, FileText, Globe, Clock, Boxes, Warehouse, FileSearch, Lock, QrCode, ArrowRight, Plus, Target, Camera, Image, Trash2, Maximize2 } from 'lucide-react';
import QRScannerModal from './QRScannerModal';
import { translations } from '../data/translations';

// Web Audio API Sound Synth for Warehouse TSD Barcode Scanner Beeps
const playBeepSuccess = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 pitch (High crisp warehouse beep)
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    // Ignore audio errors
  }
};

const playBeepError = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime); // Low warning tone
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Ignore audio errors
  }
};

// HELPER: VALIDATE STRICT 84-0000... PALLET PREFIX
const isPalletValid = (code) => {
  if (!code) return false;
  const clean = code.trim().toUpperCase();
  return clean.startsWith('84-000') || clean.startsWith('84000') || clean.startsWith('PL-84') || clean.startsWith('84-');
};

// HELPER: VALIDATE STRICT 80-0000... KOROB PREFIX
const isKorobValid = (code) => {
  if (!code) return false;
  const clean = code.trim().toUpperCase();
  return clean.startsWith('80-') || clean.startsWith('8000') || clean.startsWith('80-0') || clean.startsWith('80');
};

export default function WarehouseTerminalApp({ dbData, onAddBox, onUpdatePalletZone, onDispatchPlacement, onResetData, showToast }) {
  // --- LANGUAGE STATE ('uz' | 'ru') ---
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('wms_lang') || 'uz';
  });

  const t = translations[lang] || translations.uz;

  const toggleLanguage = () => {
    const nextLang = lang === 'uz' ? 'ru' : 'uz';
    setLang(nextLang);
    localStorage.setItem('wms_lang', nextLang);
    showToast(nextLang === 'uz' ? "Til O'zbekchaga o'zgartirildi" : "Язык изменен на Русский", 'success');
  };

  // --- STEP 1: AUTHORIZATION GATE STATE ---
  const [currentUser, setCurrentUser] = useState(null);

  const [isAuthorized, setIsAuthorized] = useState(false);

  // Login Form States (EMPTY BY DEFAULT SO WORKER ENTERS FIO)
  const [fioInput, setFioInput] = useState('');
  const [selectedShift, setSelectedShift] = useState('1 смена');

  // --- STEP 2: DIRECTION / MODE SELECTION STATE ---
  // 'sanash' (Сортировка) | 'parkovka' | 'poisk' | null
  const [selectedDirection, setSelectedDirection] = useState(null);

  // --- STEP 3 & 4: SORTING WORKFLOW STATE ---
  const [sanashGmCode, setSanashGmCode] = useState('');
  const [sanashGmLocked, setSanashGmLocked] = useState(false); // false = Step 3 (scan GM), true = Step 4 (scan Korobs)
  const [actInput, setActInput] = useState('');
  const [scannedActs, setScannedActs] = useState([]);
  const [lastScannedAct, setLastScannedAct] = useState('');
  const [sanashClosed, setSanashClosed] = useState(false);

  // --- PARKOVKA WORKFLOW STATE ---
  const [parkStep, setParkStep] = useState(1); // 1: GM, 2: Zone, 3: Completed
  const [parkGmCode, setParkGmCode] = useState('');
  const [parkZoneCode, setParkZoneCode] = useState('');

  // --- POISK WORKFLOW STATE ---
  const [searchActQuery, setSearchActQuery] = useState('');

  // Drawers & Modals State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // REFS FOR HARDWARE BARCODE SCANNER CONTINUOUS AUTOFOCUS
  const activeInputRef = useRef(null);

  // Hardware Scanner Focus Guard: Always keep active input focused so physical scanner gun input is never missed!
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (activeInputRef.current && !sanashClosed) {
        activeInputRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(focusTimer);
  }, [selectedDirection, sanashGmLocked, parkStep, scannedActs.length, sanashClosed]);

  // Global Click Listener properly ignores clicks inside ANY button or span inside button!
  const handleGlobalClick = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) {
      return;
    }
    if (activeInputRef.current && !sanashClosed) {
      activeInputRef.current.focus();
    }
  };

  useEffect(() => {
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [sanashClosed]);

  // ---------------------------------------------------------
  // HANDLERS WITH STRICT 84-0000... PALLET VALIDATION
  // ---------------------------------------------------------

  // Handle Step 1: Login Submission
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!fioInput.trim()) {
      playBeepError();
      showToast(t.fioError, 'error');
      return;
    }

    const userObj = {
      name: fioInput.trim(),
      shift: selectedShift,
      floor: 'M1'
    };

    setCurrentUser(userObj);
    setIsAuthorized(true);
    setSelectedDirection(null); // Go to Step 2 (Direction Selection)
    localStorage.setItem('wms_current_user', JSON.stringify(userObj));
    playBeepSuccess();
    showToast(`${userObj.name}!`, 'success');
  };

  // Step 2: Choose Direction
  const handleSelectDirection = (mode) => {
    setSelectedDirection(mode);
    playBeepSuccess();
    if (mode === 'sanash') {
      handleResetSanash();
    } else if (mode === 'parkovka') {
      handleResetParkovka();
    } else {
      setSearchActQuery('');
    }
  };

  // Reset Sanash / Sorting
  const handleResetSanash = () => {
    setSanashGmCode('');
    setSanashGmLocked(false);
    setScannedActs([]);
    setLastScannedAct('');
    setSanashClosed(false);
    setActInput('');
  };

  // Handle Step 3: Scan Pallet (MUST START WITH 84-0000...)
  const handleScanGruzomesto = (val) => {
    const trimmed = val.trim();
    if (!trimmed) {
      playBeepError();
      return;
    }

    // STRICT VALIDATION: MUST START WITH 84-0000...
    if (!isPalletValid(trimmed)) {
      playBeepError();
      showToast(t.gmPrefixError, 'error');
      return;
    }

    playBeepSuccess();
    setSanashGmCode(trimmed);
    setSanashGmLocked(true); // Move to Step 4 (Scan Korobs)
    showToast(lang === 'uz' ? `Pallet: ${trimmed}` : `Паллет: ${trimmed}`, 'success');
  };

  // Handle Step 4: Add Korob (Hardware Scanner / Input)
  const handleAddAct = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const val = actInput.trim();
    if (!val) {
      playBeepError();
      return;
    }

    // STRICT VALIDATION: KOROB MUST START WITH 80-
    if (!isKorobValid(val)) {
      playBeepError();
      showToast(t.actPrefixError, 'error');
      return;
    }

    if (!scannedActs.includes(val)) {
      playBeepSuccess();
      setScannedActs(prev => [...prev, val]);
      setLastScannedAct(val);
      showToast(lang === 'uz' ? `Korob ${val}` : `Короб ${val}`, 'success');
    } else {
      playBeepError();
      showToast(lang === 'uz' ? `Korob ${val} allaqachon urilgan!` : `Короб ${val} уже отсканирован!`, 'warning');
    }
    setActInput('');

    setTimeout(() => {
      if (activeInputRef.current) activeInputRef.current.focus();
    }, 50);
  };

  // Handle Step 4: Finish/Close Pallet ("ZA VER SHIT / YAKUNLASH")
  const handleFinishGruzomesto = () => {
    if (!sanashGmCode) {
      playBeepError();
      showToast(lang === 'uz' ? 'Pallet urilmagan!' : 'Паллет не отсканирован!', 'error');
      return;
    }

    if (scannedActs.length === 0) {
      playBeepError();
      showToast(lang === 'uz' ? 'Kamida 1 ta korob uring!' : 'Отсканируйте хотя бы 1 короб!', 'error');
      return;
    }

    playBeepSuccess();
    onAddBox({
      id: sanashGmCode,
      actNumbers: scannedActs,
      palletId: sanashGmCode,
      userName: currentUser?.name || "Xodim",
      shift: currentUser?.shift || '1 смена',
      counterName: currentUser?.name ? `${currentUser.name} (${currentUser.shift})` : "Xodim (1 смена)",
      notes: ''
    });

    setSanashClosed(true);
    showToast(t.gmClosedSuccess, 'success');
  };

  // Parkovka handlers
  const handleParkGmScan = (gmVal) => {
    const trimmed = gmVal.trim();
    if (!trimmed) {
      playBeepError();
      return;
    }

    if (!isPalletValid(trimmed)) {
      playBeepError();
      showToast(t.gmPrefixError, 'error');
      return;
    }

    playBeepSuccess();
    setParkGmCode(trimmed);
    setParkStep(2);
    showToast(lang === 'uz' ? `Pallet: ${trimmed}` : `Паллет: ${trimmed}`, 'success');
  };

  const handleParkZoneScan = (zoneVal) => {
    const trimmed = zoneVal.trim();
    if (!trimmed) {
      playBeepError();
      return;
    }

    if (!parkGmCode) {
      playBeepError();
      showToast(lang === 'uz' ? 'Avval Palletni skanerlang!' : 'Сначала отсканируйте паллет!', 'error');
      return;
    }

    playBeepSuccess();
    setParkZoneCode(trimmed);
    
    onUpdatePalletZone({
      palletId: parkGmCode,
      zoneId: trimmed,
      loaderName: currentUser?.name ? `${currentUser.name} (${currentUser.shift})` : "Xodim (1 смена)",
      notes: ''
    });

    setParkStep(3);
    showToast(t.parkSuccessTitle, 'success');
  };

  const handleResetParkovka = () => {
    setParkStep(1);
    setParkGmCode('');
    setParkZoneCode('');
  };

  // Logout / Switch User
  const handleSwitchUser = () => {
    setIsAuthorized(false);
    setSelectedDirection(null);
    setIsSettingsOpen(false);
    setFioInput('');
  };

  // Deep Search Logic with Audit History Log
  const searchResult = React.useMemo(() => {
    const q = searchActQuery.trim().toLowerCase();
    if (!q) return null;

    for (const box of dbData.boxes) {
      const matchedAct = box.actNumbers.find(a => a.toLowerCase().includes(q));
      if (matchedAct || box.id.toLowerCase().includes(q)) {
        const pallet = dbData.pallets.find(p => p.id === box.palletId || p.id === box.id);
        const zone = pallet && pallet.zoneId ? dbData.zones.find(z => z.id === pallet.zoneId || z.name === pallet.zoneId) : null;
        
        let zoneDisplay = zone ? zone.name : (pallet && pallet.zoneId ? pallet.zoneId : null);

        let historyLogs = box.historyLogs || [];

        const lastParkLog = [...historyLogs].reverse().find(l => l.actionType === 'park' || l.action === 'Парковка');
        if (lastParkLog && lastParkLog.zoneId) {
          zoneDisplay = lastParkLog.zoneId;
        }

        if (historyLogs.length === 0) {
          historyLogs = [
            {
              id: 1,
              time: box.createdAt || '2026-07-29 17:50:00',
              worker: box.counterName || "Xodim (1-smena)",
              workerName: box.userName || "Xodim",
              userName: box.userName || "Xodim",
              shift: box.shift || '1 смена',
              action: 'Сортировка',
              actionType: 'sort',
              gmId: box.id,
              count: box.actNumbers.length,
              details: `${box.id} pallet va ${box.actNumbers.length} ta korob sortirovka qilindi`
            }
          ];

          if (pallet && pallet.status === 'parked') {
            historyLogs.push({
              id: 2,
              time: pallet.placedAt || '2026-07-29 17:54:00',
              worker: pallet.loaderName || "Xodim (Yuklovchi)",
              workerName: pallet.loaderName || "Xodim",
              userName: pallet.loaderName || "Xodim",
              shift: '1 смена',
              action: 'Парковка',
              actionType: 'park',
              gmId: box.id,
              zoneId: pallet.zoneId,
              details: `${box.id} pallet ${pallet.zoneId} zonasiga joylashtirildi`
            });
          }
        }

        return {
          searchedTerm: q,
          act: matchedAct || q,
          box,
          pallet,
          zoneDisplay,
          historyLogs
        };
      }
    }
    return null;
  }, [searchActQuery, dbData]);

  // QR / Camera Scanner callback
  const handleScanResult = (code) => {
    if (selectedDirection === 'sanash') {
      if (!sanashGmLocked) {
        handleScanGruzomesto(code);
      } else {
        if (!isKorobValid(code)) {
          playBeepError();
          showToast(t.actPrefixError, 'error');
          return;
        }

        if (!scannedActs.includes(code)) {
          playBeepSuccess();
          setScannedActs([...scannedActs, code]);
          setLastScannedAct(code);
          showToast(lang === 'uz' ? `Korob urildi: ${code}` : `Короб отсканирован: ${code}`, 'success');
        }
      }
    } else if (selectedDirection === 'parkovka') {
      if (parkStep === 1) {
        handleParkGmScan(code);
      } else if (parkStep === 2) {
        handleParkZoneScan(code);
      }
    } else {
      playBeepSuccess();
      setSearchActQuery(code);
    }
  };

  // =========================================================
  // 🔑 STEP 1: AUTHORIZATION SCREEN
  // =========================================================
  if (!isAuthorized) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          
          <div className="flex items-center justify-between mb-2">
            <h2 className="auth-title !mb-0">
              {t.authTitle}
            </h2>

            {/* Language Switcher Chip */}
            <button
              onClick={toggleLanguage}
              className="lang-toggle-btn"
              type="button"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>{lang === 'uz' ? "🇺🇿 O'zbek" : '🇷🇺 Русский'}</span>
            </button>
          </div>

          <form onSubmit={handleLoginSubmit}>
            
            {/* Field 1: FIO */}
            <div className="auth-field-group">
              <label className="auth-label">
                {t.fioLabel}
              </label>
              <input
                ref={activeInputRef}
                type="text"
                placeholder={t.fioPlaceholder}
                className="auth-input-text"
                value={fioInput}
                onChange={(e) => setFioInput(e.target.value)}
                autoFocus
              />
            </div>

            {/* Field 2: Shift Chips */}
            <div className="auth-field-group">
              <label className="auth-label">
                {t.shiftLabel}
              </label>

              <div className="auth-shift-grid">
                {['1 смена', '2 смена', '3 смена', '4 смена'].map((shift) => (
                  <button
                    key={shift}
                    type="button"
                    onClick={() => setSelectedShift(shift)}
                    className={`auth-shift-btn ${selectedShift === shift ? 'selected' : ''}`}
                  >
                    {shift}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button "Войти" */}
            <button
              type="submit"
              className="auth-submit-btn"
            >
              {t.loginBtn}
            </button>

          </form>

        </div>
      </div>
    );
  }

  // =========================================================
  // 🎯 STEP 2: DIRECTION SELECTION SCREEN
  // =========================================================
  if (selectedDirection === null) {
    return (
      <div className="wms-app-wrapper">
        <header className="wms-header">
          <div className="wms-header-left">
            <button onClick={handleSwitchUser} className="wms-back-btn">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="wms-header-title-group">
              <span className="wms-header-title">{t.dirTitle}</span>
              <span className="wms-header-subtitle">{t.dirSubtitle}: {currentUser?.name} ({currentUser?.shift})</span>
            </div>
          </div>

          <div className="wms-header-right">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="lang-toggle-btn"
              type="button"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>{lang === 'uz' ? "🇺🇿 UZ" : '🇷🇺 RU'}</span>
            </button>

            <button onClick={() => setIsSettingsOpen(true)} className="wms-menu-btn">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="wms-main-container">
          <div className="direction-card-grid">
            
            {/* Card 1: 1. Sortirovka */}
            <button
              onClick={() => handleSelectDirection('sanash')}
              className="direction-card-btn card-sort"
            >
              <div className="direction-icon-circle icon-glow-blue">
                <Boxes className="w-20 h-20 stroke-[2.2]" />
              </div>
              <div>
                <div className="direction-card-title">{t.dirSortTitle}</div>
                <div className="direction-card-desc">{t.dirSortDesc}</div>
              </div>
            </button>

            {/* Card 2: 2. Parkovka */}
            <button
              onClick={() => handleSelectDirection('parkovka')}
              className="direction-card-btn card-park"
            >
              <div className="direction-icon-circle icon-glow-emerald">
                <Warehouse className="w-20 h-20 stroke-[2.2]" />
              </div>
              <div>
                <div className="direction-card-title">{t.dirParkTitle}</div>
                <div className="direction-card-desc">{t.dirParkDesc}</div>
              </div>
            </button>

            {/* Card 3: 3. Korobni qidirish */}
            <button
              onClick={() => handleSelectDirection('poisk')}
              className="direction-card-btn card-search"
            >
              <div className="direction-icon-circle icon-glow-purple">
                <FileSearch className="w-20 h-20 stroke-[2.2]" />
              </div>
              <div>
                <div className="direction-card-title">{t.dirSearchTitle}</div>
                <div className="direction-card-desc">{t.dirSearchDesc}</div>
              </div>
            </button>

          </div>
        </main>

        <div className="wms-footer-build">7.0.8prod (194)</div>
      </div>
    );
  }

  // =========================================================
  // 🖥️ STEP 3 & 4: SELECTED DIRECTION TERMINAL APPLICATION
  // =========================================================
  const modeLabel = selectedDirection === 'sanash' ? t.sortHeaderTitle : selectedDirection === 'parkovka' ? t.parkHeaderTitle : t.searchHeaderTitle;
  const modeSub = selectedDirection === 'sanash' ? t.sortHeaderSub : selectedDirection === 'parkovka' ? t.parkHeaderSub : t.searchHeaderSub;

  return (
    <div className="wms-app-wrapper">
      
      {/* HEADER NAVBAR */}
      <header className="wms-header">
        
        {/* Left Side: Back Arrow to Direction Selection */}
        <div className="wms-header-left">
          <button
            onClick={() => setSelectedDirection(null)}
            className="wms-back-btn"
            title={lang === 'uz' ? "Orqaga" : "Назад"}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="wms-header-title-group">
            <span className="wms-header-title">{modeLabel}</span>
            <span className="wms-header-subtitle">{modeSub} | {currentUser?.name}</span>
          </div>

          {sanashGmCode && selectedDirection === 'sanash' && (
            <span className="wms-gm-pill">
              {sanashGmCode}
            </span>
          )}
        </div>

        {/* Right Side: Language Switcher & Hamburger Menu */}
        <div className="wms-header-right">
          <button
            onClick={toggleLanguage}
            className="lang-toggle-btn"
            type="button"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>{lang === 'uz' ? "🇺🇿 UZ" : '🇷🇺 RU'}</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="wms-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

      </header>

      {/* MAIN BODY */}
      <main className="wms-main-container">
        
        {/* ========================================================= */}
        {/* 📦 WORKFLOW 1: SORTIROVKA */}
        {/* ========================================================= */}
        {selectedDirection === 'sanash' && (
          <>
            {/* STEP 3: SKANERLASH PALLET */}
            {!sanashGmLocked ? (
              <div className="wms-big-scan-card space-y-4 !p-6">
                
                {/* HIGH-TECH BARCODE LASER SCANNER ANIMATION HEADER */}
                <div className="wms-barcode-laser-container">
                  <div className="wms-red-laser-line"></div>
                  <Barcode className="w-12 h-12 text-gray-200" />
                </div>

                <h2 className="wms-scan-card-title text-2xl font-black">
                  {t.scanGmTitle}
                </h2>

                <div className="max-w-md w-full mx-auto space-y-3">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const val = e.target.gmInput.value;
                      handleScanGruzomesto(val);
                    }}
                    className="input-mobile-group"
                  >
                    <input
                      ref={activeInputRef}
                      name="gmInput"
                      type="text"
                      placeholder={t.scanGmInputPlaceholder}
                      className="input-terminal text-center text-white font-mono text-lg py-3 tsd-scan-input"
                      autoFocus
                      autoComplete="off"
                    />

                    {/* DEDICATED MOBILE / TOUCH NEXT BUTTON */}
                    <button type="submit" className="btn-mobile-submit">
                      <span>{t.btnNext}</span>
                    </button>
                  </form>
                </div>

              </div>
            ) : (
              /* STEP 4: SKANERLASH KOROB */
              <div className="wms-split-container">
                
                {/* Top Banner Card: Scanned Pallet Code */}
                <div className="wms-left-card">
                  <span className="wms-card-label">{t.scannedGmLabel}</span>
                  <div className="wms-card-huge-val">
                    {sanashGmCode}
                  </div>
                </div>

                {/* Main Scanning Card: Scan Korobs OR Success Summary Box */}
                {!sanashClosed ? (
                  <div className="wms-right-card">
                    
                    <div className="wms-barcode-laser-container">
                      <div className="wms-red-laser-line"></div>
                      <Barcode className="w-12 h-12 text-gray-200" />
                    </div>

                    <h2 className="wms-scan-card-title text-2xl font-black">
                      {t.scanActTitle}
                    </h2>

                    <form onSubmit={handleAddAct} className="w-full max-w-md input-mobile-group">
                      <input
                        ref={activeInputRef}
                        type="text"
                        placeholder={t.actInputPlaceholder}
                        className="input-terminal text-center text-yellow-400 font-mono text-xl py-3 tsd-scan-input"
                        value={actInput}
                        onChange={(e) => setActInput(e.target.value)}
                        autoFocus
                        autoComplete="off"
                      />

                      {/* DEDICATED ADD BUTTON */}
                      <button
                        type="submit"
                        onClick={handleAddAct}
                        className="btn-mobile-submit"
                      >
                        <span>{t.btnAdd}</span>
                      </button>
                    </form>

                    {/* Scanned Korobs List */}
                    <div className="w-full pt-3 border-t border-gray-800/80">
                      <div className="text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider flex items-center justify-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>{t.scannedActsCount} ({scannedActs.length} {lang === 'uz' ? 'ta' : 'шт'}):</span>
                      </div>
                      
                      <div className="search-acts-chip-wrapper justify-center max-w-xl mx-auto">
                        {scannedActs.map((act, i) => (
                          <div key={i} className="search-act-chip">
                            {act}
                          </div>
                        ))}
                        {scannedActs.length === 0 && (
                          <span className="text-xs text-gray-500 italic py-1">{t.scannedActsEmpty}</span>
                        )}
                      </div>
                    </div>

                    {/* RED FINISH PALLET BUTTON PLACED INSIDE THE CARD */}
                    <button
                      onClick={handleFinishGruzomesto}
                      className="wms-bottom-finish-btn w-full mt-4"
                    >
                      <Lock className="w-5 h-5" />
                      <span>{t.finishGmBtn}</span>
                    </button>

                  </div>
                ) : (
                  /* WHEN PALLET IS CLOSED: SCANNER & INPUT HIDE COMPLETELY, RENDERING CLEAN SUCCESS CARD WITH GREEN NEXT BUTTON INSIDE */
                  <div className="wms-right-card !p-6 border-2 border-emerald-500/80 bg-emerald-950/20 shadow-2xl space-y-4">
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
                    <h2 className="wms-scan-card-title text-emerald-400 text-2xl font-black">
                      {t.gmClosedSuccess}
                    </h2>
                    
                    <div className="w-full pt-3 border-t border-emerald-800/50">
                      <div className="text-xs font-bold text-emerald-200/90 mb-2.5 uppercase tracking-wider flex items-center justify-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span>{t.scannedActsCount} ({scannedActs.length} {lang === 'uz' ? 'ta' : 'шт'}):</span>
                      </div>
                      
                      <div className="search-acts-chip-wrapper justify-center max-w-xl mx-auto">
                        {scannedActs.map((act, i) => (
                          <div key={i} className="search-act-chip !border-emerald-500/50 !bg-emerald-900/40 !text-emerald-200 text-sm font-mono font-bold">
                            {act}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* GREEN NEXT PALLET BUTTON PLACED INSIDE THE CARD */}
                    <button
                      onClick={handleResetSanash}
                      className="wms-bottom-next-btn w-full mt-4"
                    >
                      <Plus className="w-5 h-5" />
                      <span>{t.nextGmBtn}</span>
                    </button>
                  </div>
                )}

              </div>
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* 🚜 WORKFLOW 2: PARKOVKA */}
        {/* ========================================================= */}
        {selectedDirection === 'parkovka' && (
          <div className="w-full max-w-2xl space-y-4">
            
            {/* STEP 1: SCAN PALLET */}
            {parkStep === 1 && (
              <div className="wms-big-scan-card space-y-4 !p-6">
                <div className="wms-barcode-laser-container">
                  <div className="wms-red-laser-line"></div>
                  <Barcode className="w-12 h-12 text-gray-200" />
                </div>

                <h2 className="wms-scan-card-title text-yellow-400 text-2xl font-black">
                  {t.parkStep1Title}
                </h2>

                <div className="max-w-md w-full pt-1">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleParkGmScan(e.target.parkGmInput.value);
                    }}
                    className="input-mobile-group"
                  >
                    <input
                      ref={activeInputRef}
                      name="parkGmInput"
                      type="text"
                      placeholder={t.parkStep1Placeholder}
                      className="input-terminal text-center text-lg py-3 tsd-scan-input"
                      autoFocus
                      autoComplete="off"
                    />
                    
                    <button type="submit" className="btn-mobile-submit">
                      <span>{t.btnNext}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* STEP 2: PALLET IS SCANNED */}
            {parkStep === 2 && (
              <div className="wms-big-scan-card space-y-4 !p-6 border-2 border-emerald-500/50">
                <div className="text-xs font-bold text-gray-400">
                  {t.parkScannedGm} <font className="text-yellow-400 text-base font-mono font-bold">{parkGmCode}</font>
                </div>
                
                <div className="wms-barcode-laser-container">
                  <div className="wms-red-laser-line"></div>
                  <Barcode className="w-12 h-12 text-emerald-400" />
                </div>

                <h2 className="wms-scan-card-title text-emerald-400 text-2xl font-black">
                  {t.parkStep2Title}
                </h2>

                <div className="max-w-md w-full space-y-3 pt-1">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleParkZoneScan(e.target.zoneInput.value);
                    }}
                    className="input-mobile-group"
                  >
                    <input
                      ref={activeInputRef}
                      name="zoneInput"
                      type="text"
                      placeholder={t.parkStep2Placeholder}
                      className="input-terminal text-center text-emerald-400 border-emerald-500 text-lg py-3 tsd-scan-input"
                      autoFocus
                      autoComplete="off"
                    />
                    
                    <button type="submit" className="btn-mobile-submit green">
                      <span>{t.btnPark}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* STEP 3: HIGH-TECH PARKOVKA SUCCESS SUMMARY CARD */}
            {parkStep === 3 && (
              <div className="wms-big-scan-card space-y-5 !p-6 border-2 border-emerald-500/90 bg-slate-900/95 shadow-2xl max-w-2xl mx-auto">
                
                <div className="p-3 rounded-2xl bg-emerald-500/20 w-fit mx-auto border border-emerald-500/40">
                  <CheckCircle2 className="w-14 h-14 text-emerald-400" />
                </div>

                <div className="space-y-1">
                  <h2 className="wms-scan-card-title text-emerald-400 text-2xl font-black drop-shadow-md">
                    {t.parkSuccessTitle}
                  </h2>
                  <p className="text-xs font-bold text-slate-400">
                    {lang === 'uz' ? 'Pallet ombor zonasiga muvaffaqiyatli biriktirildi' : 'Паллет успешно привязан к зоне склада'}
                  </p>
                </div>

                {/* TRANSFER CHIPS: PALLET ➔ ZONE FLOW */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 w-full max-w-lg mx-auto shadow-inner">
                  
                  {/* PALLET BADGE */}
                  <div className="flex flex-col items-center p-2.5 rounded-xl bg-slate-900 border border-yellow-500/40 min-w-[140px]">
                    <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                      {lang === 'uz' ? '📦 PALLET' : '📦 ПАЛЛЕТ'}
                    </span>
                    <span className="text-lg font-black font-mono text-yellow-300">{parkGmCode}</span>
                  </div>

                  {/* ARROW */}
                  <ArrowRight className="w-6 h-6 text-emerald-400 flex-shrink-0 rotate-90 sm:rotate-0" />

                  {/* ZONE BADGE */}
                  <div className="flex flex-col items-center p-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 min-w-[140px]">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      {lang === 'uz' ? '📍 OMBOR ZONASI' : '📍 ЗОНА СКЛАДА'}
                    </span>
                    <span className="text-lg font-black font-mono text-emerald-300">{parkZoneCode}</span>
                  </div>

                </div>

                <button
                  onClick={handleResetParkovka}
                  className="wms-bottom-next-btn !max-w-md mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  <span>{t.parkNextBtn}</span>
                </button>

              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* 🔍 WORKFLOW 3: KOROBNI QIDIRISH */}
        {/* ========================================================= */}
        {selectedDirection === 'poisk' && (
          <div className="w-full max-w-2xl wms-big-scan-card space-y-3.5 text-left items-stretch !p-4">
            
            {/* HIGH-TECH PURPLE BARCODE LASER SCANNER ANIMATION HEADER */}
            <div className="wms-barcode-laser-container mx-auto !mb-2 !w-24 !h-16">
              <div className="wms-red-laser-line"></div>
              <Barcode className="w-10 h-10 text-purple-400" />
            </div>

            <div className="space-y-0.5 text-center">
              <h2 className="wms-scan-card-title text-purple-400 text-xl">
                {t.searchTitle}
              </h2>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {t.searchInputLabel}
              </p>
            </div>

            <div className="space-y-2 max-w-md mx-auto w-full">
              <div className="input-mobile-group">
                <input
                  ref={activeInputRef}
                  type="text"
                  placeholder={t.searchInputPlaceholder}
                  className="input-terminal text-purple-300 text-center font-mono tsd-scan-input text-base py-2"
                  value={searchActQuery}
                  onChange={(e) => setSearchActQuery(e.target.value)}
                  autoFocus
                  autoComplete="off"
                />
              </div>
            </div>

            {searchActQuery.trim() !== '' && (
              <div>
                {!searchResult ? (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-center font-bold text-xs shadow-inner">
                    "{searchActQuery}" {t.searchNotFound}
                  </div>
                ) : (
                  <div className="search-result-stack space-y-2.5">

                    {/* TOP SUCCESS BANNER HIGHLIGHTING MATCHED KOROB & PALLET */}
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-blue-950/80 border border-purple-500/80 text-purple-100 text-center font-black text-sm flex items-center justify-center gap-2 shadow-lg">
                      <Target className="w-4.5 h-4.5 text-yellow-400 animate-pulse flex-shrink-0" />
                      <div>
                        {lang === 'uz' ? (
                          <span>
                            KOROB <font className="text-yellow-300 font-mono text-sm">{searchResult.searchedTerm}</font> ➔ PALLET <font className="text-yellow-300 font-mono text-sm">{searchResult.box?.id}</font> ICHIDAN TOPILDI!
                          </span>
                        ) : (
                          <span>
                            КОРОБ <font className="text-yellow-300 font-mono text-sm">{searchResult.searchedTerm}</font> ➔ НАЙДЕН В ПАЛЛЕТЕ <font className="text-yellow-300 font-mono text-sm">{searchResult.box?.id}</font>!
                          </span>
                        )}
                      </div>
                    </div>

                    {/* COMPACT SIDE-BY-SIDE 2-COLUMN GRID FOR PALLET & ZONE CARDS ON MOBILE */}
                    <div className="search-card-grid-compact">
                      
                      {/* STACK CARD 1: PALLET */}
                      <div className="search-card-item">
                        <div className="search-card-header">
                          <Boxes className="w-3.5 h-3.5 text-yellow-400" />
                          <span>{t.searchCard1Header}</span>
                        </div>
                        <div className="search-card-val-yellow">
                          {searchResult.box?.id}
                        </div>
                      </div>

                      {/* STACK CARD 2: PARKOVKA ZONASI */}
                      <div className="search-card-item">
                        <div className="search-card-header">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t.searchCard2Header}</span>
                        </div>
                        {searchResult.zoneDisplay ? (
                          <div className="space-y-0.5">
                            <div className="search-card-val-green">
                              📍 {searchResult.zoneDisplay}
                            </div>
                            <span className="text-[10px] font-bold text-emerald-300/80 italic block">
                              {lang === 'uz' ? '(Oxirgi joylashtirilgan zona)' : '(Последнее место размещения)'}
                            </span>
                          </div>
                        ) : (
                          <div className="search-card-val-orange">
                            {t.searchNotParkedYet}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* STACK CARD 3: PALLET ICHIDAGI BARCHA KOROBLAR */}
                    <div className="search-card-item">
                      <div className="search-card-header">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>{t.searchCard3Header} ({searchResult.box?.actNumbers?.length || 0} {lang === 'uz' ? 'ta' : 'шт'})</span>
                      </div>

                      <div className="search-acts-chip-wrapper">
                        {searchResult.box?.actNumbers?.map((act, idx) => {
                          const isMatch = act.toLowerCase().includes(searchResult.searchedTerm.toLowerCase());
                          return (
                            <span
                              key={idx}
                              className={`search-act-chip ${isMatch ? 'highlight' : ''}`}
                            >
                              {isMatch ? `🎯 ${act}` : act}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* STACK CARD 4: TIMELINE AUDIT HISTORY LOG */}
                    <div className="search-card-item !text-left !items-stretch">
                      <div className="search-card-header justify-center">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{t.searchCard4Header}</span>
                      </div>

                      <div className="history-timeline-container">
                        {searchResult.historyLogs?.map((log, idx) => {
                          const isSort = log.action === 'Сортировка' || log.actionType === 'sort' || log.action === 'Sortirovka';
                          const gmId = log.gmId || searchResult.box?.id;
                          const count = log.count || searchResult.box?.actNumbers?.length || 0;
                          const zone = log.zoneId || searchResult.zoneDisplay || '—';

                          let fullFio = log.workerName || log.userName;
                          if (!fullFio && log.worker) {
                            fullFio = log.worker.replace(/\s*\([^)]*\)/, '');
                          }
                          if (!fullFio) fullFio = currentUser?.name || "Xodim";

                          const shift = log.shift || '1 смена';

                          const displayAction = isSort ? (lang === 'uz' ? 'SORTIROVKA' : 'СОРТИРОВКА') : (lang === 'uz' ? 'PARKOVKA' : 'ПАРКОВКА');
                          const displayWorker = isSort
                            ? `${fullFio} (${shift})`
                            : lang === 'uz'
                            ? `${fullFio} (Yuklovchi, ${shift})`
                            : `${fullFio} (Грузчик, ${shift})`;

                          const displayDetails = isSort
                            ? lang === 'uz'
                              ? `${gmId} pallet va ${count} ta korob sortirovka qilindi`
                              : `Отсортирован паллет ${gmId} и ${count} коробов`
                            : lang === 'uz'
                            ? `${gmId} pallet ${zone} zonasiga joylashtirildi`
                            : `Паллет ${gmId} размещен в зону ${zone}`;

                          return (
                            <div key={idx} className="history-timeline-item">
                              <div className="history-timeline-top">
                                <span className={`history-action-badge ${isSort ? 'sort' : 'park'}`}>
                                  {displayAction}
                                </span>
                                
                                <span className="history-time-badge">
                                  <Clock className="w-3 h-3 inline" />
                                  {log.time}
                                </span>
                              </div>

                              <div className="history-worker-name">
                                👤 {displayWorker}
                              </div>

                              <div className="history-details-text">
                                📝 {displayDetails}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* FIXED SETTINGS GEAR BUTTON */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="wms-settings-gear-btn"
        title={t.settingsTitle}
      >
        <Settings className="w-4.5 h-4.5 text-slate-950" />
      </button>

      {/* FOOTER VERSION */}
      <div className="wms-footer-build">
        7.0.8prod (194)
      </div>

      {/* PERSONAL SETTINGS DRAWER */}
      {isSettingsOpen && (
        <div className="wms-modal-backdrop" onClick={() => setIsSettingsOpen(false)}>
          <div className="wms-modal-drawer" onClick={(e) => e.stopPropagation()}>
            
            <div className="wms-drawer-header">
              <h3 className="wms-drawer-title">{t.settingsTitle}</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="wms-drawer-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="wms-user-profile-box space-y-1">
              <div className="text-[11px] text-slate-400">{t.employeeLabel}</div>
              <div className="text-base font-bold text-white">{currentUser?.name}</div>
              <div className="text-xs text-yellow-400 font-bold">{currentUser?.shift} | {t.floorLabel}: M1</div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400">{t.langLabel}</div>
              <button onClick={toggleLanguage} className="wms-lang-btn">
                <Globe className="w-4 h-4" />
                <span>{lang === 'uz' ? "🇺🇿 O'zbekcha (UZ)" : '🇷🇺 Русский (RU)'}</span>
              </button>

              <button
                onClick={handleSwitchUser}
                className="btn btn-danger w-full font-bold py-3 mt-4"
              >
                {t.switchUserBtn}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResult={handleScanResult}
        pallets={dbData.pallets}
        zones={dbData.zones}
      />

    </div>
  );
}
