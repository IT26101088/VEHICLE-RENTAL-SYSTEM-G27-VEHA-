(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var V = window.Veha;
    var all = V.getVehicles();
    var params = new URLSearchParams(window.location.search);

    var grid = document.getElementById('browseGrid');
    var resultCount = document.getElementById('resultCount');
    var browseSub = document.getElementById('browseSub');
    var typeFilters = document.getElementById('typeFilters');
    var cityFilter = document.getElementById('cityFilter');
    var queryInput = document.getElementById('filterQuery');
    var priceFilter = document.getElementById('priceFilter');
    var priceOut = document.getElementById('priceOut');
    var transFilter = document.getElementById('transFilter');
    var seatFilter = document.getElementById('seatFilter');
    var sortSelect = document.getElementById('sortSelect');
    var resetBtn = document.getElementById('resetFilters');
    var filters = document.getElementById('filters');
    var backdrop = document.querySelector('[data-filters-backdrop]');
    var openFiltersBtn = document.querySelector('[data-open-filters]');
    var closeFiltersBtn = document.querySelector('[data-close-filters]');

    var maxPrice = Math.max.apply(null, all.map(function (v) { return Number(v.price) || 0; }).concat([20000]));
    var priceCap = Math.ceil(maxPrice / 5000) * 5000;

    var requestedType = params.get('type') || '';
    var validType = V.TYPES.some(function (t) { return t.id === requestedType; }) ? requestedType : '';
    var requestedCity = params.get('city') || '';
    if (requestedCity && V.cities().indexOf(requestedCity) === -1) requestedCity = '';

    var state = {
      q: (params.get('q') || '').trim(),
      types: new Set(validType ? [validType] : []),
      city: requestedCity,
      price: priceCap,
      trans: '',
      seats: 0,
      sort: 'recommended'
    };

    /* Keep search dates for the booking form */
    var pickup = params.get('pickup');
    var ret = params.get('return');
    if (pickup && ret && ret > pickup) {
      try {
        sessionStorage.setItem('veha.searchDates', JSON.stringify({ pickup: pickup, ret: ret }));
      } catch (err) { /* session storage unavailable */ }
    }

    /* Build filter controls */
    typeFilters.innerHTML = V.TYPES.map(function (type) {
      var count = all.filter(function (v) { return v.type === type.id; }).length;
      if (!count) return '';
      return '<label class="check">' +
        '<input type="checkbox" value="' + type.id + '"' + (state.types.has(type.id) ? ' checked' : '') + '>' +
        '<span>' + V.esc(type.name) + '</span>' +
        '<span class="count">' + count + '</span>' +
        '</label>';
    }).join('');

    V.cities().forEach(function (city) {
      var option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      if (city === state.city) option.selected = true;
      cityFilter.appendChild(option);
    });

    priceFilter.min = '1000';
    priceFilter.max = String(priceCap);
    priceFilter.step = '500';
    priceFilter.value = String(priceCap);
    priceOut.textContent = V.money(priceCap) + '+';

    queryInput.value = state.q;

    /* Filtering */
    function matches(vehicle) {
      if (state.types.size && !state.types.has(vehicle.type)) return false;
      if (state.city && vehicle.city !== state.city) return false;
      if (Number(vehicle.price) > state.price) return false;
      if (state.trans && vehicle.transmission !== state.trans) return false;
      if (state.seats && Number(vehicle.seats) < state.seats) return false;
      if (state.q) {
        var type = V.typeMeta(vehicle.type);
        var haystack = (vehicle.name + ' ' + vehicle.city + ' ' + type.name + ' ' + type.singular).toLowerCase();
        if (haystack.indexOf(state.q.toLowerCase()) === -1) return false;
      }
      return true;
    }

    /* Price and availability sorting is done by the Java server with SELECTION SORT
       (Member 2: VehicleSelectionSort). Falls back to the browser sort if the server is not running. */
    var sortNote = document.getElementById('sortNote');

    function serverSort(list, by, order) {
      var result = V.sortedVehicles(by, order);
      if (!result || !result.vehicles) return null;
      var byId = {};
      list.forEach(function (v) { byId[v.id] = v; });
      var ordered = [];
      result.vehicles.forEach(function (entry) { if (byId[entry.id]) { ordered.push(byId[entry.id]); delete byId[entry.id]; } });
      list.forEach(function (v) { if (byId[v.id]) ordered.push(v); });
      if (sortNote) sortNote.textContent = result.algorithm + ' \u00b7 ' + result.comparisons + ' comparisons \u00b7 ' + result.swaps + ' swaps';
      return ordered;
    }

    function sortList(list) {
      var copy = list.slice();
      if (sortNote) sortNote.textContent = '';
      var server = null;
      if (state.sort === 'price-asc') server = serverSort(copy, 'price', 'asc');
      else if (state.sort === 'price-desc') server = serverSort(copy, 'price', 'desc');
      else if (state.sort === 'avail-asc') server = serverSort(copy, 'availability', 'asc');
      else if (state.sort === 'avail-desc') server = serverSort(copy, 'availability', 'desc');
      if (server) return server;

      if (state.sort === 'price-asc') {
        copy.sort(function (a, b) { return a.price - b.price; });
      } else if (state.sort === 'price-desc') {
        copy.sort(function (a, b) { return b.price - a.price; });
      } else if (state.sort === 'avail-asc' || state.sort === 'avail-desc') {
        var dir = state.sort === 'avail-asc' ? 1 : -1;
        copy.sort(function (a, b) {
          var ra = V.rentedUntil(a.id) ? 1 : 0, rb = V.rentedUntil(b.id) ? 1 : 0;
          return ra !== rb ? (ra - rb) * dir : a.price - b.price;
        });
      } else if (state.sort === 'rating-desc') {
        copy.sort(function (a, b) { return b.rating - a.rating; });
      } else {
        copy.sort(function (a, b) {
          if (b.rating !== a.rating) return b.rating - a.rating;
          return a.price - b.price;
        });
      }
      return copy;
    }

    function render() {
      var list = sortList(all.filter(matches));
      var cityPool = state.city ? all.filter(function (v) { return v.city === state.city; }) : all;
      resultCount.textContent = list.length;
      browseSub.textContent = cityPool.length + ' vehicles from verified owners' +
        (state.city ? ' in ' + state.city : ', across the island') + '.';

      if (!list.length) {
        grid.innerHTML = '' +
          '<div class="empty-state">' +
            '<span class="empty-state__icon">' + V.icon('search') + '</span>' +
            '<h2>No rides match those filters</h2>' +
            '<p>Try widening your price range, switching cities, or clearing a filter or two.</p>' +
            '<button class="btn btn--primary btn--sm" type="button" data-empty-reset>Reset filters</button>' +
          '</div>';
      } else {
        grid.innerHTML = list.map(function (v) { return V.vehicleCard(v); }).join('');
      }
      V.revealVisible();
    }

    function reset() {
      state.q = '';
      state.types.clear();
      state.city = '';
      state.price = priceCap;
      state.trans = '';
      state.seats = 0;
      state.sort = 'recommended';

      queryInput.value = '';
      cityFilter.value = '';
      priceFilter.value = String(priceCap);
      priceOut.textContent = V.money(priceCap) + '+';
      sortSelect.value = 'recommended';
      typeFilters.querySelectorAll('input[type="checkbox"]').forEach(function (input) { input.checked = false; });
      transFilter.querySelectorAll('button').forEach(function (btn) { btn.classList.toggle('is-active', btn.getAttribute('data-trans') === ''); });
      seatFilter.querySelectorAll('button').forEach(function (btn) { btn.classList.toggle('is-active', btn.getAttribute('data-seats') === '0'); });
      render();
    }

    /* Listeners */
    var queryTimer = null;
    queryInput.addEventListener('input', function () {
      window.clearTimeout(queryTimer);
      queryTimer = window.setTimeout(function () {
        state.q = queryInput.value.trim();
        render();
      }, 140);
    });

    typeFilters.addEventListener('change', function (event) {
      var input = event.target.closest('input[type="checkbox"]');
      if (!input) return;
      if (input.checked) state.types.add(input.value);
      else state.types.delete(input.value);
      render();
    });

    cityFilter.addEventListener('change', function () {
      state.city = cityFilter.value;
      render();
    });

    priceFilter.addEventListener('input', function () {
      state.price = Number(priceFilter.value);
      priceOut.textContent = state.price >= priceCap ? V.money(priceCap) + '+' : V.money(state.price);
      render();
    });

    transFilter.addEventListener('click', function (event) {
      var btn = event.target.closest('button[data-trans]');
      if (!btn) return;
      state.trans = btn.getAttribute('data-trans');
      transFilter.querySelectorAll('button').forEach(function (item) { item.classList.toggle('is-active', item === btn); });
      render();
    });

    seatFilter.addEventListener('click', function (event) {
      var btn = event.target.closest('button[data-seats]');
      if (!btn) return;
      state.seats = Number(btn.getAttribute('data-seats'));
      seatFilter.querySelectorAll('button').forEach(function (item) { item.classList.toggle('is-active', item === btn); });
      render();
    });

    sortSelect.addEventListener('change', function () {
      state.sort = sortSelect.value;
      render();
    });

    resetBtn.addEventListener('click', reset);

    grid.addEventListener('click', function (event) {
      if (event.target.closest('[data-empty-reset]')) reset();
    });

    /* Mobile filter drawer */
    function openFilters() {
      filters.classList.add('is-open');
      backdrop.classList.add('is-open');
      document.body.classList.add('no-scroll');
    }
    function closeFilters() {
      filters.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
    }

    if (openFiltersBtn) openFiltersBtn.addEventListener('click', openFilters);
    if (closeFiltersBtn) closeFiltersBtn.addEventListener('click', closeFilters);
    if (backdrop) backdrop.addEventListener('click', closeFilters);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeFilters();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 980) closeFilters();
    });

    render();
  });
})();
