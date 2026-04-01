/* ====================================================
   RadiusX — cart.js
   Auth-gated via api.js JWT.
   Cart data lives in localStorage (fast, offline-ready).
   Checkout requires a valid session.
   ==================================================== */

/* ---- Product catalogue (for suggestions) ---- */
var allProducts = [
  {id:1,  name:"Laptop",         price:45000, originalPrice:52000, category:"Electronics", image:"assets/products/laptop.jpg",     rating:4.5, reviews:128},
  {id:2,  name:"Headphones",     price:1200,  originalPrice:1800,  category:"Electronics", image:"assets/products/headphones.jpg", rating:4.2, reviews:85},
  {id:3,  name:"Shoes",          price:900,   originalPrice:1400,  category:"Fashion",     image:"assets/products/shoes.jpg",      rating:4.0, reviews:63},
  {id:4,  name:"Tshirt",         price:400,   originalPrice:600,   category:"Fashion",     image:"assets/products/tshirt.jpg",     rating:3.8, reviews:42},
  {id:5,  name:"Chair",          price:1500,  originalPrice:2000,  category:"Home",        image:"assets/products/chair.jpg",      rating:4.3, reviews:34},
  {id:6,  name:"Lamp",           price:700,   originalPrice:950,   category:"Home",        image:"assets/products/lamp.jpg",       rating:4.1, reviews:27}
];

/* ---- Cart state ---- */
var cart = [];

/* Namespace cart by user ID so switching accounts never leaks items */
function cartKey() {
  var uid = currentUser && (currentUser._id || currentUser.id);
  return uid ? ("u_" + uid + "_cart") : "guest_cart";
}

function loadCart() {
  var stored = localStorage.getItem(cartKey());
  if (stored) { try { return JSON.parse(stored); } catch(e) {} }
  return [];
}

function saveCart() {
  localStorage.setItem(cartKey(), JSON.stringify(cart));
}

/* ---- Coupon state ---- */
var appliedCoupon  = null;
var couponDiscount = 0;

var COUPONS = {
  "RADIUS10": { type:"percent", value:10,  label:"10% off" },
  "FLAT200":  { type:"flat",    value:200, label:"Rs.200 off" },
  "WELCOME":  { type:"percent", value:15,  label:"15% off for new users" }
};

var FREE_DELIVERY_THRESHOLD = 999;
var DELIVERY_CHARGE         = 49;

/* ---- Current user (set after auth check) ---- */
var currentUser = null;


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

  currentUser = res.user;

  /* Load cart AFTER currentUser is set so cartKey() uses the correct user ID */
  cart = loadCart();

  renderCart();
  renderSuggestions();
};


/* ====================================================
   SIGN-IN WALL — shown when not logged in
   ==================================================== */

function showSignInWall() {
  /* Hide all cart UI */
  var els = ["cartTopbar","cartItems","cartSummary","recentlySection"];
  els.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  /* Show sign-in prompt inside cartEmpty */
  var empty = document.getElementById("cartEmpty");
  if (empty) {
    empty.classList.remove("hidden");
    empty.innerHTML =
      '<div style="text-align:center;padding:60px 20px">' +
        '<i class="fa-solid fa-cart-shopping" style="font-size:54px;color:var(--border);margin-bottom:20px;display:block"></i>' +
        '<h3 style="font-family:\'Playfair Display\',serif;font-size:22px;color:var(--text);margin-bottom:10px">Sign in to view your cart</h3>' +
        '<p style="color:var(--muted);font-size:14px;margin-bottom:28px">Your cart is saved to your account so you can access it anywhere.</p>' +
        '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
          '<a href="login.html?tab=signin" style="padding:12px 28px;background:var(--accent);color:rgb(8,12,16);border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Sign In</a>' +
          '<a href="login.html?tab=signup" style="padding:12px 28px;background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:8px;text-decoration:none;font-size:14px">Create Account</a>' +
        '</div>' +
      '</div>';
  }

  /* Still show suggestions so page is not blank */
  renderSuggestions();
}


/* ====================================================
   RENDER CART
   ==================================================== */

