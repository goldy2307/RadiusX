/* ================================================================
   RadiusX -- main.js
   ================================================================ */


/* -- scroll shadow -- */
window.addEventListener("scroll", function () {
  var h = document.querySelector(".header-wrapper");
  if (window.scrollY > 20) h.style.boxShadow = "0px 4px 14px rgb(0,0,0)";
  else                      h.style.boxShadow = "none";
});


/* ================================================================
   THEME TOGGLE
   ================================================================ */

function toggleTheme() {
  var body    = document.body;
  var sun     = document.getElementById("themeIconSun");
  var moon    = document.getElementById("themeIconMoon");
  var isLight = body.classList.toggle("light-mode");

  var logoSrc = isLight ? "assets/logo/logo-light.png" : "assets/logo/logo.png";
  document.querySelectorAll(".logo img, .footer img").forEach(function (img) {
    img.src = logoSrc;
  });

  if (isLight) {
    sun.style.display  = "none";
    moon.style.display = "";
    localStorage.setItem("rx_theme", "light");
  } else {
    sun.style.display  = "";
    moon.style.display = "none";
    localStorage.setItem("rx_theme", "dark");
  }

  initBannerSlider();
}

(function () {
  if (localStorage.getItem("rx_theme") === "light") {
    document.body.classList.add("light-mode");
  }
})();

/* -- boot -- */
window.onload = function () {
  if (document.body.classList.contains("light-mode")) {
    document.querySelectorAll(".logo img, .footer img").forEach(function (img) {
      img.src = "assets/logo/logo-light.png";
    });
    var sun  = document.getElementById("themeIconSun");
    var moon = document.getElementById("themeIconMoon");
    if (sun)  sun.style.display  = "none";
    if (moon) moon.style.display = "";
  }
  detectLocation();
  generateProducts();
  checkUserLogin();
  initBannerSlider();
};


/* ================================================================
   GEOLOCATION
   ================================================================ */

var userLat = null;
var userLon = null;
window.rxUserAddress = null;

/* ================================================================
   ADDRESS DROPDOWN
   ================================================================ */

function openAddrDropdown() {
  var box = document.getElementById("locationBox");
  box.classList.add("open");
  renderSavedAddresses();
  setTimeout(function () {
    document.addEventListener("click", outsideAddrClose);
  }, 10);
}

function closeAddrDropdown(e) {
  if (e) e.stopPropagation();
  var box = document.getElementById("locationBox");
  box.classList.remove("open");
  document.removeEventListener("click", outsideAddrClose);
}

function outsideAddrClose(e) {
  var box = document.getElementById("locationBox");
  if (box && !box.contains(e.target)) closeAddrDropdown();
}

document.addEventListener("DOMContentLoaded", function () {
  var box = document.getElementById("locationBox");
  box.addEventListener("click", function (e) {
    if (e.target.closest(".addr-dropdown") && !e.target.closest(".addr-dd-header")) return;
    if (box.classList.contains("open")) closeAddrDropdown();
    else openAddrDropdown();
  });
});

/* ================================================================
   SAVED ADDRESSES -- localStorage CRUD
   ================================================================ */

function getSavedAddresses() {
  try { return JSON.parse(localStorage.getItem("rx_saved_addresses") || "[]"); }
  catch(e) { return []; }
}

function saveAddresses(list) {
  localStorage.setItem("rx_saved_addresses", JSON.stringify(list));
}

function getActiveAddrId() {
  return localStorage.getItem("rx_active_addr_id") || null;
}

function setActiveAddrId(id) {
  localStorage.setItem("rx_active_addr_id", id);
}

function renderSavedAddresses() {
  var list     = getSavedAddresses();
  var el       = document.getElementById("savedAddrList");
  var label    = document.getElementById("savedAddrLabel");
  var activeId = getActiveAddrId();

  if (!list.length) {
    el.innerHTML = '<div class="addr-no-saved">No saved addresses yet</div>';
    label.style.display = "none";
    return;
  }

  label.style.display = "block";
  el.innerHTML = "";

  list.forEach(function (addr) {
    var isActive = (addr.id === activeId);
    var line1 = [addr.house, addr.street].filter(Boolean).join(", ");
    var line2 = [addr.colony, addr.city, addr.pin].filter(Boolean).join(", ");
    var displayLine = line1 || line2;

    var card = document.createElement("div");
    card.className = "addr-saved-card" + (isActive ? " active-addr" : "");
    card.innerHTML =
      '<div class="addr-card-icon"><i class="fa-solid ' + (isActive ? "fa-circle-check" : "fa-house") + '"></i></div>' +
      '<div class="addr-card-body">' +
        '<div class="addr-card-name">' + (addr.name || "Address") + '</div>' +
        '<div class="addr-card-line">' + displayLine + '</div>' +
        '<div class="addr-card-actions">' +
          '<button class="addr-card-del" onclick="deleteAddr(\'' + addr.id + '\',event)"><i class="fa-solid fa-trash-can"></i> Delete</button>' +
        '</div>' +
      '</div>' +
      (isActive ? '<span class="addr-active-badge">Delivering here</span>' : '');

    card.addEventListener("click", function (e) {
      if (e.target.closest(".addr-card-del")) return;
      selectSavedAddress(addr);
    });

    el.appendChild(card);
  });
}

function selectSavedAddress(addr) {
  setActiveAddrId(addr.id);
  var parts = [];
  if (addr.colony) parts.push(addr.colony);
  if (addr.city   && addr.city   !== addr.colony) parts.push(addr.city);
  if (addr.state  && addr.state  !== addr.city)   parts.push(addr.state);
  var label = parts.join(", ");
  if (addr.pin) label = label + " - " + addr.pin;
  document.getElementById("locationText").innerText = label || addr.name || "Saved Address";
  setShopsCity(addr.city || addr.colony || "your area");
  window.rxUserAddress = addr;
  localStorage.setItem("rx_full_address", JSON.stringify(addr));
  closeAddrDropdown();
}

function deleteAddr(id, e) {
  e.stopPropagation();
  var list = getSavedAddresses().filter(function (a) { return a.id !== id; });
  saveAddresses(list);
  if (getActiveAddrId() === id) localStorage.removeItem("rx_active_addr_id");
  renderSavedAddresses();
}

/* ================================================================
   MANUAL ADDRESS FORM
   ================================================================ */

function showAddrForm(e) {
  e.stopPropagation();
  document.getElementById("addrFormWrap").classList.add("visible");
  document.getElementById("af-name").focus();
  document.querySelector(".addr-add-btn").style.display = "none";
}

function hideAddrForm(e) {
  if (e) e.stopPropagation();
  document.getElementById("addrFormWrap").classList.remove("visible");
  document.querySelector(".addr-add-btn").style.display = "";
  ["af-name","af-phone","af-house","af-street","af-colony","af-city","af-state","af-pin"]
    .forEach(function(id){ var el=document.getElementById(id); el.value=""; el.classList.remove("error"); });
  var lbl = document.getElementById("addrFormLabel");
  lbl.style.display = "none";
  lbl.className = "addr-form-row-label";
}

