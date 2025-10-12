/**
 * Reusable Modal Components for Super Admin Dashboard
 * Provides styled confirmation and alert dialogs
 */

import { ReactNode } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  icon?: string;
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  icon?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  icon,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      bg: 'bg-red-950/90 border-red-500',
      headerBg: 'bg-red-950/90 border-red-800',
      titleColor: 'text-red-400',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      icon: icon || '⚠️',
    },
    warning: {
      bg: 'bg-amber-950/90 border-amber-500',
      headerBg: 'bg-amber-950/90 border-amber-800',
      titleColor: 'text-amber-400',
      buttonBg: 'bg-amber-600 hover:bg-amber-700',
      icon: icon || '⚠️',
    },
    info: {
      bg: 'bg-blue-950/90 border-blue-500',
      headerBg: 'bg-blue-950/90 border-blue-800',
      titleColor: 'text-blue-400',
      buttonBg: 'bg-primary hover:bg-primary-hover',
      icon: icon || 'ℹ️',
    },
    success: {
      bg: 'bg-emerald-950/90 border-emerald-500',
      headerBg: 'bg-emerald-950/90 border-emerald-800',
      titleColor: 'text-emerald-400',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
      icon: icon || '✅',
    },
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`border-2 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col ${styles.bg}`}>
        {/* Header */}
        <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between ${styles.headerBg}`}>
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{styles.icon}</span>
            <h2 className={`text-xl font-bold ${styles.titleColor}`}>{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - with scrollbar for long content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="text-foreground whitespace-pre-line">{message}</div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-700 p-4 flex items-center space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-foreground rounded-lg transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium ${styles.buttonBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  icon,
}: AlertModalProps) {
  if (!isOpen) return null;

  const typeStyles = {
    success: {
      bg: 'bg-emerald-950/90 border-emerald-500',
      headerBg: 'bg-emerald-950/90 border-emerald-800',
      titleColor: 'text-emerald-400',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
      icon: icon || '✅',
    },
    info: {
      bg: 'bg-blue-950/90 border-blue-500',
      headerBg: 'bg-blue-950/90 border-blue-800',
      titleColor: 'text-blue-400',
      buttonBg: 'bg-primary hover:bg-primary-hover',
      icon: icon || 'ℹ️',
    },
    warning: {
      bg: 'bg-amber-950/90 border-amber-500',
      headerBg: 'bg-amber-950/90 border-amber-800',
      titleColor: 'text-amber-400',
      buttonBg: 'bg-amber-600 hover:bg-amber-700',
      icon: icon || '⚠️',
    },
    error: {
      bg: 'bg-red-950/90 border-red-500',
      headerBg: 'bg-red-950/90 border-red-800',
      titleColor: 'text-red-400',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      icon: icon || '🚨',
    },
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`border-2 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col ${styles.bg}`}>
        {/* Header */}
        <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between ${styles.headerBg}`}>
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{styles.icon}</span>
            <h2 className={`text-xl font-bold ${styles.titleColor}`}>{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - with scrollbar for long content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="text-foreground whitespace-pre-line">{message}</div>
        </div>

        {/* Action */}
        <div className="border-t border-slate-700 p-4">
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 text-white rounded-lg transition-colors font-medium ${styles.buttonBg}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
