/* ================================================================
   seller-dashboard.js
   ================================================================ */

/* ================================================================
   INIT
   ================================================================ */
window.addEventListener("DOMContentLoaded", function () {
  applyTheme();
  checkSellerAuth();
});

async function checkSellerAuth() {
  var loggedIn = await api.init();
  if (!loggedIn) {
    window.location.href = "login.html";
    return;
  }

  var res = await api.get("/auth/me");
  if (!res.success) {
    window.location.href = "login.html";
    return;
  }

  var user = res.user;

  /* If still a buyer (application pending), show banner */
  if (user.role === "buyer") {
    document.getElementById("approvalBanner").classList.remove("hidden");
    document.getElementById("sellerName").textContent  = user.name;
    document.getElementById("welcomeName").textContent = user.name;
    /* Still show basic dashboard but no products */
    setStats(0, 0, 0);
    return;
  }

  if (user.role !== "seller" && user.role !== "admin") {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("sellerName").textContent  = user.name;
  document.getElementById("welcomeName").textContent = user.name;

  loadDashboardStats();
  loadRecentProducts();
  loadStoreProfile();
}

/* ================================================================
   THEME
   ================================================================ */
function applyTheme() {
  if (localStorage.getItem("rx_theme") === "light") {
    document.body.classList.add("light-mode");
    document.getElementById("themeIconSun").style.display  = "none";
    document.getElementById("themeIconMoon").style.display = "";
    updateLogo(true);
  }
}

function toggleTheme() {
  var isLight = document.body.classList.toggle("light-mode");
  document.getElementById("themeIconSun").style.display  = isLight ? "none" : "";
  document.getElementById("themeIconMoon").style.display = isLight ? "" : "none";
  localStorage.setItem("rx_theme", isLight ? "light" : "dark");
  updateLogo(isLight);
}

function updateLogo(isLight) {
  var el = document.getElementById("sidebarLogo");
  if (el) el.src = isLight ? "assets/logo/logo-light.png" : "assets/logo/logo.png";
}

/* ================================================================
   SIDEBAR / NAVIGATION
   ================================================================ */
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

function showPage(pageId, navEl) {
  document.querySelectorAll(".page").forEach(function (p) { p.classList.remove("active"); });
  document.querySelectorAll(".nav-item").forEach(function (n) { n.classList.remove("active"); });

  var page = document.getElementById("page-" + pageId);
  if (page) page.classList.add("active");
  if (navEl) navEl.classList.add("active");

  var titles = {
    "overview":    "Dashboard",
    "products":    "My Products",
    "add-product": "Add New Product",
    "store":       "Store Profile"
  };

  document.getElementById("topbarTitle").textContent = titles[pageId] || "Dashboard";

  if (pageId === "products") loadMyProducts();
}

/* ================================================================
   STATS
   ================================================================ */
async function loadDashboardStats() {
  var res = await api.get("/seller/dashboard-stats");
  if (!res.success) return;
  setStats(res.stats.totalProducts, res.stats.activeProducts, res.stats.outOfStock);
}

function setStats(total, active, outOf) {
  document.getElementById("stat-total").textContent  = total;
  document.getElementById("stat-active").textContent = active;
  document.getElementById("stat-out").textContent    = outOf;
}

/* ================================================================
   RECENT PRODUCTS (overview)
   ================================================================ */
async function loadRecentProducts() {
  var res = await api.get("/seller/my-products?limit=5");
  var el = document.getElementById("recentProducts");

  if (!res.success || !res.products.length) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">No products yet. <a href="#" onclick="showPage(\'add-product\', document.querySelector(\'[data-page=add-product]\'))" style="color:var(--accent)">Add your first product</a>.</div>';
    return;
  }

  el.innerHTML = res.products.map(function (p) {
    var badge = p.isActive
      ? '<span class="badge badge-active">Active</span>'
      : '<span class="badge badge-inactive">Hidden</span>';
    return '<div class="summary-row">' +
      '<span>' + esc(p.name) + '</span>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="font-size:12px;color:var(--muted)">Rs.' + p.price.toLocaleString() + '</span>' +
        badge +
      '</div>' +
    '</div>';
  }).join("");
}

/* ================================================================
   MY PRODUCTS TABLE
   ================================================================ */
async function loadMyProducts() {
  var tbody = document.getElementById("sellerProductsBody");
  tbody.innerHTML = '<tr><td colspan="6" class="table-empty"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading...</td></tr>';

  var res = await api.get("/seller/my-products?limit=50");
  if (!res.success || !res.products.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No products yet. Add your first product!</td></tr>';
    return;
  }

  tbody.innerHTML = res.products.map(function (p) {
    var badge = p.isActive
      ? '<span class="badge badge-active">Active</span>'
      : '<span class="badge badge-inactive">Hidden</span>';
    return '<tr>' +
      '<td><strong>' + esc(p.name) + '</strong></td>' +
      '<td>' + esc(p.category) + '</td>' +
      '<td>Rs.' + p.price.toLocaleString() + '</td>' +
      '<td>' + p.stock + '</td>' +
      '<td>' + badge + '</td>' +
      '<td>' +
        '<button class="tbl-btn tbl-btn-toggle" onclick="toggleProduct(\'' + p._id + '\')">Toggle</button>' +
        '<button class="tbl-btn tbl-btn-delete" onclick="deleteProduct(\'' + p._id + '\', \'' + esc(p.name) + '\')">Delete</button>' +
      '</td>' +
    '</tr>';
  }).join("");
}

