// SBK Estimator — Backup & Restore utilities

export function exportBackup(jobs, customers, settings) {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    appName: 'SBK Estimator',
    jobs,
    customers,
    settings,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
  const a = document.createElement('a');
  a.href = url;
  a.download = `SBK-Estimator-Backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { jobCount: jobs.length, customerCount: customers.length };
}

export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.jobs || !Array.isArray(data.jobs)) {
          reject(new Error('Invalid backup file — missing jobs array'));
          return;
        }
        resolve({
          jobs: data.jobs || [],
          customers: data.customers || [],
          settings: data.settings || null,
          exportedAt: data.exportedAt,
          version: data.version,
        });
      } catch (err) {
        reject(new Error('Could not read backup file — invalid JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
