const PREF_KEY = 'larnvocab_voice_pref';

export const getVoices = () => {
    return new Promise((resolve) => {
        let voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(voices);
            return;
        }

        // Voices might load asynchronously
        window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            resolve(voices);
        };

        // Fallback timeout
        setTimeout(() => {
            resolve(window.speechSynthesis.getVoices());
        }, 1000);
    });
};

export const getVoicePreference = (langPrefix) => {
    try {
        const prefs = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
        return prefs[langPrefix];
    } catch (e) {
        return null;
    }
};

export const setVoicePreference = (langPrefix, voiceURI) => {
    try {
        const prefs = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
        prefs[langPrefix] = voiceURI;
        localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    } catch (e) {
        console.error("Failed to save voice pref", e);
    }
};

export const speak = async (text, lang = 'en-US', shouldCancel = true, rate = 0.9) => {
    // ตรวจสอบว่า browser รองรับ TTS หรือไม่
    if (!('speechSynthesis' in window)) {
        console.warn('TTS not supported in this browser');
        return;
    }

    if (shouldCancel) {
        window.speechSynthesis.cancel();
    }

    return new Promise(async (resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = 1.1;

        const voices = await getVoices();

        // ถ้าไม่มีเสียงเลย (mobile บางเครื่อง)
        if (voices.length === 0) {
            console.warn('No voices available');
            // ลองพูดด้วย default voice
            window.speechSynthesis.speak(utterance);
            setTimeout(resolve, 1000);
            return;
        }

        const langPrefix = lang.split('-')[0]; // 'en' or 'th'
        const preferredURI = getVoicePreference(langPrefix);

        let selectedVoice = null;

        // 1. ลองใช้เสียงที่บันทึกไว้
        if (preferredURI) {
            selectedVoice = voices.find(v => v.voiceURI === preferredURI);
        }

        // 2. ถ้าไม่เจอ ลองหาเสียงที่ตรงกับภาษา
        if (!selectedVoice) {
            if (lang.startsWith('en')) {
                // ลองหาเสียงภาษาอังกฤษ (รองรับหลาย variant)
                selectedVoice = voices.find(v =>
                    v.lang.startsWith('en') && (
                        v.name.includes('Google') ||
                        v.name.includes('Female') ||
                        v.name.includes('Samantha') || // iOS
                        v.name.includes('Karen') // iOS
                    )
                );

                // ถ้ายังไม่เจอ ใช้เสียงภาษาอังกฤษตัวแรก
                if (!selectedVoice) {
                    selectedVoice = voices.find(v => v.lang.startsWith('en'));
                }
            } else if (lang.startsWith('th')) {
                // ลองหาเสียงภาษาไทย
                selectedVoice = voices.find(v => v.lang.startsWith('th'));
            }
        }

        // 3. ถ้ายังไม่เจอ ใช้เสียง default ของระบบ
        if (!selectedVoice && voices.length > 0) {
            selectedVoice = voices[0];
            console.warn(`Using default voice: ${selectedVoice.name} for lang: ${lang}`);
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.onend = () => {
            resolve();
        };

        utterance.onerror = (e) => {
            console.error("TTS Error:", e);
            // แม้ error ก็ resolve เพื่อไม่ให้แอปค้าง
            resolve();
        };

        // Mobile Safari บางครั้งต้อง resume ก่อน
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }

        window.speechSynthesis.speak(utterance);
    });
};

export const preloadVoices = () => {
    getVoices(); // Just trigger loading
};