function renderCart() {
  var container = document.getElementById("cartItems");
  var empty     = document.getElementById("cartEmpty");
  var topbar    = document.getElementById("cartTopbar");
  var summary   = document.getElementById("cartSummary");

  container.innerHTML = "";

  if (cart.length === 0) {
    empty.classList.remove("hidden");
    empty.innerHTML =
      '<div style="text-align:center;padding:60px 20px">' +
        '<i class="fa-solid fa-cart-shopping" style="font-size:54px;color:var(--border);margin-bottom:20px;display:block"></i>' +
        '<h3 style="font-family:\'Playfair Display\',serif;font-size:22px;color:var(--text);margin-bottom:10px">Your cart is empty</h3>' +
        '<p style="color:var(--muted);font-size:14px;margin-bottom:28px">Looks like you haven\'t added anything yet.</p>' +
        '<a href="index.html" style="padding:12px 28px;background:var(--accent);color:rgb(8,12,16);border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Shop Now</a>' +
      '</div>';
    topbar.style.display        = "none";
    summary.style.opacity       = "0.4";
    summary.style.pointerEvents = "none";
    document.getElementById("checkoutBtn").disabled = true;
    document.getElementById("cartCountBadge").innerText = "0";
    updateSummary();
    return;
  }

  empty.classList.add("hidden");
  topbar.style.display        = "flex";
  summary.style.opacity       = "1";
  summary.style.pointerEvents = "all";
  document.getElementById("checkoutBtn").disabled = false;

  var totalQty = cart.reduce(function(s,i) { return s + i.qty; }, 0);
  document.getElementById("cartCountBadge").innerText = totalQty;

  cart.forEach(function(item, idx) {
    var discount = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
    var stars    = renderStars(item.rating);

    var card = document.createElement("div");
    card.className = "cart-item";
    card.id = "cartItem_" + item.id;
    card.style.animationDelay = (idx * 0.07) + "s";

    card.innerHTML =
      '<div class="item-check-wrap">' +
        '<input type="checkbox" id="check_' + item.id + '" onchange="onItemCheck()">' +
        '<label class="item-custom-check" for="check_' + item.id + '"></label>' +
      '</div>' +
      '<img class="item-img" src="' + item.image + '" onerror="this.src=\'assets/products/demo.jpg\'" alt="' + esc(item.name) + '">' +
      '<div class="item-details">' +
        '<span class="item-category">' + esc(item.category) + '</span>' +
        '<span class="item-name">' + esc(item.name) + '</span>' +
        '<div class="item-stars">' + stars + '<span>(' + (item.reviews || 0) + ')</span></div>' +
        '<div class="item-price-row">' +
          '<span class="item-price">&#8377;' + item.price.toLocaleString() + '</span>' +
          '<span class="item-original">&#8377;' + item.originalPrice.toLocaleString() + '</span>' +
          '<span class="item-discount-tag">' + discount + '% off</span>' +
        '</div>' +
      '</div>' +
      '<div class="item-actions">' +
        '<button class="item-remove-btn" onclick="removeItem(' + item.id + ')" title="Remove">' +
          '<i class="fa-regular fa-trash-can"></i>' +
        '</button>' +
        '<div class="qty-stepper">' +
          '<button class="qty-btn" onclick="changeQty(' + item.id + ', -1)">&#8722;</button>' +
          '<span class="qty-val" id="qty_' + item.id + '">' + item.qty + '</span>' +
          '<button class="qty-btn" onclick="changeQty(' + item.id + ', +1)">+</button>' +
        '</div>' +
        '<div class="item-subtotal">Subtotal: <strong>&#8377;' + (item.price * item.qty).toLocaleString() + '</strong></div>' +
      '</div>';

    container.appendChild(card);
  });

  updateSelectAllCount();
  updateSummary();
}


/* ====================================================
   QUANTITY STEPPER
   ==================================================== */

function changeQty(id, delta) {
  var item = cart.find(function(i) { return i.id === id; });
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  document.getElementById("qty_" + id).innerText = item.qty;
  var card = document.getElementById("cartItem_" + id);
  if (card) {
    card.querySelector(".item-subtotal").innerHTML =
      "Subtotal: <strong>&#8377;" + (item.price * item.qty).toLocaleString() + "</strong>";
  }
  saveCart();
  updateSummary();
  var totalQty = cart.reduce(function(s,i) { return s + i.qty; }, 0);
  document.getElementById("cartCountBadge").innerText = totalQty;
}


/* ====================================================
   REMOVE ITEM
   ==================================================== */

function removeItem(id) {
  var card = document.getElementById("cartItem_" + id);
  if (card) {
    card.classList.add("removing");
    setTimeout(function() {
      cart = cart.filter(function(i) { return i.id !== id; });
      saveCart();
      renderCart();
      showToast("Item removed from cart");
    }, 340);
  }
}


/* ====================================================
   SELECT ALL / BULK DELETE
   ==================================================== */

function toggleSelectAll(checked) {
  document.querySelectorAll(".item-check-wrap input").forEach(function(cb) {
    cb.checked = checked;
  });
  updateSelectAllCount();
}

function onItemCheck() {
  var all          = document.querySelectorAll(".item-check-wrap input");
  var allCheck     = document.getElementById("selectAllCheck");
  var checkedCount = Array.from(all).filter(function(c) { return c.checked; }).length;
  allCheck.checked = (checkedCount === all.length);
  updateSelectAllCount();
}

