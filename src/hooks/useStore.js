import { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_SETTINGS } from '../data/jobTypes';
import { supabase } from '../utils/supabase';

// ── Local cache helpers ───────────────────────────────────────────────────────
function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Debounce helper ───────────────────────────────────────────────────────────
function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

// ── Main store ────────────────────────────────────────────────────────────────
export function useStore() {
  const [jobs, setJobsState] = useState(() => lsGet('sbk_jobs', []));
  const [customers, setCustomersState] = useState(() => lsGet('sbk_customers', []));
  const [settings, setSettingsState] = useState(() => lsGet('sbk_settings', DEFAULT_SETTINGS));
  const [customPrices, setCustomPricesState] = useState(() => lsGet('sbk_custom_prices', {}));
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncError, setSyncError] = useState(null);

  // ── Load from Supabase on mount ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadFromCloud() {
      setSyncStatus('syncing');
      try {
        const [{ data: jobRows }, { data: custRows }, { data: settRows }] = await Promise.all([
          supabase.from('jobs').select('id, data, updated_at').order('updated_at', { ascending: false }),
          supabase.from('customers').select('id, data, updated_at').order('updated_at', { ascending: false }),
          supabase.from('settings').select('data').eq('id', 'default').maybeSingle(),
        ]);
        if (cancelled) return;
        if (jobRows) {
          const cloudJobs = jobRows.map(r => ({ ...r.data, id: r.id }));
          setJobsState(cloudJobs);
          lsSet('sbk_jobs', cloudJobs);
        }
        if (custRows) {
          const cloudCustomers = custRows.map(r => ({ ...r.data, id: r.id }));
          setCustomersState(cloudCustomers);
          lsSet('sbk_customers', cloudCustomers);
        }
        if (settRows?.data) {
          const merged = { ...DEFAULT_SETTINGS, ...settRows.data };
          setSettingsState(merged);
          lsSet('sbk_settings', merged);
        }
        setSyncStatus('synced');
      } catch (e) {
        if (!cancelled) { setSyncError(e.message); setSyncStatus('error'); }
      }
    }
    loadFromCloud();
    return () => { cancelled = true; };
  }, []);

  // ── Upsert helpers ────────────────────────────────────────────────────────
  const upsertJob = useCallback(async (job) => {
    const { id, ...data } = job;
    const { error } = await supabase.from('jobs').upsert({ id, data });
    if (error) console.error('Supabase job upsert:', error.message);
  }, []);

  const upsertCustomer = useCallback(async (customer) => {
    const { id, ...data } = customer;
    const { error } = await supabase.from('customers').upsert({ id, data });
    if (error) console.error('Supabase customer upsert:', error.message);
  }, []);

  const upsertSettings = useCallback(async (s) => {
    const { error } = await supabase.from('settings').upsert({ id: 'default', data: s });
    if (error) console.error('Supabase settings upsert:', error.message);
  }, []);

  const debouncedUpsertSettings = useDebounce(upsertSettings, 1000);

  // ── JOBS ──────────────────────────────────────────────────────────────────
  const setJobs = (updater) => {
    setJobsState(prev => {
      const next = updater instanceof Function ? updater(prev) : updater;
      lsSet('sbk_jobs', next);
      return next;
    });
  };

  const createJob = (data) => {
    const id = Date.now().toString();
    const job = {
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      lineItems: [],
      notes: '',
      quoteDisplayMode: 'summary',
      laborMultiplier: 1.0,
      ...data,
    };
    setJobs(prev => [job, ...prev]);
    upsertJob(job);
    return id;
  };

  const updateJob = (id, updates) => {
    setJobs(prev => {
      const next = prev.map(j =>
        j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j
      );
      const updated = next.find(j => j.id === id);
      if (updated) upsertJob(updated);
      return next;
    });
  };

  const deleteJob = (id) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    supabase.from('jobs').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Supabase delete job:', error.message);
    });
  };

  const duplicateJob = (id) => {
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    const newId = Date.now().toString();
    const duped = {
      ...job, id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      customerName: (job.customerName || '') + ' (Copy)',
      signature: null, signedAt: null,
    };
    setJobs(prev => [duped, ...prev]);
    upsertJob(duped);
    return newId;
  };

  const getJob = (id) => jobs.find(j => j.id === id);

  // ── CUSTOMERS ─────────────────────────────────────────────────────────────
  const setCustomers = (updater) => {
    setCustomersState(prev => {
      const next = updater instanceof Function ? updater(prev) : updater;
      lsSet('sbk_customers', next);
      return next;
    });
  };

  const createCustomer = (data) => {
    const id = Date.now().toString();
    const customer = { id, createdAt: new Date().toISOString(), ...data };
    setCustomers(prev => [customer, ...prev]);
    upsertCustomer(customer);
    return id;
  };

  const updateCustomer = (id, updates) => {
    setCustomers(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      const updated = next.find(c => c.id === id);
      if (updated) upsertCustomer(updated);
      return next;
    });
  };

  const deleteCustomer = (id) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    supabase.from('customers').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Supabase delete customer:', error.message);
    });
  };

  const getCustomer = (id) => customers.find(c => c.id === id);

  // ── SETTINGS ─────────────────────────────────────────────────────────────
  const setSettings = (updates) => {
    const next = { ...settings, ...updates };
    setSettingsState(next);
    lsSet('sbk_settings', next);
    debouncedUpsertSettings(next);
  };

  // ── CUSTOM PRICES ─────────────────────────────────────────────────────────
  const setCustomPrices = (val) => {
    const next = val instanceof Function ? val(customPrices) : val;
    setCustomPricesState(next);
    lsSet('sbk_custom_prices', next);
  };

  return {
    jobs, customers, settings, customPrices,
    syncStatus, syncError,
    setSettings, setCustomPrices,
    createJob, updateJob, deleteJob, duplicateJob, getJob,
    createCustomer, updateCustomer, deleteCustomer, getCustomer,
  };
}
