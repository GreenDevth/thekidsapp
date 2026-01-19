import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon } from 'lucide-react';

const VocabEditModal = ({ isOpen, onClose, onSave, initialData = null }) => {
    const [formData, setFormData] = useState({
        session: 1,
        en: '',
        th: '',
        image: ''
    });

    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData(initialData);
            } else {
                setFormData({
                    session: 1,
                    en: '',
                    th: '',
                    image: ''
                });
            }
            setError('');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        // Simple Validation
        if (!formData.en.trim() || !formData.th.trim()) {
            setError('กรุณากรอกคำศัพท์ภาษาอังกฤษและภาษาไทย');
            return;
        }

        if (formData.session < 1) {
            setError('Session ต้องเป็นตัวเลขมากกว่า 0');
            return;
        }

        onSave({
            ...formData,
            session: parseInt(formData.session),
            en: formData.en.trim(),
            th: formData.th.trim(),
            image: formData.image.trim()
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border-4 border-white max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        {initialData ? '✏️ แก้ไขคำศัพท์' : '➕ เพิ่มคำศัพท์ใหม่'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Session ID */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            บทที่ (Session)
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={formData.session}
                            onChange={e => setFormData({ ...formData, session: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-blue focus:ring-4 focus:ring-blue-100 outline-none font-bold text-lg transition-all"
                        />
                    </div>

                    {/* Word Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                ภาษาอังกฤษ (English)
                            </label>
                            <input
                                type="text"
                                placeholder="Apple"
                                value={formData.en}
                                onChange={e => setFormData({ ...formData, en: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-pink focus:ring-4 focus:ring-pink-100 outline-none font-bold text-lg transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                ภาษาไทย (Thai)
                            </label>
                            <input
                                type="text"
                                placeholder="แอปเปิ้ล"
                                value={formData.th}
                                onChange={e => setFormData({ ...formData, th: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-green focus:ring-4 focus:ring-green-100 outline-none font-bold text-lg transition-all"
                            />
                        </div>
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            ลิงก์รูปภาพ (Image URL) - ไม่บังคับ
                        </label>
                        <div className="relative">
                            <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="https://..."
                                value={formData.image}
                                onChange={e => setFormData({ ...formData, image: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-yellow focus:ring-4 focus:ring-yellow-100 outline-none text-gray-600 transition-all"
                            />
                        </div>
                    </div>

                    {/* Image Preview */}
                    <div className="mt-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            ตัวอย่างรูปภาพ (Preview)
                        </label>
                        <div className="w-full h-48 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                            {formData.image ? (
                                <img
                                    src={formData.image}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}

                            {/* Fallback display */}
                            <div
                                className="absolute inset-0 flex flex-col items-center justify-center text-gray-400"
                                style={{ display: formData.image ? 'none' : 'flex' }}
                            >
                                {formData.image ? (
                                    <>
                                        <span className="text-4xl mb-2">?</span>
                                        <span className="text-xs">โหลดรูปไม่ได้</span>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon size={48} className="mb-2 opacity-50" />
                                        <span className="text-xs">ยังไม่มีรูปภาพ</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-500 rounded-xl text-sm font-bold text-center animate-pulse">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-600 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            บันทึก
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VocabEditModal;
