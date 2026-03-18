/* ====================================================
   RadiusX — cart.js
   Handles: render cart items, qty stepper, remove,
            select all, coupon, order summary calc,
            checkout modal, "you might like" section
   ==================================================== */


/* ===================================================
   DEMO DATA
   In production, load cart from localStorage / API.
   The products array mirrors main.js for consistency.
   =================================================== */

let allProducts = [
  {id:1, name:"Laptop",     price:45000, originalPrice:52000, category:"Electronics", image:"assets/products/laptop.jpg",     rating:4.5, reviews:128},
  {id:2, name:"Headphones", price:1200,  originalPrice:1800,  category:"Electronics", image:"assets/products/headphones.jpg", rating:4.2, reviews:85},
  {id:3, name:"Shoes",      price:900,   originalPrice:1400,  category:"Fashion",     image:"assets/products/shoes.jpg",      rating:4.0, reviews:63},
  {id:4, name:"Tshirt",     price:400,   originalPrice:600,   category:"Fashion",     image:"assets/products/tshirt.jpg",     rating:3.8, reviews:42},
  {id:5, name:"Chair",      price:1500,  originalPrice:2000,  category:"Home",        image:"assets/products/chair.jpg",      rating:4.3, reviews:34},
  {id:6, name:"Lamp",       price:700,   originalPrice:950,   category:"Home",        image:"assets/products/lamp.jpg",       rating:4.1, reviews:27}
]

/* ---- Load cart from localStorage (populated by main.js addToCart) ---- */
function loadCart() {
  let stored = localStorage.getItem("rx_cart")
  if (stored) {
    try { return JSON.parse(stored) } catch(e) {}
  }

  /* DEMO fallback — pre-populate with 3 items so the page looks good */
  return [
    { ...allProducts[0], qty: 1 },
    { ...allProducts[1], qty: 2 },
    { ...allProducts[3], qty: 1 }
  ]
}

function saveCart() {
  localStorage.setItem("rx_cart", JSON.stringify(cart))
}

let cart = loadCart()

/* coupon state */
let appliedCoupon    = null
let couponDiscount   = 0

const COUPONS = {
  "RADIUS10": { type:"percent", value:10, label:"10% off" },
  "FLAT200":  { type:"flat",    value:200, label:"₹200 off" },
  "WELCOME":  { type:"percent", value:15, label:"15% off for new users" }
}

const FREE_DELIVERY_THRESHOLD = 999
const DELIVERY_CHARGE         = 49


/* ===================================================
   INIT
   =================================================== */

window.onload = function () {
  renderCart()
  renderSuggestions()
}


/* ===================================================
   RENDER CART
   =================================================== */

function renderCart() {
  let container = document.getElementById("cartItems")
  let empty     = document.getElementById("cartEmpty")
  let topbar    = document.getElementById("cartTopbar")
  let summary   = document.getElementById("cartSummary")

  container.innerHTML = ""

  if (cart.length === 0) {
    empty.classList.remove("hidden")
    topbar.style.display   = "none"
    summary.style.opacity  = "0.4"
    summary.style.pointerEvents = "none"
    document.getElementById("checkoutBtn").disabled = true
    document.getElementById("cartCountBadge").innerText = "0"
    updateSummary()
    return
  }

  empty.classList.add("hidden")
  topbar.style.display  = "flex"
  summary.style.opacity = "1"
  summary.style.pointerEvents = "all"
  document.getElementById("checkoutBtn").disabled = false

  /* total item count including quantities */
  let totalQty = cart.reduce((s, i) => s + i.qty, 0)
  document.getElementById("cartCountBadge").innerText = totalQty

  cart.forEach((item, idx) => {
    let discount = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
    let stars    = renderStars(item.rating)

    let card = document.createElement("div")
    card.className = "cart-item"
    card.id = "cartItem_" + item.id

    card.innerHTML = `
      <!-- checkbox -->
      <div class="item-check-wrap">
        <input type="checkbox" id="check_${item.id}" onchange="onItemCheck()">
        <label class="item-custom-check" for="check_${item.id}"></label>
      </div>

      <!-- image -->
      <img class="item-img"
           src="${item.image}"
           onerror="this.src='assets/products/demo.jpg'"
           alt="${item.name}">

      <!-- details -->
      <div class="item-details">
        <span class="item-category">${item.category}</span>
        <span class="item-name">${item.name}</span>
        <div class="item-stars">${stars}<span>(${item.reviews})</span></div>
        <div class="item-price-row">
          <span class="item-price">₹${item.price.toLocaleString()}</span>
          <span class="item-original">₹${item.originalPrice.toLocaleString()}</span>
          <span class="item-discount-tag">${discount}% off</span>
        </div>
      </div>

      <!-- actions -->
      <div class="item-actions">
        <button class="item-remove-btn" onclick="removeItem(${item.id})" title="Remove">
          <i class="fa-regular fa-trash-can"></i>
        </button>
        <div class="qty-stepper">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
          <span class="qty-val" id="qty_${item.id}">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, +1)">+</button>
        </div>
        <div class="item-subtotal">
          Subtotal: <strong>₹${(item.price * item.qty).toLocaleString()}</strong>
        </div>
      </div>
    `

    /* stagger animation */
    card.style.animationDelay = (idx * 0.07) + "s"
    container.appendChild(card)
  })

  updateSelectAllCount()
  updateSummary()
}


