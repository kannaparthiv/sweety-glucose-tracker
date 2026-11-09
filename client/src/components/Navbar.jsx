import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, User, HeartPulse } from 'lucide-react';

export default function Navbar({ onOpenAuth }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-bold tracking-tight text-slate-900">Sweety</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Tracker
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Blood Glucose Monitoring</p>
          </div>
        </div>

        {/* Right Action */}
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                <User className="w-4 h-4 text-emerald-600" />
                <span className="font-medium hidden sm:inline">{user?.name}</span>
                <span className="text-xs text-slate-400">({user?.email})</span>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center space-x-1.5 text-sm font-medium text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg shadow-sm shadow-emerald-600/20 transition-all hover:shadow"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
