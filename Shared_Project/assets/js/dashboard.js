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

    els.statCards.innerHTML = cards.map(function (card) {
      return '<article class="dash-stat">' +
        '<div class="dash-stat__top">' +
          '<span class="dash-stat__label">' + V.esc(card.label) + '</span>' +
          '<span class="dash-stat__ico dash-stat__ico--' + card.tone + '">' + V.icon(card.icon) + '</span>' +
        '</div>' +
        '<strong>' + V.esc(card.value) + '</strong>' +
        '<span>' + V.esc(card.note) + '</span>' +
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
      .filter(function (row) { return row.count > 0; })
      .sort(function (a, b) { return b.count - a.count; });

    if (!rows.length) {
      els.fleetMix.innerHTML = '<p class="table-empty">No vehicles in the fleet yet.</p>';
      return;
    }

    var max = rows[0].count;
    els.fleetMix.innerHTML = rows.map(function (row) {
      var share = total ? Math.round((row.count / total) * 100) : 0;
      return '<div class="fleet-row">' +
        '<div class="fleet-row__top"><span>' + V.esc(row.type.name) + '</span>' +
        '<strong>' + row.count + ' · ' + share + '%</strong></div>' +
        '<div class="fleet-bar"><span style="width:' + Math.max(6, Math.round((row.count / max) * 100)) + '%"></span></div>' +
      '</div>';
    }).join('');
  }

  function renderRecentBookings() {
    var bookings = V.getBookings()
      .slice()
      .sort(function (a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); })
      .slice(0, 5);
    var tbody = $('#recentBookings tbody');

    if (!bookings.length) {
      tbody.innerHTML = '<tr><td class="table-empty" colspan="5">No bookings yet.</td></tr>';
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
