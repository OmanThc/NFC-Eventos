import { Transaction, Company, Product } from '../types';

export interface ProviderItemStat {
  name: string;
  qty: number;
  emoji: string;
  revenueUSD: number;
}

export interface ProviderFinancialSummary {
  name: string;
  companyId?: string;
  companyName?: string;
  salesCount: number;
  totalUSD: number;
  totalBs: number;
  percentageOfTotal: number;
  commissionUSD: number;
  commissionBs: number;
  netUSD: number;
  netBs: number;
  itemsBreakdown: ProviderItemStat[];
}

/**
 * Calculates provider/stand revenue breakdown in USD and Bs for a single company
 */
export function calculateCompanyProviderStats(
  products: Product[],
  transactions: Transaction[],
  commissionRate: number = 0,
  defaultBcvRate: number = 52.40
): ProviderFinancialSummary[] {
  // 1. Gather all known providers from catalog
  const providerMap = new Map<string, {
    salesCount: number;
    totalUSD: number;
    totalBs: number;
    items: Map<string, ProviderItemStat>;
  }>();

  products.forEach(p => {
    const provName = p.provider?.trim() || 'Stand General';
    if (!providerMap.has(provName)) {
      providerMap.set(provName, {
        salesCount: 0,
        totalUSD: 0,
        totalBs: 0,
        items: new Map(),
      });
    }
  });

  // 2. Process all consumption transactions
  const consumptions = transactions.filter(t => t.type === 'CONSUMO');

  consumptions.forEach(tx => {
    const txRate = tx.bcvRate || defaultBcvRate;

    if (tx.cartSnapshot && tx.cartSnapshot.length > 0) {
      // Group by item provider if available
      tx.cartSnapshot.forEach(item => {
        const itemProv = item.provider?.trim() || tx.provider?.trim() || 'Stand General';
        if (!providerMap.has(itemProv)) {
          providerMap.set(itemProv, {
            salesCount: 0,
            totalUSD: 0,
            totalBs: 0,
            items: new Map(),
          });
        }

        const data = providerMap.get(itemProv)!;
        const itemTotalUSD = item.price * item.qty;
        const itemTotalBs = itemTotalUSD * txRate;

        data.totalUSD += itemTotalUSD;
        data.totalBs += itemTotalBs;

        // items breakdown
        if (data.items.has(item.name)) {
          const it = data.items.get(item.name)!;
          it.qty += item.qty;
          it.revenueUSD += itemTotalUSD;
        } else {
          data.items.set(item.name, {
            name: item.name,
            qty: item.qty,
            emoji: item.emoji || '🍽️',
            revenueUSD: itemTotalUSD,
          });
        }
      });

      // Increment sales count for each distinct provider in this ticket
      const distinctProvs = new Set(
        tx.cartSnapshot.map(i => i.provider?.trim() || tx.provider?.trim() || 'Stand General')
      );
      distinctProvs.forEach(prov => {
        if (providerMap.has(prov)) {
          providerMap.get(prov)!.salesCount += 1;
        }
      });
    } else {
      // Fallback: entire ticket assigned to tx.provider
      const provName = tx.provider?.trim() || 'Stand General';
      if (!providerMap.has(provName)) {
        providerMap.set(provName, {
          salesCount: 0,
          totalUSD: 0,
          totalBs: 0,
          items: new Map(),
        });
      }
      const data = providerMap.get(provName)!;
      data.totalUSD += tx.usd;
      data.totalBs += tx.bs;
      data.salesCount += 1;
    }
  });

  // Total USD across all providers for percentage calculation
  let grandTotalUSD = 0;
  providerMap.forEach(d => {
    grandTotalUSD += d.totalUSD;
  });

  // 3. Format result list sorted by revenue descending
  const results: ProviderFinancialSummary[] = [];

  providerMap.forEach((data, provName) => {
    const totalUSD = Number(data.totalUSD.toFixed(2));
    const totalBs = Number(data.totalBs.toFixed(2));
    const percentage = grandTotalUSD > 0 ? Number(((totalUSD / grandTotalUSD) * 100).toFixed(1)) : 0;
    const commissionUSD = Number((totalUSD * (commissionRate / 100)).toFixed(2));
    const commissionBs = Number((totalBs * (commissionRate / 100)).toFixed(2));
    const netUSD = Number((totalUSD - commissionUSD).toFixed(2));
    const netBs = Number((totalBs - commissionBs).toFixed(2));

    results.push({
      name: provName,
      salesCount: data.salesCount,
      totalUSD,
      totalBs,
      percentageOfTotal: percentage,
      commissionUSD,
      commissionBs,
      netUSD,
      netBs,
      itemsBreakdown: Array.from(data.items.values()).sort((a, b) => b.revenueUSD - a.revenueUSD),
    });
  });

  return results.sort((a, b) => b.totalUSD - a.totalUSD);
}

/**
 * Consolidates provider sales across all companies for the Super Admin
 */
export function calculateGlobalProviderStats(
  companies: Company[]
): ProviderFinancialSummary[] {
  const globalList: ProviderFinancialSummary[] = [];

  companies.forEach(comp => {
    const compStats = calculateCompanyProviderStats(
      comp.products,
      comp.transactions,
      comp.settings.eventCommissionRate || 0,
      comp.settings.bcvRate || 52.40
    );

    compStats.forEach(stat => {
      globalList.push({
        ...stat,
        companyId: comp.id,
        companyName: comp.name,
      });
    });
  });

  // Calculate percentage of global total
  const grandGlobalUSD = globalList.reduce((sum, s) => sum + s.totalUSD, 0);

  return globalList
    .map(s => ({
      ...s,
      percentageOfTotal: grandGlobalUSD > 0 ? Number(((s.totalUSD / grandGlobalUSD) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.totalUSD - a.totalUSD);
}

/**
 * Exports provider settlement report to CSV
 */
export function exportProvidersCSV(
  stats: ProviderFinancialSummary[], 
  filename: string = 'liquidacion_proveedores.csv',
  includeCompanyColumn: boolean = false
) {
  const headers = includeCompanyColumn
    ? ['Empresa / Evento', 'Nombre del Proveedor', 'Ventas Realizadas', 'Total Generado ($ USD)', 'Total Generado (Bs)', '% de Ventas', 'Comisión Evento ($)', 'Neto Proveedor ($)', 'Neto Proveedor (Bs)']
    : ['Nombre del Proveedor', 'Ventas Realizadas', 'Total Generado ($ USD)', 'Total Generado (Bs)', '% de Ventas', 'Comisión Evento ($)', 'Neto Proveedor ($)', 'Neto Proveedor (Bs)'];

  const rows = stats.map(s => {
    const row = [
      `"${s.name.replace(/"/g, '""')}"`,
      s.salesCount,
      s.totalUSD.toFixed(2),
      s.totalBs.toFixed(2),
      `${s.percentageOfTotal}%`,
      s.commissionUSD.toFixed(2),
      s.netUSD.toFixed(2),
      s.netBs.toFixed(2),
    ];
    if (includeCompanyColumn) {
      row.unshift(`"${(s.companyName || '').replace(/"/g, '""')}"`);
    }
    return row;
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
