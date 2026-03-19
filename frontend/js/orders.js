/* ====================================================
   RadiusX — orders.js
   Auth-gated via api.js JWT.
   Loads real orders from GET /orders.
   Falls back to empty state gracefully.
   All UI logic (filters, drawer, chart) preserved.
   ==================================================== */

/* ---- Orders loaded from backend ---- */
var ORDERS = [];

/* ---- State ---- */
var currentFilterValue = "all";
var selectedYear       = new Date().getFullYear();
var toastTimer         = null;

var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

var STATUS_ICONS = {
  delivered:  "fa-circle-check",
  shipped:    "fa-truck",
  processing: "fa-gear",
  cancelled:  "fa-xmark-circle",
  returned:   "fa-rotate-left"
};

var TRACKER_STEPS    = ["Order Placed","Processing","Shipped","Delivered"];
var TRACKER_STATUS_IDX = { processing:1, shipped:2, delivered:3, cancelled:0, returned:0 };


/* ====================================================
   INIT — auth gate
   ==================================================== */

window.onload = async function () {
  var loggedIn = await api.init();

  if (!loggedIn) {
    showSignInWall();
    return;
  }

  var res = await api.get("/auth/me");
  if (!res.success) {
    showSignInWall();
    return;
  }

  await loadOrders();
};


/* ====================================================
   LOAD ORDERS FROM BACKEND
   ==================================================== */

async function loadOrders() {
  showPageLoading(true);

  var rawOrders = [];

  /* ── Try backend first ── */
  try {
    var res = await api.get("/orders");
    if (res && res.success && res.orders && res.orders.length) {
      rawOrders = res.orders;
    }
  } catch(e) {}

  /* ── FIX: Fall back to localStorage if backend has no orders ──
     cart.js saves every checkout to rx_orders so this always works */
  if (!rawOrders.length) {
    try {
      rawOrders = JSON.parse(localStorage.getItem("rx_orders") || "[]");
    } catch(e) { rawOrders = []; }
  }

  showPageLoading(false);

  /* ── Normalize order format for UI ── */
  ORDERS = rawOrders.map(function(o) {
    return {
      id:             o._id || o.id,
      date:           o.createdAt || o.date,
      status:         o.status || "processing",
      items:          (o.items || []).map(function(i) {
        return {
          id:            i.product || i.id,
          name:          i.name          || "Product",
          category:      i.category      || "General",
          price:         i.price         || 0,
          originalPrice: i.originalPrice || i.price || 0,
          qty:           i.qty           || 1,
          image:         i.image         || "assets/products/demo.jpg"
        };
      }),
      couponDiscount: o.couponDiscount || 0,
      delivery:       o.deliveryCharge || o.delivery || 0
    };
  });

  renderStatCards();
  renderOrders();
  buildYearTabs();
  renderExpense(selectedYear);

  /* ── Listen for new orders placed in cart page (same tab or other tab) ── */
  window.addEventListener("storage", function(e) {
    if (e.key === "rx_orders") {
      try {
        var updated = JSON.parse(e.newValue || "[]");
        ORDERS = updated.map(function(o) {
          return {
            id:             o._id || o.id,
            date:           o.createdAt || o.date,
            status:         o.status || "processing",
            items:          (o.items || []).map(function(i) {
              return {
                id:            i.product || i.id,
                name:          i.name          || "Product",
                category:      i.category      || "General",
                price:         i.price         || 0,
                originalPrice: i.originalPrice || i.price || 0,
                qty:           i.qty           || 1,
                image:         i.image         || "assets/products/demo.jpg"
              };
            }),
            couponDiscount: o.couponDiscount || 0,
            delivery:       o.deliveryCharge || o.delivery || 0
          };
        });
        renderStatCards();
        renderOrders();
        buildYearTabs();
        renderExpense(selectedYear);
      } catch(err) {}
    }
  });
}


/* ====================================================
   PAGE LOADING STATE
   ==================================================== */

function showPageLoading(show) {
  var container = document.getElementById("ordersList");
  if (!container) return;
  if (show) {
    container.innerHTML =
      '<div style="text-align:center;padding:60px 20px;color:var(--muted)">' +
        '<i class="fa-solid fa-circle-notch fa-spin" style="font-size:28px;margin-bottom:14px;display:block"></i>' +
        '<p style="font-size:14px">Loading your orders...</p>' +
      '</div>';
  }
}


