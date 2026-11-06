(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var V = window.Veha;
    var vehicles = V.getVehicles();

    /* Hero search defaults */
    var typeSelect = document.getElementById('sType');
    var citySelect = document.getElementById('sCity');
    var pickupInput = document.getElementById('sPickup');
    var returnInput = document.getElementById('sReturn');
    var searchForm = document.getElementById('searchForm');

    V.TYPES.forEach(function (type) {
      var option = document.createElement('option');
      option.value = type.id;
      option.textContent = type.name;
      typeSelect.appendChild(option);
    });

    V.cities().forEach(function (city) {
      var option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });

    var today = V.todayISO();
    pickupInput.min = today;
    returnInput.min = today;
    pickupInput.value = V.offsetISO(1);
    returnInput.value = V.offsetISO(4);

    pickupInput.addEventListener('change', function () {
      if (!pickupInput.value) return;
      returnInput.min = pickupInput.value;
      if (!returnInput.value || returnInput.value <= pickupInput.value) {
        var next = new Date(pickupInput.value + 'T12:00:00');
        next.setDate(next.getDate() + 3);
        returnInput.value = next.getFullYear() + '-' + String(next.getMonth() + 1).padStart(2, '0') + '-' + String(next.getDate()).padStart(2, '0');
      }
    });

    searchForm.addEventListener('submit', function (event) {
      if (!pickupInput.value || !returnInput.value) {
        event.preventDefault();
        V.toast('Choose your pick-up and return dates.', 'error');
        return;
      }
      if (returnInput.value <= pickupInput.value) {
        event.preventDefault();
        V.toast('Return date must be after pick-up.', 'error');
      }
    });

    /* Stats */
    var statVehicles = document.querySelector('[data-stat-vehicles]');
    var statCities = document.querySelector('[data-stat-cities]');
    if (statVehicles) statVehicles.textContent = vehicles.length;
    if (statCities) statCities.textContent = V.cities().length;

    /* Categories */
    var catGrid = document.querySelector('[data-categories]');
    if (catGrid) {
      catGrid.innerHTML = V.TYPES.map(function (type) {
        var matching = vehicles.filter(function (v) { return v.type === type.id; });
        if (!matching.length) return '';
        var from = Math.min.apply(null, matching.map(function (v) { return v.price; }));
        var label = matching.length === 1 ? '1 vehicle' : matching.length + ' vehicles';
        return '' +
          '<a class="cat-card reveal" href="vehicles.html?type=' + type.id + '">' +
            '<div class="cat-card__img"><img src="' + type.image + '" alt="' + V.esc(type.name) + '" loading="lazy"></div>' +
            '<div class="cat-card__body">' +
              '<div><h3>' + V.esc(type.name) + '</h3><p>From ' + V.money(from) + ' / day · ' + label + '</p></div>' +
              '<span class="cat-card__go" aria-hidden="true">' + V.icon('arrow') + '</span>' +
            '</div>' +
          '</a>';
      }).join('');
    }

    /* Featured vehicles */
    var featuredGrid = document.querySelector('[data-featured]');
    if (featuredGrid) {
      var ids = ['v1', 'v2', 'v4', 'v8', 'v7', 'v10'];
      var featured = ids.map(function (id) {
        return vehicles.filter(function (v) { return v.id === id; })[0];
      }).filter(Boolean);
      featuredGrid.innerHTML = featured.map(function (v) {
        return V.vehicleCard(v);
      }).join('');
    }

    V.revealVisible();
  });
})();
