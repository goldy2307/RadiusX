/* ================================================================
   admin-dashboard.js — fully wired to backend
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
  var loggedIn = await api.init();
  if (!loggedIn) { window.location.href = "login.html"; return; }

  var res = await api.get("/auth/me");
  if (!res.success || res.user.role !== "admin") {
    showToast("Access denied. Admin only.");
    setTimeout(function () { window.location.href = "login.html"; }, 1500);
    return;
  }

  api.setUser(res.user);
  document.getElementById("adminName").textContent = res.user.name;
  loadStats();
  loadPendingSellers();
}

/* ================================================================
   THEME
   ================================================================ */
function applyTheme() {
  if (localStorage.getItem("rx_theme") === "light") {
    document.body.classList.add("light-mode");
    var sun  = document.getElementById("themeIconSun");
    var moon = document.getElementById("themeIconMoon");
    if (sun)  sun.style.display  = "none";
    if (moon) moon.style.display = "";
  }
}

function toggleTheme() {
  var isLight = document.body.classList.toggle("light-mode");
  var sun  = document.getElementById("themeIconSun");
  var moon = document.getElementById("themeIconMoon");
  if (sun)  sun.style.display  = isLight ? "none" : "";
  if (moon) moon.style.display = isLight ? "" : "none";
  localStorage.setItem("rx_theme", isLight ? "light" : "dark");
}

/* ================================================================
   SIDEBAR / NAVIGATION
   ================================================================ */
function toggleSidebar() {
  var sb = document.getElementById("sidebar");
  if (sb) sb.classList.toggle("open");
}

function showPage(pageId, navEl) {
  document.querySelectorAll(".page").forEach(function (p) { p.classList.remove("active"); });
  document.querySelectorAll(".nav-item").forEach(function (n) { n.classList.remove("active"); });

  var page = document.getElementById("page-" + pageId);
  if (page) page.classList.add("active");
  if (navEl) navEl.classList.add("active");

  var titles = {
    "overview":        "Dashboard",
    "sellers-pending": "Pending Applications",
    "sellers-approved":"Approved Sellers",
    "sellers-rejected":"Rejected Applications",
    "users":           "All Users",
    "products":        "All Products",
    "orders":          "All Orders",
    "add-product":     "Add Product",
    "broadcast":       "Broadcast Message",
  };
  var el = document.getElementById("topbarTitle");
  if (el) el.textContent = titles[pageId] || "Dashboard";

  if (pageId === "sellers-pending")  loadSellers("pending");
  if (pageId === "sellers-approved") loadSellers("approved");
  if (pageId === "sellers-rejected") loadSellers("rejected");
  if (pageId === "users")            loadUsers();
  if (pageId === "products")         loadProducts("");
  if (pageId === "orders")           loadAdminOrders();
}

/* ================================================================
   STATS
   ================================================================ */
async function loadStats() {
  var res = await api.get("/admin/stats");
  if (!res.success) return;
  var s = res.stats;
  setText("stat-users",            s.totalUsers     || 0);
  setText("stat-sellers",          s.totalSellers   || 0);
  setText("stat-pending",          s.pendingSellers  || 0);
  setText("stat-products",         s.totalProducts   || 0);
  setText("sum-approved",          s.approvedSellers || 0);
  setText("sum-rejected",          s.rejectedSellers || 0);
  setText("sum-active-products",   s.activeProducts  || 0);
  var badge = document.getElementById("pendingBadge");
  if (badge) badge.textContent = s.pendingSellers || 0;
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ================================================================
   PENDING SELLERS (overview panel)
   ================================================================ */
async function loadPendingSellers() {
  var el = document.getElementById("recentPending");
  if (!el) return;
  var res = await api.get("/admin/sellers?status=pending&limit=5");
  if (!res.success || !res.sellers || !res.sellers.length) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">No pending applications</div>';
    return;
  }
  el.innerHTML = res.sellers.map(function (s) {
    return '<div class="summary-row">' +
      '<span>' + esc(s.ownerName) + ' &mdash; <em>' + esc(s.storeName) + '</em></span>' +
      '<button class="tbl-btn tbl-btn-review" onclick=\'openReviewModal("' + s._id + '",' + safeJSON(s) + ')\'>Review</button>' +
    '</div>';
  }).join("");
}