function saveManualAddress(e) {
  e.stopPropagation();
  var name   = document.getElementById("af-name").value.trim();
  var phone  = document.getElementById("af-phone").value.trim();
  var house  = document.getElementById("af-house").value.trim();
  var street = document.getElementById("af-street").value.trim();
  var colony = document.getElementById("af-colony").value.trim();
  var city   = document.getElementById("af-city").value.trim();
  var state  = document.getElementById("af-state").value.trim();
  var pin    = document.getElementById("af-pin").value.trim();

  ["af-name","af-phone","af-house","af-street","af-colony","af-city","af-state","af-pin"]
    .forEach(function(id){ document.getElementById(id).classList.remove("error"); });

  var errors = [];
  if (!name)                        errors.push("af-name");
  if (!city)                        errors.push("af-city");
  if (!pin || !/^\d{6}$/.test(pin)) errors.push("af-pin");

  if (errors.length) {
    errors.forEach(function(id){ document.getElementById(id).classList.add("error"); });
    var lbl = document.getElementById("addrFormLabel");
    lbl.textContent = "Please fill Name, City and a valid 6-digit Pincode.";
    lbl.className = "addr-form-row-label err";
    lbl.style.display = "block";
    return;
  }

  var newAddr = {
    id: "addr_" + Date.now(), name: name, phone: phone,
    house: house, street: street, colony: colony,
    city: city, state: state, pin: pin,
    source: "manual", lat: userLat || 0, lon: userLon || 0
  };

  var list = getSavedAddresses();
  list.push(newAddr);
  saveAddresses(list);
  selectSavedAddress(newAddr);
  hideAddrForm(null);
  renderSavedAddresses();
}

/* ================================================================
   GPS DETECT
   ================================================================ */

function triggerGPS(e) {
  if (e) e.stopPropagation();
  detectLocation();
}

