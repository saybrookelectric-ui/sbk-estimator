export function calcJobTotals(job, settings) {
  const laborRate = settings?.laborRate || 95;
  const markupPct = settings?.defaultMarkup || 20;
  const multiplier = job.laborMultiplier || 1.0;

  // Multi-scope: if job has scopes array, sum across all scopes
  const scopes = job.scopes && job.scopes.length > 0 ? job.scopes : null;

  function calcScope(lineItems) {
    let totalMaterial = 0;
    let totalLaborHrs = 0;
    let totalAllIn = 0;

    const lineDetails = (lineItems || []).map(item => {
      const qty = item.qty || 0;
      if (item.allInPrice != null) {
        totalAllIn += item.allInPrice * qty;
        return { ...item, subtotal: item.allInPrice * qty, isAllIn: true };
      }
      const mat = (item.material || 0) * qty;
      const hrs = (item.laborHrs || 0) * qty * multiplier;
      totalMaterial += mat;
      totalLaborHrs += hrs;
      return { ...item, subtotal: mat + hrs * laborRate, isAllIn: false };
    });

    const totalLaborCost = totalLaborHrs * laborRate;
    const subtotal = totalMaterial + totalLaborCost + totalAllIn;
    return { totalMaterial, totalLaborHrs, totalLaborCost, totalAllIn, subtotal, lineDetails };
  }

  if (scopes) {
    const scopeTotals = scopes.map(scope => ({
      ...scope,
      ...calcScope(scope.lineItems),
    }));
    const totalMaterial = scopeTotals.reduce((s, t) => s + t.totalMaterial, 0);
    const totalLaborHrs = scopeTotals.reduce((s, t) => s + t.totalLaborHrs, 0);
    const totalLaborCost = scopeTotals.reduce((s, t) => s + t.totalLaborCost, 0);
    const totalAllIn = scopeTotals.reduce((s, t) => s + t.totalAllIn, 0);
    const subtotal = scopeTotals.reduce((s, t) => s + t.subtotal, 0);
    const markupAmt = subtotal * (markupPct / 100);
    const grandTotal = subtotal + markupAmt;
    return {
      totalMaterial, totalLaborHrs, totalLaborCost, totalAllIn,
      subtotal, markupPct, markupAmt, grandTotal,
      laborRate, multiplier,
      scopeTotals,
      isMultiScope: true,
    };
  }

  // Single scope (original behavior)
  const { totalMaterial, totalLaborHrs, totalLaborCost, totalAllIn, subtotal, lineDetails } = calcScope(job.lineItems);
  const markupAmt = subtotal * (markupPct / 100);
  const grandTotal = subtotal + markupAmt;

  return {
    totalMaterial, totalLaborHrs, totalLaborCost, totalAllIn,
    subtotal, markupPct, markupAmt, grandTotal,
    lineDetails, laborRate, multiplier,
    isMultiScope: false,
  };
}

export function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
}

export function formatHours(h) {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}
