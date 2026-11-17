/* VEHA — admin dashboard: fleet CRUD, booking status, overview stats */
(function () {
  'use strict';

  var V = window.Veha;

  /* Admin-only: everyone else is sent to the sign-in page */
  if (!V.isAdmin()) {
    document.documentElement.style.display = 'none';
    window.location.replace('auth.html?mode=login&next=dashboard.html');
    return;
  }
  var STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
  var VIEWS = {
    overview: { eyebrow: 'Workspace', title: 'Overview' },
    vehicles: { eyebrow: 'Fleet', title: 'Vehicles' },
    bookings: { eyebrow: 'Reservations', title: 'Bookings' },
    rented: { eyebrow: 'Rentals', title: 'Rented vehicles' }
  };

  var state = {
    view: 'overview',
    vehicleQuery: '',
    vehicleSort: 'default',
    bookingFilter: 'all',
    editingId: null
  };

  var els = {};
  var modalFocus = null;

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }
  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function shortDate(iso) {
    if (!iso) return '—';
    var parts = String(iso).slice(0, 10).split('-');
    if (parts.length !== 3) return iso;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  function dateRange(booking) {
    return shortDate(booking.pickup) + ' – ' + shortDate(booking.ret);
  }

  function compactMoney(amount) {
    var value = Number(amount) || 0;
    if (value >= 1000000) return 'Rs ' + (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return 'Rs ' + Math.round(value / 1000) + 'K';
    return V.money(value);
  }

  function statusPill(status) {
    var key = String(status || 'Pending').toLowerCase();
    return '<span class="status status--' + V.esc(key) + '">' + V.esc(status || 'Pending') + '</span>';
  }

  function vehicleName(id) {
    var vehicle = V.getVehicle(id);
    return vehicle ? vehicle.name : 'Removed vehicle';
  }

  /* ---------- Views ---------- */

  function setView(view, updateHash) {
    if (!VIEWS[view]) view = 'overview';
    state.view = view;

    $$('.dash-view').forEach(function (section) {
      section.hidden = section.id !== 'view-' + view;
    });
    $$('[data-view]').forEach(function (link) {
      var active = link.getAttribute('data-view') === view;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    els.viewEyebrow.textContent = VIEWS[view].eyebrow;
    els.viewTitle.textContent = VIEWS[view].title;

    if (updateHash !== false) {
      var hash = '#' + view;
      if (window.location.hash !== hash) {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', hash);
        } else {
          window.location.hash = hash;
        }
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function viewFromHash() {
    var hash = String(window.location.hash || '').replace('#', '');
    return VIEWS[hash] ? hash : 'overview';
  }

  /* ---------- Overview ---------- */

  function renderStats() {
    var vehicles = V.getVehicles();
    var bookings = V.getBookings();
    var cities = {};
    vehicles.forEach(function (v) { cities[v.city] = true; });

    var pending = bookings.filter(function (b) { return b.status === 'Pending'; }).length;
    var confirmed = bookings.filter(function (b) { return b.status === 'Confirmed'; }).length;
    var revenue = bookings.reduce(function (sum, b) {
      return b.status === 'Confirmed' || b.status === 'Completed' ? sum + (Number(b.total) || 0) : sum;
    }, 0);
    var ratingTotal = vehicles.reduce(function (sum, v) { return sum + (Number(v.rating) || 0); }, 0);
    var reviewTotal = vehicles.reduce(function (sum, v) { return sum + (Number(v.reviews) || 0); }, 0);
    var avgRating = vehicles.length ? (ratingTotal / vehicles.length).toFixed(1) : '—';

    var cards = [
      {
        icon: 'car',
        tone: 'accent',
        label: 'Fleet size',
        value: String(vehicles.length),
        note: 'vehicles across ' + Object.keys(cities).length + ' cities'
      },
      {
        icon: 'bookings',
        tone: 'teal',
        label: 'Active bookings',
        value: String(pending + confirmed),
        note: pending + ' pending · ' + confirmed + ' confirmed'
      },
      {
        icon: 'wallet',
        tone: 'green',
        label: 'Booked revenue',
        value: compactMoney(revenue),
        note: 'confirmed and completed trips'
      },
      {
        icon: 'star',
        tone: 'gold',
        label: 'Average rating',
        value: avgRating,
        note: reviewTotal + ' guest reviews'
      }
    ];

    els.statCards.innerHTML = cards.map(function (card, i) {
      var gone = isHidden('stat:' + i);
      if (gone) card = { icon: card.icon, tone: card.tone, label: card.label, value: '\u2014', note: 'Data deleted' };
      return '<article class="dash-stat' + (gone ? ' is-cleared' : '') + '">' +
        '<div class="dash-stat__top">' +
          '<span class="dash-stat__label">' + V.esc(card.label) + '</span>' +
          '<span class="dash-stat__ico dash-stat__ico--' + card.tone + '">' + V.icon(card.icon) + '</span>' +
        '</div>' +
        '<strong>' + V.esc(card.value) + '</strong>' +
        '<span>' + V.esc(card.note) + '</span>' +
        (gone ? '' : delBtn('stat:' + i)) +
      '</article>';
    }).join('');
  }

  function renderFleetMix() {
    var vehicles = V.getVehicles();
    var total = vehicles.length;
    var counts = {};
    vehicles.forEach(function (v) { counts[v.type] = (counts[v.type] || 0) + 1; });

    var rows = V.TYPES
      .map(function (type) { return { type: type, count: counts[type.id] || 0 }; })
      .filter(function (row) { return row.count > 0 && !isHidden('mix:' + row.type.id); })
      .sort(function (a, b) { return b.count - a.count; });

    if (!rows.length) {
      els.fleetMix.innerHTML = '<p class="table-empty">' + (vehicles.length ? 'Fleet mix data deleted. Use Restore to bring it back.' : 'No vehicles in the fleet yet.') + '</p>';
      return;
    }

    var max = rows[0].count;
    els.fleetMix.innerHTML = rows.map(function (row) {
      var share = total ? Math.round((row.count / total) * 100) : 0;
      return '<div class="fleet-row">' +
        '<div class="fleet-row__top"><span>' + V.esc(row.type.name) + '</span>' +
        '<strong>' + row.count + ' · ' + share + '%</strong>' + delBtn('mix:' + row.type.id) + '</div>' +
        '<div class="fleet-bar"><span style="width:' + Math.max(6, Math.round((row.count / max) * 100)) + '%"></span></div>' +
      '</div>';
    }).join('');
  }

  function renderRecentBookings() {
    var bookings = V.getBookings()
      .slice()
      .sort(function (a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); })
      .filter(function (b) { return !isHidden('booking:' + b.id); })
      .slice(0, 5);
    var tbody = $('#recentBookings tbody');

    if (!bookings.length) {
      tbody.innerHTML = '<tr><td class="table-empty" colspan="6">' +
        (V.getBookings().length ? 'Booking data deleted. Use Restore to bring it back.' : 'No bookings yet.') + '</td></tr>';
      return;
    }

    tbody.innerHTML = bookings.map(function (booking) {
      var vehicle = V.getVehicle(booking.vehicleId);
      return '<tr>' +
        '<td><div class="table-stack"><strong>' + V.esc(booking.id) + '</strong>' +
          '<span>' + V.esc(booking.userName || 'Guest') + '</span></div></td>' +
        '<td><div class="table-stack"><strong>' + V.esc(vehicleName(booking.vehicleId)) + '</strong>' +
          '<span>' + V.esc(booking.city || (vehicle ? vehicle.city : '—')) + '</span></div></td>' +
        '<td class="table-dates">' + V.esc(dateRange(booking)) + '</td>' +
        '<td>' + V.esc(V.money(booking.total)) + '</td>' +
        '<td>' + statusPill(booking.status) + '</td>' +
        '<td><div class="table-actions">' + delBtn('booking:' + booking.id) + '</div></td>' +
      '</tr>';
    }).join('');
  }

  /* ---------- Vehicles ---------- */

  function availabilityCell(vehicleId) {
    var until = V.rentedUntil(vehicleId);
    return until
      ? '<span class="status status--cancelled">Rented until ' + V.esc(shortDate(until)) + '</span>'
      : '<span class="status status--confirmed">Available</span>';
  }

  function renderVehicleTable() {
    var vehicles = V.getVehicles();
    var query = state.vehicleQuery.trim().toLowerCase();
    var rows = vehicles.filter(function (vehicle) {
      if (!query) return true;
      var type = V.typeMeta(vehicle.type);
      return [vehicle.name, vehicle.city, type.singular, type.name, vehicle.tag]
        .join(' ').toLowerCase().indexOf(query) !== -1;
    });

    var sortNote = '';
    if (state.vehicleSort !== 'default') {
      var parts = state.vehicleSort.split('-');
      var result = V.sortedVehicles(parts[0] === 'price' ? 'price' : 'availability', parts[1]);
      if (result && result.vehicles) {
        /* order comes from the Java selection sort (Member 2) */
        var byId = {};
        rows.forEach(function (v) { byId[v.id] = v; });
        var ordered = [];
        result.vehicles.forEach(function (entry) { if (byId[entry.id]) { ordered.push(byId[entry.id]); delete byId[entry.id]; } });
        rows.forEach(function (v) { if (byId[v.id]) ordered.push(v); });
        rows = ordered;
        sortNote = ' \u00b7 ' + result.algorithm + ': ' + result.comparisons + ' comparisons, ' + result.swaps + ' swaps';
      } else {
        sortNote = ' \u00b7 start the Java server to use selection sort';
      }
    }

    els.vehicleTableSub.textContent = (query
      ? rows.length + ' of ' + vehicles.length + ' vehicles match "' + state.vehicleQuery.trim() + '"'
      : vehicles.length + (vehicles.length === 1 ? ' vehicle in the fleet' : ' vehicles in the fleet')) + sortNote;

    var tbody = $('#vehicleTable tbody');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td class="table-empty" colspan="6">' +
        (query ? 'No vehicles match your search.' : 'No vehicles in the fleet yet. Add your first one.') +
        '</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(function (vehicle) {
      var type = V.typeMeta(vehicle.type);
      var id = V.esc(vehicle.id);
      return '<tr>' +
        '<td><div class="table-vehicle">' +
          '<img src="' + type.image + '" alt="" loading="lazy">' +
          '<div><strong>' + V.esc(vehicle.name) + '</strong>' +
          '<span>' + V.esc(type.singular) + (vehicle.tag ? ' · ' + V.esc(vehicle.tag) : '') + '</span></div>' +
        '</div></td>' +
        '<td>' + V.esc(vehicle.city) + '</td>' +
        '<td>' + V.esc(V.money(vehicle.price)) + '</td>' +
        '<td>' + V.esc(vehicle.seats) + '</td>' +
        '<td>' + V.esc(vehicle.transmission) + '</td>' +
        '<td>' + availabilityCell(vehicle.id) + '</td>' +
        '<td><div class="table-actions">' +
          '<button class="icon-btn" type="button" data-edit-vehicle="' + id + '" aria-label="Edit ' + V.esc(vehicle.name) + '">' + V.icon('edit') + '</button>' +
          '<button class="icon-btn icon-btn--danger" type="button" data-delete-vehicle="' + id + '" aria-label="Delete ' + V.esc(vehicle.name) + '">' + V.icon('trash') + '</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  /* ---------- Bookings ---------- */

  function renderBookingTable() {
    var bookings = V.getBookings()
      .slice()
      .sort(function (a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); });
    var rows = bookings.filter(function (booking) {
      return state.bookingFilter === 'all' || booking.status === state.bookingFilter;
    });

    els.bookingTableSub.textContent = state.bookingFilter === 'all'
      ? bookings.length + (bookings.length === 1 ? ' reservation' : ' reservations')
      : rows.length + ' ' + state.bookingFilter.toLowerCase() + (rows.length === 1 ? ' booking' : ' bookings');

    var tbody = $('#bookingTable tbody');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td class="table-empty" colspan="7">' +
        (state.bookingFilter === 'all' ? 'No bookings yet.' : 'No ' + V.esc(state.bookingFilter.toLowerCase()) + ' bookings.') +
        '</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(function (booking) {
      var id = V.esc(booking.id);
      var options = STATUSES.map(function (status) {
        return '<option value="' + status + '"' + (booking.status === status ? ' selected' : '') + '>' + status + '</option>';
      }).join('');
      return '<tr>' +
        '<td class="table-ref">' + V.esc(booking.id) + '</td>' +
        '<td><div class="table-stack"><strong>' + V.esc(booking.userName || 'Guest') + '</strong>' +
          '<span>' + V.esc(booking.userEmail || '—') + '</span></div></td>' +
        '<td><div class="table-stack"><strong>' + V.esc(vehicleName(booking.vehicleId)) + '</strong>' +
          '<span>' + V.esc(booking.city || '—') + '</span></div></td>' +
        '<td class="table-dates">' + V.esc(dateRange(booking)) + '</td>' +
        '<td>' + V.esc(V.money(booking.total)) + '</td>' +
        '<td><select class="status-select" data-status="' + id + '" aria-label="Status for booking ' + id + '">' + options + '</select></td>' +
        '<td><div class="table-actions">' +
          '<button class="icon-btn icon-btn--danger" type="button" data-delete-booking="' + id + '" aria-label="Delete booking ' + id + '">' + V.icon('trash') + '</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }


  /* ---------- Rented vehicles (singly linked list, Member 3) ---------- */

  function renderRented() {
    var rows = V.getRented();
    var chain = $('#rentedChain');
    var tbody = $('#rentedTable tbody');
    els.navRentedCount.textContent = rows ? String(rows.length) : '0';

    if (rows === null) {
      els.rentedSub.textContent = 'Java server not running';
      chain.innerHTML = '<span class=\"ll-empty\">Start the Java server (run.bat / run.sh) to load the linked list.</span>';
      tbody.innerHTML = '<tr><td class=\"table-empty\" colspan=\"7\">The rented-vehicle linked list lives on the Java server.</td></tr>';
      return;
    }

    els.rentedSub.textContent = rows.length + (rows.length === 1 ? ' node' : ' nodes') + ' in the linked list';

    chain.innerHTML = '<span class=\"ll-head\">HEAD</span>' + rows.map(function (r) {
      return '<span class=\"ll-arrow\" aria-hidden=\"true\">\u2192</span>' +
        '<div class=\"ll-node\"><strong>' + V.esc(r.rentalId) + '</strong>' +
        '<span>' + V.esc(r.vehicleName) + '</span><span class=\"ll-next\">next \u2192</span></div>';
    }).join('') + '<span class=\"ll-arrow\" aria-hidden=\"true\">\u2192</span><span class=\"ll-null\">NULL</span>';

    if (!rows.length) {
      tbody.innerHTML = '<tr><td class=\"table-empty\" colspan=\"7\">No vehicles are rented out. Confirm a booking to add a record.</td></tr>';
      return;
    }

    var today = V.todayISO();
    tbody.innerHTML = rows.map(function (r, i) {
      var overdue = r.ret < today;
      return '<tr>' +
        '<td class=\"table-ref\">#' + (i + 1) + (i === 0 ? ' (head)' : '') + (i === rows.length - 1 ? ' (tail)' : '') + '</td>' +
        '<td class=\"table-ref\">' + V.esc(r.rentalId) + '</td>' +
        '<td><div class=\"table-stack\"><strong>' + V.esc(r.vehicleName) + '</strong><span>Booking ' + V.esc(r.bookingId) + '</span></div></td>' +
        '<td>' + V.esc(r.customerEmail || '\u2014') + '</td>' +
        '<td class=\"table-dates\">' + V.esc(shortDate(r.pickup) + ' \u2013 ' + shortDate(r.ret)) + '</td>' +
        '<td><span class=\"status ' + (overdue ? 'status--cancelled' : 'status--confirmed') + '\">' + (overdue ? 'Overdue' : 'Rented') + '</span></td>' +
        '<td><div class=\"table-actions\"><button class=\"btn btn--ghost btn--sm\" type=\"button\" data-return-rental=\"' + V.esc(r.bookingId) + '\">Return vehicle</button></div></td>' +
      '</tr>';
    }).join('');
  }


  /* ---------- Overview tools: delete / restore, report, CSV export ---------- */

  var HIDE_KEY = 'veha_overview_hidden';
  var ovHidden = loadHidden();
  var reportText = '';

  function loadHidden() {
    try {
      var list = JSON.parse(window.localStorage.getItem(HIDE_KEY));
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function saveHidden() {
    try { window.localStorage.setItem(HIDE_KEY, JSON.stringify(ovHidden)); } catch (e) { /* storage unavailable */ }
  }
  function isHidden(key) { return ovHidden.indexOf(key) !== -1; }
  function clearHidden() { ovHidden = []; saveHidden(); }
  function delBtn(key) {
    return '<button class="ov-del" type="button" data-ov-del="' + V.esc(key) + '">Delete</button>';
  }

  function renderOverview() {
    renderStats();
    renderFleetMix();
    renderRecentBookings();
    renderEarnings();
    renderOverviewTools();
  }

  function renderOverviewTools() {
    var restore = $('#btnRestore');
    if (!restore) return;
    restore.textContent = 'Restore (' + ovHidden.length + ')';
    restore.disabled = !ovHidden.length;
  }

  function deleteAllOverview() {
    var keys = ['stat:0', 'stat:1', 'stat:2', 'stat:3'];
    V.getBookings().forEach(function (b) { keys.push('booking:' + b.id); });
    V.TYPES.forEach(function (t) { keys.push('mix:' + t.id); keys.push('etype:' + t.id); });
    ['earn:0', 'earn:1', 'earn:2', 'earn:3', 'earn:4'].forEach(function (k) { keys.push(k); });
    earningsData('all').byVehicle.forEach(function (v) { keys.push('evehicle:' + v.id); });
    keys.forEach(function (k) { if (ovHidden.indexOf(k) === -1) ovHidden.push(k); });
    saveHidden();
    renderOverview();
    V.toast('Overview data deleted. Use Restore to bring it back.');
  }

  function restoreOverview() {
    if (!ovHidden.length) return;
    clearHidden();
    renderOverview();
    V.toast('Overview data restored.');
  }

  /* CSV */
  function csvCell(value) {
    var text = value === null || value === undefined ? '' : String(value);
    if (/^[=+\-@\t\r]/.test(text) && isNaN(Number(text))) text = "'" + text; /* spreadsheet formula guard */
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function download(name, text, type) {
    var link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([text], { type: type }));
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
  }
  function sortedBookings() {
    return V.getBookings().slice().sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
  }
  function bookingRow(b) {
    var vehicle = V.getVehicle(b.vehicleId);
    return [b.id, b.userName || 'Guest', b.userEmail || '', vehicleName(b.vehicleId),
      b.city || (vehicle ? vehicle.city : ''), b.pickup, b.ret, Number(b.total) || 0, b.status];
  }
  var BOOKING_HEAD = ['Reference', 'Customer', 'Email', 'Vehicle', 'City', 'Pickup', 'Return', 'Total (Rs)', 'Status'];

  function exportData(view) {
    if (view === 'vehicles') {
      var q = state.vehicleQuery.trim().toLowerCase();
      return {
        head: ['Name', 'Type', 'City', 'Price per day (Rs)', 'Seats', 'Transmission', 'Fuel', 'Year', 'Rating', 'Availability'],
        rows: V.getVehicles().filter(function (v) {
          if (!q) return true;
          var t = V.typeMeta(v.type);
          return [v.name, v.city, t.singular, t.name, v.tag].join(' ').toLowerCase().indexOf(q) !== -1;
        }).map(function (v) {
          var until = V.rentedUntil(v.id);
          return [v.name, V.typeMeta(v.type).singular, v.city, v.price, v.seats, v.transmission, v.fuel, v.year, v.rating,
            until ? 'Rented until ' + until : 'Available'];
        })
      };
    }
    if (view === 'bookings') {
      return {
        head: BOOKING_HEAD,
        rows: sortedBookings().filter(function (b) {
          return state.bookingFilter === 'all' || b.status === state.bookingFilter;
        }).map(bookingRow)
      };
    }
    if (view === 'rented') {
      return {
        head: ['Rental', 'Booking', 'Vehicle', 'Customer', 'Pickup', 'Return'],
        rows: (V.getRented() || []).map(function (r) {
          return [r.rentalId, r.bookingId, r.vehicleName, r.customerEmail || '', r.pickup, r.ret];
        })
      };
    }
    return {
      head: BOOKING_HEAD,
      rows: sortedBookings().filter(function (b) { return !isHidden('booking:' + b.id); }).slice(0, 5).map(bookingRow)
    };
  }

  function exportCurrent() {
    var data = exportData(state.view);
    if (!data.rows.length) { V.toast('Nothing to export in this view.'); return; }
    var csv = [data.head].concat(data.rows).map(function (row) { return row.map(csvCell).join(','); }).join('\r\n');
    download('veha-' + state.view + '-' + new Date().toISOString().slice(0, 10) + '.csv', '\ufeff' + csv, 'text/csv;charset=utf-8');
    V.toast('Exported ' + data.rows.length + (data.rows.length === 1 ? ' row.' : ' rows.'));
  }

  /* Report */
  function countBy(list, pick) {
    var out = {};
    list.forEach(function (item) { var k = pick(item) || '\u2014'; out[k] = (out[k] || 0) + 1; });
    return Object.keys(out).map(function (k) { return [k, out[k]]; });
  }
  function buildReport() {
    var vehicles = V.getVehicles();
    var bookings = V.getBookings();
    var rented = V.getRented();
    var revenue = bookings.reduce(function (sum, b) {
      return b.status === 'Confirmed' || b.status === 'Completed' ? sum + (Number(b.total) || 0) : sum;
    }, 0);
    var rentedNow = vehicles.filter(function (v) { return V.rentedUntil(v.id); }).length;
    var rating = vehicles.length
      ? (vehicles.reduce(function (s, v) { return s + (Number(v.rating) || 0); }, 0) / vehicles.length).toFixed(1) : '\u2014';

    var byStatus = STATUSES.map(function (st) {
      return [st, bookings.filter(function (b) { return b.status === st; }).length];
    });
    return [
      { title: 'Fleet', rows: [
        ['Total vehicles', vehicles.length],
        ['Available now', vehicles.length - rentedNow],
        ['Rented now', rentedNow],
        ['Average rating', rating]
      ] },
      { title: 'Earnings (all time)', rows: earningsReportRows('all') },
      { title: 'Bookings', rows: [['Total bookings', bookings.length]].concat(byStatus).concat([['Booked revenue', V.money(revenue)]]) },
      { title: 'Rented vehicle records', rows: [['Nodes in linked list', rented === null ? 'Java server not running' : rented.length]] },
      { title: 'Vehicles by type', rows: countBy(vehicles, function (v) { return V.typeMeta(v.type).name; }) },
      { title: 'Vehicles by city', rows: countBy(vehicles, function (v) { return v.city; }) }
    ];
  }

  function openReport(customSections, title) {
    var modal = $('#reportModal');
    if (!modal) return;
    var sections = customSections || buildReport();
    var stamp = new Date().toLocaleString();
    $('#reportTitle').textContent = title || 'VEHA report';
    reportText = (title || 'VEHA FLEET REPORT').toUpperCase() + '\nGenerated: ' + stamp + '\n';
    $('#reportStamp').textContent = 'Generated ' + stamp;
    $('#reportBody').innerHTML = sections.map(function (sec) {
      reportText += '\n' + sec.title.toUpperCase() + '\n';
      return '<div class="rep-sec"><h3>' + V.esc(sec.title) + '</h3><dl>' + sec.rows.map(function (r) {
        reportText += '  ' + r[0] + ': ' + r[1] + '\n';
        return '<dt>' + V.esc(r[0]) + '</dt><dd>' + V.esc(r[1]) + '</dd>';
      }).join('') + '</dl></div>';
    }).join('');
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }
  function closeReport() {
    var modal = $('#reportModal');
    if (!modal || !modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  function handleToolsClick(event) {
    var t = event.target;
    var del = t.closest('[data-ov-del]');
    if (del) {
      var key = del.getAttribute('data-ov-del');
      V.confirm({
        title: 'Delete this data?',
        message: 'It is cleared from the Overview only. Use Restore to bring it back.',
        confirmText: 'Delete',
        danger: true
      }).then(function (ok) {
        if (!ok) return;
        if (ovHidden.indexOf(key) === -1) ovHidden.push(key);
        saveHidden();
        renderOverview();
      });
      return true;
    }
    if (t.closest('#btnDeleteAll')) {
      V.confirm({
        title: 'Delete all Overview data?',
        message: 'Numbers, bookings and fleet mix are cleared from the Overview. Nothing is removed from your fleet or bookings, and Restore brings it back.',
        confirmText: 'Delete all',
        danger: true
      }).then(function (ok) { if (ok) deleteAllOverview(); });
      return true;
    }
    if (t.closest('#btnRestore')) { restoreOverview(); return true; }
    if (t.closest('#btnReport')) { openReport(); return true; }
    if (t.closest('#earnReport')) { openReport(earningsReportSections(), 'Earnings report · ' + rangeLabel(state.earnRange)); return true; }
    if (t.closest('#earnExport')) { exportEarnings(); return true; }
    if (t.closest('#earnTxt')) {
      download('earnings.txt', earningsFileText() + '\n', 'text/plain;charset=utf-8');
      return true;
    }
    if (t.closest('#btnExport')) { exportCurrent(); return true; }
    if (t.closest('[data-rep-close]')) { closeReport(); return true; }
    if (t.closest('#reportDownload')) {
      download('veha-report-' + new Date().toISOString().slice(0, 10) + '.txt', reportText, 'text/plain;charset=utf-8');
      return true;
    }
    if (t.closest('#reportPrint')) { window.print(); return true; }
    return false;
  }

  function ensureTools() {
    var style = document.createElement('style');
    style.textContent =
      '.ov-toolbar{display:flex;align-items:center;gap:8px;justify-content:flex-end;margin-bottom:16px;flex-wrap:wrap}' +
      '.ov-toolbar__label{margin-right:auto;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.6}' +
      '.ov-del{font:inherit;font-size:12px;line-height:1;padding:5px 10px;border-radius:999px;border:1px solid rgba(220,60,60,.45);background:transparent;color:#d94343;cursor:pointer}' +
      '.ov-del:hover{background:rgba(220,60,60,.1)}' +
      '.dash-stat{position:relative}.dash-stat .ov-del{position:absolute;right:16px;bottom:14px}' +
      '.dash-stat.is-cleared strong,.dash-stat.is-cleared>span{opacity:.45}' +
      '.fleet-row__top{display:flex;align-items:center;gap:10px}.fleet-row__top>strong{margin-left:auto}' +
      '.fleet-row__top .ov-del{margin-left:0}' +
      '.earn-tiles .dash-stat .ov-del{top:12px;bottom:auto;right:14px}' +
      '#btnRestore:disabled{opacity:.45;cursor:not-allowed}' +
      '.earn-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin-bottom:22px}' +
      '.earn-cols{display:grid;grid-template-columns:1fr 1fr;gap:28px}@media(max-width:800px){.earn-cols{grid-template-columns:1fr}}' +
      '.earn-total{display:flex;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px solid rgba(128,128,128,.3);font-size:14px}' +
      '.dash-stat--total{outline:2px solid rgba(255,106,0,.45);outline-offset:-2px}' +
      '.earn-sync{font-size:12px;opacity:.7;margin:0 0 14px}' +
      '.earn-sub{font-size:12px;margin:0 0 10px;text-transform:uppercase;letter-spacing:.08em;opacity:.65}' +
      '.rep-sec{margin:0 0 16px}.rep-sec h3{font-size:13px;margin:0 0 6px;text-transform:uppercase;letter-spacing:.06em;opacity:.7}' +
      '.rep-sec dl{display:grid;grid-template-columns:1fr auto;gap:6px 16px;margin:0}.rep-sec dd{margin:0;font-weight:600;text-align:right}' +
      '#reportBody{max-height:60vh;overflow:auto;margin:12px 0}' +
      '@media print{body>*:not(#reportModal){display:none!important}#reportModal .modal__backdrop,#reportModal .modal__close,#reportModal .dash-modal__actions{display:none!important}#reportModal{position:static!important}#reportBody{max-height:none}}';
    document.head.appendChild(style);

    var actions = $('.dash__top-actions');
    if (actions && !$('#btnReport')) {
      actions.insertAdjacentHTML('afterbegin',
        '<button class="btn btn--ghost btn--sm" type="button" id="btnReport">Create report</button>' +
        '<button class="btn btn--primary btn--sm" type="button" id="btnExport">Export CSV</button>');
    }
    var overview = $('#view-overview');
    if (overview && !$('#btnDeleteAll')) {
      overview.insertAdjacentHTML('afterbegin',
        '<div class="ov-toolbar"><span class="ov-toolbar__label">Overview data</span>' +
        '<button class="btn btn--ghost btn--sm" type="button" id="btnDeleteAll">Delete all</button>' +
        '<button class="btn btn--ghost btn--sm" type="button" id="btnRestore" disabled>Restore (0)</button></div>');
    }
    if (overview && !$('#earningsCard')) {
      var card = '<div class="dash-card" id="earningsCard"><div class="dash-card__head"><div><h2>Earnings</h2>' +
        '<p id="earnSub">Revenue by booking date</p></div>' +
        '<div class="dash-tools"><select class="dash-select" id="earnRange" aria-label="Earnings period">' +
        RANGES.map(function (r) { return '<option value="' + r[0] + '">' + r[1] + '</option>'; }).join('') + '</select>' +
        '<button class="btn btn--ghost btn--sm" type="button" id="earnReport">Create report</button>' +
        '<button class="btn btn--ghost btn--sm" type="button" id="earnExport">Export CSV</button>' +
        '<button class="btn btn--ghost btn--sm" type="button" id="earnTxt">Download .txt</button></div></div>' +
        '<p class="earn-sync" id="earnSyncState"></p><div id="earningsBody"></div></div>';
      var quick = $('.quick-actions__row');
      var quickCard = quick && quick.closest('.dash-card');
      if (quickCard) quickCard.insertAdjacentHTML('beforebegin', card);
      else overview.insertAdjacentHTML('beforeend', card);
    }
    var headRow = $('#recentBookings thead tr');
    if (headRow && headRow.children.length === 5) headRow.insertAdjacentHTML('beforeend', '<th class="align-right">Actions</th>');

    if (!$('#reportModal')) {
      document.body.insertAdjacentHTML('beforeend',
        '<div class="modal" id="reportModal" aria-hidden="true"><div class="modal__backdrop" data-rep-close></div>' +
        '<div class="modal__card dash-modal" role="dialog" aria-modal="true" aria-labelledby="reportTitle">' +
        '<button class="modal__close" type="button" data-rep-close aria-label="Close">&times;</button>' +
        '<h2 id="reportTitle">VEHA report</h2><p id="reportStamp"></p><div id="reportBody"></div>' +
        '<div class="dash-modal__actions">' +
        '<button class="btn btn--ghost btn--sm" type="button" data-rep-close>Close</button>' +
        '<button class="btn btn--ghost btn--sm" type="button" id="reportPrint">Print</button>' +
        '<button class="btn btn--primary btn--sm" type="button" id="reportDownload">Download .txt</button>' +
        '</div></div></div>');
    }
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeReport(); });
    startAutoSync();
    document.addEventListener('change', function (event) {
      if (event.target && event.target.id === 'earnRange') {
        state.earnRange = event.target.value;
        try { window.localStorage.setItem('veha_earn_range', state.earnRange); } catch (e) { /* ignore */ }
        renderEarnings();
      }
    });
  }


  /* ---------- Earnings ---------- */

  var RANGES = [['today', 'Today'], ['yesterday', 'Yesterday'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days'], ['all', 'All time']];
  state.earnRange = (function () {
    try {
      var saved = window.localStorage.getItem('veha_earn_range');
      return RANGES.some(function (r) { return r[0] === saved; }) ? saved : 'all';
    } catch (e) { return 'all'; }
  })();
  function rangeLabel(range) {
    return RANGES.filter(function (r) { return r[0] === range; })[0][1];
  }
  function startOfDay(offset) {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset).getTime();
  }
  /* an earning is dated by when the booking was made (falls back to pickup date) */
  function bookingDate(b) {
    var d = b.createdAt ? new Date(b.createdAt) : null;
    if (!d || isNaN(d.getTime())) d = b.pickup ? new Date(String(b.pickup).slice(0, 10) + 'T00:00:00') : null;
    return d && !isNaN(d.getTime()) ? d : null;
  }
  function inRange(b, range) {
    if (range === 'all') return true;
    var d = bookingDate(b);
    if (!d) return false;
    var t = d.getTime();
    if (range === 'today') return t >= startOfDay(0) && t < startOfDay(1);
    if (range === 'yesterday') return t >= startOfDay(-1) && t < startOfDay(0);
    var days = Number(range);
    return t >= startOfDay(-(days - 1)) && t < startOfDay(1);
  }

  function earningsData(range) {
    range = range || state.earnRange;
    var sums = { Completed: 0, Confirmed: 0, Pending: 0, Cancelled: 0 };
    var counts = { Completed: 0, Confirmed: 0 };
    var byType = {}, byVehicle = {};
    V.getBookings().filter(function (b) { return inRange(b, range); }).forEach(function (b) {
      var amount = Number(b.total) || 0;
      if (sums[b.status] !== undefined) sums[b.status] += amount;
      if (b.status !== 'Completed' && b.status !== 'Confirmed') return;
      counts[b.status] += 1;
      var vehicle = V.getVehicle(b.vehicleId);
      var typeId = vehicle ? vehicle.type : 'removed';
      byType[typeId] = (byType[typeId] || 0) + amount;
      var vid = b.vehicleId || 'removed';
      if (!byVehicle[vid]) byVehicle[vid] = { id: vid, name: vehicleName(b.vehicleId), amount: 0, trips: 0 };
      byVehicle[vid].amount += amount;
      byVehicle[vid].trips += 1;
    });
    var booked = sums.Completed + sums.Confirmed;
    var trips = counts.Completed + counts.Confirmed;
    return {
      sums: sums,
      counts: counts,
      booked: booked,
      average: trips ? Math.round(booked / trips) : 0,
      byType: Object.keys(byType).map(function (id) {
        var meta = id === 'removed' ? { name: 'Removed vehicles' } : V.typeMeta(id);
        return { id: id, name: meta.name, amount: byType[id] };
      }).sort(function (a, b) { return b.amount - a.amount; }),
      byVehicle: Object.keys(byVehicle).map(function (k) { return byVehicle[k]; })
        .sort(function (a, b) { return b.amount - a.amount; })
    };
  }

  function earningsReportRows(range) {
    var e = earningsData(range);
    return [
      ['Earned (completed)', V.money(e.sums.Completed)],
      ['Upcoming (confirmed)', V.money(e.sums.Confirmed)],
      ['Total earnings (completed + confirmed)', V.money(e.booked)],
      ['Pending (not yet confirmed)', V.money(e.sums.Pending)],
      ['Lost to cancellations', V.money(e.sums.Cancelled)],
      ['Average booking value', V.money(e.average)]
    ];
  }

  function earnRows(list, prefix, nameOf, totalLabel) {
    var visible = list.filter(function (r) { return !isHidden(prefix + r.id); });
    if (!visible.length) {
      return '<p class="table-empty">' + (list.length ? 'Earnings data deleted. Use Restore to bring it back.' : 'No earnings in this period.') + '</p>';
    }
    var max = visible[0].amount || 1;
    var sum = visible.reduce(function (t, r) { return t + r.amount; }, 0);
    var footer = '<div class="earn-total"><span>' + V.esc(totalLabel || 'Total') + '</span><strong>' + V.esc(V.money(sum)) + '</strong></div>';
    return visible.map(function (r) {
      return '<div class="fleet-row"><div class="fleet-row__top"><span>' + V.esc(nameOf(r)) + '</span>' +
        '<strong>' + V.esc(V.money(r.amount)) + '</strong>' + delBtn(prefix + r.id) + '</div>' +
        '<div class="fleet-bar"><span style="width:' + Math.max(6, Math.round((r.amount / max) * 100)) + '%"></span></div></div>';
    }).join('') + footer;
  }

  function renderEarnings() {
    var box = $('#earningsBody');
    if (!box) return;
    var e = earningsData();
    var sel = $('#earnRange'); if (sel && sel.value !== state.earnRange) sel.value = state.earnRange;
    var sub = $('#earnSub'); if (sub) sub.textContent = 'Revenue by booking date · ' + rangeLabel(state.earnRange);
    var tiles = [
      { key: 4, label: 'Total earnings', value: V.money(e.booked), note: V.money(e.sums.Completed) + ' received + ' + V.money(e.sums.Confirmed) + ' upcoming', total: true },
      { key: 0, label: 'Completed trips', value: String(e.counts.Completed), note: V.money(e.sums.Completed) + ' received' },
      { key: 1, label: 'Upcoming', value: V.money(e.sums.Confirmed), note: e.counts.Confirmed + (e.counts.Confirmed === 1 ? ' confirmed trip' : ' confirmed trips') + ', not yet returned' },
      { key: 2, label: 'Pending', value: V.money(e.sums.Pending), note: 'awaiting confirmation' },
      { key: 3, label: 'Avg booking value', value: V.money(e.average), note: 'confirmed and completed' }
    ];
    box.innerHTML =
      '<div class="earn-tiles">' + tiles.map(function (t) {
        var gone = isHidden('earn:' + t.key);
        return '<article class="dash-stat' + (t.total ? ' dash-stat--total' : '') + (gone ? ' is-cleared' : '') + '">' +
          '<div class="dash-stat__top"><span class="dash-stat__label">' + V.esc(t.label) + '</span></div>' +
          '<strong>' + V.esc(gone ? '\u2014' : t.value) + '</strong>' +
          '<span>' + V.esc(gone ? 'Data deleted' : t.note) + '</span>' +
          (gone ? '' : delBtn('earn:' + t.key)) + '</article>';
      }).join('') + '</div>' +
      '<div class="earn-cols">' +
        '<div><h3 class="earn-sub">Earnings by vehicle type</h3>' + earnRows(e.byType, 'etype:', function (r) { return r.name; }, 'Total') + '</div>' +
        '<div><h3 class="earn-sub">Top earning vehicles</h3>' + earnRows(e.byVehicle.slice(0, 5), 'evehicle:', function (r) { return r.name + ' \u00b7 ' + r.trips + (r.trips === 1 ? ' trip' : ' trips'); }, 'Total (top 5)') + '</div>' +
      '</div>';
    scheduleSync();
  }


  /* ---------- Earnings records, text-file storage, report, export ---------- */

  var EARN_API = window.VEHA_EARNINGS_API || '/api/earnings';
  var syncTimer = null;
  var lastSynced = null;

  function cleanField(v) { return String(v === null || v === undefined ? '' : v).replace(/[|\r\n]+/g, ' ').trim(); }
  function isoDay(d) {
    return d ? d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') : '';
  }
  /* one record per booking that earns (or will earn) money */
  function earningRecords() {
    return V.getBookings().filter(function (b) {
      return b.status === 'Completed' || b.status === 'Confirmed' || b.status === 'Pending';
    }).map(function (b) {
      var vehicle = V.getVehicle(b.vehicleId);
      return {
        id: b.id, booking: b, vehicleId: b.vehicleId || 'removed',
        date: isoDay(bookingDate(b)), vehicle: vehicleName(b.vehicleId),
        type: vehicle ? vehicle.type : 'removed',
        customer: b.userEmail || b.userName || 'Guest',
        status: b.status, amount: Number(b.total) || 0
      };
    });
  }
  /* a record is removed from the file when its tile, row or booking was deleted on the Overview */
  function recordHidden(r) {
    return isHidden('booking:' + r.id) || isHidden('evehicle:' + r.vehicleId) || isHidden('etype:' + r.type) ||
      (r.status === 'Completed' && isHidden('earn:0')) ||
      (r.status === 'Confirmed' && isHidden('earn:1')) ||
      (r.status === 'Pending' && isHidden('earn:2')) ||
      ((r.status === 'Completed' || r.status === 'Confirmed') && isHidden('earn:4'));
  }
  function recordLine(r) {
    return [r.id, r.date, r.vehicle, r.type, r.customer, r.status, r.amount].map(cleanField).join('|');
  }
  function earningsFileText() {
    return earningRecords().filter(function (r) { return !recordHidden(r); }).map(recordLine).join('\n');
  }

  function setSyncState(text, ok) {
    var el = $('#earnSyncState');
    if (!el) return;
    el.textContent = text;
    el.style.color = ok === false ? '#d94343' : '';
  }
  var lastSentText = null;
  function scheduleSync() {
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(function () { syncEarningsFile(false); }, 250);
  }
  function syncEarningsFile(force) {
    var text = earningsFileText();
    var count = text ? text.split('\n').length : 0;
    if (window.location.protocol === 'file:' || !window.fetch) {
      setSyncState('Not saved to earnings.txt: open the dashboard through the Java server. You can still download the file.', false);
      return;
    }
    if (!force && text === lastSentText) return;
    postEarnings(text)
      .then(function (body) {
        lastSentText = text;
        lastSynced = new Date();
        var path = /->\s*(.+)$/.exec(body || '');
        setSyncState('Auto-saved to ' + (path ? path[1] : 'data/earnings.txt') + ' \u00b7 ' + count + (count === 1 ? ' record' : ' records') +
          ' \u00b7 updated ' + lastSynced.toLocaleTimeString(), true);
      })
      .catch(function (err) {
        var where = err && err.url ? ' (' + err.url + ')' : '';
        if (err && /Unknown resource/i.test(err.body || '')) {
          setSyncState('The Java server that answered is still the OLD version (it does not know /api/earnings). Stop it completely, recompile VehaServer.java and start it again.', false);
        } else if (err && err.status) {
          setSyncState('earnings.txt not updated: HTTP ' + err.status + where + '. This address is not the VEHA Java server. Open the dashboard from http://localhost:8080/ .', false);
        } else {
          setSyncState('earnings.txt not updated: the Java server is not running or is on another address. Start it and open the dashboard from http://localhost:8080/ .', false);
        }
      });
  }
  /* try this page's own server first, then the default VEHA server (http://localhost:8080) */
  function postEarnings(text) {
    var urls = [EARN_API];
    if (!window.VEHA_EARNINGS_API && window.location.origin !== 'http://localhost:8080') urls.push('http://localhost:8080/api/earnings');
    var errors = [];
    function attempt(i) {
      return window.fetch(urls[i], { method: 'POST', headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: text })
        .then(function (res) {
          return res.text().then(function (body) {
            if (!res.ok) { var e = new Error('HTTP ' + res.status); e.status = res.status; e.body = body; e.url = urls[i]; throw e; }
            return body;
          });
        })
        .catch(function (err) {
          errors.push(err);
          if (i + 1 < urls.length) return attempt(i + 1);
          var withStatus = errors.filter(function (e) { return e && e.status; })[0];
          throw withStatus || err;
        });
    }
    return attempt(0);
  }
  /* keep the file current all the time: on every change, every few seconds, on other-tab changes, and when the tab closes */
  function startAutoSync() {
    window.setInterval(function () {
      if (earningsFileText() !== lastSentText) syncEarningsFile(false);
    }, 5000);
    window.addEventListener('storage', function () { renderAll(); });
    window.addEventListener('pagehide', function () {
      var text = earningsFileText();
      if (text !== lastSentText && window.location.protocol !== 'file:' && navigator.sendBeacon) {
        navigator.sendBeacon(EARN_API, new Blob([text], { type: 'text/plain;charset=UTF-8' }));
      }
    });
  }

  function visibleEarningRecords() {
    return earningRecords().filter(function (r) { return !recordHidden(r) && inRange(r.booking, state.earnRange); });
  }
  function exportEarnings() {
    var recs = visibleEarningRecords();
    if (!recs.length) { V.toast('No earnings in ' + rangeLabel(state.earnRange).toLowerCase() + '.'); return; }
    var head = ['Booking', 'Date', 'Vehicle', 'Type', 'Customer', 'Status', 'Amount (Rs)'];
    var rows = recs.map(function (r) { return [r.id, r.date, r.vehicle, r.type === 'removed' ? 'Removed vehicle' : V.typeMeta(r.type).name, r.customer, r.status, r.amount]; });
    var total = recs.reduce(function (t, r) { return t + (r.status === 'Pending' ? 0 : r.amount); }, 0);
    rows.push(['', '', '', '', '', 'TOTAL (completed + confirmed)', total]);
    var csv = [head].concat(rows).map(function (row) { return row.map(csvCell).join(','); }).join('\r\n');
    download('veha-earnings-' + state.earnRange + '-' + new Date().toISOString().slice(0, 10) + '.csv', '\ufeff' + csv, 'text/csv;charset=utf-8');
    V.toast('Exported ' + recs.length + (recs.length === 1 ? ' earning.' : ' earnings.'));
  }
  function earningsReportSections() {
    var e = earningsData(state.earnRange);
    var label = rangeLabel(state.earnRange);
    return [
      { title: 'Summary \u00b7 ' + label, rows: earningsReportRows(state.earnRange) },
      { title: 'By vehicle type', rows: e.byType.length ? e.byType.map(function (t) { return [t.name, V.money(t.amount)]; }) : [['No earnings', '\u2014']] },
      { title: 'Top earning vehicles', rows: e.byVehicle.length ? e.byVehicle.slice(0, 5).map(function (v) { return [v.name + ' (' + v.trips + (v.trips === 1 ? ' trip)' : ' trips)'), V.money(v.amount)]; }) : [['No earnings', '\u2014']] }
    ];
  }

  /* ---------- Render all ---------- */

  function renderCounts() {
    var vehicles = V.getVehicles();
    var bookings = V.getBookings();
    els.navVehicleCount.textContent = String(vehicles.length);
    els.navBookingCount.textContent = String(bookings.length);
  }

  function renderAll() {
    renderCounts();
    renderStats();
    renderFleetMix();
    renderRecentBookings();
    renderVehicleTable();
    renderBookingTable();
    renderRented();
    renderEarnings();
    renderOverviewTools();
  }

  /* ---------- Vehicle modal ---------- */

  function openVehicleModal(vehicle) {
    state.editingId = vehicle ? vehicle.id : null;
    els.formError.textContent = '';

    if (vehicle) {
      els.modalTitle.textContent = 'Edit vehicle';
      els.modalSub.textContent = 'Update the details for ' + vehicle.name + '.';
      els.submit.textContent = 'Save changes';
      els.fName.value = vehicle.name || '';
      els.fType.value = vehicle.type || 'car';
      els.fCity.value = vehicle.city || V.CITIES[0];
      els.fPrice.value = vehicle.price || '';
      els.fSeats.value = vehicle.seats || '';
      els.fTrans.value = vehicle.transmission || 'Automatic';
      els.fFuel.value = vehicle.fuel || 'Petrol';
      els.fYear.value = vehicle.year || '';
      els.fRating.value = vehicle.rating || '';
    } else {
      els.modalTitle.textContent = 'Add a vehicle';
      els.modalSub.textContent = 'Add a new ride to the VEHA fleet.';
      els.submit.textContent = 'Add vehicle';
      els.form.reset();
      els.fType.value = 'car';
      els.fCity.value = V.CITIES[0];
      els.fTrans.value = 'Automatic';
      els.fFuel.value = 'Petrol';
    }

    modalFocus = document.activeElement;
    els.modal.classList.add('is-open');
    els.modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    window.setTimeout(function () { els.fName.focus(); }, 40);
  }

  function closeVehicleModal() {
    if (!els.modal.classList.contains('is-open')) return;
    els.modal.classList.remove('is-open');
    els.modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    state.editingId = null;
    if (modalFocus && typeof modalFocus.focus === 'function') modalFocus.focus();
    modalFocus = null;
  }

  function formError(message) {
    els.formError.textContent = message;
    var field = els.form.querySelector('input, select');
    if (field) field.focus();
  }

  function saveVehicle(event) {
    event.preventDefault();
    var name = els.fName.value.trim();
    var type = els.fType.value;
    var city = els.fCity.value;
    var price = Number(els.fPrice.value);
    var seats = Number(els.fSeats.value);
    var transmission = els.fTrans.value;
    var fuel = els.fFuel.value;
    var year = Number(els.fYear.value);
    var rating = Number(els.fRating.value);
    var maxYear = new Date().getFullYear() + 1;

    if (name.length < 2) return formError('Give the vehicle a name (at least 2 characters).');
    if (!type) return formError('Choose a vehicle type.');
    if (!city) return formError('Choose a city.');
    if (!price || price < 500) return formError('Price per day must be at least Rs 500.');
    if (!seats || seats < 1 || seats > 70) return formError('Seats must be between 1 and 70.');
    if (!year || year < 1990 || year > maxYear) return formError('Model year must be between 1990 and ' + maxYear + '.');
    if (!rating || rating < 1 || rating > 5) return formError('Rating must be between 1.0 and 5.0.');

    var vehicles = V.getVehicles();
    var existing = state.editingId ? vehicles.filter(function (v) { return v.id === state.editingId; })[0] : null;

    var vehicle = {
      id: existing ? existing.id : 'v' + Date.now(),
      name: name,
      type: type,
      city: city,
      price: Math.round(price),
      seats: Math.round(seats),
      transmission: transmission,
      fuel: fuel,
      year: Math.round(year),
      rating: Math.round(rating * 10) / 10,
      reviews: existing ? existing.reviews : 0,
      tag: existing ? existing.tag : '',
      about: existing ? existing.about : 'A newly added ' + V.typeMeta(type).singular.toLowerCase() + ' available in ' + city + '.'
    };

    if (existing) {
      vehicles = vehicles.map(function (v) { return v.id === existing.id ? vehicle : v; });
    } else {
      vehicles.push(vehicle);
    }

    V.saveVehicles(vehicles);
    var wasEditing = Boolean(existing);
    closeVehicleModal();
    renderAll();
    setView('vehicles');
    V.toast(wasEditing ? name + ' updated.' : name + ' added to the fleet.');
  }

  /* ---------- Actions ---------- */

  function deleteVehicle(id) {
    var vehicle = V.getVehicle(id);
    if (!vehicle) return;
    V.confirm({
      title: 'Remove ' + vehicle.name + '?',
      message: 'The vehicle will disappear from the fleet and storefront. Existing bookings keep their records.',
      confirmText: 'Remove vehicle',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      V.saveVehicles(V.getVehicles().filter(function (v) { return v.id !== id; }));
      renderAll();
      V.toast(vehicle.name + ' removed from the fleet.');
    });
  }

  function deleteBooking(id) {
    var booking = V.getBookings().filter(function (b) { return b.id === id; })[0];
    if (!booking) return;
    V.confirm({
      title: 'Delete this booking?',
      message: booking.id + ' for ' + (booking.userName || 'a guest') + ' will be permanently removed.',
      confirmText: 'Delete booking',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      V.saveBookings(V.getBookings().filter(function (b) { return b.id !== id; }));
      renderAll();
      V.toast('Booking ' + booking.id + ' deleted.');
    });
  }

  function updateStatus(id, status) {
    if (STATUSES.indexOf(status) === -1) return;
    var bookings = V.getBookings();
    var booking = bookings.filter(function (b) { return b.id === id; })[0];
    if (!booking || booking.status === status) return;
    booking.status = status;
    V.saveBookings(bookings);
    renderAll();
    V.toast('Booking ' + booking.id + ' marked ' + status.toLowerCase() + '.');
  }

  function resetDemo() {
    V.confirm({
      title: 'Reset demo data?',
      message: 'The original fleet and the three sample bookings will be restored. Your changes in this browser will be lost.',
      confirmText: 'Reset everything',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      V.resetDemo();
      clearHidden();
      renderAll();
      V.toast('Demo data restored.');
    });
  }

  /* ---------- Wiring ---------- */

  function bind() {
    $$('[data-view]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        setView(link.getAttribute('data-view'));
      });
    });

    $$('[data-goto]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setView(btn.getAttribute('data-goto'));
      });
    });

    window.addEventListener('hashchange', function () {
      setView(viewFromHash(), false);
    });

    els.vehicleSearch.addEventListener('input', function () {
      state.vehicleQuery = els.vehicleSearch.value;
      renderVehicleTable();
    });

    els.vehicleSort.addEventListener('change', function () {
      state.vehicleSort = els.vehicleSort.value;
      renderVehicleTable();
    });

    els.bookingFilter.addEventListener('change', function () {
      state.bookingFilter = els.bookingFilter.value;
      renderBookingTable();
    });

    document.addEventListener('click', function (event) {
      if (handleToolsClick(event)) return;
      var add = event.target.closest('[data-add-vehicle]');
      if (add) {
        openVehicleModal(null);
        return;
      }
      var edit = event.target.closest('[data-edit-vehicle]');
      if (edit) {
        var vehicle = V.getVehicle(edit.getAttribute('data-edit-vehicle'));
        if (vehicle) openVehicleModal(vehicle);
        return;
      }
      var removeVehicle = event.target.closest('[data-delete-vehicle]');
      if (removeVehicle) {
        deleteVehicle(removeVehicle.getAttribute('data-delete-vehicle'));
        return;
      }
      var returnRental = event.target.closest('[data-return-rental]');
      if (returnRental) {
        updateStatus(returnRental.getAttribute('data-return-rental'), 'Completed');
        return;
      }
      var removeBooking = event.target.closest('[data-delete-booking]');
      if (removeBooking) {
        deleteBooking(removeBooking.getAttribute('data-delete-booking'));
        return;
      }
      var close = event.target.closest('[data-close-modal]');
      if (close && els.modal.contains(close)) {
        closeVehicleModal();
      }
    });

    document.addEventListener('change', function (event) {
      var select = event.target;
      if (select.matches && select.matches('[data-status]')) {
        updateStatus(select.getAttribute('data-status'), select.value);
      }
    });

    els.form.addEventListener('submit', saveVehicle);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && els.modal.classList.contains('is-open')) {
        closeVehicleModal();
      }
    });

    var reset = $('[data-reset-demo]');
    if (reset) reset.addEventListener('click', resetDemo);
  }

  function cache() {
    els.viewEyebrow = $('#viewEyebrow');
    els.viewTitle = $('#viewTitle');
    els.statCards = $('#statCards');
    els.fleetMix = $('#fleetMix');
    els.vehicleTableSub = $('#vehicleTableSub');
    els.bookingTableSub = $('#bookingTableSub');
    els.vehicleSearch = $('#vehicleSearch');
    els.vehicleSort = $('#vehicleSort');
    els.rentedSub = $('#rentedSub');
    els.navRentedCount = $('#navRentedCount');
    els.bookingFilter = $('#bookingFilter');
    els.navVehicleCount = $('#navVehicleCount');
    els.navBookingCount = $('#navBookingCount');
    els.modal = $('#vehicleModal');
    els.modalTitle = $('#vehicleModalTitle');
    els.modalSub = $('#vehicleModalSub');
    els.form = $('#vehicleForm');
    els.formError = $('#vfError');
    els.submit = $('#vfSubmit');
    els.fName = $('#vfName');
    els.fType = $('#vfType');
    els.fCity = $('#vfCity');
    els.fPrice = $('#vfPrice');
    els.fSeats = $('#vfSeats');
    els.fTrans = $('#vfTrans');
    els.fFuel = $('#vfFuel');
    els.fYear = $('#vfYear');
    els.fRating = $('#vfRating');
  }

  function init() {
    cache();
    ensureTools();

    els.fType.innerHTML = V.TYPES.map(function (type) {
      return '<option value="' + type.id + '">' + V.esc(type.singular) + '</option>';
    }).join('');
    els.fCity.innerHTML = V.CITIES.map(function (city) {
      return '<option value="' + V.esc(city) + '">' + V.esc(city) + '</option>';
    }).join('');
    els.fYear.max = String(new Date().getFullYear() + 1);

    bind();
    renderAll();
    setView(viewFromHash(), false);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