/* ================================================================
   SELLERS TABLE
   ================================================================ */
async function loadSellers(status) {
  var bodyId = status + "TableBody";
  var tbody  = document.getElementById(bodyId);
  if (!tbody) return;
  var cols = status === "rejected" ? 4 : 5;
  tbody.innerHTML = loadingRow(cols);

  var res = await api.get("/admin/sellers?status=" + status + "&limit=50");
  if (!res.success || !res.sellers || !res.sellers.length) {
    tbody.innerHTML = emptyRow(cols, "No " + status + " applications.");
    return;
  }

  if (status === "pending") {
    tbody.innerHTML = res.sellers.map(function (s) {
      return '<tr>' +
        '<td><strong>' + esc(s.ownerName) + '</strong><br><small style="color:var(--muted)">' + esc(s.email) + '</small></td>' +
        '<td>' + esc(s.storeName) + '</td>' +
        '<td>' + esc(s.category) + '</td>' +
        '<td>' + fmtDate(s.createdAt) + '</td>' +
        '<td><button class="tbl-btn tbl-btn-review" onclick=\'openReviewModal("' + s._id + '",' + safeJSON(s) + ')\'>Review</button></td>' +
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
  if (!tbody) return;
  tbody.innerHTML = loadingRow(6);

  var res = await api.get("/admin/users?limit=50");
  if (!res.success || !res.users || !res.users.length) {
    tbody.innerHTML = emptyRow(6, "No users found.");
    return;
  }

  tbody.innerHTML = res.users.map(function (u) {
    var roleBadge   = u.role === "seller" ? '<span class="badge badge-active">Seller</span>' :
                      u.role === "admin"  ? '<span class="badge badge-approved">Admin</span>' :
                                           '<span class="badge">Buyer</span>';
    var statusBadge = u.isActive
      ? '<span class="badge badge-approved">Active</span>'
      : '<span class="badge badge-rejected">Disabled</span>';
    return '<tr>' +
      '<td><button class="tbl-btn-name" onclick=\'openUserModal("' + u._id + '")\' title="View profile & orders">' + esc(u.name) + '</button></td>' +
      '<td>' + esc(u.email) + '</td>' +
      '<td>' + esc(u.mobile || "--") + '</td>' +
      '<td>' + roleBadge + '</td>' +
      '<td>' + fmtDate(u.createdAt) + '</td>' +
      '<td>' + statusBadge + '</td>' +
    '</tr>';
  }).join("");
}

/* ================================================================
   USER DETAIL MODAL
   ================================================================ */
async function openUserModal(userId) {
  var modal = document.getElementById("userModal");
  var body  = document.getElementById("userModalBody");
  var title = document.getElementById("userModalTitle");
  if (!modal) return;

  body.innerHTML  = '<div class="loading-row"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading user data...</div>';
  title.textContent = "User Profile";
  modal.classList.add("open");

  var res = await api.get("/admin/users/" + userId);
  if (!res.success) {
    body.innerHTML = '<p style="color:var(--error);text-align:center;padding:20px">' + esc(res.message || "Failed to load user") + '</p>';
    return;
  }

  var u = res.user;
  var orders = res.orders || [];
  title.textContent = u.name + " — Profile";

  var orderRows = orders.length
    ? orders.map(function(o) {
        var total = (o.items||[]).reduce(function(s,i){ return s+i.price*i.qty; }, 0);
        var items = (o.items||[]).map(function(i){ return esc(i.name); }).join(", ");
        return '<tr>' +
          '<td style="font-size:11px;font-family:monospace">' + esc(o._id.toString().slice(-8).toUpperCase()) + '</td>' +
          '<td>' + items + '</td>' +
          '<td>&#8377;' + total.toLocaleString() + '</td>' +
          '<td>' + fmtDate(o.createdAt) + '</td>' +
          '<td>' + statusBadgeHTML(o.status) + '</td>' +
        '</tr>';
      }).join("")
    : '<tr><td colspan="5" class="table-empty">No orders yet</td></tr>';

  body.innerHTML =
    '<div class="user-modal-grid">' +
      '<div class="user-modal-info">' +
        '<div class="umo-row"><span>Name</span><strong>' + esc(u.name) + '</strong></div>' +
        '<div class="umo-row"><span>Email</span><strong>' + esc(u.email) + '</strong></div>' +
        '<div class="umo-row"><span>Mobile</span><strong>' + esc(u.mobile || "--") + '</strong></div>' +
        '<div class="umo-row"><span>Role</span><strong>' + esc(u.role) + '</strong></div>' +
        '<div class="umo-row"><span>Joined</span><strong>' + fmtDate(u.createdAt) + '</strong></div>' +
        '<div class="umo-row"><span>Status</span><strong>' + (u.isActive ? "Active" : "Disabled") + '</strong></div>' +
        (u.address ? '<div class="umo-row"><span>Address</span><strong>' + esc(u.address) + '</strong></div>' : '') +
        (u.pincode ? '<div class="umo-row"><span>Pincode</span><strong>' + esc(u.pincode) + '</strong></div>' : '') +
      '</div>' +
    '</div>' +
    '<h4 style="margin:20px 0 10px;font-size:14px;color:var(--muted)">Order History (' + orders.length + ')</h4>' +
    '<div class="table-scroll">' +
      '<table class="data-table">' +
        '<thead><tr><th>Order ID</th><th>Items</th><th>Total</th><th>Date</th><th>Status</th></tr></thead>' +
        '<tbody>' + orderRows + '</tbody>' +
      '</table>' +
    '</div>';
}

function closeUserModal() {
  var modal = document.getElementById("userModal");
  if (modal) modal.classList.remove("open");
}

/* ================================================================
   PRODUCTS TABLE
   ================================================================ */
async function loadProducts(category) {
  var tbody = document.getElementById("productsTableBody");
  if (!tbody) return;
  tbody.innerHTML = loadingRow(7);

  var url = "/admin/products?limit=50" + (category ? "&category=" + category : "");
  var res = await api.get(url);
  if (!res.success || !res.products || !res.products.length) {
    tbody.innerHTML = emptyRow(7, "No products found. Add one using the sidebar.");
    return;
  }

  tbody.innerHTML = res.products.map(function (p) {
    var badge = p.isActive
      ? '<span class="badge badge-approved">Active</span>'
      : '<span class="badge badge-rejected">Hidden</span>';
    return '<tr>' +
      '<td><strong>' + esc(p.name) + '</strong></td>' +
      '<td>' + esc((p.seller && p.seller.name) || "Admin") + '</td>' +
      '<td>' + esc(p.category) + '</td>' +
      '<td>&#8377;' + (p.price || 0).toLocaleString() + '</td>' +
      '<td>' + (p.stock || 0) + '</td>' +
      '<td>' + badge + '</td>' +
      '<td>' +
        '<button class="tbl-btn tbl-btn-review" onclick="toggleProduct(\'' + p._id + '\',this)">' + (p.isActive ? "Hide" : "Show") + '</button> ' +
        '<button class="tbl-btn" style="background:rgba(255,80,80,0.1);color:rgb(255,100,100);border-color:rgba(255,80,80,0.2)" onclick="deleteProduct(\'' + p._id + '\',this)">Delete</button>' +
      '</td>' +
    '</tr>';
  }).join("");
}

async function toggleProduct(id, btn) {
  btn.disabled = true;
  var res = await api.patch("/products/" + id + "/toggle");
  btn.disabled = false;
  if (res.success) {
    btn.textContent = res.isActive ? "Hide" : "Show";
    showToast("Product " + (res.isActive ? "activated" : "hidden"));
  } else {
    showToast(res.message || "Toggle failed", true);
  }
}

async function deleteProduct(id, btn) {
  if (!confirm("Delete this product permanently?")) return;
  btn.disabled = true;
  var res = await api.del("/products/" + id);
  if (res.success) {
    btn.closest("tr").remove();
    showToast("Product deleted");
  } else {
    btn.disabled = false;
    showToast(res.message || "Delete failed", true);
  }
}

/* ================================================================
   ADD PRODUCT FORM
   ================================================================ */
var selectedImages = [];

function handleImageSelect(input) {
  selectedImages = Array.from(input.files);
  var label = document.getElementById("pImagesLabel");
  if (label) label.textContent = selectedImages.length + " image(s) selected";
}

async function submitProduct() {
  /* Clear errors */
  ["pName","pDesc","pCategory","pPincode","pPrice","pOriginal","pStock"].forEach(function(id) {
    var e = document.getElementById(id + "Err"); if (e) e.textContent = "";
  });

  var name     = (document.getElementById("pName")     || {}).value || "";
  var desc     = (document.getElementById("pDesc")     || {}).value || "";
  var category = (document.getElementById("pCategory") || {}).value || "";
  var pincode  = (document.getElementById("pPincode")  || {}).value || "";
  var price    = (document.getElementById("pPrice")    || {}).value || "";
  var original = (document.getElementById("pOriginal") || {}).value || "";
  var stock    = (document.getElementById("pStock")    || {}).value || "";

  var valid = true;
  if (!name.trim())                 { setFieldErr("pName",     "Product name is required"); valid = false; }
  if (desc.trim().length < 10)      { setFieldErr("pDesc",     "Description must be at least 10 chars"); valid = false; }
  if (!category)                    { setFieldErr("pCategory", "Select a category"); valid = false; }
  if (!/^\d{6}$/.test(pincode))     { setFieldErr("pPincode",  "Valid 6-digit pincode required"); valid = false; }
  if (!price || parseFloat(price)<0){ setFieldErr("pPrice",    "Valid price required"); valid = false; }
  if (!original)                    { setFieldErr("pOriginal", "Original price required"); valid = false; }
  if (stock === "")                  { setFieldErr("pStock",    "Stock quantity required"); valid = false; }
  if (!valid) return;

  var formData = new FormData();
  formData.append("name",          name.trim());
  formData.append("description",   desc.trim());
  formData.append("category",      category);
  formData.append("pincode",       pincode);
  formData.append("price",         price);
  formData.append("originalPrice", original);
  formData.append("stock",         stock);
  selectedImages.forEach(function(img) { formData.append("images", img); });

  var btn = document.querySelector('#page-add-product .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = "Saving..."; }

  var res = await api.upload("/products", formData);

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Product'; }

  var msgEl = document.getElementById("productFormMsg");
  if (res && res.success) {
    if (msgEl) { msgEl.textContent = "Product added successfully!"; msgEl.style.color = "var(--success)"; }
    /* Reset form */
    ["pName","pDesc","pPincode","pPrice","pOriginal","pStock"].forEach(function(id){
      var el = document.getElementById(id); if (el) el.value = "";
    });
    document.getElementById("pCategory").value = "";
    document.getElementById("pImages").value   = "";
    selectedImages = [];
    var lbl = document.getElementById("pImagesLabel");
    if (lbl) lbl.textContent = "Click to select images (JPG, PNG, WEBP)";
    setTimeout(function() { if (msgEl) msgEl.textContent = ""; }, 3000);
  } else {
    if (msgEl) { msgEl.textContent = (res && res.message) || "Failed to add product."; msgEl.style.color = "var(--error)"; }
  }
}

function setFieldErr(fieldId, msg) {
  var el = document.getElementById(fieldId + "Err");
  if (el) el.textContent = msg;
}

/* ================================================================
   ORDERS TABLE — all orders with status update
   ================================================================ */
async function loadAdminOrders(statusFilter) {
  var tbody = document.getElementById("ordersTableBody");
  if (!tbody) return;
  tbody.innerHTML = loadingRow(7);

  var url = "/admin/orders?limit=100" + (statusFilter ? "&status=" + statusFilter : "");
  var res = await api.get(url);

  if (!res.success || !res.orders || !res.orders.length) {
    tbody.innerHTML = emptyRow(7, "No orders found.");
    return;
  }

  tbody.innerHTML = res.orders.map(function (o) {
    var total    = (o.items||[]).reduce(function(s,i){ return s+i.price*i.qty; }, 0);
    var items    = (o.items||[]).map(function(i){ return esc(i.name); }).join(", ");
    var userName = (o.user && o.user.name)  ? esc(o.user.name)  : "--";
    var userEmail= (o.user && o.user.email) ? esc(o.user.email) : "";
    var oid      = o._id.toString().slice(-8).toUpperCase();
    return '<tr>' +
      '<td style="font-family:monospace;font-size:12px;white-space:nowrap">' + oid + '</td>' +
      '<td style="white-space:nowrap"><strong>' + userName + '</strong><br><small style="color:var(--muted)">' + userEmail + '</small></td>' +
      '<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + items + '">' + items + '</td>' +
      '<td style="white-space:nowrap">&#8377;' + total.toLocaleString() + '</td>' +
      '<td style="white-space:nowrap">' + fmtDate(o.createdAt) + '</td>' +
      '<td style="white-space:nowrap">' + statusBadgeHTML(o.status) + '</td>' +
      '<td style="white-space:nowrap">' +
        '<select class="order-status-select" onchange="updateOrderStatus(\'' + o._id + '\',this)">' +
          statusOptions(o.status) +
        '</select>' +
      '</td>' +
    '</tr>';
  }).join("");
}

function statusOptions(current) {
  return ["processing","shipped","delivered","cancelled","returned"].map(function(s) {
    return '<option value="' + s + '"' + (s === current ? " selected" : "") + '>' +
      s.charAt(0).toUpperCase() + s.slice(1) + '</option>';
  }).join("");
}

function statusBadgeHTML(status) {
  var map = { processing:"badge-pending", shipped:"badge-active", delivered:"badge-approved", cancelled:"badge-rejected", returned:"badge-pending" };
  return '<span class="badge ' + (map[status] || "badge-pending") + '">' + (status || "unknown") + '</span>';
}

async function updateOrderStatus(orderId, selectEl) {
  var newStatus = selectEl.value;
  selectEl.disabled = true;
  var res = await api.patch("/admin/orders/" + orderId + "/status", { status: newStatus });
  selectEl.disabled = false;
  if (res.success) {
    showToast("Order updated to: " + newStatus);
    var row  = selectEl.closest("tr");
    var cell = row && row.cells[5];
    if (cell) cell.innerHTML = statusBadgeHTML(newStatus);
  } else {
    showToast(res.message || "Update failed", true);
    loadAdminOrders();
  }
}

function filterOrders(statusFilter) {
  loadAdminOrders(statusFilter || "");
}

/* ================================================================
   BROADCAST
   ================================================================ */
async function sendBroadcast() {
  var target  = (document.getElementById("bcTarget")  || {}).value || "all";
  var subject = (document.getElementById("bcSubject") || {}).value || "";
  var message = (document.getElementById("bcMessage") || {}).value || "";
  var msgEl   = document.getElementById("broadcastMsg");

  if (!subject.trim() || !message.trim()) {
    if (msgEl) { msgEl.textContent = "Subject and message are required."; msgEl.style.color = "var(--error)"; }
    return;
  }

  var btn = document.querySelector('#page-broadcast .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }

  var res = await api.post("/admin/broadcast", { target, subject: subject.trim(), message: message.trim() });

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Broadcast'; }

  if (res && res.success) {
    if (msgEl) { msgEl.textContent = res.message; msgEl.style.color = "var(--success)"; }
    document.getElementById("bcSubject").value = "";
    document.getElementById("bcMessage").value = "";
  } else {
    if (msgEl) { msgEl.textContent = (res && res.message) || "Broadcast failed."; msgEl.style.color = "var(--error)"; }
  }
}

/* ================================================================
   REVIEW MODAL
   ================================================================ */
function safeJSON(s) {
  try {
    return JSON.stringify({
      _id: s._id, ownerName: s.ownerName, email: s.email,
      storeName: s.storeName, bizName: s.bizName, pan: s.pan,
      category: s.category, storeAddr: s.storeAddr, mobile: s.mobile,
      pincode: s.pincode, gst: s.gst || "", bankName: s.bankName,
      accName: s.accName, ifsc: s.ifsc, status: s.status,
      adminNote: s.adminNote || ""
    }).replace(/'/g, "\\'").replace(/"/g, "&quot;");
  } catch(e) { return "{}"; }
}

function openReviewModal(id, dataAttr) {
  currentSellerId = id;
  var s;
  try { s = typeof dataAttr === "string" ? JSON.parse(dataAttr.replace(/&quot;/g,'"')) : dataAttr; }
  catch(e) { s = {}; }

  setText("modalTitle", "Review: " + (s.storeName || "Application"));
  var info = document.getElementById("modalSellerInfo");
  if (info) info.innerHTML =
    '<div class="umo-row"><span>Applicant</span><strong>' + esc(s.ownerName) + '</strong></div>' +
    '<div class="umo-row"><span>Email</span><strong>'     + esc(s.email)     + '</strong></div>' +
    '<div class="umo-row"><span>Mobile</span><strong>'    + esc(s.mobile||"")+ '</strong></div>' +
    '<div class="umo-row"><span>Business</span><strong>'  + esc(s.bizName||"")+'</strong></div>' +
    '<div class="umo-row"><span>PAN</span><strong>'       + esc(s.pan||"")   + '</strong></div>' +
    '<div class="umo-row"><span>GST</span><strong>'       + esc(s.gst||"--") + '</strong></div>' +
    '<div class="umo-row"><span>Category</span><strong>'  + esc(s.category||"")+'</strong></div>' +
    '<div class="umo-row"><span>Store</span><strong>'     + esc(s.storeName||"")+'</strong></div>' +
    '<div class="umo-row"><span>Address</span><strong>'   + esc(s.storeAddr||"")+'</strong></div>' +
    '<div class="umo-row"><span>Pincode</span><strong>'   + esc(s.pincode||"")+'</strong></div>' +
    '<div class="umo-row"><span>Bank</span><strong>'      + esc(s.bankName||"")+'</strong></div>' +
    '<div class="umo-row"><span>IFSC</span><strong>'      + esc(s.ifsc||"")  + '</strong></div>' +
    '<div class="umo-row"><span>Account</span><strong>'   + esc(s.accName||"")+'</strong></div>';

  var rw = document.getElementById("rejectReasonWrap");
  var sb = document.getElementById("submitRejectBtn");
  var rb = document.getElementById("rejectBtn");
  var ab = document.getElementById("approveBtn");
  var rr = document.getElementById("rejectReason");
  var mm = document.getElementById("modalMsg");
  if (rw) rw.style.display = "none";
  if (sb) sb.style.display = "none";
  if (rb) rb.style.display = "";
  if (ab) ab.style.display = "";
  if (rr) rr.value = "";
  if (mm) { mm.textContent = ""; mm.className = "modal-msg"; }

  var modal = document.getElementById("reviewModal");
  if (modal) modal.classList.add("open");
}

function closeModal() {
  var modal = document.getElementById("reviewModal");
  if (modal) modal.classList.remove("open");
  currentSellerId = null;
}

function toggleRejectReason() {
  var rw = document.getElementById("rejectReasonWrap");
  var sb = document.getElementById("submitRejectBtn");
  var rb = document.getElementById("rejectBtn");
  var ab = document.getElementById("approveBtn");
  if (rw) rw.style.display = "";
  if (sb) sb.style.display = "";
  if (rb) rb.style.display = "none";
  if (ab) ab.style.display = "none";
}

async function submitReview(status) {
  if (!currentSellerId) return;
  var reason    = (document.getElementById("rejectReason") || {}).value || "";
  reason = reason.trim();
  if (status === "rejected" && reason.length < 5) {
    showModalMsg("Enter a rejection reason (min 5 chars).", true); return;
  }

  var ab = document.getElementById("approveBtn");
  var sb = document.getElementById("submitRejectBtn");
  if (ab) ab.disabled = true;
  if (sb) sb.disabled = true;

  var res = await api.patch("/admin/sellers/" + currentSellerId + "/review", {
    status, adminNote: reason
  });

  if (ab) ab.disabled = false;
  if (sb) sb.disabled = false;

  if (res.success) {
    showToast(status === "approved" ? "Seller approved — account created." : "Application rejected.");
    closeModal();
    loadStats();
    loadPendingSellers();
  } else {
    showModalMsg(res.message || "Action failed.", true);
  }
}

function showModalMsg(msg, isErr) {
  var el = document.getElementById("modalMsg");
  if (!el) return;
  el.textContent = msg;
  el.className   = "modal-msg" + (isErr ? " err" : "");
}

/* ================================================================
   TABLE HELPERS
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
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function fmtDate(dateStr) {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

function loadingRow(cols) {
  return '<tr><td colspan="' + cols + '" class="table-empty"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading...</td></tr>';
}

function emptyRow(cols, msg) {
  return '<tr><td colspan="' + cols + '" class="table-empty">' + esc(msg) + '</td></tr>';
}

var _toastTimer = null;
function showToast(msg, isErr) {
  var el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className   = "toast" + (isErr ? " err" : "");
  el.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2800);
}