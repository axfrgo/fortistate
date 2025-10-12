'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Check, X, ArrowRight } from 'lucide-react';

export default function UpgradePage() {
  const [orgName, setOrgName] = useState('Your Organization');

  useEffect(() => {
    // Fetch organization info
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.organization) {
          setOrgName(data.organization.name);
        }
      })
      .catch(err => console.error('Failed to fetch org:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500/20 rounded-full mb-6">
            <Shield className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Enterprise Access Required
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            The User Admin panel is an enterprise feature. Contact your Fortistate account manager to enable advanced team management for <span className="font-semibold text-white">{orgName}</span>.
          </p>
        </div>

        {/* Features Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Current Plan */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Current Plan</h3>
              <span className="px-3 py-1 bg-slate-700 text-slate-300 text-sm font-medium rounded">
                Standard
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">Visual Studio IDE access</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">State management tools</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">Individual user account</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">Collaboration features</span>
              </div>
              <div className="flex items-start space-x-3 opacity-50">
                <X className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-500">User Admin panel</span>
              </div>
              <div className="flex items-start space-x-3 opacity-50">
                <X className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-500">Team management</span>
              </div>
              <div className="flex items-start space-x-3 opacity-50">
                <X className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-500">Role-based access control</span>
              </div>
              <div className="flex items-start space-x-3 opacity-50">
                <X className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-500">Advanced analytics</span>
              </div>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/20 border-2 border-amber-500/50 rounded-lg p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded uppercase">
                Upgrade
              </span>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Enterprise Plan</h3>
              <p className="text-sm text-slate-300">Everything you need for team management</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-200 font-medium">All Standard features</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-white font-medium">User Admin panel access</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-white font-medium">Team member management</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-white font-medium">Role-based permissions</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-white font-medium">Organization settings</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-white font-medium">Advanced team analytics</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-white font-medium">Audit logs & compliance</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-white font-medium">Priority support</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to enable enterprise features?
          </h3>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Contact your Fortistate account manager or reach out to our sales team to upgrade your organization to enterprise access.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <a
              href="mailto:enterprise@fortistate.dev?subject=Enterprise Access Request"
              className="inline-flex items-center px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors"
            >
              Contact Sales
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>

        {/* Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            Already upgraded? Try{' '}
            <button
              onClick={() => window.location.reload()}
              className="text-amber-400 hover:text-amber-300 underline"
            >
              refreshing the page
            </button>
            {' '}or contact support if you&apos;re still seeing this message.
          </p>
        </div>
      </div>
    </div>
  );
}
