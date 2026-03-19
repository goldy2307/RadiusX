/* ================================================================
   admin-dashboard.js
   ================================================================ */

var currentSellerId = null;

/* ================================================================
   INIT
   ================================================================ */
window.addEventListener("DOMContentLoaded", function () {
  applyTheme();
  checkAdminAuth();
});

async function checkAdminAuth() {
  /* Try to restore session from refresh cookie */
  var loggedIn = await api.init();

  if (!loggedIn) {
    window.location.href = "login.html";
    return;
  }

  var res = await api.get("/auth/me");
  if (!res.success || res.user.role !== "admin") {
    showToast("Access denied. Admin only.");
    setTimeout(function () { window.location.href = "login.html"; }, 1500);
    return;
  }

  document.getElementById("adminName").textContent = res.user.name;
  loadStats();
  loadPendingSellers();
}

/* ================================================================
   THEME
   ================================================================ */
function applyTheme() {
  var saved = localStorage.getItem("rx_theme");
  if (saved === "light") {
    document.body.classList.add("light-mode");
    document.getElementById("themeIconSun").style.display  = "none";
    document.getElementById("themeIconMoon").style.display = "";
    updateLogos(true);
  }
}

function toggleTheme() {
  var isLight = document.body.classList.toggle("light-mode");
  document.getElementById("themeIconSun").style.display  = isLight ? "none" : "";
  document.getElementById("themeIconMoon").style.display = isLight ? "" : "none";
  localStorage.setItem("rx_theme", isLight ? "light" : "dark");
  updateLogos(isLight);
}

function updateLogos(isLight) {
  var logo = isLight ? "assets/logo/logo-light.png" : "assets/logo/logo.png";
  var el = document.getElementById("sidebarLogo");
  if (el) el.src = logo;
}

/* ================================================================
   SIDEBAR / NAVIGATION
   ================================================================ */
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

function showPage(pageId, navEl) {
  /* Hide all pages */
  document.querySelectorAll(".page").forEach(function (p) { p.classList.remove("active"); });
  /* Deactivate all nav items */
  document.querySelectorAll(".nav-item").forEach(function (n) { n.classList.remove("active"); });

  /* Show selected page */
  var page = document.getElementById("page-" + pageId);
  if (page) page.classList.add("active");

  /* Activate nav item */
  if (navEl) navEl.classList.add("active");

  /* Update topbar title */
  var titles = {
    "overview":          "Dashboard",
    "sellers-pending":   "Pending Applications",
    "sellers-approved":  "Approved Sellers",
    "sellers-rejected":  "Rejected Applications",
    "users":             "All Users",
    "products":          "All Products"
  };
  document.getElementById("topbarTitle").textContent = titles[pageId] || "Dashboard";

  /* Load data for the page */
  if (pageId === "sellers-pending")  loadSellers("pending");
  if (pageId === "sellers-approved") loadSellers("approved");
  if (pageId === "sellers-rejected") loadSellers("rejected");
  if (pageId === "users")            loadUsers();
  if (pageId === "products")         loadProducts("");
}

/* ================================================================
   STATS
   ================================================================ */
async function loadStats() {
  var res = await api.get("/admin/stats");
  if (!res.success) return;
  var s = res.stats;
  document.getElementById("stat-users").textContent    = s.totalUsers    || 0;
  document.getElementById("stat-sellers").textContent  = s.totalSellers  || 0;
  document.getElementById("stat-pending").textContent  = s.pendingSellers || 0;
  document.getElementById("stat-products").textContent = s.totalProducts  || 0;
  document.getElementById("sum-approved").textContent  = s.approvedSellers || 0;
  document.getElementById("sum-rejected").textContent  = s.rejectedSellers || 0;
  document.getElementById("sum-active-products").textContent = s.activeProducts || 0;

  /* Update badge */
  var badge = document.getElementById("pendingBadge");
  if (badge) badge.textContent = s.pendingSellers || 0;
}

/* ================================================================
   PENDING SELLERS (overview panel)
   ================================================================ */