/* ====================================================
   SIGN-IN WALL
   ==================================================== */

function showSignInWall() {
  /* Hide stat cards and filter UI */
  var hideIds = ["ordersList","yearTabs","barChart","monthLabels","categoryBars"];
  document.querySelectorAll(".stat-card,.filter-row,.expense-section,.breakdown-section").forEach(function(el) {
    el.style.display = "none";
  });

  var container = document.getElementById("ordersList");
  if (container) {
    container.innerHTML =
      '<div style="text-align:center;padding:80px 20px">' +
        '<i class="fa-solid fa-box-open" style="font-size:54px;color:var(--border);margin-bottom:20px;display:block"></i>' +
        '<h3 style="font-family:\'Playfair Display\',serif;font-size:22px;color:var(--text);margin-bottom:10px">Sign in to view your orders</h3>' +
        '<p style="color:var(--muted);font-size:14px;margin-bottom:28px">Track deliveries, view history, and manage returns — all in one place.</p>' +
        '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
          '<a href="login.html?tab=signin" style="padding:12px 28px;background:var(--accent);color:rgb(8,12,16);border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Sign In</a>' +
          '<a href="login.html?tab=signup" style="padding:12px 28px;background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:8px;text-decoration:none;font-size:14px">Create Account</a>' +
        '</div>' +
      '</div>';
  }
}


/* ====================================================
   STAT CARDS
   ==================================================== */

function orderTotal(o) {
  var sum = (o.items || []).reduce(function(s,i) { return s + i.price * i.qty; }, 0);
  return Math.max(0, sum - (o.couponDiscount || 0) + (o.delivery || 0));
}

function orderOriginalTotal(o) {
  return (o.items || []).reduce(function(s,i) { return s + i.originalPrice * i.qty; }, 0);
}

/* FIX: savings = (MRP total) - (sale price total)
   Do NOT subtract coupon/delivery here — those are separate line items.
   Old code: orderOriginalTotal - orderTotal (which included delivery/coupon)
   → caused negative or garbage savings values. */
function orderSavings(o) {
  var mrpTotal  = orderOriginalTotal(o);
  var saleTotal = (o.items || []).reduce(function(s,i) { return s + i.price * i.qty; }, 0);
  return Math.max(0, mrpTotal - saleTotal);
}

function renderStatCards() {
  var all        = ORDERS;
  var totalSpent = all.reduce(function(s,o) { return s + orderTotal(o); }, 0);
  var delivered  = all.filter(function(o) { return o.status === "delivered"; }).length;
  var returned   = all.filter(function(o) { return o.status === "returned"; }).length;

  animateCount("statTotal",     all.length);
  animateRupee("statSpent",     totalSpent);
  animateCount("statDelivered", delivered);
  animateCount("statReturned",  returned);
}

function animateCount(id, target) {
  var el = document.getElementById(id);
  if (!el) return;
  var start = 0, step = Math.max(1, Math.ceil(target / 50));
  var iv = setInterval(function() {
    start = Math.min(start + step, target);
    el.innerText = start;
    if (start >= target) clearInterval(iv);
  }, 16);
}

function animateRupee(id, target) {
  var el = document.getElementById(id);
  if (!el) return;
  var start = 0, step = Math.max(1, Math.ceil(target / 50));
  var iv = setInterval(function() {
    start = Math.min(start + step, target);
    el.innerText = "\u20B9" + start.toLocaleString();
    if (start >= target) clearInterval(iv);
  }, 16);
}


/* ====================================================
   ORDER LIST
   ==================================================== */

function setFilter(btn, filter) {
  document.querySelectorAll(".ftab").forEach(function(b) { b.classList.remove("active"); });
  btn.classList.add("active");
  currentFilterValue = filter;
  filterOrders();
}