/* ===================================================
   QUANTITY STEPPER
   =================================================== */

function changeQty(id, delta) {
  let item = cart.find(i => i.id === id)
  if (!item) return

  item.qty = Math.max(1, item.qty + delta)

  /* update qty display */
  document.getElementById("qty_" + id).innerText = item.qty

  /* update subtotal inside card */
  let card = document.getElementById("cartItem_" + id)
  if (card) {
    let subtotalEl = card.querySelector(".item-subtotal")
    subtotalEl.innerHTML = `Subtotal: <strong>₹${(item.price * item.qty).toLocaleString()}</strong>`
  }

  saveCart()
  updateSummary()

  /* update badge */
  let totalQty = cart.reduce((s, i) => s + i.qty, 0)
  document.getElementById("cartCountBadge").innerText = totalQty
}


/* ===================================================
   REMOVE ITEM
   =================================================== */

function removeItem(id) {
  let card = document.getElementById("cartItem_" + id)
  if (card) {
    card.classList.add("removing")
    setTimeout(() => {
      cart = cart.filter(i => i.id !== id)
      saveCart()
      renderCart()
      showToast("Item removed from cart")
    }, 340)
  }
}


/* ===================================================
   SELECT ALL / BULK DELETE
   =================================================== */

function toggleSelectAll(checked) {
  document.querySelectorAll(".item-check-wrap input").forEach(cb => {
    cb.checked = checked
  })
  updateSelectAllCount()
}

function onItemCheck() {
  let all     = document.querySelectorAll(".item-check-wrap input")
  let allCheck = document.getElementById("selectAllCheck")
  let checkedCount = Array.from(all).filter(c => c.checked).length
  allCheck.checked = (checkedCount === all.length)
  updateSelectAllCount()
}

function updateSelectAllCount() {
  document.getElementById("selectAllCount").innerText = cart.length
}

function deleteSelected() {
  let checked = Array.from(document.querySelectorAll(".item-check-wrap input:checked"))
  if (checked.length === 0) { showToast("Select items to remove", true); return }

  let idsToRemove = checked.map(cb => parseInt(cb.id.replace("check_", "")))

  idsToRemove.forEach(id => {
    let card = document.getElementById("cartItem_" + id)
    if (card) card.classList.add("removing")
  })

  setTimeout(() => {
    cart = cart.filter(i => !idsToRemove.includes(i.id))
    saveCart()
    renderCart()
    showToast(idsToRemove.length + " item(s) removed")
  }, 340)
}


/* ===================================================
   COUPON
   =================================================== */

function applyCoupon() {
  let input = document.getElementById("couponInput").value.trim().toUpperCase()
  let msg   = document.getElementById("couponMsg")

  if (!input) { setMsg(msg, "Enter a coupon code", "error"); return }

  if (COUPONS[input]) {
    appliedCoupon  = input
    let coupon     = COUPONS[input]
    let subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0)

    if (coupon.type === "percent") {
      couponDiscount = Math.round(subtotal * coupon.value / 100)
    } else {
      couponDiscount = coupon.value
    }

    setMsg(msg, `✓ "${input}" applied — ${coupon.label}!`, "success")
    document.getElementById("couponRow").style.display = "flex"
    updateSummary()
    showToast("Coupon applied! 🎉")
  } else {
    appliedCoupon  = null
    couponDiscount = 0
    document.getElementById("couponRow").style.display = "none"
    setMsg(msg, "Invalid coupon code", "error")
    updateSummary()
  }
}

function setMsg(el, text, type) {
  el.innerText  = text
  el.className  = "coupon-msg " + type
}


/* ===================================================
   ORDER SUMMARY CALCULATION
   =================================================== */