async function loadPendingSellers() {
  var res = await api.get("/admin/sellers?status=pending&limit=5");
  var el = document.getElementById("recentPending");
  if (!res.success || !res.sellers.length) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;">No pending applications</div>';
    return;
  }
  el.innerHTML = res.sellers.map(function (s) {
    return '<div class="summary-row">' +
      '<span>' + esc(s.ownerName) + ' &mdash; ' + esc(s.storeName) + '</span>' +
      '<button class="tbl-btn tbl-btn-review" onclick="openReviewModal(\'' + s._id + '\', ' + JSON.stringify(s).replace(/'/g, "\\'") + ')">Review</button>' +
    '</div>';
  }).join("");
}

/* ================================================================
   SELLERS TABLE
   ================================================================ */
async function loadSellers(status) {
  var tbody = document.getElementById(status + "TableBody");
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" class="table-empty"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading...</td></tr>';

  var res = await api.get("/admin/sellers?status=" + status + "&limit=50");
  if (!res.success || !res.sellers.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No ' + status + ' applications found.</td></tr>';
    return;
  }

  if (status === "pending") {
    tbody.innerHTML = res.sellers.map(function (s) {
      return '<tr>' +
        '<td><strong>' + esc(s.ownerName) + '</strong><br><small style="color:var(--muted)">' + esc(s.email) + '</small></td>' +
        '<td>' + esc(s.storeName) + '</td>' +
        '<td><span class="badge badge-pending">' + esc(s.category) + '</span></td>' +
        '<td>' + fmtDate(s.createdAt) + '</td>' +
        '<td><button class="tbl-btn tbl-btn-review" onclick="openReviewModal(\'' + s._id + '\', ' + encodeSellerData(s) + ')">Review</button></td>' +
      '</tr>';
    }).join("");

  } else if (status === "approved") {
    tbody.innerHTML = res.sellers.map(function (s) {
      return '<tr>' +
        '<td><strong>' + esc(s.ownerName) + '</strong><br><small style="color:var(--muted)">' + esc(s.email) + '</small></td>' +
        '<td>' + esc(s.storeName) + '</td>' +
        '<td>' + esc(s.category) + '</td>' +
        '<td>' + fmtDate(s.reviewedAt) + '</td>' +
        '<td><span class="badge badge-approved">Approved</span></td>' +
      '</tr>';
    }).join("");

  } else {
    tbody.innerHTML = res.sellers.map(function (s) {
      return '<tr>' +
        '<td><strong>' + esc(s.ownerName) + '</strong><br><small style="color:var(--muted)">' + esc(s.email) + '</small></td>' +
        '<td>' + esc(s.storeName) + '</td>' +
        '<td style="max-width:200px;color:var(--muted);font-size:12px">' + esc(s.adminNote || "No reason given") + '</td>' +
        '<td>' + fmtDate(s.reviewedAt) + '</td>' +
      '</tr>';
    }).join("");
  }
}

/* ================================================================
   USERS TABLE
   ================================================================ */
async function loadUsers() {
  var tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = '<tr><td colspan="5" class="table-empty"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading...</td></tr>';

  var res = await api.get("/admin/users?role=buyer&limit=50");
  if (!res.success || !res.users.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No users found.</td></tr>';
    return;
  }

  tbody.innerHTML = res.users.map(function (u) {
    var badge = u.isActive
      ? '<span class="badge badge-active">Active</span>'
      : '<span class="badge badge-inactive">Disabled</span>';
    return '<tr>' +
      '<td><strong>' + esc(u.name) + '</strong></td>' +
      '<td>' + esc(u.email) + '</td>' +
      '<td>' + esc(u.mobile) + '</td>' +
      '<td>' + fmtDate(u.createdAt) + '</td>' +
      '<td>' + badge + '</td>' +
    '</tr>';
  }).join("");
}

/* ================================================================
   PRODUCTS TABLE
   ================================================================ */
