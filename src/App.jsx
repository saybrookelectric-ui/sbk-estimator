import { useState, useEffect } from 'react';
import { useStore } from './hooks/useStore';
import Dashboard from './components/Dashboard';
import NewJobScreen from './components/NewJobScreen';
import JobEditor from './components/JobEditor';
import { CustomerDatabase } from './components/CustomerDB';
import SettingsPage from './components/SettingsPage';
import LoginScreen from './components/LoginScreen';
import CalendarView from './components/CalendarView';
import RoomCalculator from './components/RoomCalculator';
import { handleQBCallback, setQBTokens } from './utils/quickbooks';
import { supabase } from './utils/supabase';

export default function App() {
  const store = useStore();
  const [view, setView] = useState('dashboard');
  const [activeJobId, setActiveJobId] = useState(null);
  const [qbCallbackStatus, setQbCallbackStatus] = useState(null);
  const [qbCallbackMsg, setQbCallbackMsg] = useState('');
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check auth state on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Handle QB OAuth callback on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('code') && params.get('realmId')) {
      setQbCallbackStatus('processing');
      const settings = store.settings;
      const redirectUri = settings.qbRedirectUri?.trim() ||
        (window.location.origin + window.location.pathname).replace(/\/?$/, '/');
      handleQBCallback(
        settings.qbClientId,
        settings.qbClientSecret,
        redirectUri
      ).then(success => {
        if (success) {
          setQbCallbackStatus('success');
          setQbCallbackMsg('QuickBooks connected successfully!');
          setTimeout(() => { setQbCallbackStatus(null); setView('settings'); }, 2000);
        }
      }).catch(e => {
        setQbCallbackStatus('error');
        setQbCallbackMsg(e.message);
        setTimeout(() => setQbCallbackStatus(null), 4000);
      });
    }
  }, []);

  const handleNewJobType = (jobType, lineItems = [], notes = '', scopes = null) => {
    const id = store.createJob({
      jobType,
      status: 'draft',
      lineItems: scopes ? [] : (lineItems || []),
      scopes: scopes || null,
      notes: notes || '',
      scopeTitle: scopes ? 'New Construction (Preliminary)' : lineItems?.length > 0 ? 'House Rewire (Preliminary)' : '',
    });
    setActiveJobId(id);
    setView('job');
  };

  const handleSelectJob = (id) => {
    setActiveJobId(id);
    setView('job');
  };

  const handleDuplicate = (id) => {
    const newId = store.duplicateJob(id);
    if (newId) { setActiveJobId(newId); setView('job'); }
  };

  const job = store.getJob(activeJobId);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⚡</div>
          <p className="text-[#444] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in — show login screen
  if (!session) {
    return <LoginScreen onLogin={setSession} />;
  }

  return (
    <>
      {/* QB OAuth callback overlay */}
      {qbCallbackStatus && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-8 text-center max-w-sm w-full mx-4">
            {qbCallbackStatus === 'processing' && (
              <>
                <div className="text-4xl mb-4 animate-spin">⟳</div>
                <p className="condensed text-xl font-black text-white">CONNECTING TO QUICKBOOKS</p>
                <p className="text-[#555] text-sm mt-2">Exchanging authorization tokens...</p>
              </>
            )}
            {qbCallbackStatus === 'success' && (
              <>
                <div className="text-4xl mb-4">✅</div>
                <p className="condensed text-xl font-black text-green-400">CONNECTED!</p>
                <p className="text-[#555] text-sm mt-2">{qbCallbackMsg}</p>
              </>
            )}
            {qbCallbackStatus === 'error' && (
              <>
                <div className="text-4xl mb-4">❌</div>
                <p className="condensed text-xl font-black text-red-400">CONNECTION FAILED</p>
                <p className="text-red-400/70 text-sm mt-2">{qbCallbackMsg}</p>
              </>
            )}
          </div>
        </div>
      )}

      {view === 'new' && <NewJobScreen onSelect={handleNewJobType} onBack={() => setView('dashboard')} settings={store.settings} />}
      {view === 'job' && job && (
        <JobEditor
          job={job}
          customers={store.customers}
          settings={store.settings}
          onUpdate={store.updateJob}
          onBack={() => setView('dashboard')}
          onCreateCustomer={store.createCustomer}
          claimInvoiceNumber={store.claimInvoiceNumber}
        />
      )}
      {view === 'customers' && (
        <CustomerDatabase
          customers={store.customers}
          onCreateCustomer={store.createCustomer}
          onUpdateCustomer={store.updateCustomer}
          onDeleteCustomer={store.deleteCustomer}
          onBack={() => setView('dashboard')}
        />
      )}
      {view === 'settings' && (
        <SettingsPage
          settings={store.settings}
          onSave={store.setSettings}
          onBack={() => setView('dashboard')}
        />
      )}
      {view === 'calendar' && (
        <div className="min-h-screen bg-black">
          <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 py-3 flex items-center gap-3">
            <button onClick={() => setView('dashboard')} className="text-[#555] hover:text-[#f59e0b] text-sm transition-colors">← Dashboard</button>
          </div>
          <CalendarView jobs={store.jobs} settings={store.settings} onGoToSettings={() => setView('settings')} />
        </div>
      )}
      {view === 'calculator' && (
        <div className="min-h-screen bg-black">
          <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 py-3 flex items-center gap-3">
            <button onClick={() => setView('dashboard')} className="text-[#555] hover:text-[#f59e0b] text-sm transition-colors">← Dashboard</button>
          </div>
          <RoomCalculator />
        </div>
      )}
      {(view === 'dashboard' || (view === 'job' && !job)) && (
        <Dashboard
          jobs={store.jobs}
          customers={store.customers}
          settings={store.settings}
          onNewJob={() => setView('new')}
          onSelectJob={handleSelectJob}
          onDeleteJob={store.deleteJob}
          onDuplicateJob={handleDuplicate}
          onCustomers={() => setView('customers')}
          onSettings={() => setView('settings')}
          onCalendar={() => setView('calendar')}
          onCalculator={() => setView('calculator')}
          syncStatus={store.syncStatus}
          syncError={store.syncError}
          onRestoreBackup={store.restoreBackup}
        />
      )}
    </>
  );
}
