import React, { useState } from 'react';
import { Plus, Trash2, Edit2, BookOpen, AlertTriangle } from 'lucide-react';
import VocabEditModal from './VocabEditModal';
import { useModal } from '../contexts/ModalContext';

const VocabManager = ({ vocabList, onUpdateVocab }) => {
    const { showConfirm } = useModal();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editIndex, setEditIndex] = useState(-1);

    // จัดกลุ่มคำศัพท์ตาม session
    const groupedVocab = vocabList.reduce((acc, item, index) => {
        const session = item.session || 1;
        if (!acc[session]) acc[session] = [];
        acc[session].push({ ...item, originalIndex: index });
        return acc;
    }, {});

    const sessions = Object.keys(groupedVocab).sort((a, b) => Number(a) - Number(b));

    const handleAddClick = () => {
        setEditingItem(null);
        setEditIndex(-1);
        setIsModalOpen(true);
    };

    const handleEditClick = (item) => {
        setEditingItem(item);
        setEditIndex(item.originalIndex);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (originalIndex, word) => {
        showConfirm(
            'ลบคำศัพท์',
            `คุณต้องการลบคำว่า "${word}" ใช่ไหม?`,
            () => {
                const newList = vocabList.filter((_, i) => i !== originalIndex);
                onUpdateVocab(newList);
            }
        );
    };

    const handleSave = (item) => {
        let newList = [...vocabList];

        if (editIndex >= 0) {
            // Edit existing
            newList[editIndex] = item;
        } else {
            // Add new
            newList.push(item);
        }

        onUpdateVocab(newList);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen className="text-brand-blue" />
                        จัดการคำศัพท์ ({vocabList.length} คำ)
                    </h2>
                    <p className="text-sm text-gray-400">เพิ่ม ลบ หรือแก้ไขรายการคำศัพท์ของคุณ</p>
                </div>
                <button
                    onClick={handleAddClick}
                    className="flex items-center gap-2 px-5 py-3 bg-brand-blue text-white rounded-xl shadow-lg hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all font-bold"
                >
                    <Plus size={20} />
                    เพิ่มคำศัพท์
                </button>
            </div>

            {vocabList.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">ยังไม่มีคำศัพท์</h3>
                    <p className="text-gray-400 mb-6">เริ่มเพิ่มคำศัพท์คำแรกของคุณเลย!</p>
                    <button
                        onClick={handleAddClick}
                        className="px-6 py-2 bg-white text-brand-blue border-2 border-brand-blue rounded-full font-bold hover:bg-blue-50 transition-colors"
                    >
                        เพิ่มคำศัพท์ใหม่
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {sessions.map(session => (
                        <div key={session} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 flex justify-between items-center">
                                <h3 className="font-bold text-brand-blue text-lg">
                                    บทที่ {session} (Session {session})
                                </h3>
                                <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-blue-400 shadow-sm">
                                    {groupedVocab[session].length} คำ
                                </span>
                            </div>

                            <div className="divide-y divide-gray-50">
                                {groupedVocab[session].map((item, idx) => (
                                    <div key={idx} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden border border-gray-100 shrink-0">
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.en}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300 font-bold text-xl"
                                                    style={{ display: item.image ? 'none' : 'flex' }}
                                                >
                                                    ?
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-lg">{item.en}</h4>
                                                <p className="text-gray-500 text-sm">{item.th}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditClick(item)}
                                                className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(item.originalIndex, item.en)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <VocabEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingItem}
            />
        </div>
    );
};

export default VocabManager;