function filterOrders() {
  var search = (document.getElementById("orderSearch") || {}).value || "";
  search = search.toLowerCase();
  var sort = (document.getElementById("orderSort") || {}).value || "newest";

  var list = ORDERS.filter(function(o) {
    if (currentFilterValue !== "all" && o.status !== currentFilterValue) return false;
    if (search) {
      var match = (o.id || "").toLowerCase().includes(search) ||
                  (o.items || []).some(function(i) { return i.name.toLowerCase().includes(search); });
      if (!match) return false;
    }
    return true;
  });

  list = list.slice().sort(function(a,b) {
    if (sort === "newest") return new Date(b.date) - new Date(a.date);
    if (sort === "oldest") return new Date(a.date) - new Date(b.date);
    if (sort === "high")   return orderTotal(b) - orderTotal(a);
    if (sort === "low")    return orderTotal(a) - orderTotal(b);
    return 0;
  });

  renderOrderList(list);
}

function renderOrders() { filterOrders(); }

function renderOrderList(list) {
  var container = document.getElementById("ordersList");
  var empty     = document.getElementById("ordersEmpty");
  container.innerHTML = "";

  if (!list.length) {
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");
  list.forEach(function(order, idx) { container.appendChild(buildOrderCard(order, idx)); });
}

function buildOrderCard(order, idx) {
  var card = document.createElement("div");
  card.className = "order-card";
  card.style.animationDelay = (idx * 0.06) + "s";
  card.onclick = function() { openDrawer(order); };

  var total    = orderTotal(order);
  var savings  = orderSavings(order);
  var names    = (order.items || []).map(function(i) { return i.name; }).join(", ");
  var date     = new Date(order.date).toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"});
  var totalQty = (order.items || []).reduce(function(s,i) { return s + i.qty; }, 0);

  var imgsHTML = "";
  (order.items || []).slice(0,3).forEach(function(i) {
    imgsHTML += '<img class="order-img" src="' + i.image + '" onerror="this.src=\'assets/products/demo.jpg\'" alt="' + esc(i.name) + '">';
  });
  if ((order.items || []).length > 3) {
    imgsHTML += '<div class="order-more-badge">+' + ((order.items || []).length - 3) + '</div>';
  }

  var trackerHTML = "";
  var statusIdx = TRACKER_STATUS_IDX[order.status] || 0;
  if (order.status === "cancelled" || order.status === "returned") {
    trackerHTML = '<span style="font-size:12px;color:var(--muted)">\u2014</span>';
  } else {
    TRACKER_STEPS.forEach(function(s, i) {
      var dotClass = i < statusIdx ? "done" : (i === statusIdx ? "current" : "");
      trackerHTML += '<div class="tracker-dot ' + dotClass + '"></div>';
      if (i < TRACKER_STEPS.length - 1) {
        trackerHTML += '<div class="tracker-line ' + (i < statusIdx ? "done" : "") + '"></div>';
      }
    });
  }

  var icon = STATUS_ICONS[order.status] || "fa-box";
  card.innerHTML =
    '<div class="order-card-header">' +
      '<div>' +
        '<div class="order-id">' + esc(order.id) + '</div>' +
        '<div class="order-date">' + date + '</div>' +
      '</div>' +
      '<span class="order-status-badge status-' + order.status + '">' +
        '<i class="fa-solid ' + icon + '"></i> ' + order.status +
      '</span>' +
    '</div>' +
    '<div class="order-card-body">' +
      '<div class="order-imgs">' + imgsHTML + '</div>' +
      '<div class="order-meta">' +
        '<div class="order-items-summary">' + esc(names) + '</div>' +
        '<div class="order-items-count">' + totalQty + ' item' + (totalQty > 1 ? 's' : '') + '</div>' +
        '<div class="order-tracker">' + trackerHTML + '</div>' +
      '</div>' +
      '<div class="order-card-right">' +
        '<div class="order-total">\u20B9' + total.toLocaleString() + '</div>' +
        (savings > 0 ? '<div class="order-savings">Saved \u20B9' + savings.toLocaleString() + '</div>' : '') +
        '<div class="order-action-btn"><i class="fa-solid fa-chevron-right"></i> View Details</div>' +
      '</div>' +
    '</div>';

  return card;
}


/* ====================================================
   ORDER DETAIL DRAWER
   ==================================================== */

function openDrawer(order) {
  var body       = document.getElementById("drawerBody");
  var date       = new Date(order.date).toLocaleDateString("en-IN", {weekday:"long",day:"2-digit",month:"long",year:"numeric"});
  var total      = orderTotal(order);
  var subtotal   = (order.items || []).reduce(function(s,i) { return s + i.price * i.qty; }, 0);
  var origTotal  = orderOriginalTotal(order);
  var savings    = origTotal - subtotal;
  var statusIdx  = TRACKER_STATUS_IDX[order.status] || 0;

  var steps = [
    {label:"Placed",     icon:"fa-file-circle-check"},
    {label:"Processing", icon:"fa-gear"},
    {label:"Shipped",    icon:"fa-truck"},
    {label:"Delivered",  icon:"fa-house"}
  ];

  var trackerHTML = '<div class="drawer-tracker">';
  steps.forEach(function(s, i) {
    var cls = "";
    if (order.status === "cancelled" || order.status === "returned") {
      cls = i === 0 ? "done" : "";
    } else {
      cls = i < statusIdx ? "done" : (i === statusIdx ? "current" : "");
    }
    trackerHTML +=
      '<div class="tracker-step ' + cls + '">' +
        '<div class="tracker-step-icon"><i class="fa-solid ' + s.icon + '"></i></div>' +
        '<span class="tracker-step-label">' + s.label + '</span>' +
      '</div>';
    if (i < steps.length - 1) {
      trackerHTML += '<div class="tracker-connector ' + (i < statusIdx && order.status !== "cancelled" ? "done" : "") + '"></div>';
    }
  });
  trackerHTML += '</div>';

  var itemsHTML = (order.items || []).map(function(i) {
    return '<div class="drawer-item">' +
      '<img src="' + i.image + '" onerror="this.src=\'assets/products/demo.jpg\'" alt="' + esc(i.name) + '">' +
      '<div class="drawer-item-info">' +
        '<div class="drawer-item-name">' + esc(i.name) + '</div>' +
        '<div class="drawer-item-cat">' + esc(i.category) + '</div>' +
        '<div class="drawer-item-qty">Qty: ' + i.qty + '</div>' +
      '</div>' +
      '<div class="drawer-item-price">\u20B9' + (i.price * i.qty).toLocaleString() + '</div>' +
    '</div>';
  }).join("");

  var actionsHTML = "";
  if (order.status === "delivered") {
    actionsHTML =
      '<button class="drawer-btn primary" onclick="showToast(\'Reorder placed!\')"><i class="fa-solid fa-rotate-right"></i> Reorder</button>' +
      '<button class="drawer-btn secondary" onclick="showToast(\'Return request submitted\')"><i class="fa-solid fa-rotate-left"></i> Return</button>';
  } else if (order.status === "shipped" || order.status === "processing") {
    actionsHTML =
      '<button class="drawer-btn primary" onclick="showToast(\'Tracking info sent to your email\')"><i class="fa-solid fa-location-dot"></i> Track Order</button>' +
      '<button class="drawer-btn secondary" onclick="showToast(\'Cancellation request sent\')"><i class="fa-solid fa-xmark"></i> Cancel</button>';
  } else {
    actionsHTML =
      '<button class="drawer-btn primary" onclick="window.location.href=\'index.html\'"><i class="fa-solid fa-store"></i> Shop Again</button>';
  }

  var icon = STATUS_ICONS[order.status] || "fa-box";
  body.innerHTML =
    '<div class="drawer-order-meta">' +
      '<div>' +
        '<span class="drawer-order-id">' + esc(order.id) + '</span>' +
        '<span class="drawer-order-date">' + date + '</span>' +
      '</div>' +
      '<span class="order-status-badge status-' + order.status + '">' +
        '<i class="fa-solid ' + icon + '"></i> ' + order.status +
      '</span>' +
    '</div>' +
    trackerHTML +
    '<div class="drawer-items">' + itemsHTML + '</div>' +
    '<div class="drawer-price-summary">' +
      '<div class="drawer-price-row"><span>Subtotal</span><span>\u20B9' + subtotal.toLocaleString() + '</span></div>' +
      (savings > 0 ? '<div class="drawer-price-row"><span>Savings</span><span class="dr-savings">\u2212\u20B9' + savings.toLocaleString() + '</span></div>' : '') +
      ((order.couponDiscount || 0) > 0 ? '<div class="drawer-price-row"><span>Coupon</span><span class="dr-savings">\u2212\u20B9' + order.couponDiscount.toLocaleString() + '</span></div>' : '') +
      '<div class="drawer-price-row"><span>Delivery</span><span>' + ((order.delivery || 0) === 0 ? "FREE" : "\u20B9" + order.delivery) + '</span></div>' +
      '<div class="drawer-price-row total-row"><span>Total Paid</span><span>\u20B9' + total.toLocaleString() + '</span></div>' +
    '</div>' +
    '<div class="drawer-actions">' + actionsHTML + '</div>';

  document.getElementById("drawerOverlay").classList.add("open");
  document.getElementById("orderDrawer").classList.add("open");
}

function closeDrawer() {
  document.getElementById("drawerOverlay").classList.remove("open");
  document.getElementById("orderDrawer").classList.remove("open");
}


/* ====================================================
   EXPENSE CALCULATOR
   ==================================================== */

function getYears() {
  if (!ORDERS.length) return [new Date().getFullYear()];
  var years = ORDERS.map(function(o) { return new Date(o.date).getFullYear(); });
  return Array.from(new Set(years)).sort(function(a,b) { return b - a; });
}

function buildYearTabs() {
  var container = document.getElementById("yearTabs");
  if (!container) return;
  container.innerHTML = "";
  getYears().forEach(function(y) {
    var btn = document.createElement("button");
    btn.className = "ytab" + (y === selectedYear ? " active" : "");
    btn.innerText = y;
    btn.onclick = function() {
      document.querySelectorAll(".ytab").forEach(function(b) { b.classList.remove("active"); });
      btn.classList.add("active");
      selectedYear = y;
      renderExpense(y);
    };
    container.appendChild(btn);
  });
}

function ordersForYear(year) {
  return ORDERS.filter(function(o) { return new Date(o.date).getFullYear() === year; });
}

function renderExpense(year) {
  var lbl = document.getElementById("selectedYearLabel");
  if (lbl) lbl.innerText = year;

  var yearOrders  = ordersForYear(year);
  var spendOrders = yearOrders.filter(function(o) { return o.status !== "cancelled"; });

  var totalSpent  = spendOrders.reduce(function(s,o) { return s + orderTotal(o); }, 0);
  var totalSaved  = spendOrders.reduce(function(s,o) { return s + orderSavings(o); }, 0);
  var avgPerOrder = spendOrders.length ? Math.round(totalSpent / spendOrders.length) : 0;

  animateExpenseTotal(totalSpent);

  var meta = document.getElementById("expenseTotalMeta");
  if (meta) meta.innerText = spendOrders.length + " order" + (spendOrders.length !== 1 ? "s" : "") + " \u00B7 avg \u20B9" + avgPerOrder.toLocaleString() + "/order";

  var amounts = spendOrders.map(function(o) { return orderTotal(o); });
  var hi = document.getElementById("metricHighest");
  var lo = document.getElementById("metricLowest");
  var am = document.getElementById("metricAvgMonth");
  var cat = document.getElementById("metricCategory");
  if (hi) hi.innerText = amounts.length ? "\u20B9" + Math.max.apply(null, amounts).toLocaleString() : "\u2014";
  if (lo) lo.innerText = amounts.length ? "\u20B9" + Math.min.apply(null, amounts).toLocaleString() : "\u2014";
  if (am) am.innerText = "\u20B9" + Math.round(totalSpent / 12).toLocaleString();

  var catMap = {};
  spendOrders.forEach(function(o) {
    (o.items || []).forEach(function(i) { catMap[i.category] = (catMap[i.category] || 0) + i.qty; });
  });
  var topCat = Object.entries(catMap).sort(function(a,b) { return b[1] - a[1]; })[0];
  if (cat) cat.innerText = topCat ? topCat[0] : "\u2014";

  var sv = document.getElementById("expenseSavings");
  if (sv) sv.innerText = "\u20B9" + totalSaved.toLocaleString();

  renderBarChart(year, spendOrders);
  renderCategoryBreakdown(spendOrders);
}

function animateExpenseTotal(target) {
  var el = document.getElementById("expenseTotalAmount");
  if (!el) return;
  var start = 0, step = Math.max(1, Math.ceil(target / 50));
  var iv = setInterval(function() {
    start = Math.min(start + step, target);
    el.innerText = "\u20B9" + start.toLocaleString();
    if (start >= target) clearInterval(iv);
  }, 16);
}

function renderBarChart(year, spendOrders) {
  var monthlyTotals = Array(12).fill(0);
  spendOrders.forEach(function(o) {
    var m = new Date(o.date).getMonth();
    monthlyTotals[m] += orderTotal(o);
  });
  var maxVal  = Math.max.apply(null, monthlyTotals.concat([1]));
  var peakIdx = monthlyTotals.indexOf(Math.max.apply(null, monthlyTotals));

  var chart  = document.getElementById("barChart");
  var labels = document.getElementById("monthLabels");
  if (!chart || !labels) return;
  chart.innerHTML = "";
  labels.innerHTML = "";

  monthlyTotals.forEach(function(val, i) {
    var pct = (val / maxVal) * 100;
    var col = document.createElement("div");
    col.className = "bar-col";
    var fill = document.createElement("div");
    fill.className = "bar-fill" + (val === 0 ? " empty-bar" : "") + (i === peakIdx && val > 0 ? " peak-bar" : "");
    fill.style.height = "3px";
    fill.setAttribute("data-tip", val > 0 ? MONTHS[i] + ": \u20B9" + val.toLocaleString() : MONTHS[i] + ": No spend");
    col.appendChild(fill);
    chart.appendChild(col);
    setTimeout(function() { fill.style.height = pct + "%"; }, 80 + i * 40);

    var lbl = document.createElement("div");
    lbl.className = "month-lbl";
    lbl.innerText = MONTHS[i];
    labels.appendChild(lbl);
  });

  var peakEl = document.getElementById("chartPeak");
  if (peakEl) {
    peakEl.innerText = monthlyTotals[peakIdx] > 0
      ? "Peak: " + MONTHS[peakIdx] + " \u20B9" + monthlyTotals[peakIdx].toLocaleString()
      : "";
  }
}

function renderCategoryBreakdown(spendOrders) {
  var catSpend = {};
  spendOrders.forEach(function(o) {
    (o.items || []).forEach(function(i) {
      var amt = i.price * i.qty;
      catSpend[i.category] = (catSpend[i.category] || 0) + amt;
    });
  });

  var total    = Object.values(catSpend).reduce(function(s,v) { return s + v; }, 0) || 1;
  var sorted   = Object.entries(catSpend).sort(function(a,b) { return b[1] - a[1]; });
  var container = document.getElementById("categoryBars");
  if (!container) return;
  container.innerHTML = "";

  if (!sorted.length) {
    container.innerHTML = '<p style="font-size:13px;color:var(--muted)">No data for this year</p>';
    return;
  }

  sorted.forEach(function(entry, idx) {
    var cat = entry[0], amt = entry[1];
    var pct = Math.round((amt / total) * 100);
    var row = document.createElement("div");
    row.className = "cat-row";
    row.style.animationDelay = (idx * 0.08) + "s";
    row.innerHTML =
      '<div class="cat-row-top">' +
        '<span class="cat-name">' + esc(cat) + '</span>' +
        '<span><span class="cat-amount">\u20B9' + amt.toLocaleString() + '</span>&nbsp;<span class="cat-pct">' + pct + '%</span></span>' +
      '</div>' +
      '<div class="cat-bar-track"><div class="cat-bar-fill" style="width:0%" data-pct="' + pct + '%"></div></div>';
    container.appendChild(row);
    setTimeout(function() { row.querySelector(".cat-bar-fill").style.width = pct + "%"; }, 100 + idx * 80);
  });
}


/* ====================================================
   HELPERS
   ==================================================== */

function esc(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function showToast(message, isError) {
  var toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.remove("error-toast");
  if (isError) toast.classList.add("error-toast");
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { toast.classList.remove("show"); }, 2800);
}