'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: React.ReactNode;
  readonly maxWidth?: string;
}

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-default"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-xl shadow-slate-200 overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// Shared form field components for consistency

interface FieldProps {
  readonly label: string;
  readonly required?: boolean;
  readonly children: React.ReactNode;
}

export function Field({ label, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

type InputProps = Readonly<React.InputHTMLAttributes<HTMLInputElement>>;

export function Input(props: InputProps) {
  return (
    <input
      {...props}
      className="h-9 px-3 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:bg-white transition-colors disabled:opacity-50"
    />
  );
}

type SelectBaseProps = Readonly<React.SelectHTMLAttributes<HTMLSelectElement>>;
type SelectProps = SelectBaseProps & { readonly children: React.ReactNode };

export function Select({ children, ...rest }: SelectProps) {
  return (
    <select
      {...rest}
      className="h-9 px-3 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition-colors disabled:opacity-50"
    >
      {children}
    </select>
  );
}

type TextareaProps = Readonly<React.TextareaHTMLAttributes<HTMLTextAreaElement>>;

export function Textarea(props: TextareaProps) {
  return (
    <textarea
      {...props}
      className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:bg-white transition-colors resize-none disabled:opacity-50"
      rows={props.rows ?? 3}
    />
  );
}

interface FormActionsProps {
  readonly onCancel: () => void;
  readonly loading?: boolean;
  readonly submitLabel?: string;
}

export function FormActions({ onCancel, loading, submitLabel = 'Save' }: FormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
      <button
        type="button"
        onClick={onCancel}
        className="h-8 px-4 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="h-8 px-4 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {loading ? 'Saving…' : submitLabel}
      </button>
    </div>
  );
}
