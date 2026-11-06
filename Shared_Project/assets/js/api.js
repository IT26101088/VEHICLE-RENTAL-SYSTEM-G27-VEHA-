/* Optional VEHA Java API client. Include after data.js when wiring pages to backend. */
window.VehaAPI = (function () {
  'use strict';
  var base = '/api/';
  function request(path, method, record) {
    var options = { method: method || 'GET', headers: {} };
    if (record !== undefined) { options.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8'; options.body = new URLSearchParams({ record: record }).toString(); }
    return fetch(base + path, options).then(function (r) { return r.json().then(function (data) { if (!r.ok) throw new Error(data.error || 'Request failed'); return data; }); });
  }
  return { list: function (name) { return request(name); }, create: function (name, record) { return request(name, 'POST', record); }, update: function (name, id, record) { return request(name + '/' + encodeURIComponent(id), 'PUT', record); }, remove: function (name, id) { return request(name + '/' + encodeURIComponent(id), 'DELETE'); }, report: function () { return request('report'); } };
}());
