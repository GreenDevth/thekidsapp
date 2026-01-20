import React, { useState, useEffect } from 'react';
import { Home, Lock, FileText, RefreshCw, Trash2, CheckCircle, Smartphone, BookOpen, Unlock } from 'lucide-react';
import { getVocabData, saveVocabData, resetAllData, getParentPin, setParentPin, saveProgress, loadProgress, getUnlockedSessions, setUnlockedSessions } from '../utils/storage';
import { fetchVocabFromSheet, updateSheetData } from '../utils/googleSheet';
import { GOOGLE_APPS_SCRIPT_URL } from '../config';
import { useModal } from '../contexts/ModalContext';
import VocabManager from './VocabManager';

const ParentDashboard = ({ onExit }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [activeTab, setActiveTab] = useState('sync');
    const [message, setMessage] = useState('');
    const [currentPin, setCurrentPin] = useState('1234');
    const { showAlert, showConfirm } = useModal();

    // Sync State
    const [sheetUrl, setSheetUrl] = useState(localStorage.getItem('larnvocab_sheet_url') || GOOGLE_APPS_SCRIPT_URL);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(localStorage.getItem('larnvocab_last_sync') || '-');

    // Vocab State
    const [vocabList, setVocabList] = useState([]);

    useEffect(() => {
        const savedPin = getParentPin();
        if (savedPin) setCurrentPin(savedPin);

        // Load Vocab Data
        const currentData = getVocabData();
        if (currentData) {
            setVocabList(currentData);
        }
    }, []);

    const handleUpdateVocab = (newList) => {
        setVocabList(newList);
        saveVocabData(newList);
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (pinInput === currentPin) {
            setIsAuthenticated(true);
        } else {
            showAlert({ title: 'เข้าสู่ระบบไม่สำเร็จ', message: 'รหัสผ่านไม่ถูกต้อง (Default: 1234)', variant: 'error' });
        }
    };

    const handleSync = async () => {
        if (!sheetUrl) return;
        setIsSyncing(true);
        setMessage('');
        try {
            const data = await fetchVocabFromSheet(sheetUrl);
            saveVocabData(data);
            localStorage.setItem('larnvocab_sheet_url', sheetUrl);
            const time = new Date().toLocaleString();
            localStorage.setItem('larnvocab_last_sync', time);
            setLastSyncTime(time);
            setVocabList(data); // Update state
            showAlert({ title: 'สำเร็จ', message: `✅ Sync สำเร็จ! โหลดคำศัพท์มาทั้งหมด ${data.length} คำ`, variant: 'success' });
        } catch (error) {
            showAlert({ title: 'ผิดพลาด', message: `❌ เกิดข้อผิดพลาด: ${error.message}`, variant: 'error' });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleUpload = async () => {
        if (!sheetUrl) {
            showAlert({
                title: 'ไม่พบ URL',
                message: '⚠️ กรุณากรอก Google Apps Script URL ก่อน',
                variant: 'warning'
            });
            return;
        }

        setIsUploading(true);
        setMessage('');

        try {
            const currentVocab = getVocabData();

            // ตรวจสอบว่ามีข้อมูลหรือไม่
            if (!currentVocab || currentVocab.length === 0) {
                setIsUploading(false);
                showAlert({
                    title: 'ไม่มีข้อมูล',
                    message: '⚠️ ไม่พบข้อมูลคำศัพท์ใน LocalStorage\n\nกรุณา "ดึงข้อมูลลง" จาก Google Sheets ก่อน\nหรือเล่นเกมเพื่อให้ระบบโหลดข้อมูลจาก CSV',
                    variant: 'warning'
                });
                return;
            }

            console.log(`Uploading ${currentVocab.length} vocab items...`);
            const result = await updateSheetData(sheetUrl, currentVocab);

            if (result && result.status === 'success') {
                const time = new Date().toLocaleString();
                setLastSyncTime(time);
                showAlert({
                    title: 'สำเร็จ',
                    message: `☁️ อัปโหลดสำเร็จ! จำนวน ${result.count} รายการ`,
                    variant: 'success'
                });
            } else {
                throw new Error(result?.message || 'Upload failed - ไม่ได้รับ response ที่ถูกต้อง');
            }
        } catch (error) {
            console.error('Upload error:', error);

            // แสดง error message ที่ละเอียดขึ้น
            let errorMessage = error.message;

            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'ไม่สามารถเชื่อมต่อกับ Google Sheets ได้\n\nกรุณาตรวจสอบ:\n1. URL ถูกต้องหรือไม่\n2. Deploy Apps Script เป็น "Anyone" แล้วหรือยัง\n3. Internet connection';
            } else if (error.message.includes('NetworkError')) {
                errorMessage = 'เกิดข้อผิดพลาดเครือข่าย\nกรุณาตรวจสอบ Internet connection';
            }

            showAlert({
                title: 'ผิดพลาด',
                message: `❌ อัปโหลดไม่สำเร็จ:\n${errorMessage}`,
                variant: 'error'
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleReset = () => {
        showConfirm({
            title: 'ยืนยันการล้างข้อมูล',
            message: '⚠️ ข้อมูลความก้าวหน้าทั้งหมดจะหายไป!\nคุณต้องการดำเนินการต่อหรือไม่?',
            variant: 'error',
            confirmText: 'ลบข้อมูล',
            onConfirm: () => resetAllData()
        });
    };

    const handleChangePin = (newPin) => {
        setParentPin(newPin);
        setCurrentPin(newPin);
        showAlert({ title: 'สำเร็จ', message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', variant: 'success' });
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-blue-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-6 text-gray-700">ผู้ปกครองเท่านั้น</h2>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            className="w-full text-center text-3xl font-bold tracking-widest border-2 border-gray-200 rounded-xl p-3 mb-4"
                            placeholder="PIN"
                            maxLength={4}
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 bg-brand-blue text-white font-bold py-3 rounded-xl hover:bg-blue-600">
                                เข้าสู่ระบบ
                            </button>
                            <button type="button" onClick={onExit} className="px-4 py-3 bg-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-300">
                                กลับ
                            </button>
                        </div>
                    </form>
                    <p className="text-gray-400 text-sm mt-4">รหัสเริ่มต้น: 1234</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={24} />
                    Parent Dashboard
                </h1>
                <button onClick={onExit} className="flex items-center gap-2 text-gray-600 hover:text-brand-blue font-bold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <Home size={20} /> กลับไปหน้าเกม
                </button>
            </header>

            <main className="max-w-4xl mx-auto p-6">
                <div className="flex gap-4 mb-6 overflow-x-auto">
                    <button onClick={() => setActiveTab('sync')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'sync' ? 'bg-brand-blue text-white shadow-lg' : 'bg-white text-gray-600 shadow-sm'}`}>
                        <RefreshCw size={20} /> Cloud Sync
                    </button>
                    <button onClick={() => setActiveTab('data')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'data' ? 'bg-brand-blue text-white shadow-lg' : 'bg-white text-gray-600 shadow-sm'}`}>
                        <Smartphone size={20} /> Data
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'settings' ? 'bg-brand-blue text-white shadow-lg' : 'bg-white text-gray-600 shadow-sm'}`}>
                        <Lock size={20} /> Settings
                    </button>
                    <button onClick={() => setActiveTab('vocab')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'vocab' ? 'bg-brand-blue text-white shadow-lg' : 'bg-white text-gray-600 shadow-sm'}`}>
                        <BookOpen size={20} /> Vocab Manager
                    </button>
                    <button onClick={() => setActiveTab('levels')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'levels' ? 'bg-brand-blue text-white shadow-lg' : 'bg-white text-gray-600 shadow-sm'}`}>
                        <Unlock size={20} /> Levels
                    </button>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    {activeTab === 'sync' && (
                        <div className="max-w-xl mx-auto">
                            <div className="text-center mb-8">
                                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="text-green-600" size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Google Sheets Sync</h2>
                                <p className="text-gray-500 mt-2">เชื่อมต่อฐานข้อมูลคำศัพท์จาก Cloud</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Google Apps Script URL</label>
                                <input
                                    type="url"
                                    id="sheetUrlInput"
                                    name="sheetUrl"
                                    autoComplete="off"
                                    className="w-full p-4 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-500 focus:outline-none transition-colors"
                                    placeholder="https://script.google.com/..."
                                    value={sheetUrl}
                                    onChange={e => {
                                        const newUrl = e.target.value;
                                        setSheetUrl(newUrl);
                                        localStorage.setItem('larnvocab_sheet_url', newUrl);
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleSync}
                                    disabled={isSyncing || isUploading || !sheetUrl}
                                    className={`py-4 rounded-xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-3 transition-all
                                        ${isSyncing ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600 hover:scale-[1.02]'}
                                    `}
                                >
                                    {isSyncing ? <RefreshCw className="animate-spin" /> : <RefreshCw />}
                                    {isSyncing ? 'กำลังดึง...' : 'ดึงข้อมูลลง'}
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={isSyncing || isUploading || !sheetUrl}
                                    className={`py-4 rounded-xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-3 transition-all
                                        ${isUploading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600 hover:scale-[1.02]'}
                                    `}
                                >
                                    {isUploading ? <RefreshCw className="animate-spin" /> : <RefreshCw />}
                                    {isUploading ? 'กำลังส่ง...' : 'ส่งข้อมูลขึ้น'}
                                </button>
                            </div>

                            {message && (
                                <div className={`mt-6 p-4 rounded-xl text-center font-bold border ${message.includes('สำเร็จ') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {message}
                                </div>
                            )}

                            <p className="text-center text-gray-400 text-sm mt-8">
                                Sync ล่าสุด: {lastSyncTime} <br />
                                <span className="text-xs text-gray-300">v1.1 (Latest)</span>
                            </p>
                        </div>
                    )}

                    {activeTab === 'vocab' && (
                        <div className="animate-fade-in">
                            <VocabManager vocabList={vocabList} onUpdateVocab={handleUpdateVocab} />
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="text-center py-8 max-w-md mx-auto">
                            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="text-red-500" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">จัดการข้อมูล</h2>
                            <p className="text-gray-500 mb-8">ล้างข้อมูลความก้าวหน้าทั้งหมด (คำศัพท์จะไม่ถูกลบ)</p>
                            <button
                                onClick={handleReset}
                                className="w-full py-4 bg-white border-2 border-red-100 text-red-500 rounded-xl font-bold hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={20} />
                                ล้างข้อมูลความก้าวหน้า
                            </button>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-sm mx-auto py-4">
                            <h3 className="text-xl font-bold mb-6 text-center">เปลี่ยนรหัสผ่าน (PIN)</h3>
                            <PinChangeForm onSave={handleChangePin} />
                        </div>
                    )}

                    {activeTab === 'levels' && (
                        <LevelManager />
                    )}
                </div>
            </main >
        </div >
    );
};

const PinChangeForm = ({ onSave }) => {
    const [newPin, setNewPin] = useState('');
    const { showAlert } = useModal();
    return (
        <div className="flex flex-col gap-3">
            <input
                type="password"
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                maxLength={4}
                className="border-2 p-3 rounded-xl text-center text-3xl font-bold tracking-widest focus:border-brand-blue focus:outline-none"
                placeholder="New PIN"
            />
            <button
                onClick={() => newPin.length === 4 ? onSave(newPin) : showAlert({ title: 'ผิดพลาด', message: 'กรุณากรอก 4 หลัก', variant: 'warning' })}
                className="bg-brand-pink hover:bg-pink-600 text-white py-3 rounded-xl font-bold transition-colors"
            >
                บันทึกรหัสใหม่
            </button>
        </div>
    );
};

const LevelManager = () => {
    const [vocabList, setVocabList] = useState([]);
    const [unlockedSessions, setUnlocked] = useState([]);
    const { showAlert } = useModal();

    useEffect(() => {
        setVocabList(getVocabData() || []);
        setUnlocked(getUnlockedSessions() || [1]);
    }, []);

    // Helper to get total sessions
    const totalSessions = React.useMemo(() => {
        const sessions = new Set();
        vocabList.forEach(v => {
            if (v.session) sessions.add(parseInt(v.session));
        });
        // If vocabList is empty (first load from CSV not yet happened in Parent Dashboard context), maybe we need fallback
        // But normally vocabData should be available if they played or we should let them sync first.
        // Let's also check if we have max session in unlocked to at least show those.
        const maxUnlocked = Math.max(...unlockedSessions, 0);
        const maxFromVocab = sessions.size > 0 ? Math.max(...Array.from(sessions)) : 0;

        const max = Math.max(maxUnlocked, maxFromVocab, 5); // Default show at least 5 for demo if empty
        return Array.from({ length: max }, (_, i) => i + 1);
    }, [vocabList, unlockedSessions]);

    const handleToggle = (sessionId) => {
        let newUnlocked;
        if (unlockedSessions.includes(sessionId)) {
            // Prevent locking session 1 (optional, but usually safe to keep 1 unlocked)
            if (sessionId === 1) {
                showAlert({ title: 'แจ้งเตือน', message: 'ควรเปิดด่านที่ 1 ไว้เสมอ', variant: 'warning' });
                return;
            }
            newUnlocked = unlockedSessions.filter(id => id !== sessionId);
        } else {
            newUnlocked = [...unlockedSessions, sessionId].sort((a, b) => a - b);
        }
        setUnlocked(newUnlocked);
        setUnlockedSessions(newUnlocked);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Unlock className="text-orange-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">จัดการการปลดล็อคด่าน (Level Unlock)</h2>
                <p className="text-gray-500 mt-2">เลือกด่านที่ต้องการให้เด็กเล่นได้โดยไม่ต้องเก็บดาว</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {totalSessions.map(sessionId => {
                    const isUnlocked = unlockedSessions.includes(sessionId);
                    return (
                        <div
                            key={sessionId}
                            onClick={() => handleToggle(sessionId)}
                            className={`
                                p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between
                                ${isUnlocked
                                    ? 'border-green-500 bg-green-50 shadow-md transform scale-[1.02]'
                                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-400'
                                }
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                                    ${isUnlocked ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                                `}>
                                    {sessionId}
                                </div>
                                <span className={`font-bold ${isUnlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                                    ด่านที่ {sessionId}
                                </span>
                            </div>

                            {isUnlocked ? (
                                <CheckCircle className="text-green-500" />
                            ) : (
                                <Lock className="text-gray-300" />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 p-4 bg-blue-50 text-blue-800 text-sm rounded-xl text-center">
                💡 การเปลี่ยนแปลงจะถูกบันทึกทันที
            </div>
        </div>
    );
};

export default ParentDashboard;
