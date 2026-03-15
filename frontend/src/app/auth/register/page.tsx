'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRegister } from '@/hooks/useAuth';

interface FormData {
  businessName: string;
  businessSlug: string;
  businessEmail: string;
  country: string;
  currency: string;
  timezone: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const TIMEZONES = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'PKR', 'INR', 'SAR'];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    businessName: '',
    businessSlug: '',
    businessEmail: '',
    country: '',
    currency: 'USD',
    timezone: 'UTC',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const register = useRegister();

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'businessName') {
      setForm((prev) => ({
        ...prev,
        businessName: value,
        businessSlug: value.toLowerCase().replaceAll(/\s+/g, '-').replaceAll(/[^a-z0-9-]/g, ''),
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await register.mutateAsync({
        business: {
          name: form.businessName,
          slug: form.businessSlug,
          email: form.businessEmail,
          country: form.country,
          currency: form.currency,
          timezone: form.timezone,
        },
        user: {
          fullName: form.fullName,
          email: form.email,
          password: form.password,
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    }
  }

  const inputCls =
    'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              I
            </div>
            <span className="text-2xl font-bold text-slate-900">Inventra</span>
          </div>
          <p className="mt-2 text-slate-500 text-sm">Create your business account</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition ${
                  step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {s}
              </div>
              <span className={`text-xs ${step >= s ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                {s === 1 ? 'Business details' : 'Your account'}
              </span>
              {s < 2 && <div className="flex-1 h-px bg-slate-200" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label htmlFor="bname" className="block text-sm font-medium text-slate-700 mb-1">Business name</label>
                  <input id="bname" type="text" value={form.businessName} onChange={(e) => set('businessName', e.target.value)} required className={inputCls} placeholder="Acme Corp" />
                </div>
                <div>
                  <label htmlFor="bslug" className="block text-sm font-medium text-slate-700 mb-1">Business slug</label>
                  <input id="bslug" type="text" value={form.businessSlug} onChange={(e) => set('businessSlug', e.target.value)} required className={inputCls} placeholder="acme-corp" />
                  <p className="mt-1 text-xs text-slate-400">Used in login. Lowercase letters, numbers, hyphens only.</p>
                </div>
                <div>
                  <label htmlFor="bemail" className="block text-sm font-medium text-slate-700 mb-1">Business email</label>
                  <input id="bemail" type="email" value={form.businessEmail} onChange={(e) => set('businessEmail', e.target.value)} required className={inputCls} placeholder="hello@acme.com" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="bcountry" className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                    <input id="bcountry" type="text" value={form.country} onChange={(e) => set('country', e.target.value)} required className={inputCls} placeholder="US" />
                  </div>
                  <div>
                    <label htmlFor="bcurrency" className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                    <select id="bcurrency" value={form.currency} onChange={(e) => set('currency', e.target.value)} className={inputCls}>
                      {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="btz" className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
                  <select id="btz" value={form.timezone} onChange={(e) => set('timezone', e.target.value)} className={inputCls}>
                    {TIMEZONES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition mt-2">
                  Continue →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label htmlFor="fname" className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
                  <input id="fname" type="text" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required className={inputCls} placeholder="Jane Doe" />
                </div>
                <div>
                  <label htmlFor="uemail" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input id="uemail" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required className={inputCls} placeholder="jane@acme.com" />
                </div>
                <div>
                  <label htmlFor="upass" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input id="upass" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={8} className={inputCls} placeholder="Min. 8 characters" />
                </div>
                <div>
                  <label htmlFor="upass2" className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
                  <input id="upass2" type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} required className={inputCls} placeholder="••••••••" />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 border border-slate-300 text-slate-700 font-medium py-2.5 rounded-lg text-sm hover:bg-slate-50 transition">
                    ← Back
                  </button>
                  <button type="submit" disabled={register.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition">
                    {register.isPending ? 'Creating…' : 'Create account'}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
