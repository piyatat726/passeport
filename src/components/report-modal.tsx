'use client';

import { useState } from 'react';
import { reportContent, blockUser } from '@/lib/db';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporterId: string;
  targetType: 'post' | 'user' | 'comment';
  targetId: string;
  targetName?: string;
  showBlock?: boolean;
  onBlocked?: () => void;
}

const REASONS = [
  { value: 'spam', label: '垃圾訊息 / Spam' },
  { value: 'inappropriate', label: '不適當內容' },
  { value: 'harassment', label: '騷擾或霸凌' },
  { value: 'violence', label: '暴力或危險內容' },
  { value: 'misinformation', label: '虛假資訊' },
  { value: 'other', label: '其他' },
];

export function ReportModal({
  isOpen,
  onClose,
  reporterId,
  targetType,
  targetId,
  targetName,
  showBlock = false,
  onBlocked,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  if (!isOpen) return null;

  const handleReport = async () => {
    if (!selectedReason) return;
    await reportContent(reporterId, targetType, targetId, selectedReason);
    setSubmitted(true);
  };

  const handleBlock = async () => {
    await blockUser(reporterId, targetId);
    onBlocked?.();
    onClose();
  };

  const reset = () => {
    setSelectedReason('');
    setSubmitted(false);
    setShowBlockConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={reset} />
      <div className="relative bg-cream w-full max-w-md rounded-t-2xl overflow-hidden animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {submitted ? (
          <div className="px-6 pb-10 pt-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface flex items-center justify-center">
              <svg className="w-7 h-7 text-[#7EC4A5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3 className="font-playfair italic text-lg tracking-editorial text-ink mb-2">
              REPORTED
            </h3>
            <p className="text-sm text-taupe font-noto mb-6">
              感謝你的回報，我們會盡快處理
            </p>

            {showBlock && (
              <button
                onClick={() => setShowBlockConfirm(true)}
                className="w-full py-3 text-sm text-red-500 font-noto border border-red-200 rounded-xl mb-3 hover:bg-red-50 transition-colors"
              >
                封鎖 {targetName || '此用戶'}
              </button>
            )}

            <button
              onClick={reset}
              className="w-full py-3 text-sm text-ink font-inter bg-surface rounded-xl"
            >
              完成
            </button>
          </div>
        ) : showBlockConfirm ? (
          <div className="px-6 pb-10 pt-4 text-center">
            <h3 className="font-playfair italic text-lg tracking-editorial text-ink mb-2">
              BLOCK USER
            </h3>
            <p className="text-sm text-taupe font-noto mb-6">
              封鎖後對方無法查看你的內容，也無法傳送訊息給你。你確定要封鎖 {targetName || '此用戶'} 嗎？
            </p>
            <button
              onClick={handleBlock}
              className="w-full py-3 text-sm text-white font-noto bg-red-500 rounded-xl mb-3"
            >
              確認封鎖
            </button>
            <button
              onClick={() => setShowBlockConfirm(false)}
              className="w-full py-3 text-sm text-ink font-inter bg-surface rounded-xl"
            >
              取消
            </button>
          </div>
        ) : (
          <div className="px-6 pb-10 pt-2">
            <h3 className="font-playfair italic text-lg tracking-editorial text-ink mb-1 text-center">
              REPORT
            </h3>
            <p className="text-xs text-taupe font-noto mb-5 text-center">
              請選擇檢舉原因
            </p>

            <div className="space-y-2 mb-6">
              {REASONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => setSelectedReason(r.value)}
                  className={`w-full px-4 py-3 text-left text-sm font-noto rounded-xl transition-colors flex items-center justify-between ${
                    selectedReason === r.value
                      ? 'bg-ink text-cream'
                      : 'bg-surface text-ink hover:bg-border/50'
                  }`}
                >
                  {r.label}
                  {selectedReason === r.value && (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleReport}
              disabled={!selectedReason}
              className={`w-full py-3 text-sm font-inter rounded-xl transition-colors ${
                selectedReason
                  ? 'bg-red-500 text-white'
                  : 'bg-surface text-taupe cursor-not-allowed'
              }`}
            >
              送出檢舉
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
