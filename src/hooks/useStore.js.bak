import { useState } from 'react';
import { DEFAULT_SETTINGS } from '../data/jobTypes';

function useLS(key, initial) {
  const [val, setVal] = useState(() => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : initial; }
    catch { return initial; }
  });
  const set = (v) => {
    const next = v instanceof Function ? v(val) : v;
    setVal(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  };
  return [val, set];
}

export function useStore() {
  const [jobs, setJobs] = useLS('sbk_jobs', []);
  const [customers, setCustomers] = useLS('sbk_customers', []);
  const [settings, setSettings] = useLS('sbk_settings', DEFAULT_SETTINGS);
  const [customPrices, setCustomPrices] = useLS('sbk_custom_prices', {});

  // --- JOBS ---
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
    return id;
  };

  const updateJob = (id, updates) => {
    setJobs(prev => prev.map(j =>
      j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j
    ));
  };

  const deleteJob = (id) => setJobs(prev => prev.filter(j => j.id !== id));

  const duplicateJob = (id) => {
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    const newId = Date.now().toString();
    setJobs(prev => [{
      ...job, id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      customerName: (job.customerName || '') + ' (Copy)',
      signature: null,
      signedAt: null,
    }, ...prev]);
    return newId;
  };

  const getJob = (id) => jobs.find(j => j.id === id);

  // --- CUSTOMERS ---
  const createCustomer = (data) => {
    const id = Date.now().toString();
    const customer = { id, createdAt: new Date().toISOString(), ...data };
    setCustomers(prev => [customer, ...prev]);
    return id;
  };

  const updateCustomer = (id, updates) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCustomer = (id) => setCustomers(prev => prev.filter(c => c.id !== id));

  const getCustomer = (id) => customers.find(c => c.id === id);

  return {
    jobs, customers, settings, customPrices,
    setSettings, setCustomPrices,
    createJob, updateJob, deleteJob, duplicateJob, getJob,
    createCustomer, updateCustomer, deleteCustomer, getCustomer,
  };
}
