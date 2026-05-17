// =============================================================
//  adminReports.js — Reports & Analytics Page Interactivity
//  ArtsyVibe — Artisan Co-op Platform
// =============================================================
//  Works alongside adminDashboard.js (sidebar, dropdown, logout)
//  and the existing inline script (updateDateRange, downloadReport,
//  showNotification).
//
//  This file adds:
//   1.  Date Range select — updates all KPI cards + chart data
//   2.  Custom date range — show/hide + validate start ≤ end
//   3.  KPI cards — animated count-up on page load
//   4.  KPI cards — hover tooltip showing vs-last-period detail
//   5.  Revenue line chart — interactive hover tooltips on points
//   6.  Revenue line chart — animated path draw on load
//   7.  Orders by category donut — hover segment highlights + tooltip
//   8.  New User Registrations bar chart — hover tooltips on bars
//   9.  Top Performing Artisans — animated bar fill on load
//  10.  Best Selling Products table — sortable columns
//  11.  Download Report — real CSV export of visible table data
//  12.  Platform Health — live "time since last backup" counter
//  13.  Page load staggered fade-in animations
// =============================================================

(() => {
  // ─────────────────────────────────────────────
  // SECTION 0 — Utilities
  // ─────────────────────────────────────────────
  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // ─────────────────────────────────────────────
  // SECTION 1 — Date Range Select
  // ─────────────────────────────────────────────
  // Data sets for each range — KPI values update to match
  // so the page feels responsive even without a backend.
  const rangeData = {
    week: {
      label        : 'This Week',
      revenue      : { value: 'BD 8,240',   change: '+4.2%',  up: true,  vs: 'BD 7,908 last period' },
      orders       : { value: '312',         change: '+2.8%',  up: true,  vs: '303 last period'      },
      newUsers     : { value: '58',          change: '+11.5%', up: true,  vs: '52 last period'       },
      artisans     : { value: '148',         change: '+1.4%',  up: true,  vs: '146 last period'      },
      auctionRev   : { value: 'BD 1,820',   change: '-1.1%',  up: false, vs: 'BD 1,840 last period' },
      revenuePoints: [180, 155, 165, 120, 100, 85],
      regCustomers : [60, 80, 70, 100, 90, 110],
      regArtisans  : [30, 40, 25, 50, 55, 60],
    },
    month: {
      label        : 'This Month',
      revenue      : { value: 'BD 284,520', change: '+12.5%', up: true,  vs: 'BD 252,900 last period' },
      orders       : { value: '1,847',       change: '+8.3%',  up: true,  vs: '1,705 last period'      },
      newUsers     : { value: '342',         change: '+15.2%', up: true,  vs: '297 last period'        },
      artisans     : { value: '156',         change: '+5.1%',  up: true,  vs: '148 last period'        },
      auctionRev   : { value: 'BD 45,280',  change: '-3.2%',  up: false, vs: 'BD 46,780 last period'  },
      revenuePoints: [180, 140, 160, 100, 80, 60],
      regCustomers : [60, 80, 70, 100, 90, 110],
      regArtisans  : [30, 40, 25, 50, 55, 60],
    },
    '3months': {
      label        : 'Last 3 Months',
      revenue      : { value: 'BD 712,400', change: '+18.3%', up: true,  vs: 'BD 601,800 last period' },
      orders       : { value: '5,214',       change: '+14.7%', up: true,  vs: '4,545 last period'      },
      newUsers     : { value: '987',         change: '+22.1%', up: true,  vs: '808 last period'        },
      artisans     : { value: '162',         change: '+9.5%',  up: true,  vs: '148 last period'        },
      auctionRev   : { value: 'BD 98,400',  change: '+5.8%',  up: true,  vs: 'BD 92,980 last period'  },
      revenuePoints: [195, 165, 140, 110, 85, 60],
      regCustomers : [80, 100, 90, 120, 110, 140],
      regArtisans  : [40, 55, 45, 65, 60, 75],
    },
    year: {
      label        : 'This Year',
      revenue      : { value: 'BD 2.4M',    change: '+31.2%', up: true,  vs: 'BD 1.83M last period' },
      orders       : { value: '21,840',      change: '+28.6%', up: true,  vs: '16,978 last period'   },
      newUsers     : { value: '4,120',       change: '+41.3%', up: true,  vs: '2,915 last period'    },
      artisans     : { value: '178',         change: '+20.3%', up: true,  vs: '148 last period'      },
      auctionRev   : { value: 'BD 384,200', change: '+18.4%', up: true,  vs: 'BD 324,500 last period'},
      revenuePoints: [200, 175, 155, 130, 105, 75],
      regCustomers : [100, 130, 115, 155, 140, 180],
      regArtisans  : [50, 70, 60, 85, 75, 95],
    },
    custom: {
      label        : 'Custom Range',
      revenue      : { value: 'BD —',       change: '—',      up: true,  vs: '—' },
      orders       : { value: '—',           change: '—',      up: true,  vs: '—' },
      newUsers     : { value: '—',           change: '—',      up: true,  vs: '—' },
      artisans     : { value: '—',           change: '—',      up: true,  vs: '—' },
      auctionRev   : { value: 'BD —',       change: '—',      up: true,  vs: '—' },
      revenuePoints: [180, 140, 160, 100, 80, 60],
      regCustomers : [60, 80, 70, 100, 90, 110],
      regArtisans  : [30, 40, 25, 50, 55, 60],
    },
  };

  // KPI card order matches HTML order
  const kpiKeys = ['revenue', 'orders', 'newUsers', 'artisans', 'auctionRev'];

  function updateDateRange() {
    const select = qs('#dateRangeSelect');
    const customRange = qs('#customDateRange');
    if (!select) return;

    const val  = select.value;
    const data = rangeData[val] || rangeData.month;

    // Show/hide custom date inputs
    if (val === 'custom') {
      customRange?.classList.remove('hidden');
    } else {
      customRange?.classList.add('hidden');
    }

    // Update KPI cards
    const kpiCards = qsa('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-5 > div');
    kpiCards.forEach((card, i) => {
      const key    = kpiKeys[i];
      const kpiData = data[key];
      if (!kpiData) return;

      const valueEl  = qs('p.text-2xl',  card);
      const changeEl = qs('span.text-sm', card);
      const vsEl     = qs('p.text-xs',   card);

      if (valueEl)  valueEl.textContent  = kpiData.value;
      if (vsEl)     vsEl.textContent     = `vs ${kpiData.vs}`;
      if (changeEl) {
        changeEl.innerHTML = `
          <i class="fas fa-arrow-${kpiData.up ? 'up' : 'down'}"></i>
          ${kpiData.change}
        `;
        changeEl.className = `text-sm font-semibold flex items-center gap-1 ${kpiData.up ? 'text-green-600' : 'text-red-500'}`;
      }
    });

    // Update revenue line chart
    updateRevenueChart(data.revenuePoints);

    // Update bar chart
    updateBarChart(data.regCustomers, data.regArtisans);

    if (window.showToast) {
      window.showToast(`Showing data for: ${data.label}`, 'info');
    }
  }

  // Override inline updateDateRange
  window.updateDateRange = updateDateRange;

  // ─────────────────────────────────────────────
  // SECTION 2 — Custom Date Range Validation
  // ─────────────────────────────────────────────
  function initCustomDateValidation() {
    const inputs = qsa('#customDateRange input[type="date"]');
    if (inputs.length < 2) return;

    const [startInput, endInput] = inputs;

    const validate = () => {
      if (startInput.value && endInput.value && startInput.value > endInput.value) {
        endInput.setCustomValidity('End date must be after start date');
        endInput.style.borderColor = '#dc2626';
        if (window.showToast) window.showToast('End date must be after start date', 'error');
      } else {
        endInput.setCustomValidity('');
        endInput.style.borderColor = '';
        if (startInput.value && endInput.value) {
          if (window.showToast) window.showToast('Custom range applied', 'success');
        }
      }
    };

    startInput.addEventListener('change', validate);
    endInput.addEventListener('change', validate);
  }

  // ─────────────────────────────────────────────
  // SECTION 3 — KPI Card Count-Up Animation
  // ─────────────────────────────────────────────
  function initKpiCountUp() {
    const kpiCards = qsa('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-5 > div');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const valueEl = qs('p.text-2xl', entry.target);
        if (!valueEl || valueEl.dataset.animated) return;
        valueEl.dataset.animated = 'true';
        animateValue(valueEl);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    kpiCards.forEach(card => observer.observe(card));
  }

  function animateValue(el) {
    const text = el.textContent.trim();
    // Extract numeric part — strip BD, commas, M suffix
    const isMillion = text.includes('M');
    const numStr = text.replace(/BD\s*/g, '').replace(/,/g, '').replace('M', '').trim();
    const target = parseFloat(numStr);
    if (isNaN(target)) return;

    const prefix   = text.startsWith('BD') ? 'BD ' : '';
    const suffix   = isMillion ? 'M' : '';
    const duration = 1000;
    const steps    = 50;
    let   step     = 0;

    const timer = setInterval(() => {
      step++;
      const current = (target / steps) * step;
      const display = isMillion
        ? current.toFixed(2)
        : Number.isInteger(target)
          ? Math.round(current).toLocaleString()
          : current.toFixed(0);
      el.textContent = `${prefix}${display}${suffix}`;
      if (step >= steps) {
        clearInterval(timer);
        el.textContent = text; // restore exact original
      }
    }, duration / steps);
  }

  // ─────────────────────────────────────────────
  // SECTION 4 — KPI Card Hover Tooltips
  // ─────────────────────────────────────────────
  function initKpiTooltips() {
    const kpiCards = qsa('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-5 > div');
    const tip = createTooltip();

    kpiCards.forEach((card, i) => {
      const key     = kpiKeys[i];
      const data    = rangeData.month[key];
      if (!data) return;

      card.style.cursor = 'pointer';

      card.addEventListener('mouseenter', e => {
        const label    = qs('p.text-sm.font-medium', card)?.textContent?.trim() || '';
        const change   = data.up ? `↑ ${data.change}` : `↓ ${data.change}`;
        showTooltip(tip, e, `<strong>${label}</strong><br>${change}<br><span style="opacity:0.8">${data.vs}</span>`);
      });
      card.addEventListener('mousemove', e => moveTooltip(tip, e));
      card.addEventListener('mouseleave', () => hideTooltip(tip));
    });
  }

  // ─────────────────────────────────────────────
  // SECTION 5 — Revenue Line Chart Tooltips
  // ─────────────────────────────────────────────
  const revenueWeekLabels  = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
  const revenueWeekValues  = ['BD 38,200', 'BD 48,500', 'BD 41,800', 'BD 58,400', 'BD 64,100', 'BD 75,520'];

  function initRevenueChartTooltips() {
    const svg = qs('.grid.grid-cols-1.lg\\:grid-cols-2 > div:first-child svg');
    if (!svg) return;

    const tip     = createTooltip();
    const circles = svg.querySelectorAll('circle');

    circles.forEach((circle, i) => {
      circle.style.cursor = 'pointer';
      circle.setAttribute('tabindex', '0');

      const label = revenueWeekLabels[i] || `Point ${i + 1}`;
      const value = revenueWeekValues[i] || '—';

      const expand = () => {
        circle.setAttribute('r', '8');
        circle.style.filter = 'drop-shadow(0 0 5px rgba(193,124,95,0.7))';
      };
      const shrink = () => {
        circle.setAttribute('r', '5');
        circle.style.filter = '';
      };

      circle.addEventListener('mouseenter', e => { expand(); showTooltip(tip, e, `<strong>${label}</strong><br>${value}`); });
      circle.addEventListener('mousemove',  e => moveTooltip(tip, e));
      circle.addEventListener('mouseleave', ()  => { shrink(); hideTooltip(tip); });
      circle.addEventListener('focus',      e => { expand(); showTooltip(tip, e, `${label}: ${value}`); });
      circle.addEventListener('blur',       ()  => { shrink(); hideTooltip(tip); });
    });
  }

  // ─────────────────────────────────────────────
  // SECTION 6 — Revenue Chart Path Animation
  // ─────────────────────────────────────────────
  function initRevenueChartAnimation() {
    const svg  = qs('.grid.grid-cols-1.lg\\:grid-cols-2 > div:first-child svg');
    if (!svg) return;

    const path = svg.querySelector('path[fill="none"]');
    if (!path) return;

    const length = path.getTotalLength?.() || 600;
    path.style.strokeDasharray  = length;
    path.style.strokeDashoffset = length;
    path.style.transition       = 'stroke-dashoffset 1.5s ease-in-out';

    // Trigger after a brief delay
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        path.style.strokeDashoffset = '0';
      });
    });
  }

  // ─────────────────────────────────────────────
  // Updates the SVG line chart data points + path
  // ─────────────────────────────────────────────
  function updateRevenueChart(points) {
    const svg = qs('.grid.grid-cols-1.lg\\:grid-cols-2 > div:first-child svg');
    if (!svg) return;

    const xPositions = [80, 180, 280, 380, 480, 580];
    const yMin = 60;
    const yMax = 200;
    const dataMin = Math.min(...points);
    const dataMax = Math.max(...points);
    const range   = dataMax - dataMin || 1;

    // Map data values to SVG y coordinates (inverted — higher value = lower y)
    const ys = points.map(v => yMax - ((v - dataMin) / range) * (yMax - yMin));

    // Update circles
    const circles = svg.querySelectorAll('circle');
    circles.forEach((c, i) => {
      if (i < ys.length) {
        c.setAttribute('cy', ys[i]);
        c.setAttribute('cx', xPositions[i]);
      }
    });

    // Update line path
    const linePath = svg.querySelector('path[fill="none"]');
    if (linePath) {
      const d = xPositions.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');
      linePath.setAttribute('d', d);
    }

    // Update area fill path
    const areaPath = svg.querySelector('path[fill="url(#gradient)"]');
    if (areaPath) {
      const coords = xPositions.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');
      const last   = xPositions[xPositions.length - 1];
      const first  = xPositions[0];
      areaPath.setAttribute('d', `${coords} L ${last} ${yMax} L ${first} ${yMax} Z`);
    }
  }

  // ─────────────────────────────────────────────
  // SECTION 7 — Donut Chart Hover
  // ─────────────────────────────────────────────
  function initDonutChartTooltips() {
    const donutSvg = qs('.flex.items-center.gap-8 svg');
    if (!donutSvg) return;

    const tip      = createTooltip();
    const segments = donutSvg.querySelectorAll('circle[stroke-dasharray]');
    const labels   = ['Jewelry', 'Ceramics', 'Textiles', 'Paintings', 'Woodwork'];
    const percents = ['43%', '29%', '21%', '14%', '7%'];
    const counts   = [795, 536, 388, 259, 129];

    segments.forEach((seg, i) => {
      if (i === 0) return; // skip background circle
      const idx = i - 1;
      seg.style.cursor = 'pointer';
      const origWidth = seg.getAttribute('stroke-width');

      seg.addEventListener('mouseenter', e => {
        seg.setAttribute('stroke-width', '24');
        showTooltip(tip, e, `<strong>${labels[idx]}</strong><br>${percents[idx]} · ${counts[idx].toLocaleString()} orders`);
      });
      seg.addEventListener('mousemove',  e => moveTooltip(tip, e));
      seg.addEventListener('mouseleave', () => {
        seg.setAttribute('stroke-width', origWidth);
        hideTooltip(tip);
      });
    });

    // Also wire the legend items
    const legendRows = qsa('.flex-1.space-y-3 > div');
    legendRows.forEach((row, i) => {
      row.style.cursor = 'pointer';
      const seg = segments[i + 1];

      row.addEventListener('mouseenter', e => {
        if (seg) seg.setAttribute('stroke-width', '24');
        showTooltip(tip, e, `<strong>${labels[i]}</strong><br>${percents[i]} · ${counts[i].toLocaleString()} orders`);
      });
      row.addEventListener('mousemove',  e => moveTooltip(tip, e));
      row.addEventListener('mouseleave', () => {
        if (seg) seg.setAttribute('stroke-width', '20');
        hideTooltip(tip);
      });
    });
  }

  // ─────────────────────────────────────────────
  // SECTION 8 — Bar Chart Tooltips
  // ─────────────────────────────────────────────
  const barWeekLabels    = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
  const barCustomerData  = [60, 80, 70, 100, 90, 110];
  const barArtisanData   = [30, 40, 25, 50, 55, 60];

  function initBarChartTooltips() {
    const barSvg = qs('.grid.grid-cols-1.lg\\:grid-cols-2 > div:last-child svg');
    if (!barSvg) return;

    const tip  = createTooltip();
    const rects = barSvg.querySelectorAll('rect');

    rects.forEach((rect, i) => {
      // Skip legend rects (they have fixed x positions near 200 and 300)
      const x = parseFloat(rect.getAttribute('x') || 0);
      if (x >= 190 && x <= 310) return;

      rect.style.cursor = 'pointer';
      const origFill = rect.getAttribute('fill');

      // Even indices = customer (purple), odd = artisan (amber)
      const weekIndex = Math.floor(i / 2);
      const isCustomer = i % 2 === 0;
      const label  = barWeekLabels[weekIndex] || `Week ${weekIndex + 1}`;
      const count  = isCustomer ? barCustomerData[weekIndex] : barArtisanData[weekIndex];
      const type   = isCustomer ? 'Customers' : 'Artisans';

      rect.addEventListener('mouseenter', e => {
        rect.setAttribute('fill', isCustomer ? '#6d28d9' : '#d97706');
        rect.style.filter = `drop-shadow(0 0 4px ${isCustomer ? 'rgba(139,92,246,0.6)' : 'rgba(245,158,11,0.6)'})`;
        showTooltip(tip, e, `<strong>${label}</strong><br>${type}: ${count} new`);
      });
      rect.addEventListener('mousemove',  e => moveTooltip(tip, e));
      rect.addEventListener('mouseleave', () => {
        rect.setAttribute('fill', origFill);
        rect.style.filter = '';
        hideTooltip(tip);
      });
    });
  }

  function updateBarChart(customers, artisans) {
    const barSvg = qs('.grid.grid-cols-1.lg\\:grid-cols-2 > div:last-child svg');
    if (!barSvg) return;

    const rects = Array.from(barSvg.querySelectorAll('rect')).filter(r => {
      const x = parseFloat(r.getAttribute('x') || 0);
      return !(x >= 190 && x <= 310);
    });

    const maxVal = Math.max(...customers, ...artisans, 1);
    const yBase  = 200;
    const maxH   = 150;

    rects.forEach((rect, i) => {
      const weekIdx    = Math.floor(i / 2);
      const isCustomer = i % 2 === 0;
      const val        = isCustomer ? customers[weekIdx] : artisans[weekIdx];
      if (val === undefined) return;
      const h = Math.round((val / maxVal) * maxH);
      rect.setAttribute('height', h);
      rect.setAttribute('y',      yBase - h);
    });
  }

  // ─────────────────────────────────────────────
  // SECTION 9 — Artisan Progress Bar Animations
  // ─────────────────────────────────────────────
  function initArtisanBarAnimations() {
    const bars = qsa('.bg-\\[\\#c17c5f\\].h-3.rounded-full');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const bar = entry.target;
        const targetWidth = bar.style.width;
        bar.style.width      = '0%';
        bar.style.transition = 'width 1s ease-in-out';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            bar.style.width = targetWidth;
          });
        });
        observer.unobserve(bar);
      });
    }, { threshold: 0.3 });

    bars.forEach(bar => observer.observe(bar));
  }

  // ─────────────────────────────────────────────
  // SECTION 10 — Best Selling Products Sorting
  // ─────────────────────────────────────────────
  function initTableSorting() {
    const headers = qsa('thead th');
    const tbody   = qs('tbody');
    if (!headers.length || !tbody) return;

    let sortCol = -1;
    let sortAsc = true;

    headers.forEach((th, colIdx) => {
      // Only sort-able columns: Units Sold (4), Revenue (5), Avg Rating (6)
      if (![4, 5, 6].includes(colIdx)) return;

      th.style.cursor = 'pointer';
      th.title        = 'Click to sort';

      // Add sort icon
      const icon = document.createElement('i');
      icon.className = 'fas fa-sort ml-2 text-[#b8a99a]';
      th.appendChild(icon);

      th.addEventListener('click', () => {
        const rows = Array.from(tbody.querySelectorAll('tr'));

        if (sortCol === colIdx) {
          sortAsc = !sortAsc;
        } else {
          sortCol = colIdx;
          sortAsc = false; // default to descending for numbers
        }

        // Update all sort icons
        headers.forEach(h => {
          const ic = h.querySelector('i.fa-sort, i.fa-sort-up, i.fa-sort-down');
          if (ic) { ic.className = 'fas fa-sort ml-2 text-[#b8a99a]'; }
        });
        icon.className = `fas fa-sort-${sortAsc ? 'up' : 'down'} ml-2 text-[#c17c5f]`;

        rows.sort((a, b) => {
          const aCell = a.cells[colIdx]?.textContent?.trim() || '';
          const bCell = b.cells[colIdx]?.textContent?.trim() || '';

          // Parse number — strip BD, commas, parens
          const aNum = parseFloat(aCell.replace(/BD\s*/g, '').replace(/,/g, '').replace(/[()]/g, ''));
          const bNum = parseFloat(bCell.replace(/BD\s*/g, '').replace(/,/g, '').replace(/[()]/g, ''));

          if (!isNaN(aNum) && !isNaN(bNum)) {
            return sortAsc ? aNum - bNum : bNum - aNum;
          }
          return sortAsc
            ? aCell.localeCompare(bCell)
            : bCell.localeCompare(aCell);
        });

        rows.forEach(row => tbody.appendChild(row));

        if (window.showToast) {
          const colName = th.textContent.replace(/[↑↓⬆⬇]/g, '').trim();
          window.showToast(`Sorted by ${colName} (${sortAsc ? 'ascending' : 'descending'})`, 'info');
        }
      });
    });
  }

  // ─────────────────────────────────────────────
  // SECTION 11 — Download Report as CSV
  // ─────────────────────────────────────────────
  // Overrides the inline downloadReport() with a real CSV export
  // of the Best Selling Products table.
  window.downloadReport = function () {
    const dateRange = qs('#dateRangeSelect');
    const label     = dateRange?.options[dateRange.selectedIndex]?.text || 'Report';

    // Build CSV from the Best Selling Products table
    const headers = ['Rank', 'Product', 'SKU', 'Artisan', 'Category', 'Units Sold', 'Revenue', 'Avg Rating'];
    const rows    = qsa('tbody tr');

    const csvRows = [headers.join(',')];

    rows.forEach(row => {
      const rank     = row.cells[0]?.textContent?.trim()                             || '';
      const product  = qs('p.font-semibold', row.cells[1])?.textContent?.trim()     || '';
      const sku      = qs('p.text-xs',       row.cells[1])?.textContent?.trim()     || '';
      const artisan  = row.cells[2]?.textContent?.trim()                             || '';
      const category = row.cells[3]?.textContent?.trim()                             || '';
      const units    = row.cells[4]?.textContent?.trim()                             || '';
      const revenue  = row.cells[5]?.textContent?.trim()                             || '';
      const rating   = qs('span',            row.cells[6])?.textContent?.trim()
                         ?.replace(/[()]/g, '') || '';

      csvRows.push([rank, `"${product}"`, sku, `"${artisan}"`, category, units, revenue, rating].join(','));
    });

    // Add platform health summary
    csvRows.push('');
    csvRows.push('Platform Health');
    csvRows.push(`Average Response Time,127ms`);
    csvRows.push(`System Uptime,99.9%`);
    csvRows.push(`Last Backup,"Mar 20, 2025 02:30 AM UTC"`);

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `artisyvibe-report-${label.toLowerCase().replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.showToast) window.showToast('Report downloaded as CSV successfully!', 'success');
  };

  // ─────────────────────────────────────────────
  // SECTION 12 — Live "Time Since Last Backup" Counter
  // ─────────────────────────────────────────────
  function initBackupCounter() {
    const backupCard = Array.from(qsa('.bg-gradient-to-br')).find(el =>
      el.textContent.includes('Last Backup')
    );
    if (!backupCard) return;

    // Last backup was Mar 20, 2025 02:30 AM UTC (static — matches HTML)
    const lastBackup = new Date('2025-03-20T02:30:00Z');

    const timeEl = document.createElement('p');
    timeEl.className = 'text-xs text-amber-600 mt-1';
    const detailEl = backupCard.querySelector('.flex.items-center.gap-2');
    if (detailEl) detailEl.insertAdjacentElement('beforebegin', timeEl);

    const update = () => {
      const now    = new Date();
      const diff   = Math.floor((now - lastBackup) / 1000); // seconds
      const hours  = Math.floor(diff / 3600);
      const mins   = Math.floor((diff % 3600) / 60);
      timeEl.textContent = `${hours}h ${mins}m ago`;
    };

    update();
    setInterval(update, 60_000);
  }

  // ─────────────────────────────────────────────
  // SECTION 13 — Page Load Staggered Animations
  // ─────────────────────────────────────────────
  function initPageAnimations() {
    const elements = [
      ...qsa('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-5 > div'),
      ...qsa('.grid.grid-cols-1.lg\\:grid-cols-2 > div'),
      qs('.bg-white.rounded-xl.card-shadow.overflow-hidden'),
      qs('.bg-white.rounded-xl.card-shadow.p-6:last-child'),
    ].filter(Boolean);

    elements.forEach((el, i) => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = `opacity 0.4s ease ${i * 60}ms, transform 0.4s ease ${i * 60}ms`;

      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.opacity   = '1';
        el.style.transform = 'translateY(0)';
      }));
    });
  }

  // ─────────────────────────────────────────────
  // TOOLTIP HELPERS
  // ─────────────────────────────────────────────
  function createTooltip() {
    const tip = document.createElement('div');
    tip.className = 'chart-tooltip';
    tip.style.cssText = `
      position: fixed;
      background: rgba(92,74,61,0.95);
      color: #fff;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.6;
      pointer-events: none;
      z-index: 9999;
      display: none;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(tip);
    return tip;
  }

  function showTooltip(tip, e, html) {
    tip.innerHTML   = html;
    tip.style.display = 'block';
    moveTooltip(tip, e);
  }

  function moveTooltip(tip, e) {
    tip.style.left = `${(e.clientX || e.pageX) + 14}px`;
    tip.style.top  = `${(e.clientY || e.pageY) - 36}px`;
  }

  function hideTooltip(tip) {
    tip.style.display = 'none';
  }

  // ─────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initCustomDateValidation();
    initKpiCountUp();
    initKpiTooltips();
    initRevenueChartTooltips();
    initRevenueChartAnimation();
    initDonutChartTooltips();
    initBarChartTooltips();
    initArtisanBarAnimations();
    initTableSorting();
    initBackupCounter();
    initPageAnimations();
  });

})();
