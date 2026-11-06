/* VEHA — shared data, storage and UI helpers */
(function () {
  'use strict';

  var STORAGE = {
    vehicles: 'veha.vehicles',
    bookings: 'veha.bookings',
    payments: 'veha.payments',
    user: 'veha.user',
    pending: 'veha.pending'
  };

  var TYPES = [
    { id: 'car', name: 'Cars', singular: 'Car', from: 9500, image: 'assets/images/car.png', bags: 2, blurb: 'Comfort for city and coast' },
    { id: 'van', name: 'Vans', singular: 'Van', from: 9000, image: 'assets/images/van.png', bags: 6, blurb: 'Space for the whole crew' },
    { id: 'bus', name: 'Buses', singular: 'Bus', from: 28000, image: 'assets/images/bus.png', bags: 20, blurb: 'Group trips, sorted' },
    { id: 'bike', name: 'Bikes', singular: 'Bike', from: 2800, image: 'assets/images/bike.png', bags: 1, blurb: 'Quick and nimble' },
    { id: 'scooty', name: 'Scooties', singular: 'Scooty', from: 1900, image: 'assets/images/scooty.png', bags: 1, blurb: 'Easy island hops' },
    { id: 'threewheel', name: 'Three-wheels', singular: 'Three-wheel', from: 3200, image: 'assets/images/threewheel.png', bags: 1, blurb: 'The local classic' },
    { id: 'lorry', name: 'Lorries', singular: 'Lorry', from: 13500, image: 'assets/images/lorry.png', bags: 0, blurb: 'Move anything, anywhere' },
    { id: 'luxury', name: 'Luxury', singular: 'Luxury', from: 15000, image: 'assets/images/luxury.png', bags: 3, blurb: 'Arrive in style' }
  ];

  var CITIES = ['Colombo', 'Kandy', 'Galle', 'Negombo', 'Jaffna', 'Ella', 'Trincomalee', 'Anuradhapura'];

  var DRIVER_TYPES = { car: true, van: true, bus: true, bike: false, scooty: false, threewheel: true, lorry: true, luxury: true };

  var VEHICLE_SEED = [
    { id: 'v1', name: 'Toyota Axio', type: 'car', city: 'Colombo', price: 9500, seats: 5, transmission: 'Automatic', fuel: 'Petrol', year: 2021, rating: 4.8, reviews: 64, tag: 'Popular', about: "A light, easy-going sedan that's just as happy in Colombo traffic as it is on the Southern Expressway." },
    { id: 'v2', name: 'Toyota HiAce', type: 'van', city: 'Colombo', price: 12500, seats: 12, transmission: 'Manual', fuel: 'Diesel', year: 2019, rating: 4.7, reviews: 42, tag: '', about: 'The go-to van for family trips and airport runs, with room for luggage and a cool cabin.' },
    { id: 'v3', name: 'Suzuki Every', type: 'van', city: 'Kandy', price: 9000, seats: 7, transmission: 'Automatic', fuel: 'Petrol', year: 2022, rating: 4.6, reviews: 28, tag: '', about: 'Compact, nippy and surprisingly roomy — ideal for hill country lanes and small groups.' },
    { id: 'v4', name: 'Mitsubishi Rosa', type: 'bus', city: 'Colombo', price: 28000, seats: 30, transmission: 'Manual', fuel: 'Diesel', year: 2018, rating: 4.7, reviews: 37, tag: '', about: 'A comfortable mid-size coach for office outings, school trips and wedding shuttles.' },
    { id: 'v5', name: 'Honda Vezel', type: 'car', city: 'Galle', price: 14000, seats: 5, transmission: 'Automatic', fuel: 'Hybrid', year: 2020, rating: 4.9, reviews: 81, tag: 'Top rated', about: 'A smooth hybrid crossover with a high ride and a cabin that stays quiet at speed.' },
    { id: 'v6', name: 'Bajaj Pulsar 150', type: 'bike', city: 'Colombo', price: 2800, seats: 2, transmission: 'Manual', fuel: 'Petrol', year: 2022, rating: 4.5, reviews: 19, tag: '', about: 'A dependable street bike for quick solo runs along the coast or into the city.' },
    { id: 'v7', name: 'Honda Dio', type: 'scooty', city: 'Galle', price: 1900, seats: 2, transmission: 'Automatic', fuel: 'Petrol', year: 2023, rating: 4.8, reviews: 56, tag: 'Local favourite', about: 'Light, automatic and effortless — the easiest way to zip around town.' },
    { id: 'v8', name: 'Bajaj RE Tuk Tuk', type: 'threewheel', city: 'Kandy', price: 3200, seats: 3, transmission: 'Manual', fuel: 'Petrol', year: 2021, rating: 4.9, reviews: 73, tag: 'Island icon', about: 'The classic way to travel: open-air, nimble and made for short island hops.' },
    { id: 'v9', name: 'Isuzu Elf Lorry', type: 'lorry', city: 'Colombo', price: 18000, seats: 3, transmission: 'Manual', fuel: 'Diesel', year: 2018, rating: 4.4, reviews: 12, tag: '', about: 'A solid light lorry for furniture moves, stock deliveries and site errands.' },
    { id: 'v10', name: 'Mercedes-Benz E-Class', type: 'luxury', city: 'Colombo', price: 38000, seats: 5, transmission: 'Automatic', fuel: 'Petrol', year: 2022, rating: 5.0, reviews: 34, tag: 'Premium', about: 'Executive comfort with a quiet cabin and a little extra presence for the occasion.' },
    { id: 'v11', name: 'BMW R 1250 GS', type: 'luxury', city: 'Colombo', price: 15000, seats: 2, transmission: 'Manual', fuel: 'Petrol', year: 2023, rating: 4.9, reviews: 21, tag: '', about: 'A proper adventure tourer for long coastal rides and the road to Ella.' },
    { id: 'v12', name: 'Toyota Alphard', type: 'luxury', city: 'Colombo', price: 32000, seats: 7, transmission: 'Automatic', fuel: 'Hybrid', year: 2023, rating: 5.0, reviews: 18, tag: 'VIP pick', about: 'A lounge on wheels for VIP airport transfers and long family journeys.' },
    { id: 'v13', name: 'Yutong Coach', type: 'luxury', city: 'Colombo', price: 55000, seats: 45, transmission: 'Manual', fuel: 'Diesel', year: 2022, rating: 4.8, reviews: 9, tag: '', about: 'A full-size coach for large groups, conferences and multi-day tours.' },
    { id: 'v14', name: 'Toyota Prius', type: 'car', city: 'Negombo', price: 10500, seats: 5, transmission: 'Automatic', fuel: 'Hybrid', year: 2021, rating: 4.7, reviews: 45, tag: '', about: 'A frugal hybrid that sips fuel, with enough space for a small family.' },
    { id: 'v15', name: 'Vespa Primavera', type: 'scooty', city: 'Colombo', price: 3500, seats: 2, transmission: 'Automatic', fuel: 'Petrol', year: 2023, rating: 4.9, reviews: 39, tag: '', about: 'Retro looks, automatic ease and just enough space for a beach-day bag.' },
    { id: 'v16', name: 'TVS Ntorq', type: 'scooty', city: 'Jaffna', price: 2200, seats: 2, transmission: 'Automatic', fuel: 'Petrol', year: 2022, rating: 4.5, reviews: 16, tag: '', about: 'A peppy automatic scooter for city errands and short rides to the beach.' },
    { id: 'v17', name: 'Mahindra Bolero', type: 'car', city: 'Ella', price: 11000, seats: 7, transmission: 'Manual', fuel: 'Diesel', year: 2019, rating: 4.3, reviews: 11, tag: '', about: 'Rugged and roomy — built for tea-country roads and weekend escapes.' },
    { id: 'v18', name: 'Tata Ace', type: 'lorry', city: 'Galle', price: 13500, seats: 2, transmission: 'Manual', fuel: 'Diesel', year: 2020, rating: 4.2, reviews: 8, tag: '', about: 'A compact cargo carrier for small loads and tight city streets.' }
  ];

  function pad(n) { return String(n).padStart(2, '0'); }

  function toISO(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function todayISO() {
    return toISO(new Date());
  }

  function offsetISO(days) {
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return toISO(d);
  }

  function makeDemoBookings() {
    return [
      { id: 'VEH-8K2M1A', userName: 'Nimal Perera', userEmail: 'nimal@example.com', vehicleId: 'v1', city: 'Colombo', pickup: offsetISO(2), ret: offsetISO(4), days: 2, extras: 1200, total: 21500, status: 'Confirmed', createdAt: offsetISO(0) + 'T09:24:00' },
      { id: 'VEH-4R7Q9C', userName: 'Hasini Fernando', userEmail: 'hasini@example.com', vehicleId: 'v5', city: 'Galle', pickup: offsetISO(1), ret: offsetISO(5), days: 4, extras: 1200, total: 60300, status: 'Pending', createdAt: offsetISO(0) + 'T08:10:00' },
      { id: 'VEH-2L5T6B', userName: 'Ravi Silva', userEmail: 'ravi@example.com', vehicleId: 'v4', city: 'Colombo', pickup: offsetISO(-5), ret: offsetISO(-3), days: 2, extras: 0, total: 56500, status: 'Completed', createdAt: offsetISO(-8) + 'T14:45:00' }
    ];
  }

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* storage unavailable — app still renders with in-memory defaults */
    }
  }


  /* ---------- Server file sync (data/*.txt via the Java backend) ----------
     Each module's data lives in its own pipe-separated text file:
       Member 1 -> data/users.txt      Member 2 -> data/vehicles.txt
       Member 3 -> data/bookings.txt   Member 4 -> data/payments.txt
     localStorage stays as a fast cache; when the Java server is not running
     (e.g. file:// preview) the site silently falls back to localStorage only. */
  var FIELDS = {
    vehicles: ['id', 'name', 'type', 'city', 'price', 'seats', 'transmission', 'fuel', 'year', 'rating', 'reviews', 'tag', 'about'],
    bookings: ['id', 'userName', 'userEmail', 'vehicleId', 'city', 'pickup', 'ret', 'days', 'extras', 'total', 'status', 'createdAt'],
    payments: ['id', 'booking', 'amount', 'method', 'status', 'date'],
    users: ['email', 'name', 'phone', 'role', 'updatedAt'],
    rented: ['rentalId', 'bookingId', 'vehicleId', 'vehicleName', 'customerEmail', 'pickup', 'ret', 'status']
  };
  var NUMERIC = { price: 1, seats: 1, year: 1, rating: 1, reviews: 1, days: 1, extras: 1, total: 1, amount: 1 };
  var serverUp = null;

  function cleanField(v) {
    return String(v === undefined || v === null ? '' : v).replace(/[|\r\n]+/g, ' ').trim();
  }

  function toRecord(name, obj) {
    return FIELDS[name].map(function (key) { return cleanField(obj[key]); }).join('|');
  }

  function fromRecord(name, line) {
    var parts = String(line).split('|');
    var obj = {};
    FIELDS[name].forEach(function (key, i) {
      var raw = parts[i] === undefined ? '' : parts[i];
      obj[key] = NUMERIC[key] ? (Number(raw) || 0) : raw;
    });
    return obj;
  }

  function xhr(method, path, body) {
    if (serverUp === false || typeof XMLHttpRequest === 'undefined') return null;
    if (!/^https?:$/.test(window.location.protocol)) { serverUp = false; return null; }
    try {
      var req = new XMLHttpRequest();
      req.open(method, '/api/' + path, false); /* synchronous: keeps order and finishes before page redirects */
      if (body !== undefined) req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
      req.send(body);
      if (req.status >= 200 && req.status < 300) { serverUp = true; return req.responseText; }
    } catch (err) { /* server not reachable */ }
    if (serverUp === null) serverUp = false;
    return null;
  }

  function serverRead(name) {
    var text = xhr('GET', name);
    if (text === null) return null;
    try {
      return JSON.parse(text).filter(function (l) { return l.trim(); }).map(function (l) { return fromRecord(name, l); });
    } catch (err) { return null; }
  }

  function showPersistenceError(name) {
    if (typeof document === 'undefined') return;
    var id = 'veha-persistence-warning';
    var banner = document.getElementById(id);
    if (!banner) {
      banner = document.createElement('div');
      banner.id = id;
      banner.setAttribute('role', 'alert');
      banner.style.cssText = 'position:fixed;z-index:99999;left:16px;right:16px;bottom:16px;padding:14px 18px;background:#8b1e1e;color:#fff;border-radius:10px;font:600 14px/1.45 Arial,sans-serif;box-shadow:0 4px 18px #0003';
      document.body.appendChild(banner);
    }
    banner.textContent = 'SAVE FAILED: ' + name + ' data could not be written to the server text file. Your browser cache may contain the change, but it is NOT safely saved. Check that run.bat / run.sh is running, then reload and try again.';
  }

  function serverWrite(name, list) {
    var lines = list.map(function (item) { return toRecord(name, item); }).join('\n');
    var result = xhr('PUT', name, 'records=' + encodeURIComponent(lines));
    if (result === null) { showPersistenceError(name); return false; }
    return true;
  }

  /* On first load: pull saved rows from the text files into the local cache. */
  function hydrate(name, key) {
    var rows = serverRead(name);
    if (rows === null) return;
    var flag = 'veha.synced.' + name;
    var firstRun = false;
    try { firstRun = !localStorage.getItem(flag); } catch (err) { /* noop */ }
    var needsPush = false;
    if (rows.length) {
      write(key, rows);
    } else if (!firstRun) {
      write(key, []);
    } else {
      needsPush = true; /* first run with an empty file: seed it from this browser */
    }
    try { localStorage.setItem(flag, '1'); } catch (err) { /* noop */ }
    return needsPush;
  }


  /* Rented vehicle records live in a linked list on the Java server (Member 3);
     vehicle sorting uses selection sort on the server (Member 2). */
  var rentedMap = {};

  function refreshRented() {
    var rows = serverRead('rented');
    rentedMap = {};
    if (!rows) return null;
    var today = todayISO();
    rows.forEach(function (r) {
      if (r.ret >= today && (!rentedMap[r.vehicleId] || r.ret < rentedMap[r.vehicleId])) rentedMap[r.vehicleId] = r.ret;
    });
    return rows;
  }

  function getRented() {
    return refreshRented();
  }

  function rentedUntil(vehicleId) {
    return rentedMap[vehicleId] || '';
  }

  /* by: 'price' | 'availability'   order: 'asc' | 'desc'  -> { algorithm, comparisons, swaps, vehicles:[{id,available,rentedUntil}] } or null */
  function sortedVehicles(by, order) {
    var text = xhr('GET', 'vehicles/sorted?by=' + encodeURIComponent(by) + '&order=' + encodeURIComponent(order));
    if (text === null) return null;
    try { return JSON.parse(text); } catch (err) { return null; }
  }

  function getVehicles() {
    var list = read(STORAGE.vehicles, null);
    if (!Array.isArray(list) || !list.length) {
      list = VEHICLE_SEED.map(function (v) { return Object.assign({}, v); });
      write(STORAGE.vehicles, list);
    }
    return list;
  }

  function saveVehicles(list) {
    write(STORAGE.vehicles, list);
    return serverWrite('vehicles', list);
  }

  function getBookings() {
    var list = read(STORAGE.bookings, null);
    if (!Array.isArray(list)) {
      list = makeDemoBookings();
      write(STORAGE.bookings, list);
    }
    return list;
  }

  function saveBookings(list) {
    write(STORAGE.bookings, list);
    var saved = serverWrite('bookings', list);
    refreshRented();
    return saved;
  }

  function getPayments() {
    return read(STORAGE.payments, []);
  }

  function savePayments(list) {
    write(STORAGE.payments, list);
    return serverWrite('payments', list);
  }

  function resetDemo() {
    saveVehicles(VEHICLE_SEED.map(function (v) { return Object.assign({}, v); }));
    saveBookings(makeDemoBookings());
  }

  function getVehicle(id) {
    return getVehicles().filter(function (v) { return v.id === id; })[0] || null;
  }

  function typeMeta(id) {
    return TYPES.filter(function (t) { return t.id === id; })[0] || TYPES[0];
  }

  function cities() {
    var list = getVehicles().map(function (v) { return v.city; });
    return Array.from(new Set(list)).sort();
  }

  function money(amount) {
    var value = Number(amount) || 0;
    return 'Rs ' + value.toLocaleString('en-LK', { maximumFractionDigits: 0 });
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(iso) {
    if (!iso) return '—';
    var parts = String(iso).slice(0, 10).split('-');
    if (parts.length !== 3) return iso;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function daysBetween(start, end) {
    if (!start || !end) return 0;
    var a = new Date(start + 'T12:00:00');
    var b = new Date(end + 'T12:00:00');
    return Math.round((b - a) / 86400000);
  }

  function bookingRef() {
    var stamp = Date.now().toString(36).toUpperCase().slice(-4);
    var rand = Math.random().toString(36).toUpperCase().slice(2, 5);
    return 'VEH-' + stamp + rand;
  }

  function getUser() {
    return read(STORAGE.user, null);
  }

  function setUser(user) {
    var previous = getUser();
    write(STORAGE.user, user);
    if (!user || user.role === 'admin') return;
    var users = serverRead('users');
    if (users === null) { showPersistenceError('users'); return false; }
    var oldEmail = previous && previous.role !== 'admin' ? String(previous.email || '').toLowerCase() : '';
    var email = String(user.email || '').toLowerCase();
    users = users.filter(function (u) {
      var e = String(u.email).toLowerCase();
      return e !== email && e !== oldEmail;
    });
    users.push({ email: email, name: user.name, phone: user.phone || '', role: user.role || 'user', updatedAt: new Date().toISOString() });
    return serverWrite('users', users);
  }

  function isAdmin() {
    var u = getUser();
    return !!(u && u.role === 'admin' && u.email === 'admin');
  }

  function clearUser() {
    try { localStorage.removeItem(STORAGE.user); } catch (err) { /* noop */ }
  }

  function setPending(value) {
    try { sessionStorage.setItem(STORAGE.pending, JSON.stringify(value)); } catch (err) { /* noop */ }
  }

  function getPending() {
    try {
      var raw = sessionStorage.getItem(STORAGE.pending);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function clearPending() {
    try { sessionStorage.removeItem(STORAGE.pending); } catch (err) { /* noop */ }
  }

  var ICONS = {
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    star: '<path d="M12 2.6l2.9 5.9 6.5 1-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5L2.6 9.5l6.5-1z"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    bag: '<path d="M6 8h12l1 13H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    fuel: '<path d="M3 22h12"/><path d="M4 9h10"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V9.8a2 2 0 0 0-.6-1.4L18 5"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
    check: '<path d="M20 6L9 17l-4-4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
    headset: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
    wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
    sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    close: '<path d="M18 6L6 18M6 6l12 12"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    show: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    hide: '<path d="M17.9 17.9A10.4 10.4 0 0 1 12 19c-7 0-11-7-11-7a19 19 0 0 1 5.1-5.9M9.9 4.2A10.6 10.6 0 0 1 12 5c7 0 11 7 11 7a19.3 19.3 0 0 1-2.2 3.2"/><path d="M1 1l22 22"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    car: '<path d="M5 17h14M3 13l1.7-5.2A2 2 0 0 1 6.6 6.4h10.8a2 2 0 0 1 1.9 1.4L21 13v4a1 1 0 0 1-1 1h-1"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/><path d="M3 13h18"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    bookings: '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    route: '<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h4a4 4 0 0 0 0-8H8a3 3 0 0 1 0-6h7"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    laptop: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>'
  };

  function icon(name, extra) {
    var body = ICONS[name] || '';
    return '<svg class="icon ' + (extra || '') + '" viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
  }

  function ratingStars(rating) {
    return '<span class="rating">' + icon('star', 'icon--star') + Number(rating).toFixed(1) + '</span>';
  }

  function availabilityPill(vehicleId) {
    var until = rentedUntil(vehicleId);
    if (until) return '<span class="pill pill--rented">Rented until ' + escapeHTML(formatDate(until)) + '</span>';
    return '<span class="pill pill--available">Available</span>';
  }

  function vehicleCard(vehicle, options) {
    var opts = options || {};
    var type = typeMeta(vehicle.type);
    var tag = vehicle.tag ? '<span class="pill pill--accent">' + escapeHTML(vehicle.tag) + '</span>' : '';
    return '' +
      '<article class="vehicle-card reveal">' +
        '<a class="vehicle-card__link" href="vehicle.html?id=' + encodeURIComponent(vehicle.id) + '">' +
          '<div class="vehicle-card__media">' +
            '<img src="' + type.image + '" alt="' + escapeHTML(vehicle.name) + '" loading="lazy">' +
            '<span class="pill pill--type">' + escapeHTML(type.singular) + '</span>' +
            tag +
            availabilityPill(vehicle.id) +
          '</div>' +
          '<div class="vehicle-card__body">' +
            '<div class="vehicle-card__top">' +
              '<span class="loc">' + icon('pin') + escapeHTML(vehicle.city) + '</span>' +
              ratingStars(vehicle.rating) +
            '</div>' +
            '<h3>' + escapeHTML(vehicle.name) + '</h3>' +
            '<ul class="specs">' +
              '<li>' + icon('users') + vehicle.seats + ' seats</li>' +
              '<li>' + icon('gear') + escapeHTML(vehicle.transmission) + '</li>' +
              '<li>' + icon('fuel') + escapeHTML(vehicle.fuel) + '</li>' +
            '</ul>' +
            '<div class="vehicle-card__foot">' +
              '<div class="price"><strong>' + money(vehicle.price) + '</strong><span>/ day</span></div>' +
              (opts.hideArrow ? '' : '<span class="go" aria-hidden="true">' + icon('arrow') + '</span>') +
            '</div>' +
          '</div>' +
        '</a>' +
      '</article>';
  }

  function revealVisible() {
    var items = document.querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -50px 0px', threshold: 0.05 });
    items.forEach(function (el) { observer.observe(el); });
  }

  var toastTimer = null;
  function toast(message, tone) {
    var el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.innerHTML = icon(tone === 'error' ? 'info' : 'check') + '<span>' + escapeHTML(message) + '</span>';
    el.classList.toggle('toast--error', tone === 'error');
    el.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { el.classList.remove('is-visible'); }, 3200);
  }

  function confirmDialog(options) {
    var opts = Object.assign({ title: 'Are you sure?', message: '', confirmText: 'Confirm', cancelText: 'Cancel', danger: false }, options || {});
    return new Promise(function (resolve) {
      var wrap = document.createElement('div');
      wrap.className = 'confirm';
      wrap.innerHTML = '' +
        '<div class="confirm__backdrop" data-confirm-cancel></div>' +
        '<div class="confirm__card" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">' +
          '<span class="confirm__icon">' + icon(opts.danger ? 'trash' : 'info') + '</span>' +
          '<h2 id="confirmTitle">' + escapeHTML(opts.title) + '</h2>' +
          '<p>' + escapeHTML(opts.message) + '</p>' +
          '<div class="confirm__actions">' +
            '<button type="button" class="btn btn--ghost" data-confirm-cancel>' + escapeHTML(opts.cancelText) + '</button>' +
            '<button type="button" class="btn ' + (opts.danger ? 'btn--danger' : 'btn--primary') + '" data-confirm-ok>' + escapeHTML(opts.confirmText) + '</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(wrap);
      document.body.classList.add('no-scroll');

      var previousFocus = document.activeElement;
      var okBtn = wrap.querySelector('[data-confirm-ok]');

      function close(result) {
        document.body.classList.remove('no-scroll');
        wrap.remove();
        document.removeEventListener('keydown', onKey);
        if (previousFocus && previousFocus.focus) previousFocus.focus();
        resolve(result);
      }

      function onKey(event) {
        if (event.key === 'Escape') close(false);
      }

      wrap.querySelectorAll('[data-confirm-cancel]').forEach(function (btn) {
        btn.addEventListener('click', function () { close(false); });
      });
      okBtn.addEventListener('click', function () { close(true); });
      document.addEventListener('keydown', onKey);
      window.setTimeout(function () { okBtn.focus(); }, 20);
    });
  }

  if (hydrate('vehicles', STORAGE.vehicles)) serverWrite('vehicles', getVehicles());
  if (hydrate('bookings', STORAGE.bookings)) serverWrite('bookings', getBookings());
  if (hydrate('payments', STORAGE.payments)) { var localPay = getPayments(); if (localPay.length) serverWrite('payments', localPay); }

  refreshRented();

  window.Veha = {
    TYPES: TYPES,
    CITIES: CITIES,
    DRIVER_TYPES: DRIVER_TYPES,
    storage: STORAGE,
    getVehicles: getVehicles,
    saveVehicles: saveVehicles,
    getVehicle: getVehicle,
    getBookings: getBookings,
    saveBookings: saveBookings,
    getRented: getRented,
    rentedUntil: rentedUntil,
    sortedVehicles: sortedVehicles,
    getPayments: getPayments,
    savePayments: savePayments,
    resetDemo: resetDemo,
    typeMeta: typeMeta,
    cities: cities,
    money: money,
    esc: escapeHTML,
    formatDate: formatDate,
    daysBetween: daysBetween,
    todayISO: todayISO,
    offsetISO: offsetISO,
    bookingRef: bookingRef,
    getUser: getUser,
    setUser: setUser,
    clearUser: clearUser,
    isAdmin: isAdmin,
    setPending: setPending,
    getPending: getPending,
    clearPending: clearPending,
    icon: icon,
    vehicleCard: vehicleCard,
    revealVisible: revealVisible,
    toast: toast,
    confirm: confirmDialog
  };
})();