function updateSelectAllCount() {
  document.getElementById("selectAllCount").innerText = cart.length;
}

function deleteSelected() {
  var checked = Array.from(document.querySelectorAll(".item-check-wrap input:checked"));
  if (!checked.length) { showToast("Select items to remove", true); return; }
  var idsToRemove = checked.map(function(cb) { return parseInt(cb.id.replace("check_","")); });
  idsToRemove.forEach(function(id) {
    var card = document.getElementById("cartItem_" + id);
    if (card) card.classList.add("removing");
  });
  setTimeout(function() {
    cart = cart.filter(function(i) { return !idsToRemove.includes(i.id); });
    saveCart();
    renderCart();
    showToast(idsToRemove.length + " item(s) removed");
  }, 340);
}


/* ====================================================
   COUPON
   ==================================================== */

function applyCoupon() {
  var input = document.getElementById("couponInput").value.trim().toUpperCase();
  var msg   = document.getElementById("couponMsg");

  if (!input) { setMsg(msg, "Enter a coupon code", "error"); return; }

  if (COUPONS[input]) {
    appliedCoupon  = input;
    var coupon     = COUPONS[input];
    var subtotal   = cart.reduce(function(s,i) { return s + i.price * i.qty; }, 0);
    couponDiscount = coupon.type === "percent"
      ? Math.round(subtotal * coupon.value / 100)
      : coupon.value;
    setMsg(msg, "\u2713 \"" + input + "\" applied \u2014 " + coupon.label + "!", "success");
    document.getElementById("couponRow").style.display = "flex";
    updateSummary();
    showToast("Coupon applied!");
  } else {
    appliedCoupon  = null;
    couponDiscount = 0;
    document.getElementById("couponRow").style.display = "none";
    setMsg(msg, "Invalid coupon code", "error");
    updateSummary();
  }
}

function setMsg(el, text, type) {
  el.innerText  = text;
  el.className  = "coupon-msg " + type;
}


/* ====================================================
   ORDER SUMMARY
   ==================================================== */

function updateSummary() {
  var itemCount = cart.reduce(function(s,i) { return s + i.qty; }, 0);
  var subtotal  = cart.reduce(function(s,i) { return s + i.price * i.qty; }, 0);
  var origTotal = cart.reduce(function(s,i) { return s + i.originalPrice * i.qty; }, 0);
  var savings   = origTotal - subtotal;
  var delivery  = (subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0) ? 0 : DELIVERY_CHARGE;
  if (couponDiscount > subtotal) couponDiscount = subtotal;
  var total = Math.max(0, subtotal - couponDiscount + delivery);

  document.getElementById("summaryItemCount").innerText = itemCount;
  document.getElementById("summarySubtotal").innerText  = "₹" + subtotal.toLocaleString();
  document.getElementById("summarySavings").innerText   = "₹" + savings.toLocaleString();
  document.getElementById("summaryCoupon").innerText    = "₹" + couponDiscount.toLocaleString();
  document.getElementById("summaryDelivery").innerText  = delivery === 0 ? "FREE" : "₹" + delivery;
  document.getElementById("summaryTotal").innerText     = "₹" + total.toLocaleString();

  var note = document.getElementById("savingsNote");
  var totalSaved = savings + couponDiscount;
  note.innerText = totalSaved > 0 ? "You're saving ₹" + totalSaved.toLocaleString() + " on this order!" : "";

  var delivNote = document.getElementById("deliveryNote");
  if (subtotal === 0) {
    delivNote.innerText = "Add items to see delivery info";
  } else if (delivery === 0) {
    delivNote.innerHTML = "<strong style=\"color:var(--success)\">Free delivery</strong> applied on your order";
  } else {
    delivNote.innerText = "Add ₹;" + (FREE_DELIVERY_THRESHOLD - subtotal).toLocaleString() + " more for free delivery";
  }
}


/* ====================================================
   CHECKOUT — requires auth (already verified on load)
   ==================================================== */