async function loadProducts(category) {
  var tbody = document.getElementById("productsTableBody");
  tbody.innerHTML = '<tr><td colspan="6" class="table-empty"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading...</td></tr>';

  var url = "/admin/products?limit=50" + (category ? "&category=" + category : "");
  var res = await api.get(url);
  if (!res.success || !res.products.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No products found.</td></tr>';
    return;
  }

  tbody.innerHTML = res.products.map(function (p) {
    var badge = p.isActive
      ? '<span class="badge badge-active">Active</span>'
      : '<span class="badge badge-inactive">Hidden</span>';
    return '<tr>' +
      '<td><strong>' + esc(p.name) + '</strong></td>' +
      '<td>' + esc((p.seller && p.seller.name) || "Unknown") + '</td>' +
      '<td>' + esc(p.category) + '</td>' +
      '<td>Rs.' + p.price.toLocaleString() + '</td>' +
      '<td>' + p.stock + '</td>' +
      '<td>' + badge + '</td>' +
    '</tr>';
  }).join("");
}

/* ================================================================
   REVIEW MODAL
   ================================================================ */
function encodeSellerData(s) {
  return "'" + JSON.stringify({
    id: s._id, ownerName: s.ownerName, email: s.email,
    storeName: s.storeName, bizName: s.bizName, pan: s.pan,
    category: s.category, storeAddr: s.storeAddr, mobile: s.mobile
  }).replace(/'/g, "\\'") + "'";
}

function openReviewModal(id, dataStr) {
  currentSellerId = id;
  var s = typeof dataStr === "string" ? JSON.parse(dataStr) : dataStr;

  document.getElementById("modalTitle").textContent = "Review: " + s.storeName;
  document.getElementById("modalSellerInfo").innerHTML =
    '<strong>Applicant:</strong> ' + esc(s.ownerName) + '<br>' +
    '<strong>Email:</strong> ' + esc(s.email) + '<br>' +
    '<strong>Mobile:</strong> ' + esc(s.mobile || "") + '<br>' +
    '<strong>Business:</strong> ' + esc(s.bizName || "") + '<br>' +
    '<strong>Category:</strong> ' + esc(s.category) + '<br>' +
    '<strong>Address:</strong> ' + esc(s.storeAddr || "");

  document.getElementById("rejectReasonWrap").style.display  = "none";
  document.getElementById("submitRejectBtn").style.display   = "none";
  document.getElementById("rejectBtn").style.display         = "";
  document.getElementById("approveBtn").style.display        = "";
  document.getElementById("rejectReason").value              = "";
  document.getElementById("modalMsg").textContent            = "";
  document.getElementById("modalMsg").className              = "modal-msg";

  document.getElementById("reviewModal").classList.add("open");
}

function closeModal() {
  document.getElementById("reviewModal").classList.remove("open");
  currentSellerId = null;
}

function toggleRejectReason() {
  document.getElementById("rejectReasonWrap").style.display = "";
  document.getElementById("submitRejectBtn").style.display  = "";
  document.getElementById("rejectBtn").style.display        = "none";
  document.getElementById("approveBtn").style.display       = "none";
}

async function submitReview(status) {
  if (!currentSellerId) return;

  var reason = document.getElementById("rejectReason").value.trim();
  if (status === "rejected" && reason.length < 5) {
    showModalMsg("Please enter a rejection reason (min 5 characters).", true);
    return;
  }

  var res = await api.patch("/admin/sellers/" + currentSellerId + "/review", {
    status: status,
    adminNote: reason
  });

  if (res.success) {
    showToast(status === "approved" ? "Seller approved!" : "Application rejected.");
    closeModal();
    loadStats();
    loadPendingSellers();
  } else {
    showModalMsg(res.message || "Action failed.", true);
  }
}

function showModalMsg(msg, isErr) {
  var el = document.getElementById("modalMsg");
  el.textContent = msg;
  el.className = "modal-msg" + (isErr ? " err" : "");
}

/* ================================================================
   TABLE SEARCH FILTER
   ================================================================ */
function filterTable(tableId, query) {
  var table = document.getElementById(tableId);
  if (!table) return;
  var q = query.toLowerCase();
  table.querySelectorAll("tbody tr").forEach(function (row) {
    row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}

/* ================================================================
   LOGOUT
   ================================================================ */
async function handleLogout() {
  await api.logout();
  window.location.href = "login.html";
}

/* ================================================================
   HELPERS
   ================================================================ */
function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtDate(dateStr) {
  if (!dateStr) return "--";
  var d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

var toastTimer = null;
function showToast(msg) {
  var el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2800);
}