async function detectLocation() {
  var el = document.getElementById("locationText");
  el.innerText = "Detecting...";

  document.getElementById("gpsCardDivider").style.display = "";
  document.getElementById("addrCurrentCard").style.display = "";

  var cached = localStorage.getItem("rx_full_address");
  if (cached) {
    try { applyAddress(JSON.parse(cached), false); } catch (e) {}
  }

  if (!navigator.geolocation) { await ipFallback(); return; }

  navigator.geolocation.getCurrentPosition(
    async function (pos) {
      userLat = pos.coords.latitude;
      userLon = pos.coords.longitude;
      var ok = await geocodeNominatim(userLat, userLon);
      if (!ok) await geocodeBigData(userLat, userLon);
      loadNearbyShops(userLat, userLon);
    },
    async function () { await ipFallback(); },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

function isRoadCode(s) {
  if (!s) return false;
  return /^[A-Z]{1,3}[-\s]?[0-9]{1,5}$/i.test(s.trim());
}

function firstLocality() {
  for (var i = 0; i < arguments.length; i++) {
    var v = arguments[i];
    if (v && !isRoadCode(v)) return v;
  }
  return "";
}

function buildAddr(a, lat, lon, source) {
  var colony = firstLocality(a.neighbourhood, a.quarter, a.hamlet, a.residential, a.village, a.suburb);
  var area = "";
  if (a.suburb && a.suburb !== colony && !isRoadCode(a.suburb)) area = a.suburb;
  var road = "";
  var roadCandidates = [a.road, a.pedestrian, a.footway, a.path, a.street];
  for (var j = 0; j < roadCandidates.length; j++) {
    if (roadCandidates[j] && !isRoadCode(roadCandidates[j])) { road = roadCandidates[j]; break; }
  }
  return {
    houseNo: a["addr:housenumber"] || a.house_number || "",
    road: road, colony: colony, area: area,
    city: a.city || a.town || a.municipality || a.city_district || "",
    district: a.county || a.state_district || "",
    state: a.state || "", postcode: a.postcode || "",
    country: a.country || "", cc: (a.country_code || "").toUpperCase(),
    lat: lat, lon: lon, source: source || "gps"
  };
}

function navLabel(addr) {
  var parts = [];
  if (addr.colony) parts.push(addr.colony);
  var city = addr.city || addr.district || "";
  if (city && city !== addr.colony) parts.push(city);
  if (addr.state && addr.state !== city) parts.push(addr.state);
  var label = parts.join(", ");
  if (addr.postcode) label = label + " - " + addr.postcode;
  return label || "Location found";
}

function applyAddress(addr, save) {
  if (save === undefined) save = true;
  document.getElementById("locationText").innerText = navLabel(addr);
  setShopsCity(addr.city || addr.district || addr.colony || addr.state || "your area");
  window.rxUserAddress = addr;
  renderAddrCard(addr);
  if (save) localStorage.setItem("rx_full_address", JSON.stringify(addr));
}

function renderAddrCard(addr) {
  var body = document.getElementById("lfcBody");
  if (!body) return;
  var isGPS = (addr.source === "gps" || addr.source === "gps-backup");
  var srcBadge = isGPS
    ? '<span class="lfc-source gps"><i class="fa-solid fa-satellite-dish"></i> GPS</span>'
    : '<span class="lfc-source ip"><i class="fa-solid fa-wifi"></i> IP</span>';
  var street   = [addr.houseNo, addr.road].filter(Boolean).join(", ");
  var cityLine = [addr.city || addr.district, addr.state].filter(Boolean).join(", ");
  var rows = [];
  if (addr.colony)                          rows.push(addrRow("fa-house-flag",   addr.colony));
  if (addr.area && addr.area !== addr.colony) rows.push(addrRow("fa-location-dot", addr.area));
  if (street)                               rows.push(addrRow("fa-road",         street));
  if (cityLine)                             rows.push(addrRow("fa-city",         cityLine));
  if (addr.postcode)                        rows.push(addrRow("fa-envelope",     addr.postcode));
  if (addr.country)                         rows.push(addrRow("fa-globe",        addr.country + (addr.cc ? " (" + addr.cc + ")" : "")));
  if (!rows.length) rows.push('<div class="lfc-row"><span class="lfc-value empty">Address unavailable</span></div>');
  body.innerHTML = rows.join("") + '<div class="lfc-coords">' + addr.lat.toFixed(6) + ", " + addr.lon.toFixed(6) + " " + srcBadge + "</div>";
}

function addrRow(icon, text) {
  return '<div class="lfc-row"><i class="fa-solid ' + icon + ' lfc-icon"></i><span class="lfc-value">' + text + '</span></div>';
}

/* ================================================================
   GEOCODING -- 5-layer
   ================================================================ */

function extractLocality(a) {
  if (!a) return "";
  var candidates = [a.neighbourhood, a.quarter, a.hamlet, a.residential, a.village, a.suburb, a.city_district, a.town];
  for (var i = 0; i < candidates.length; i++) {
    var v = candidates[i];
    if (v && !isRoadCode(v) && v.length > 2) return v;
  }
  return "";
}

async function geocodeNominatim(lat, lon) {
  try {
    var base = "https://nominatim.openstreetmap.org/reverse?lat=" + lat + "&lon=" + lon + "&format=json&addressdetails=1";
    var hdrs = { headers: { "Accept-Language": "en-US,en;q=0.9" } };
    var results = await Promise.allSettled([
      fetchTO(base + "&zoom=14", hdrs, 8000).then(function(r){ return r.json(); }),
      fetchTO(base + "&zoom=18", hdrs, 8000).then(function(r){ return r.json(); })
    ]);
    var a14 = (results[0].status === "fulfilled" && results[0].value && results[0].value.address) ? results[0].value.address : null;
    var a18 = (results[1].status === "fulfilled" && results[1].value && results[1].value.address) ? results[1].value.address : null;
    if (!a14 && !a18) return false;
    var merged = Object.assign({}, a14 || a18);
    if (a18) {
      if (a18.road && !isRoadCode(a18.road))         merged.road          = a18.road;
      if (a18["addr:housenumber"])                    merged["addr:housenumber"] = a18["addr:housenumber"];
      if (!merged.neighbourhood && a18.neighbourhood) merged.neighbourhood = a18.neighbourhood;
      if (a18.suburb && !merged.neighbourhood)        merged.suburb        = a18.suburb;
    }
    var addr = buildAddr(merged, lat, lon, "gps");
    if (!addr.colony) {
      var bdcOk = await geocodeBigData(lat, lon);
      if (bdcOk) return true;
    }
    applyAddress(addr);
    if (addr.postcode && addr.postcode.length === 6) enrichWithIndiaPost(addr);
    return true;
  } catch (e) { return false; }
}

async function enrichWithIndiaPost(addr) {
  try {
    var res  = await fetchTO("https://api.postalpincode.in/pincode/" + addr.postcode, {}, 6000);
    var data = await res.json();
    if (!data || !data[0] || data[0].Status !== "Success") return;
    var posts = data[0].PostOffice || [];
    if (!posts.length) return;
    var updated = Object.assign({}, addr);
    if (!updated.colony) {
      var block = posts[0].Block || posts[0].Name || "";
      if (block && block !== "NA" && block !== updated.city) updated.colony = block;
    }
    if (!updated.district && posts[0].District) updated.district = posts[0].District;
    if (!updated.state    && posts[0].State)    updated.state    = posts[0].State;
    if (!updated.city     && posts[0].Division) updated.city     = posts[0].Division;
    applyAddress(updated);
  } catch (e) {}
}

async function geocodeBigData(lat, lon) {
  try {
    var url = "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" + lat + "&longitude=" + lon + "&localityLanguage=en";
    var res = await fetchTO(url, {}, 8000);
    if (!res.ok) return false;
    var d   = await res.json();
    var adm = (d.localityInfo && d.localityInfo.administrative) || [];
    var inf = (d.localityInfo && d.localityInfo.informational)  || [];
    var colony = "";
    for (var i = inf.length - 1; i >= 0; i--) {
      if (inf[i].name && !isRoadCode(inf[i].name) && inf[i].name.length > 2) { colony = inf[i].name; break; }
    }
    if (!colony) {
      colony = d.locality || (adm[5] && adm[5].name) || (adm[4] && adm[4].name) || "";
      if (isRoadCode(colony)) colony = "";
    }
    var city  = d.city || (adm[3] && adm[3].name) || (adm[2] && adm[2].name) || "";
    var state = d.principalSubdivision || (adm[1] && adm[1].name) || "";
    var addr  = {
      houseNo: "", road: "", colony: colony, area: "", city: city,
      district: (adm[2] && adm[2].name) || "", state: state,
      postcode: d.postcode || "", country: d.countryName || "",
      cc: (d.countryCode || "").toUpperCase(), lat: lat, lon: lon, source: "gps-backup"
    };
    applyAddress(addr);
    if (addr.postcode && addr.postcode.length === 6) enrichWithIndiaPost(addr);
    return true;
  } catch (e) {
    document.getElementById("locationText").innerText = lat.toFixed(4) + ", " + lon.toFixed(4);
    setShopsCity("your area");
    return false;
  }
}

async function ipFallback() {
  var el = document.getElementById("locationText");
  try {
    var res  = await fetchTO("http://ip-api.com/json/?fields=status,city,regionName,district,zip,country,countryCode,lat,lon", {}, 6000);
    var data = await res.json();
    if (data.status === "success") {
      userLat = parseFloat(data.lat); userLon = parseFloat(data.lon);
      var addr = {
        houseNo: "", road: "", colony: "", area: "",
        city: data.city || "", district: data.district || data.regionName || "",
        state: data.regionName || "", postcode: data.zip || "",
        country: data.country || "", cc: (data.countryCode || "").toUpperCase(),
        lat: userLat, lon: userLon, source: "ip"
      };
      applyAddress(addr);
      if (userLat && userLon) loadNearbyShops(userLat, userLon);
      if (addr.postcode && addr.postcode.length === 6) enrichWithIndiaPost(addr);
      return;
    }
  } catch (e) {}
  try {
    var res2  = await fetchTO("https://ipwho.is/", {}, 6000);
    var data2 = await res2.json();
    if (data2.success !== false) {
      userLat = parseFloat(data2.latitude); userLon = parseFloat(data2.longitude);
      var addr2 = {
        houseNo: "", road: "", colony: "", area: "",
        city: data2.city || "", district: data2.region || "",
        state: data2.region || "", postcode: data2.postal || "",
        country: data2.country || "", cc: (data2.country_code || "").toUpperCase(),
        lat: userLat, lon: userLon, source: "ip-fallback"
      };
      applyAddress(addr2);
      if (userLat && userLon) loadNearbyShops(userLat, userLon);
      if (addr2.postcode && addr2.postcode.length === 6) enrichWithIndiaPost(addr2);
      return;
    }
  } catch (e) {}
  el.innerText = "Location unavailable";
  showShopsError("Could not detect your location. Please allow location access.");
}

function fetchTO(url, opts, ms) {
  var ctrl  = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, ms);
  return fetch(url, Object.assign({}, opts || {}, { signal: ctrl.signal }))
         .finally(function () { clearTimeout(timer); });
}

function setShopsCity(city) {
  var el   = document.getElementById("shopsCity");
  var pill = document.getElementById("shopsLocationPill");
  if (el)   el.innerText       = city;
  if (pill) pill.style.display = "inline-flex";
}


/* ================================================================
   NEARBY SHOPS
   ================================================================ */

var SHOP_EMOJI_UNICODE = {
  supermarket:"\uD83D\uDED2", convenience:"\uD83C\uDFEA", electronics:"\uD83D\uDDA5\uFE0F",
  clothes:"\uD83D\uDC57",     mobile_phone:"\uD83D\uDCF1", shoes:"\uD83D\uDC5F",
  furniture:"\uD83D\uDECB\uFE0F", hardware:"\uD83D\uDD27", bakery:"\uD83E\uDD50",
  butcher:"\uD83E\uDD69",     pharmacy:"\uD83D\uDC8A",    books:"\uD83D\uDCDA",
  jewelry:"\uD83D\uDC8D",     sports:"\uD83C\uDFCF",      toys:"\uD83E\uDE80",
  bicycle:"\uD83D\uDEB4",     optician:"\uD83D\uDC53",    cosmetics:"\uD83D\uDC84",
  hairdresser:"\u2702\uFE0F", beauty:"\uD83D\uDC85",      department_store:"\uD83C\uDFEC",
  mall:"\uD83C\uDFEC",        marketplace:"\uD83C\uDFEA", general:"\uD83D\uDECD\uFE0F",
  car_repair:"\uD83D\uDD27",  florist:"\uD83C\uDF38",     pet:"\uD83D\uDC3E",
  restaurant:"\uD83C\uDF7D\uFE0F", cafe:"\u2615",         bank:"\uD83C\uDFE6",
  hospital:"\uD83C\uDFE5",    school:"\uD83C\uDFEB",      gym:"\uD83D\uDCAA",
  cinema:"\uD83C\uDFAC"
};

/* ---- Per-type gradient + SVG icon for beautiful fallback covers ---- */
var SHOP_COVER_STYLE = {
  supermarket:    { g: ["#f7971e","#ffd200"], icon: '<path d="M8 20h16l-2-10H10L8 20zm0 0H5m19 0h3M10 20v2m8-2v2" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/><rect x="11" y="13" width="3" height="4" rx="0.5" fill="rgba(255,255,255,0.5)"/><rect x="16" y="13" width="3" height="4" rx="0.5" fill="rgba(255,255,255,0.5)"/>' },
  convenience:    { g: ["#f953c6","#b91d73"], icon: '<rect x="5" y="12" width="22" height="12" rx="2" fill="rgba(255,255,255,0.2)"/><path d="M5 12l4-7h14l4 7" stroke="#fff" stroke-width="1.8" fill="none" stroke-linejoin="round"/><rect x="13" y="16" width="6" height="8" rx="1" fill="rgba(255,255,255,0.45)"/>' },
  electronics:    { g: ["#4776e6","#8e54e9"], icon: '<rect x="4" y="8" width="24" height="16" rx="2" stroke="#fff" stroke-width="1.8" fill="rgba(255,255,255,0.15)"/><rect x="12" y="24" width="8" height="3" rx="1" fill="rgba(255,255,255,0.4)"/><circle cx="16" cy="16" r="4" fill="rgba(255,255,255,0.5)"/>' },
  clothes:        { g: ["#c471ed","#f64f59"], icon: '<path d="M4 10l5-5 3 3 4 0 3-3 5 5-3 2v11H7V12L4 10z" fill="rgba(255,255,255,0.25)" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>' },
  mobile_phone:   { g: ["#00b4db","#0083b0"], icon: '<rect x="9" y="4" width="14" height="24" rx="3" fill="rgba(255,255,255,0.2)" stroke="#fff" stroke-width="1.8"/><rect x="11" y="7" width="10" height="16" rx="1.5" fill="rgba(255,255,255,0.35)"/><circle cx="16" cy="25" r="1.2" fill="white"/>' },
  shoes:          { g: ["#f7971e","#e05d5d"], icon: '<path d="M4 22c0 0 2-8 5-10 2-1.5 4-1 6 0l7 4c1.5 1 2 2 2 3H4z" fill="rgba(255,255,255,0.25)" stroke="#fff" stroke-width="1.6"/><path d="M6 22c2-1 4-1 6 0" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>' },
  furniture:      { g: ["#834d9b","#d04ed6"], icon: '<rect x="5" y="14" width="22" height="6" rx="2" fill="rgba(255,255,255,0.3)"/><rect x="7" y="20" width="3" height="5" rx="1" fill="rgba(255,255,255,0.4)"/><rect x="22" y="20" width="3" height="5" rx="1" fill="rgba(255,255,255,0.4)"/><rect x="8" y="8" width="16" height="7" rx="1.5" fill="rgba(255,255,255,0.2)" stroke="#fff" stroke-width="1.4"/>' },
  hardware:       { g: ["#636363","#a2ab58"], icon: '<path d="M8 24L20 8" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="21" cy="9" r="4" fill="rgba(255,255,255,0.35)" stroke="#fff" stroke-width="1.6"/><circle cx="9" cy="23" r="3" fill="rgba(255,255,255,0.35)" stroke="#fff" stroke-width="1.6"/>' },
  bakery:         { g: ["#f7971e","#f45c43"], icon: '<ellipse cx="16" cy="18" rx="10" ry="7" fill="rgba(255,255,255,0.2)" stroke="#fff" stroke-width="1.8"/><path d="M9 16 Q16 8 23 16" stroke="#fff" stroke-width="1.6" fill="none"/><circle cx="13" cy="19" r="1.5" fill="rgba(255,255,255,0.6)"/><circle cx="19" cy="19" r="1.5" fill="rgba(255,255,255,0.6)"/>' },
  pharmacy:       { g: ["#11998e","#38ef7d"], icon: '<rect x="13" y="7" width="6" height="18" rx="2" fill="rgba(255,255,255,0.4)"/><rect x="7" y="13" width="18" height="6" rx="2" fill="rgba(255,255,255,0.4)"/>' },
  books:          { g: ["#1a1a2e","#16213e"], icon: '<rect x="5" y="6" width="7" height="20" rx="1" fill="rgba(255,255,255,0.3)"/><rect x="14" y="6" width="7" height="20" rx="1" fill="rgba(255,255,255,0.2)"/><rect x="9" y="9" width="5" height="20" rx="1" fill="rgba(255,255,255,0.4)" transform="rotate(-5 9 9)"/>' },
  jewelry:        { g: ["#b06ab3","#4568dc"], icon: '<path d="M8 12l8-7 8 7-8 13-8-13z" fill="rgba(255,255,255,0.2)" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 12h16M12 12l4-7 4 7" stroke="#fff" stroke-width="1.3" fill="none"/>' },
  sports:         { g: ["#00c6ff","#0072ff"], icon: '<circle cx="16" cy="16" r="10" stroke="#fff" stroke-width="1.8" fill="rgba(255,255,255,0.15)"/><path d="M6 16 Q11 10 16 16 Q21 22 26 16" stroke="#fff" stroke-width="1.4" fill="none"/><path d="M16 6 Q10 11 16 16 Q22 21 16 26" stroke="#fff" stroke-width="1.4" fill="none"/>' },
  cosmetics:      { g: ["#e96c9a","#c86dd8"], icon: '<rect x="12" y="5" width="8" height="16" rx="3" fill="rgba(255,255,255,0.25)" stroke="#fff" stroke-width="1.6"/><ellipse cx="16" cy="5" rx="4" ry="2" fill="rgba(255,255,255,0.4)"/><rect x="14" y="21" width="4" height="5" rx="1" fill="rgba(255,255,255,0.3)"/>' },
  hairdresser:    { g: ["#ee9ca7","#ffdde1"], icon: '<path d="M10 8 Q16 4 22 8 L22 20 Q16 24 10 20 Z" fill="rgba(255,255,255,0.15)" stroke="#fff" stroke-width="1.5"/><circle cx="13" cy="12" r="2" fill="rgba(255,255,255,0.5)"/><circle cx="19" cy="12" r="2" fill="rgba(255,255,255,0.5)"/><path d="M13 14 Q16 20 19 14" stroke="#fff" stroke-width="1.4" fill="none"/>' },
  restaurant:     { g: ["#f12711","#f5af19"], icon: '<path d="M10 6v8a4 4 0 004 4v8" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><path d="M14 6v20" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><path d="M22 6c0 0 0 8-4 8" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>' },
  cafe:           { g: ["#4e342e","#a1887f"], icon: '<path d="M7 12h14v10a3 3 0 01-3 3H10a3 3 0 01-3-3V12z" fill="rgba(255,255,255,0.2)" stroke="#fff" stroke-width="1.6"/><path d="M21 14h2a2 2 0 010 4h-2" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M11 8 Q13 4 15 8" stroke="#fff" stroke-width="1.4" fill="none"/>' },
  florist:        { g: ["#f953c6","#7fd173"], icon: '<circle cx="16" cy="14" r="4" fill="rgba(255,255,255,0.35)"/><circle cx="10" cy="12" r="3" fill="rgba(255,255,255,0.25)"/><circle cx="22" cy="12" r="3" fill="rgba(255,255,255,0.25)"/><circle cx="16" cy="8" r="3" fill="rgba(255,255,255,0.25)"/><path d="M16 18v8" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>' },
  pet:            { g: ["#f7971e","#c471ed"], icon: '<circle cx="12" cy="10" r="3" fill="rgba(255,255,255,0.35)"/><circle cx="20" cy="10" r="3" fill="rgba(255,255,255,0.35)"/><ellipse cx="16" cy="18" rx="7" ry="6" fill="rgba(255,255,255,0.2)" stroke="#fff" stroke-width="1.6"/><circle cx="13" cy="17" r="1.2" fill="#fff" opacity="0.7"/><circle cx="19" cy="17" r="1.2" fill="#fff" opacity="0.7"/>' },
  bank:           { g: ["#2c3e50","#4ca1af"], icon: '<rect x="5" y="14" width="22" height="12" rx="1" fill="rgba(255,255,255,0.2)" stroke="#fff" stroke-width="1.5"/><path d="M5 14l11-9 11 9" fill="rgba(255,255,255,0.25)" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><rect x="9" y="18" width="3" height="8" fill="rgba(255,255,255,0.45)"/><rect x="15" y="18" width="3" height="8" fill="rgba(255,255,255,0.45)"/><rect x="21" y="18" width="3" height="8" fill="rgba(255,255,255,0.45)"/>' },
  gym:            { g: ["#1a1a2e","#16213e"], icon: '<rect x="3" y="14" width="4" height="5" rx="1" fill="rgba(255,255,255,0.4)"/><rect x="25" y="14" width="4" height="5" rx="1" fill="rgba(255,255,255,0.4)"/><rect x="7" y="12" width="4" height="9" rx="1" fill="rgba(255,255,255,0.3)"/><rect x="21" y="12" width="4" height="9" rx="1" fill="rgba(255,255,255,0.3)"/><rect x="11" y="15" width="10" height="3" rx="1.5" fill="rgba(255,255,255,0.5)"/>' },
  general:        { g: ["#373b44","#4286f4"], icon: '<rect x="5" y="13" width="22" height="14" rx="2" fill="rgba(255,255,255,0.18)" stroke="#fff" stroke-width="1.6"/><path d="M3 13l5-8h18l5 8" stroke="#fff" stroke-width="1.6" fill="rgba(255,255,255,0.12)" stroke-linejoin="round"/><rect x="13" y="18" width="6" height="9" rx="1" fill="rgba(255,255,255,0.4)"/>' }
};

function shopCoverSVG(type) {
  var s = SHOP_COVER_STYLE[type] || SHOP_COVER_STYLE["general"];
  var g1 = s.g[0], g2 = s.g[1];
  var uid = "sg_" + Math.random().toString(36).slice(2, 8);
  return '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid slice">' +
    '<defs><linearGradient id="' + uid + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
    '<stop offset="0%" stop-color="' + g1 + '"/><stop offset="100%" stop-color="' + g2 + '"/></linearGradient></defs>' +
    '<rect width="32" height="32" fill="url(#' + uid + ')"/>' +
    '<g opacity="0.18"><rect width="32" height="32" fill="none" stroke="white" stroke-width="0.4" style="stroke-dasharray:4 4"/></g>' +
    s.icon +
    '</svg>';
}

var SHOP_LABEL = {
  supermarket:"Supermarket",      convenience:"Convenience Store",
  electronics:"Electronics",      clothes:"Fashion & Clothing",
  mobile_phone:"Mobile Phones",   shoes:"Footwear",
  furniture:"Furniture",          hardware:"Hardware Store",
  bakery:"Bakery",                butcher:"Butcher",
  pharmacy:"Pharmacy",            books:"Books & Stationery",
  jewelry:"Jewellery",            sports:"Sports & Fitness",
  toys:"Toys & Games",            bicycle:"Bicycle Shop",
  optician:"Optician",            cosmetics:"Cosmetics",
  hairdresser:"Salon",            beauty:"Beauty & Wellness",
  department_store:"Department Store", mall:"Shopping Mall",
  marketplace:"Marketplace",      general:"General Store",
  car_repair:"Auto Repair",       florist:"Florist",
  pet:"Pet Store",                restaurant:"Restaurant",
  cafe:"Cafe",                    bank:"Bank",
  hospital:"Hospital",            school:"School",
  gym:"Gym",                      cinema:"Cinema"
};

async function loadNearbyShops(lat, lon) {
  var loading = document.getElementById("shopsLoading");
  var errorEl = document.getElementById("shopsError");
  var wrap    = document.getElementById("shopsScrollWrap");
  var grid    = document.getElementById("shopsGrid");
  loading.classList.remove("hidden");
  errorEl.classList.add("hidden");
  wrap.classList.add("hidden");
  grid.innerHTML = "";
  try {
    var r = 1500;
    var q = "[out:json][timeout:20];\n(\n" +
            "node[\"shop\"](around:" + r + "," + lat + "," + lon + ");\n" +
            "way[\"shop\"](around:"  + r + "," + lat + "," + lon + ");\n" +
            "node[\"amenity\"~\"marketplace|mall\"](around:" + r + "," + lat + "," + lon + ");\n" +
            ");\nout center 40;";
    var eps = ["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
    var data = null;
    for (var i = 0; i < eps.length; i++) {
      try {
        var res = await fetchTO(eps[i] + "?data=" + encodeURIComponent(q), {}, 18000);
        data = await res.json();
        if (data && data.elements) break;
      } catch (e) { continue; }
    }
    if (!data || !data.elements || !data.elements.length) { showShopsError("No shops found within 1.5 km. Try again later."); return; }
    var shops = processShops(data.elements, lat, lon);
    if (!shops.length) { showShopsError("No named shops nearby. OSM data may be limited here."); return; }
    renderShops(shops, grid);
    var attr = document.createElement("p");
    attr.className = "osm-attribution";
    attr.innerHTML = "Shop data &copy; <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\">OpenStreetMap</a> contributors";
    document.querySelector(".shops-section").appendChild(attr);
    loading.classList.add("hidden");
    wrap.classList.remove("hidden");
  } catch (e) {
    showShopsError("Could not load nearby shops. Check your internet connection.");
  }
}

function processShops(elements, uLat, uLon) {
  var seen = {}, shops = [];
  elements.forEach(function (el) {
    var tags = el.tags || {};
    var name = tags.name || tags["name:en"] || "";
    if (!name) return;
    var key = name.toLowerCase();
    if (seen[key]) return;
    seen[key] = true;
    var lat = el.lat || (el.center && el.center.lat);
    var lon = el.lon || (el.center && el.center.lon);
    if (!lat || !lon) return;
    var type = tags.shop || tags.amenity || "general";
    var dist = haversine(uLat, uLon, lat, lon);
    shops.push({
      id: el.id, name: name, type: type,
      typeLabel: SHOP_LABEL[type] || cap(type.replace(/_/g, " ")),
      emoji: SHOP_EMOJI_UNICODE[type] || "\uD83D\uDECD\uFE0F",
      address: osmAddr(tags), distance: dist,
      distLabel: dist < 1000 ? Math.round(dist) + " m" : (dist / 1000).toFixed(1) + " km",
      open: openNow(tags.opening_hours),
      phone: tags.phone || tags["contact:phone"] || "",
      website: tags.website || tags["contact:website"] || "",
      lat: lat, lon: lon
    });
  });
  shops.sort(function (a, b) { return a.distance - b.distance; });
  return shops.slice(0, 20);
}

function renderShops(shops, grid) {
  shops.forEach(function (s, i) {
    var card = document.createElement("div");
    card.className = "shop-card";
    card.style.animationDelay = (i * 0.06) + "s";

    var bc   = s.open === false ? "closed" : "open";
    var bt   = s.open === false ? "Closed"  : "Open";
    var mUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(s.name) + "&query_place_id=" + s.lat + "," + s.lon;
    var addrHTML   = s.address ? '<div class="shop-address"><i class="fa-solid fa-location-dot" style="font-size:10px;margin-right:4px"></i>' + s.address + '</div>' : "";
    var phoneHTML  = s.phone   ? '<span><i class="fa-solid fa-phone"></i> ' + s.phone + '</span>' : "";
    var phoneBadge = s.phone   ? '<span class="shop-tag"><i class="fa-solid fa-phone" style="font-size:9px"></i> Call</span>'   : "";
    var webBadge   = s.website ? '<span class="shop-tag"><i class="fa-solid fa-globe" style="font-size:9px"></i> Website</span>' : "";

    /* Street View cover — loads real photo; falls back to SVG illustration */
    var svUrl = "https://maps.googleapis.com/maps/api/streetview?size=400x160&location=" +
                s.lat + "," + s.lon + "&fov=90&pitch=5&source=outdoor";

    var coverHTML =
      '<div class="shop-cover-wrap">' +
        /* real photo attempt */
        '<img class="shop-cover-photo" src="' + svUrl + '" alt="' + s.name + '" ' +
          'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'" ' +
          'onload="this.nextElementSibling.style.display=\'none\'">' +
        /* SVG illustrated fallback */
        '<div class="shop-cover-svg" style="display:none">' + shopCoverSVG(s.type) + '</div>' +
        /* type badge overlay */
        '<div class="shop-cover-badge">' +
          '<span class="shop-cover-type-pill">' + s.typeLabel + '</span>' +
        '</div>' +
      '</div>';

    card.innerHTML =
      coverHTML +
      '<div class="shop-body">' +
        '<div class="shop-top-row"><div class="shop-name">' + s.name + '</div><span class="shop-badge ' + bc + '">' + bt + '</span></div>' +
        addrHTML +
        '<div class="shop-meta"><span><i class="fa-solid fa-location-dot"></i> ' + s.distLabel + ' away</span>' + phoneHTML + '</div>' +
        '<div class="shop-tags">' + phoneBadge + webBadge + '</div>' +
        '<button class="shop-order-btn" onclick="openShopMap(\'' + encodeURIComponent(s.name) + '\',' + s.lat + ',' + s.lon + ',event)"><i class="fa-solid fa-map-location-dot"></i> View on Map</button>' +
      '</div>';

    card.onclick = function (e) { if (e.target.closest(".shop-order-btn")) return; window.open(mUrl, "_blank"); };
    grid.appendChild(card);
  });
  window._osmShops = shops;
}

function openShopMap(name, lat, lon, event) {
  event.stopPropagation();
  window.open("https://www.google.com/maps/search/?api=1&query=" + name + "&query_place_id=" + lat + "," + lon, "_blank");
}

function showShopsError(msg) {
  document.getElementById("shopsLoading").classList.add("hidden");
  document.getElementById("shopsScrollWrap").classList.add("hidden");
  document.getElementById("shopsErrorMsg").innerText = msg;
  document.getElementById("shopsError").classList.remove("hidden");
}

function haversine(la1, lo1, la2, lo2) {
  var R = 6371000, p1 = la1*Math.PI/180, p2 = la2*Math.PI/180,
      dp = (la2-la1)*Math.PI/180, dl = (lo2-lo1)*Math.PI/180,
      a  = Math.sin(dp/2)*Math.sin(dp/2) + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)*Math.sin(dl/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function osmAddr(tags) {
  var p = [];
  if (tags["addr:housenumber"]) p.push(tags["addr:housenumber"]);
  if (tags["addr:street"])      p.push(tags["addr:street"]);
  if (tags["addr:suburb"])      p.push(tags["addr:suburb"]);
  if (tags["addr:city"])        p.push(tags["addr:city"]);
  return p.slice(0, 3).join(", ");
}

function cap(s) { return s.replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }

function openNow(s) {
  if (!s) return null;
  s = s.trim().toLowerCase();
  if (s === "24/7")   return true;
  if (s === "closed") return false;
  return true;
}


/* ================================================================
   CATEGORY BAR
   ================================================================ */
document.querySelectorAll(".category").forEach(function (cat) {
  cat.onclick = function () {
    document.querySelectorAll(".category").forEach(function (c) { c.classList.remove("active"); });
    cat.classList.add("active");
    filterProducts(cat.dataset.category);
  };
});


/* ================================================================
   FILTER PANEL
   ================================================================ */
function toggleFilter() {
  var p = document.getElementById("filterPanel");
  p.style.display = p.style.display === "block" ? "none" : "block";
}

function applyFilters() {
  var v = document.getElementById("priceFilter").value;
  var f = products;
  if (v === "low")  f = products.filter(function (p) { return p.price < 500; });
  if (v === "mid")  f = products.filter(function (p) { return p.price >= 500 && p.price <= 2000; });
  if (v === "high") f = products.filter(function (p) { return p.price > 2000; });
  renderProducts(f);
  document.getElementById("filterPanel").style.display = "none";
}


/* ================================================================
   PRODUCTS
   ================================================================ */
var products = [
  {id:1,  name:"Laptop",         price:45000, originalPrice:52000, category:"electronics", image:"assets/products/laptop.jpg",     rating:4.5, reviews:128},
  {id:2,  name:"Headphones",     price:1200,  originalPrice:1800,  category:"electronics", image:"assets/products/headphones.jpg", rating:4.2, reviews:85},
  {id:3,  name:"Shoes",          price:900,   originalPrice:1400,  category:"fashion",     image:"assets/products/shoes.jpg",      rating:4.0, reviews:63},
  {id:4,  name:"Tshirt",         price:400,   originalPrice:600,   category:"fashion",     image:"assets/products/tshirt.jpg",     rating:3.8, reviews:42},
  {id:5,  name:"Chair",          price:1500,  originalPrice:2000,  category:"home",        image:"assets/products/chair.jpg",      rating:4.3, reviews:34},
  {id:6,  name:"Lamp",           price:700,   originalPrice:950,   category:"home",        image:"assets/products/lamp.jpg",       rating:4.1, reviews:27},
  {id:7,  name:"Samsung Mobile", price:65000, originalPrice:75000, category:"electronics", image:"assets/products/S26.jpg",    rating:4.1, reviews:27},
  {id:8,  name:"Jeans",          price:700,   originalPrice:950,   category:"fashion",     image:"assets/products/jeans.jpg",      rating:4.1, reviews:27},
  {id:9,  name:"Oneplus Mobile", price:700,   originalPrice:950,   category:"electronics", image:"assets/products/15r.jpg",    rating:4.1, reviews:27},
  {id:10, name:"Camera",         price:85000, originalPrice:95000, category:"electronics", image:"assets/products/camera.jpg",     rating:4.1, reviews:27},
  {id:17, name:"Tablet",         price:18000, originalPrice:21000, category:"electronics", image:"assets/products/tablet.jpg",     rating:4.2, reviews:54},
  {id:18, name:"Smartwatch",     price:3500,  originalPrice:4200,  category:"electronics", image:"assets/products/smartwatch.jpg",      rating:4.3, reviews:66},
  {id:19, name:"Keyboard",       price:800,   originalPrice:1100,  category:"electronics", image:"assets/products/keyboard.jpg",   rating:4.0, reviews:33},
  {id:20, name:"Mouse",          price:500,   originalPrice:700,   category:"electronics", image:"assets/products/mouse.jpg",      rating:4.1, reviews:41},
  {id:21, name:"Jacket",         price:1600,  originalPrice:2200,  category:"fashion",     image:"assets/products/jacket.jpg",     rating:4.2, reviews:58},
  {id:22, name:"Cap",            price:250,   originalPrice:400,   category:"fashion",     image:"assets/products/cap.jpg",        rating:3.9, reviews:25},
  {id:23, name:"Sweater",        price:900,   originalPrice:1300,  category:"fashion",     image:"assets/products/sweater.jpg",    rating:4.1, reviews:39},
  {id:24, name:"Shorts",         price:500,   originalPrice:800,   category:"fashion",     image:"assets/products/shorts.jpg",     rating:3.8, reviews:21},
  {id:25, name:"Table",          price:3000,  originalPrice:3800,  category:"home",        image:"assets/products/table.jpg",      rating:4.3, reviews:44},
  {id:26, name:"Sofa",           price:12000, originalPrice:15000, category:"home",        image:"assets/products/sofa.jpg",       rating:4.5, reviews:52},
  {id:27, name:"Bed",            price:14000, originalPrice:18000, category:"home",        image:"assets/products/bed.jpg",        rating:4.4, reviews:47},
  {id:28, name:"Fan",            price:1800,  originalPrice:2300,  category:"home",        image:"assets/products/fan.jpg",        rating:4.0, reviews:30},
  {id:29, name:"Speaker",        price:2200,  originalPrice:2800,  category:"electronics", image:"assets/products/speaker.jpg",    rating:4.3, reviews:63},
  {id:30, name:"Router",         price:1500,  originalPrice:2000,  category:"electronics", image:"assets/products/router.jpg",     rating:4.1, reviews:37},
  {id:31, name:"Monitor",        price:9000,  originalPrice:11000, category:"electronics", image:"assets/products/monitor.jpg",    rating:4.4, reviews:48},
  {id:32, name:"Powerbank",      price:1200,  originalPrice:1600,  category:"electronics", image:"assets/products/powerbank.jpg",  rating:4.2, reviews:53},
  {id:33, name:"Dress",          price:1300,  originalPrice:1700,  category:"fashion",     image:"assets/products/dress.jpg",      rating:4.1, reviews:36},
  {id:34, name:"Scarf",          price:300,   originalPrice:450,   category:"fashion",     image:"assets/products/scarf.jpg",      rating:3.7, reviews:18},
  {id:35, name:"Sunglasses",     price:600,   originalPrice:900,   category:"fashion",     image:"assets/products/sunglasses.jpg",    rating:4.0, reviews:27},
  {id:36, name:"Belt",           price:350,   originalPrice:500,   category:"fashion",     image:"assets/products/belt.jpg",       rating:3.9, reviews:20},
  {id:37, name:"Curtains",       price:1100,  originalPrice:1500,  category:"home",        image:"assets/products/curtain.jpg",    rating:4.1, reviews:29},
  {id:38, name:"Carpet",         price:2000,  originalPrice:2600,  category:"home",        image:"assets/products/carpet.jpg",     rating:4.2, reviews:34},
  {id:39, name:"Clock",          price:450,   originalPrice:650,   category:"home",        image:"assets/products/clock.jpg",      rating:3.8, reviews:22},
  {id:40, name:"Mirror",         price:900,   originalPrice:1200,  category:"home",        image:"assets/products/mirror.jpg",     rating:4.0, reviews:26},
  {id:41, name:"Earbuds",        price:1800,  originalPrice:2300,  category:"electronics", image:"assets/products/earbuds.jpg",    rating:4.3, reviews:49},
  {id:42, name:"Drone",          price:6000,  originalPrice:7500,  category:"electronics", image:"assets/products/drone.jpg",      rating:4.4, reviews:32},
  {id:43, name:"Tripod",         price:700,   originalPrice:950,   category:"electronics", image:"assets/products/tripod.jpg",     rating:4.0, reviews:28},
  {id:44, name:"Projector",      price:8500,  originalPrice:10000, category:"electronics", image:"assets/products/projector.jpg",  rating:4.2, reviews:31},
  {id:45, name:"Backpack",       price:1200,  originalPrice:1600,  category:"fashion",     image:"assets/products/backpack.jpg",   rating:4.1, reviews:35},
  {id:46, name:"Wallet",         price:500,   originalPrice:750,   category:"fashion",     image:"assets/products/wallet.jpg",     rating:3.9, reviews:24},
  {id:47, name:"Sandals",        price:700,   originalPrice:950,   category:"fashion",     image:"assets/products/sandal.jpg",    rating:4.0, reviews:26},
  {id:48, name:"Bottle",         price:300,   originalPrice:450,   category:"home",        image:"assets/products/bottle.jpg",     rating:3.8, reviews:19},
  {id:49, name:"Lunchbox",       price:450,   originalPrice:650,   category:"home",        image:"assets/products/lunchbox.jpg",   rating:3.9, reviews:21},
  {id:50, name:"Plant",          price:350,   originalPrice:500,   category:"home",        image:"assets/products/plant.jpg",      rating:4.2, reviews:23}
];

function generateProducts() { renderProducts(products); }

function renderStars(r) {
  var full = Math.floor(r), half = r % 1 >= 0.5, h = "";
  for (var i = 0; i < 5; i++) {
    if (i < full)                h += '<i class="fa-solid fa-star"></i>';
    else if (i === full && half) h += '<i class="fa-solid fa-star-half-stroke"></i>';
    else                         h += '<i class="fa-regular fa-star"></i>';
  }
  return h;
}

function addToCart(id, event) {
  event.stopPropagation();
  var prod = products.find(function (p) { return p.id === id; });
  var cart = JSON.parse(localStorage.getItem("rx_cart") || "[]");
  var ex   = cart.find(function (i) { return i.id === id; });
  if (ex) ex.qty++;
  else    cart.push(Object.assign({}, prod, { qty: 1 }));
  localStorage.setItem("rx_cart", JSON.stringify(cart));
  var btn = event.target;
  btn.innerText = "Added!";
  btn.style.background = "rgb(130,180,80)";
  setTimeout(function () { btn.innerText = "Add to Cart"; btn.style.background = ""; }, 1200);
}

function buyNow(id, event) {
  event.stopPropagation();
  window.location.href = "product.html?id=" + id;
}

function renderProducts(list) {
  var c = document.getElementById("productsContainer");
  c.innerHTML = "";
  list.forEach(function (p) {
    var disc = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
    var card = document.createElement("div");
    card.className = "product-card";
    card.onclick = function () { window.location.href = "product.html?id=" + p.id; };
    card.innerHTML =
      '<img src="' + p.image + '" onerror="this.src=\'assets/products/demo.jpg\'" alt="' + p.name + '">' +
      '<h4>' + p.name + '</h4>' +
      '<div class="price-row">' +
        '<span class="price-current">&#8377;' + p.price.toLocaleString() + '</span>' +
        '<span class="price-original">&#8377;' + p.originalPrice.toLocaleString() + '</span>' +
        '<span class="price-discount">' + disc + '% off</span>' +
      '</div>' +
      '<div class="stars-row">' + renderStars(p.rating) + '<span class="review-count">(' + p.reviews + ')</span></div>' +
      '<div class="card-actions">' +
        '<button class="btn-cart" onclick="addToCart(' + p.id + ',event)">Add to Cart</button>' +
        '<button class="btn-buy"  onclick="buyNow(' + p.id + ',event)">Buy Now</button>' +
      '</div>';
    c.appendChild(card);
  });
}

function filterProducts(cat) {
  if (cat === "all") renderProducts(products);
  else renderProducts(products.filter(function (p) { return p.category === cat; }));
}


/* ================================================================
   USER LOGIN -- wired to backend JWT via api.js
   ================================================================ */
async function checkUserLogin() {
  var loggedIn = await api.init();

  var signInOpt  = document.getElementById("signInOption");
  var signUpOpt  = document.getElementById("signUpOption");
  var profileOpt = document.getElementById("profileOption");
  var forgotOpt  = document.getElementById("forgotOption");
  var logoutOpt  = document.getElementById("logoutOption");

  if (!loggedIn) {
    if (signInOpt)  signInOpt.style.display  = "";
    if (signUpOpt)  signUpOpt.style.display  = "";
    if (profileOpt) profileOpt.style.display = "none";
    if (forgotOpt)  forgotOpt.style.display  = "";
    if (logoutOpt)  logoutOpt.style.display  = "none";
    return;
  }

  var res = await api.get("/auth/me");
  if (!res.success) {
    api.clearToken();
    return;
  }

  var user = res.user;
  localStorage.setItem("rx_user_name", user.name);
  localStorage.setItem("rx_user_role", user.role);
  window.rxCurrentUser = user;

  if (signInOpt)  signInOpt.style.display  = "none";
  if (signUpOpt)  signUpOpt.style.display  = "none";
  if (forgotOpt)  forgotOpt.style.display  = "none";
  if (profileOpt) profileOpt.style.display = "";
  if (logoutOpt)  logoutOpt.style.display  = "";

  /* Show dashboard link in navbar for admin/seller */
  var dashLink = document.getElementById("dashboardOption");
  if (dashLink) {
    dashLink.style.display = "";
    if (user.role === "admin") {
      dashLink.querySelector("a").href = "admin-dashboard.html";
      dashLink.querySelector("a").innerText = "Admin Dashboard";
    } else if (user.role === "seller") {
      dashLink.querySelector("a").href = "seller-dashboard.html";
      dashLink.querySelector("a").innerText = "Seller Dashboard";
    }
  }
}

async function logoutUser() {
  await api.logout();
  localStorage.removeItem("rx_user_name");
  localStorage.removeItem("rx_user_role");
  window.rxCurrentUser = null;
  window.location.href = "login.html";
}


/* ================================================================
   BANNER SLIDER
   ================================================================ */
var BANNERS_DARK = [
  {image:"",                           title:'<img src="assets/banners/logo.png" alt="Banner" class="subtitle-img"><br>Smart Shopping Platform', subtitle:"Find products around your location"},
  {image:"assets/banners/b2.jpg",      title:"Best Deals Near You",          subtitle:"Exclusive offers updated daily"},
  {image:"assets/banners/b3.jpg",      title:"",                             subtitle:""},
  {image:"assets/banners/b4.jpg",      title:"Fashion That Fits Your Style", subtitle:"Trending looks delivered fast"},
  {image:"assets/banners/b5.jpg",      title:"Transform Your Home",          subtitle:"Beautiful furniture & decor nearby"}
];

var BANNERS_LIGHT = [
  {image:"",                                title:'<img src="assets/banners/logo-light.png" alt="Banner" class="subtitle-img"><br>Smart Shopping Platform', subtitle:"Find products around your location"},
  {image:"assets/banners/b2-light.jpg",     title:"Best Deals Near You",          subtitle:"Exclusive offers updated daily"},
  {image:"assets/banners/b3-light.jpg",     title:"",                             subtitle:""},
  {image:"assets/banners/b4-light.jpg",     title:"Fashion That Fits Your Style", subtitle:"Trending looks delivered fast"},
  {image:"assets/banners/b5-light.jpg",     title:"Transform Your Home",          subtitle:"Beautiful furniture & decor nearby"}
];

var banners = BANNERS_DARK;
var currentSlide = 0;
var bannerSliderInterval = null;

function initBannerSlider() {
  banners = document.body.classList.contains("light-mode") ? BANNERS_LIGHT : BANNERS_DARK;
  var track = document.getElementById("bannerTrack");
  var dots  = document.getElementById("bannerDots");
  if (!track) return;
  track.innerHTML = "";
  dots.innerHTML  = "";
  currentSlide = 0;
  banners.forEach(function (b, i) {
    var slide = document.createElement("div");
    slide.className = "banner-slide" + (i === 0 ? " active" : "");
    slide.style.backgroundImage = "url('" + b.image + "')";
    slide.innerHTML = '<div class="banner-text"><h2>' + b.title + '</h2><p>' + b.subtitle + '</p></div>';
    track.appendChild(slide);
    var dot = document.createElement("span");
    dot.className = "banner-dot" + (i === 0 ? " active" : "");
    dot.onclick = (function (idx) { return function () { goToSlide(idx); }; })(i);
    dots.appendChild(dot);
  });
  if (bannerSliderInterval) clearInterval(bannerSliderInterval);
  bannerSliderInterval = setInterval(nextSlide, 3000);
}

function goToSlide(idx) {
  var slides = document.querySelectorAll(".banner-slide");
  var dots   = document.querySelectorAll(".banner-dot");
  slides[currentSlide].classList.remove("active");
  dots[currentSlide].classList.remove("active");
  currentSlide = idx;
  slides[currentSlide].classList.add("active");
  dots[currentSlide].classList.add("active");
}

function nextSlide() { goToSlide((currentSlide + 1) % banners.length); }
function prevSlide() { goToSlide((currentSlide - 1 + banners.length) % banners.length); }


/* ================================================================
   SEARCH OVERLAY
   ================================================================ */
var sovActiveTab = "products";

function openSearchOverlay() {
  document.getElementById("searchOverlay").classList.add("open");
  setTimeout(function () { document.getElementById("sovInput").focus(); }, 60);
  document.addEventListener("keydown", sovEsc);
}

function closeSearchOverlay() {
  document.getElementById("searchOverlay").classList.remove("open");
  document.getElementById("sovInput").value = "";
  document.getElementById("sovResults").innerHTML =
    '<div class="sov-empty-state"><i class="fa-solid fa-magnifying-glass"></i><p>Start typing to search...</p></div>';
  document.removeEventListener("keydown", sovEsc);
}

function sovEsc(e) { if (e.key === "Escape") closeSearchOverlay(); }

function sovTab(tab, btn) {
  sovActiveTab = tab;
  document.querySelectorAll(".sov-tab").forEach(function (b) { b.classList.remove("active"); });
  btn.classList.add("active");
  handleOverlaySearch(document.getElementById("sovInput").value);
}

function handleOverlaySearch(val) {
  var c = document.getElementById("sovResults");
  c.innerHTML = "";
  var q = val.trim().toLowerCase();
  if (!q) {
    c.innerHTML = '<div class="sov-empty-state"><i class="fa-solid fa-magnifying-glass"></i><p>Start typing to search...</p></div>';
    return;
  }
  if (sovActiveTab === "products") renderSovProducts(q, c);
  else                             renderSovShops(q, c);
}

function renderSovProducts(q, c) {
  var m = products.filter(function (p) {
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });
  if (!m.length) { c.innerHTML = '<div class="sov-no-results">No products found for <strong>"' + q + '"</strong></div>'; return; }
  var lbl = document.createElement("div");
  lbl.className = "sov-label";
  lbl.innerText = "Products (" + m.length + ")";
  c.appendChild(lbl);
  m.slice(0, 14).forEach(function (p) {
    var disc = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
    var r = document.createElement("div");
    r.className = "sov-item";
    r.innerHTML =
      '<img class="sov-item-img" src="' + p.image + '" onerror="this.src=\'assets/products/demo.jpg\'" alt="' + p.name + '">' +
      '<div class="sov-item-info"><div class="sov-item-name">' + hl(p.name, q) + '</div>' +
      '<div class="sov-item-meta">' + p.category + ' &middot; ' + disc + '% off &middot; &#11088; ' + p.rating + '</div></div>' +
      '<div class="sov-item-right">&#8377;' + p.price.toLocaleString() + '</div>';
    r.onclick = function () { closeSearchOverlay(); window.location.href = "product.html?id=" + p.id; };
    c.appendChild(r);
  });
}

function renderSovShops(q, c) {
  var all = window._osmShops || [];
  var m   = all.filter(function (s) {
    return s.name.toLowerCase().includes(q) || s.typeLabel.toLowerCase().includes(q) ||
           s.type.toLowerCase().includes(q) || (s.address && s.address.toLowerCase().includes(q));
  });
  if (!m.length) {
    c.innerHTML = '<div class="sov-no-results">No shops found for <strong>"' + q + '"</strong>' +
      (all.length === 0 ? '<br><small>Allow location to load nearby shops first</small>' : '') + '</div>';
    return;
  }
  var lbl = document.createElement("div");
  lbl.className = "sov-label";
  lbl.innerText = "Nearby Shops (" + m.length + ")";
  c.appendChild(lbl);
  m.slice(0, 12).forEach(function (s) {
    var r = document.createElement("div");
    r.className = "sov-item";
    var st = s.open === false
      ? '<span style="color:rgb(255,95,95)">Closed</span>'
      : '<span style="color:rgb(100,215,130)">Open</span>';
    r.innerHTML =
      '<div class="sov-item-icon">' + s.emoji + '</div>' +
      '<div class="sov-item-info"><div class="sov-item-name">' + hl(s.name, q) + '</div>' +
      '<div class="sov-item-meta">' + s.typeLabel + ' &middot; ' + s.distLabel + ' &middot; ' + st + '</div></div>' +
      '<div class="sov-item-right" style="font-size:12px;color:rgb(130,148,162)">' + s.distLabel + '</div>';
    r.onclick = function () {
      closeSearchOverlay();
      openShopMap(encodeURIComponent(s.name), s.lat, s.lon, new MouseEvent("click"));
    };
    c.appendChild(r);
  });
}

function hl(text, q) {
  if (!q) return text;
  var safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp("(" + safe + ")", "gi"), '<mark class="sov-match">$1</mark>');
}

document.getElementById("searchOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeSearchOverlay();
});