async function handleCheckout() {
  if (cart.length === 0) { showToast("Your cart is empty", true); return; }

  if (!currentUser) {
    showToast("Please sign in to checkout", true);
    setTimeout(function() { window.location.href = "login.html"; }, 1200);
    return;
  }

  var btn = document.getElementById("checkoutBtn");
  if (btn) { btn.disabled = true; btn.innerText = "Placing order..."; }

  /* Build order payload.
     product field only set when it's a real MongoDB ObjectId (24-char hex).
     Static catalogue items have numeric ids — omit product for those. */
  var orderItems = cart.map(function(i) {
    var item = {
      name:          i.name,
      category:      (i.category || "other").toLowerCase(),
      price:         i.price,
      originalPrice: i.originalPrice || i.price,
      qty:           i.qty,
      image:         i.image || "assets/products/demo.jpg"
    };
    /* Only include product ref if it looks like a MongoDB ObjectId */
    var pid = i._id || i.productId;
    if (pid && typeof pid === "string" && pid.length === 24) {
      item.product = pid;
    }
    return item;
  });

  var res = await api.post("/orders", {
    items:          orderItems,
    deliveryCharge: cart.reduce(function(s,i){return s+i.price*i.qty;},0) >= 999 ? 0 : 49,
    couponDiscount: couponDiscount || 0,
    couponCode:     appliedCoupon  || "",
    address:        (currentUser.address || ""),
  });

  if (btn) { btn.disabled = false; btn.innerText = "Proceed to Checkout"; }

  if (!res.success) {
    showToast(res.message || "Order failed. Please try again.", true);
    return;
  }

  /* Show modal with real order ID */
  var orderId = res.order && (res.order._id || res.order.id);
  var modalEl = document.getElementById("modalOrderId");
  if (modalEl) modalEl.innerText = orderId || "RX" + Date.now().toString().slice(-8).toUpperCase();

  /* Clear cart */
  cart = [];
  saveCart();

  document.getElementById("checkoutModal").classList.add("open");
}

function closeCheckoutModal() {
  document.getElementById("checkoutModal").classList.remove("open");
  renderCart();
}


/* ====================================================
   SUGGESTIONS
   ==================================================== */

function renderSuggestions() {
  var cartIds = cart.map(function(i) { return i.id; });
  var suggest = allProducts.filter(function(p) { return !cartIds.includes(p.id); }).slice(0, 6);
  var grid    = document.getElementById("recentlyGrid");
  var section = document.getElementById("recentlySection");
  if (!grid) return;
  if (!suggest.length) { if (section) section.style.display = "none"; return; }

  grid.innerHTML = "";
  suggest.forEach(function(p, idx) {
    var card = document.createElement("div");
    card.className = "recently-card";
    card.style.animationDelay = (idx * 0.08) + "s";
    card.innerHTML =
      '<img src="' + p.image + '" onerror="this.src=\'assets/products/demo.jpg\'" alt="' + esc(p.name) + '">' +
      '<h4>' + esc(p.name) + '</h4>' +
      '<div>' +
        '<span class="rc-price">&#8377;' + p.price.toLocaleString() + '</span>' +
        '<span class="rc-original">&#8377;' + p.originalPrice.toLocaleString() + '</span>' +
      '</div>' +
      '<button class="rc-add-btn" onclick="addSuggestionToCart(' + p.id + ', this)">' +
        '<i class="fa-solid fa-plus"></i> Add to Cart' +
      '</button>';
    card.onclick = function(e) {
      if (e.target.closest(".rc-add-btn")) return;
      window.location.href = "product.html?id=" + p.id;
    };
    grid.appendChild(card);
  });
}

function addSuggestionToCart(id, btn) {
  var product = allProducts.find(function(p) { return p.id === id; });
  if (!product) return;
  var existing = cart.find(function(i) { return i.id === id; });
  if (existing) { existing.qty++; }
  else { cart.push(Object.assign({}, product, { qty: 1 })); }
  saveCart();
  btn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
  btn.style.background  = "rgba(100,215,130,0.15)";
  btn.style.borderColor = "var(--success)";
  btn.style.color       = "var(--success)";
  setTimeout(function() { renderCart(); renderSuggestions(); }, 600);
  showToast(product.name + " added to cart");
}


/* ====================================================
   STARS
   ==================================================== */

function renderStars(rating) {
  var full = Math.floor(rating || 0), half = (rating || 0) % 1 >= 0.5, h = "";
  for (var i = 0; i < 5; i++) {
    if (i < full)                h += '<i class="fa-solid fa-star"></i>';
    else if (i === full && half) h += '<i class="fa-solid fa-star-half-stroke"></i>';
    else                         h += '<i class="fa-regular fa-star"></i>';
  }
  return h;
}


/* ====================================================
   CART ABANDONMENT TRACKING
   ==================================================== */

function trackCartAbandonment() {
  if (!currentUser || !cart.length) return;
  /* Fire and forget — backend sets/resets the 10-min timer */
  api.post("/orders/cart-activity", { cartItems: cart }).catch(function() {});
}

/* ====================================================
   HELPERS
   ==================================================== */

function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

var toastTimer = null;
function showToast(message, isError) {
  var toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.remove("error-toast");
  if (isError) toast.classList.add("error-toast");
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { toast.classList.remove("show"); }, 2800);
}