async function toggleProduct(id) {
  var res = await api.patch("/products/" + id + "/toggle");
  if (res.success) {
    showToast(res.message);
    loadMyProducts();
    loadDashboardStats();
  } else {
    showToast(res.message || "Failed to toggle product.");
  }
}

async function deleteProduct(id, name) {
  if (!confirm("Delete \"" + name + "\"? This cannot be undone.")) return;
  var res = await api.del("/products/" + id);
  if (res.success) {
    showToast("Product deleted.");
    loadMyProducts();
    loadDashboardStats();
  } else {
    showToast(res.message || "Delete failed.");
  }
}

/* ================================================================
   ADD PRODUCT
   ================================================================ */
function handleImageSelect(input) {
  var label = document.getElementById("pImagesLabel");
  if (input.files && input.files.length > 0) {
    label.textContent = input.files.length + " file(s) selected: " +
      Array.from(input.files).map(function (f) { return f.name; }).join(", ");
  }
}

async function submitProduct() {
  /* Clear errors */
  ["pName","pDesc","pCategory","pPincode","pPrice","pOriginal","pStock"].forEach(function (id) {
    var err = document.getElementById(id + "Err");
    if (err) err.textContent = "";
  });

  var name     = document.getElementById("pName").value.trim();
  var desc     = document.getElementById("pDesc").value.trim();
  var category = document.getElementById("pCategory").value;
  var pincode  = document.getElementById("pPincode").value.trim();
  var price    = document.getElementById("pPrice").value;
  var original = document.getElementById("pOriginal").value;
  var stock    = document.getElementById("pStock").value;
  var images   = document.getElementById("pImages").files;

  var valid = true;

  if (!name)     { document.getElementById("pNameErr").textContent = "Product name required.";     valid = false; }
  if (desc.length < 10) { document.getElementById("pDescErr").textContent = "Min 10 characters."; valid = false; }
  if (!category) { document.getElementById("pCategoryErr").textContent = "Select a category.";     valid = false; }
  if (!/^\d{6}$/.test(pincode)) { document.getElementById("pPincodeErr").textContent = "Valid 6-digit pincode required."; valid = false; }
  if (!price || parseFloat(price) < 0)    { document.getElementById("pPriceErr").textContent    = "Valid price required.";    valid = false; }
  if (!original || parseFloat(original) < 0) { document.getElementById("pOriginalErr").textContent = "Valid MRP required."; valid = false; }
  if (!stock || parseInt(stock) < 0)      { document.getElementById("pStockErr").textContent    = "Valid stock required.";    valid = false; }

  if (!valid) return;

  var msg = document.getElementById("productFormMsg");
  msg.textContent = "Saving product...";
  msg.className = "form-msg";

  var formData = new FormData();
  formData.append("name",          name);
  formData.append("description",   desc);
  formData.append("category",      category);
  formData.append("pincode",       pincode);
  formData.append("price",         price);
  formData.append("originalPrice", original);
  formData.append("stock",         stock);
  for (var i = 0; i < images.length; i++) {
    formData.append("images", images[i]);
  }

  var res = await api.upload("/products", formData);
  if (res.success) {
    msg.textContent = "Product added successfully!";
    showToast("Product added!");
    /* Reset form */
    ["pName","pDesc","pPincode","pPrice","pOriginal","pStock"].forEach(function (id) {
      document.getElementById(id).value = "";
    });
    document.getElementById("pCategory").value   = "";
    document.getElementById("pImages").value     = "";
    document.getElementById("pImagesLabel").textContent = "Click to select images (JPG, PNG, WEBP)";
    loadDashboardStats();
    setTimeout(function () {
      msg.textContent = "";
      showPage("products", document.querySelector("[data-page=products]"));
    }, 1500);
  } else {
    msg.textContent = res.message || "Failed to add product.";
    msg.className = "form-msg err";
  }
}

/* ================================================================
   STORE PROFILE
   ================================================================ */
async function loadStoreProfile() {
  var res = await api.get("/seller/me");
  var card = document.getElementById("storeProfileCard");
  if (!res.success) {
    card.innerHTML = '<div class="loading-row" style="color:var(--error)">Could not load store profile.</div>';
    return;
  }
  var s = res.seller;
  card.innerHTML =
    '<div class="fields-grid">' +
    row("Store Name",  s.storeName)  +
    row("Category",    s.category)   +
    row("Owner",       s.ownerName)  +
    row("Email",       s.email)      +
    row("Mobile",      s.mobile)     +
    row("Business",    s.bizName)    +
    row("GST",         s.gst || "--") +
    row("PAN",         s.pan)        +
    row("Store Address", s.storeAddr) +
    row("Pincode",     s.pincode)    +
    row("Bank",        s.bankName)   +
    row("IFSC",        s.ifsc)       +
    '<div class="field-group full-width">' +
      '<label>Store Description</label>' +
      '<p style="font-size:14px;color:var(--text);line-height:1.6;padding:10px 0">' + esc(s.storeDesc) + '</p>' +
    '</div>' +
    '</div>' +
    '<div style="margin-top:14px">' +
      '<span class="badge badge-approved">Approved Seller</span>' +
    '</div>';
}

function row(label, value) {
  return '<div class="field-group">' +
    '<label>' + label + '</label>' +
    '<div style="font-size:14px;color:var(--text);padding:8px 0;border-bottom:1px solid var(--border)">' + esc(value || "--") + '</div>' +
  '</div>';
}

/* ================================================================
   TABLE FILTER
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

var toastTimer = null;
function showToast(msg) {
  var el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2800);
}