function updateSummary() {
  let itemCount  = cart.reduce((s, i) => s + i.qty, 0)
  let subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0)
  let origTotal  = cart.reduce((s, i) => s + i.originalPrice * i.qty, 0)
  let savings    = origTotal - subtotal
  let delivery   = (subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0) ? 0 : DELIVERY_CHARGE
  let total      = subtotal - couponDiscount + delivery

  /* cap coupon to not exceed subtotal */
  if (couponDiscount > subtotal) couponDiscount = subtotal

  document.getElementById("summaryItemCount").innerText  = itemCount
  document.getElementById("summarySubtotal").innerText   = "₹" + subtotal.toLocaleString()
  document.getElementById("summarySavings").innerText    = "−₹" + savings.toLocaleString()
  document.getElementById("summaryCoupon").innerText     = "−₹" + couponDiscount.toLocaleString()
  document.getElementById("summaryDelivery").innerText   = delivery === 0 ? "FREE" : "₹" + delivery
  document.getElementById("summaryTotal").innerText      = "₹" + Math.max(0, total).toLocaleString()

  /* savings note */
  let note = document.getElementById("savingsNote")
  let totalSaved = savings + couponDiscount
  if (totalSaved > 0) {
    note.innerText = `🎉 You're saving ₹${totalSaved.toLocaleString()} on this order!`
  } else {
    note.innerText = ""
  }

  /* delivery note */
  let delivNote = document.getElementById("deliveryNote")
  if (subtotal === 0) {
    delivNote.innerText = "Add items to see delivery info"
  } else if (delivery === 0) {
    delivNote.innerHTML = `<strong style="color:var(--success)">Free delivery</strong> applied on your order 🚚`
  } else {
    let needed = FREE_DELIVERY_THRESHOLD - subtotal
    delivNote.innerText = `Add ₹${needed.toLocaleString()} more for free delivery`
  }
}


/* ===================================================
   CHECKOUT
   =================================================== */

function handleCheckout() {
  if (cart.length === 0) { showToast("Your cart is empty", true); return }

  let token = localStorage.getItem("token")
  if (!token) {
    showToast("Please sign in to checkout", true)
    setTimeout(() => { window.location.href = "login.html" }, 1200)
    return
  }

  /* Generate order ID */
  let orderId = "RX" + Date.now().toString().slice(-8).toUpperCase()
  document.getElementById("modalOrderId").innerText = orderId

  /* Clear cart */
  cart = []
  saveCart()

  /* Show modal */
  document.getElementById("checkoutModal").classList.add("open")
}

function closeCheckoutModal() {
  document.getElementById("checkoutModal").classList.remove("open")
}


/* ===================================================
   SUGGESTIONS / YOU MIGHT LIKE
   =================================================== */

function renderSuggestions() {
  let cartIds  = cart.map(i => i.id)
  let suggest  = allProducts.filter(p => !cartIds.includes(p.id)).slice(0, 6)
  let grid     = document.getElementById("recentlyGrid")
  let section  = document.getElementById("recentlySection")

  if (suggest.length === 0) { section.style.display = "none"; return }

  grid.innerHTML = ""

  suggest.forEach((p, idx) => {
    let card = document.createElement("div")
    card.className = "recently-card"
    card.style.animationDelay = (idx * 0.08) + "s"

    card.innerHTML = `
      <img src="${p.image}" onerror="this.src='assets/products/demo.jpg'" alt="${p.name}">
      <h4>${p.name}</h4>
      <div>
        <span class="rc-price">₹${p.price.toLocaleString()}</span>
        <span class="rc-original">₹${p.originalPrice.toLocaleString()}</span>
      </div>
      <button class="rc-add-btn" onclick="addSuggestionToCart(${p.id}, this)">
        <i class="fa-solid fa-plus"></i> Add to Cart
      </button>
    `

    card.onclick = function(e) {
      if (e.target.closest(".rc-add-btn")) return
      window.location.href = "product.html?id=" + p.id
    }

    grid.appendChild(card)
  })
}

function addSuggestionToCart(id, btn) {
  let product = allProducts.find(p => p.id === id)
  if (!product) return

  let existing = cart.find(i => i.id === id)
  if (existing) {
    existing.qty++
  } else {
    cart.push({ ...product, qty: 1 })
  }

  saveCart()

  btn.innerHTML = `<i class="fa-solid fa-check"></i> Added!`
  btn.style.background    = "rgba(100,215,130,0.15)"
  btn.style.borderColor   = "var(--success)"
  btn.style.color         = "var(--success)"

  setTimeout(() => {
    renderCart()
    renderSuggestions()
  }, 600)

  showToast(product.name + " added to cart")
}


/* ===================================================
   STAR RENDERER
   =================================================== */

function renderStars(rating) {
  let full  = Math.floor(rating)
  let half  = rating % 1 >= 0.5
  let stars = ""
  for (let i = 0; i < 5; i++) {
    if (i < full)                stars += `<i class="fa-solid fa-star"></i>`
    else if (i === full && half) stars += `<i class="fa-solid fa-star-half-stroke"></i>`
    else                         stars += `<i class="fa-regular fa-star"></i>`
  }
  return stars
}


/* ===================================================
   TOAST
   =================================================== */

let toastTimer = null

function showToast(message, isError = false) {
  let toast = document.getElementById("toast")
  toast.innerText = message
  toast.classList.remove("error-toast")
  if (isError) toast.classList.add("error-toast")
  toast.classList.add("show")
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800)
}