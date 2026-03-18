/* ====================================================
   RadiusX — profile.js
   Handles: panel switching, user data load/save,
            avatar upload, addresses CRUD, wishlist,
            notifications, security, seller form,
            pincode lookup, logout
   ==================================================== */


/* ====================================================
   DEMO DATA — mirrors products from main.js
   ==================================================== */

const PRODUCTS = [
  {id:1,name:"Laptop",     price:45000,originalPrice:52000,category:"Electronics",image:"assets/products/laptop.jpg",    rating:4.5,reviews:128},
  {id:2,name:"Headphones", price:1200, originalPrice:1800, category:"Electronics",image:"assets/products/headphones.jpg",rating:4.2,reviews:85},
  {id:3,name:"Shoes",      price:900,  originalPrice:1400, category:"Fashion",    image:"assets/products/shoes.jpg",     rating:4.0,reviews:63},
  {id:4,name:"Tshirt",     price:400,  originalPrice:600,  category:"Fashion",    image:"assets/products/tshirt.jpg",    rating:3.8,reviews:42},
  {id:5,name:"Chair",      price:1500, originalPrice:2000, category:"Home",       image:"assets/products/chair.jpg",     rating:4.3,reviews:34},
  {id:6,name:"Lamp",       price:700,  originalPrice:950,  category:"Home",       image:"assets/products/lamp.jpg",      rating:4.1,reviews:27}
]

const RECENT_ORDERS_DEMO = [
  {id:"RX20260301",date:"2026-03-01",status:"shipped",   total:2249, image:"assets/products/tshirt.jpg",  name:"Tshirt × 2, Chair"},
  {id:"RX20260208",date:"2026-02-08",status:"processing",total:1849, image:"assets/products/shoes.jpg",   name:"Shoes × 2"},
  {id:"RX20260105",date:"2026-01-05",status:"delivered", total:43000,image:"assets/products/laptop.jpg",  name:"Laptop"},
  {id:"RX20251215",date:"2025-12-15",status:"processing",total:2149, image:"assets/products/lamp.jpg",    name:"Lamp × 3"},
  {id:"RX20251105",date:"2025-11-05",status:"shipped",   total:2400, image:"assets/products/headphones.jpg",name:"Headphones × 2"}
]

const NOTIF_PREFS = [
  {id:"np_order",   title:"Order Updates",        sub:"Delivery, dispatch & status changes", default:true},
  {id:"np_offers",  title:"Offers & Deals",        sub:"Exclusive coupons and flash sales",   default:true},
  {id:"np_account", title:"Account Activity",      sub:"Login alerts and profile changes",    default:true},
  {id:"np_seller",  title:"Seller Notifications",  sub:"New seller offers near you",          default:false},
  {id:"np_sms",     title:"SMS Notifications",     sub:"Receive updates via SMS",             default:false}
]

const NOTIFS = [
  {id:1, type:"order",    icon:"fa-box-open",    iconClass:"ni-order",    msg:"Your order RX20260301 has been shipped!", sub:"Expected delivery: 15 Mar 2026", time:"2h ago",  unread:true},
  {id:2, type:"offer",    icon:"fa-tag",         iconClass:"ni-offer",    msg:"Flash Sale: Up to 40% off on Electronics", sub:"Offer valid till midnight",        time:"5h ago",  unread:true},
  {id:3, type:"delivery", icon:"fa-truck-fast",  iconClass:"ni-delivery", msg:"Order RX20260105 delivered successfully", sub:"Rate your experience",             time:"2d ago",  unread:false},
  {id:4, type:"offer",    icon:"fa-ticket",      iconClass:"ni-offer",    msg:"Your coupon RADIUS10 expires in 3 days",  sub:"Use before it's gone!",            time:"3d ago",  unread:true},
  {id:5, type:"security", icon:"fa-shield-halved",iconClass:"ni-security",msg:"New login from Indore, MP",               sub:"If this wasn't you, change password","time":"5d ago",unread:false}
]

const WISHLIST_DEMO = [1, 3, 5, 6]

const STATUS_COLORS = {
  delivered:"ros-delivered", shipped:"ros-shipped",
  processing:"ros-processing", cancelled:"ros-cancelled", returned:"ros-returned"
}


/* ====================================================
   USER DATA (localStorage)
   ==================================================== */

function getUser() {
  let stored = localStorage.getItem("rx_profile")
  if (stored) { try { return JSON.parse(stored) } catch(e){} }
  /* Default demo user */
  return {
    name:"Ravi Kumar", email:"ravi@gmail.com",
    mobile:"9876543210", dob:"1998-04-15",
    gender:"male", pincode:"452001", address:"12, MG Road, Vijay Nagar",
    avatar:null
  }
}

function saveUser(u) {
  localStorage.setItem("rx_profile", JSON.stringify(u))
}

let user = getUser()

function getAddresses() {
  let s = localStorage.getItem("rx_addresses")
  if (s) { try { return JSON.parse(s) } catch(e){} }
  return [
    {id:1, type:"Home",  name:"Ravi Kumar", mobile:"9876543210", line:"12, MG Road, Vijay Nagar", pin:"452001", city:"Indore", isDefault:true},
    {id:2, type:"Work",  name:"Ravi Kumar", mobile:"9876543210", line:"Office Tower B, IT Park",  pin:"452010", city:"Indore", isDefault:false}
  ]
}

function saveAddresses(a) { localStorage.setItem("rx_addresses", JSON.stringify(a)) }
let addresses = getAddresses()

function getNotifPrefs() {
  let s = localStorage.getItem("rx_notif_prefs")
  if (s) { try { return JSON.parse(s) } catch(e){} }
  let map = {}
  NOTIF_PREFS.forEach(p => { map[p.id] = p.default })
  return map
}

function saveNotifPrefs(m) { localStorage.setItem("rx_notif_prefs", JSON.stringify(m)) }
let notifPrefs = getNotifPrefs()

function getNotifList() {
  let s = localStorage.getItem("rx_notifs")
  if (s) { try { return JSON.parse(s) } catch(e){} }
  return JSON.parse(JSON.stringify(NOTIFS))
}

function saveNotifList(n) { localStorage.setItem("rx_notifs", JSON.stringify(n)) }
let notifList = getNotifList()


/* ====================================================
   INIT
   ==================================================== */

window.onload = function () {
  applyUserToUI()
  renderRecentOrders()
  renderWishlist()
  renderNotifPrefs()
  renderNotifFeed()
  updateNotifDot()
  renderAddresses()
  loadProfileForm()
}


/* ====================================================
   PANEL SWITCHING
   ==================================================== */

function switchPanel(btnEl, panelId) {
  /* deactivate all nav items */
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"))
  /* hide all panels */
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"))

  /* activate clicked nav item */
  if (btnEl) btnEl.classList.add("active")

  /* show target panel */
  let panel = document.getElementById("panel-" + panelId)
  if (panel) {
    panel.classList.add("active")
    /* re-trigger animation */
    panel.style.animation = "none"
    panel.offsetHeight
    panel.style.animation = ""
  }
}


/* ====================================================
   USER → UI
   ==================================================== */

function applyUserToUI() {
  let initials = (user.name || "R").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)

  /* topbar */
  let tav = document.getElementById("topbarAvatar")
  if (user.avatar) {
    tav.innerHTML = `<img src="${user.avatar}" alt="avatar">`
  } else {
    tav.innerText = initials[0] || "R"
  }

  /* sidebar */
  setAvatarEl("sidebarAvatar", user.avatar, initials)
  document.getElementById("sidebarName").innerText  = user.name  || "User"
  document.getElementById("sidebarEmail").innerText = user.email || ""

  /* dashboard greet */
  document.getElementById("dashGreetName").innerText = (user.name || "").split(" ")[0] || "there"

  /* profile panel avatar */
  setAvatarEl("profileAvCircle", user.avatar, initials)
  let pan = document.getElementById("profileAvName")
  if (pan) pan.innerText = user.name || "User"
}

function setAvatarEl(id, avatarSrc, initials) {
  let el = document.getElementById(id)
  if (!el) return
  if (avatarSrc) {
    el.innerHTML = `<img src="${avatarSrc}" alt="avatar">`
  } else {
    el.innerText = initials[0] || "R"
  }
}


/* ====================================================
   AVATAR UPLOAD
   ==================================================== */

function handleAvatarUpload(input) {
  let file = input.files[0]
  if (!file) return
  let reader = new FileReader()
  reader.onload = function(e) {
    user.avatar = e.target.result
    saveUser(user)
    applyUserToUI()
    showToast("Photo updated!")
  }
  reader.readAsDataURL(file)
}


/* ====================================================
   PROFILE FORM
   ==================================================== */

function loadProfileForm() {
  document.getElementById("pfName").value    = user.name    || ""
  document.getElementById("pfEmail").value   = user.email   || ""
  document.getElementById("pfMobile").value  = user.mobile  || ""
  document.getElementById("pfDob").value     = user.dob     || ""
  document.getElementById("pfGender").value  = user.gender  || ""
  document.getElementById("pfPincode").value = user.pincode || ""
  document.getElementById("pfAddress").value = user.address || ""
  if (user.pincode && user.pincode.length === 6) lookupPin(user.pincode, "pfPinInfo")
}

function saveProfile() {
  let name = document.getElementById("pfName").value.trim()
  if (!name) { showToast("Name cannot be empty", true); return }

  user.name    = name
  user.email   = document.getElementById("pfEmail").value.trim()
  user.mobile  = document.getElementById("pfMobile").value.trim()
  user.dob     = document.getElementById("pfDob").value
  user.gender  = document.getElementById("pfGender").value
  user.pincode = document.getElementById("pfPincode").value.trim()
  user.address = document.getElementById("pfAddress").value.trim()
  saveUser(user)
  applyUserToUI()
  showToast("Profile saved successfully!")
}


/* ====================================================
   PINCODE LOOKUP
   ==================================================== */

let pinTimers = {}

async function lookupPin(value, infoId) {
  let infoEl = document.getElementById(infoId)
  if (!infoEl) return
  infoEl.innerText = ""

  if (value.length !== 6 || isNaN(value)) return

  infoEl.innerText = "Looking up..."

  clearTimeout(pinTimers[infoId])
  pinTimers[infoId] = setTimeout(async () => {
    try {
      let res  = await fetch(`https://api.postalpincode.in/pincode/${value}`)
      let data = await res.json()
      if (data[0].Status === "Success") {
        let po = data[0].PostOffice[0]
        infoEl.innerText = `📍 ${po.District}, ${po.State}`
        /* auto-fill city in address modal if open */
        let cityField = document.getElementById("aCity")
        if (cityField && !cityField.value) cityField.value = po.District
      } else {
        infoEl.innerText = "Pincode not found"
        infoEl.style.color = "var(--error)"
      }
    } catch(e) { infoEl.innerText = "" }
  }, 500)
}


/* ====================================================
   ADDRESSES
   ==================================================== */

function renderAddresses() {
  let grid = document.getElementById("addressesGrid")
  if (!grid) return
  grid.innerHTML = ""

  if (addresses.length === 0) {
    grid.innerHTML = `<p style="color:var(--muted);font-size:13px">No saved addresses. Add one!</p>`
    return
  }

  addresses.forEach((a, idx) => {
    let card = document.createElement("div")
    card.className = "addr-card" + (a.isDefault ? " addr-default" : "")
    card.style.animationDelay = (idx * 0.07) + "s"
    card.innerHTML = `
      ${a.isDefault ? `<span class="addr-default-tag">✓ Default</span>` : ""}
      <div class="addr-type-tag">${a.type}</div>
      <div class="addr-name">${a.name}</div>
      <div class="addr-mobile">+91 ${a.mobile}</div>
      <div class="addr-line">${a.line}, ${a.city} — ${a.pin}</div>
      <div class="addr-actions">
        <button class="addr-btn edit-btn" onclick="editAddress(${a.id})"><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="addr-btn del-btn"  onclick="deleteAddress(${a.id})"><i class="fa-regular fa-trash-can"></i> Remove</button>
      </div>
    `
    grid.appendChild(card)
  })
}

let editingAddrId = null

function openAddrModal(id = null) {
  editingAddrId = id
  document.getElementById("addrModalTitle").innerText = id ? "Edit Address" : "Add New Address"
  document.getElementById("aPinInfo").innerText = ""

  /* reset type */
  document.querySelectorAll(".atype").forEach(b => b.classList.remove("active"))
  document.querySelector(".atype[data-t='Home']").classList.add("active")

  if (id) {
    let a = addresses.find(x => x.id === id)
    if (a) {
      document.getElementById("aName").value   = a.name
      document.getElementById("aMobile").value = a.mobile
      document.getElementById("aLine").value   = a.line
      document.getElementById("aPin").value    = a.pin
      document.getElementById("aCity").value   = a.city
      document.getElementById("aDefault").checked = a.isDefault
      document.querySelector(`.atype[data-t='${a.type}']`)?.classList.add("active")
      document.querySelector(".atype:not([data-t='"+a.type+"'])").classList.remove("active")
      /* properly set only the right one */
      document.querySelectorAll(".atype").forEach(b => {
        b.classList.toggle("active", b.dataset.t === a.type)
      })
    }
  } else {
    document.getElementById("aName").value   = user.name || ""
    document.getElementById("aMobile").value = user.mobile || ""
    document.getElementById("aLine").value   = ""
    document.getElementById("aPin").value    = ""
    document.getElementById("aCity").value   = ""
    document.getElementById("aDefault").checked = false
  }

  document.getElementById("addrModal").classList.add("open")
}

function editAddress(id) { openAddrModal(id) }

function closeAddrModal() { document.getElementById("addrModal").classList.remove("open") }

function selectAddrType(btn) {
  document.querySelectorAll(".atype").forEach(b => b.classList.remove("active"))
  btn.classList.add("active")
}

function saveAddress() {
  let name   = document.getElementById("aName").value.trim()
  let mobile = document.getElementById("aMobile").value.trim()
  let line   = document.getElementById("aLine").value.trim()
  let pin    = document.getElementById("aPin").value.trim()
  let city   = document.getElementById("aCity").value.trim()
  let isDefault = document.getElementById("aDefault").checked
  let type   = document.querySelector(".atype.active")?.dataset.t || "Home"

  if (!name || !mobile || !line || !pin) {
    showToast("Fill all required fields", true); return
  }

  if (isDefault) addresses.forEach(a => a.isDefault = false)

  if (editingAddrId) {
    let idx = addresses.findIndex(a => a.id === editingAddrId)
    if (idx !== -1) addresses[idx] = { ...addresses[idx], type, name, mobile, line, pin, city, isDefault }
  } else {
    let newId = Date.now()
    addresses.push({ id:newId, type, name, mobile, line, pin, city, isDefault })
  }

  saveAddresses(addresses)
  renderAddresses()
  closeAddrModal()
  showToast(editingAddrId ? "Address updated!" : "Address saved!")
  editingAddrId = null
}

function deleteAddress(id) {
  addresses = addresses.filter(a => a.id !== id)
  if (addresses.length && !addresses.some(a => a.isDefault)) addresses[0].isDefault = true
  saveAddresses(addresses)
  renderAddresses()
  showToast("Address removed")
}


/* ====================================================
   RECENT ORDERS (dashboard)
   ==================================================== */

function renderRecentOrders() {
  let container = document.getElementById("recentOrders")
  if (!container) return
  container.innerHTML = ""

  RECENT_ORDERS_DEMO.slice(0, 4).forEach((o, idx) => {
    let date = new Date(o.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})
    let item = document.createElement("div")
    item.className = "ro-item"
    item.style.animationDelay = (idx * 0.07) + "s"
    item.innerHTML = `
      <img class="ro-img" src="${o.image}" onerror="this.src='assets/products/demo.jpg'" alt="">
      <div class="ro-info">
        <div class="ro-name">${o.name}</div>
        <div class="ro-date">${date}</div>
      </div>
      <span class="ro-status ${STATUS_COLORS[o.status] || ''}">${o.status}</span>
      <span class="ro-amount">₹${o.total.toLocaleString()}</span>
    `
    item.onclick = () => window.location.href = "orders.html"
    container.appendChild(item)
  })
}


/* ====================================================
   WISHLIST
   ==================================================== */

function getWishlist() {
  let s = localStorage.getItem("rx_wishlist")
  if (s) { try { return JSON.parse(s) } catch(e){} }
  return WISHLIST_DEMO
}

function saveWishlist(w) { localStorage.setItem("rx_wishlist", JSON.stringify(w)) }

function renderWishlist() {
  let grid = document.getElementById("wishlistGrid")
  if (!grid) return
  grid.innerHTML = ""

  let wishlist = getWishlist()
  let items    = PRODUCTS.filter(p => wishlist.includes(p.id))

  if (items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--muted)">
        <i class="fa-regular fa-heart" style="font-size:40px;margin-bottom:12px;display:block"></i>
        <p style="font-size:14px">Your wishlist is empty. Browse products and save what you love!</p>
        <a href="index.html" style="color:var(--accent);font-size:13px;margin-top:10px;display:inline-block">Shop Now →</a>
      </div>`
    return
  }

  items.forEach((p, idx) => {
    let disc = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
    let card = document.createElement("div")
    card.className = "wl-card"
    card.style.animationDelay = (idx * 0.07) + "s"
    card.innerHTML = `
      <img src="${p.image}" onerror="this.src='assets/products/demo.jpg'" alt="${p.name}">
      <div class="wl-name">${p.name}</div>
      <div>
        <span class="wl-price">₹${p.price.toLocaleString()}</span>
        <span class="wl-orig">₹${p.originalPrice.toLocaleString()}</span>
      </div>
      <div class="wl-actions">
        <button class="wl-btn wl-add" onclick="addWishlistToCart(${p.id}, event)">
          <i class="fa-solid fa-basket-shopping"></i> Add to Cart
        </button>
        <button class="wl-btn wl-rem" onclick="removeFromWishlist(${p.id})">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    `
    card.onclick = () => window.location.href = `product.html?id=${p.id}`
    grid.appendChild(card)
  })
}

function addWishlistToCart(id, event) {
  event.stopPropagation()
  let cart = JSON.parse(localStorage.getItem("rx_cart") || "[]")
  let prod = PRODUCTS.find(p => p.id === id)
  if (!prod) return
  let ex = cart.find(i => i.id === id)
  if (ex) { ex.qty++ } else { cart.push({...prod, qty:1}) }
  localStorage.setItem("rx_cart", JSON.stringify(cart))
  showToast(`${prod.name} added to cart!`)
}

function removeFromWishlist(id) {
  let wl = getWishlist().filter(i => i !== id)
  saveWishlist(wl)
  renderWishlist()
  showToast("Removed from wishlist")
}


/* ====================================================
   NOTIFICATIONS
   ==================================================== */

function renderNotifPrefs() {
  let container = document.getElementById("notifPrefList")
  if (!container) return
  container.innerHTML = ""

  NOTIF_PREFS.forEach(pref => {
    let on  = notifPrefs[pref.id] ?? pref.default
    let div = document.createElement("div")
    div.className = "notif-pref-item"
    div.innerHTML = `
      <div class="notif-pref-info">
        <span class="notif-pref-title">${pref.title}</span>
        <span class="notif-pref-sub">${pref.sub}</span>
      </div>
      <label class="tog">
        <input type="checkbox" id="np_${pref.id}" ${on ? "checked" : ""} onchange="toggleNotifPref('${pref.id}',this.checked)">
        <span class="tog-slider"></span>
      </label>
    `
    container.appendChild(div)
  })
}

function toggleNotifPref(id, val) {
  notifPrefs[id] = val
  saveNotifPrefs(notifPrefs)
  showToast(val ? "Notifications enabled" : "Notifications disabled")
}

function renderNotifFeed() {
  let container = document.getElementById("notifFeed")
  if (!container) return
  container.innerHTML = ""

  notifList.forEach((n, idx) => {
    let div = document.createElement("div")
    div.className = "notif-item" + (n.unread ? " unread" : "")
    div.style.animationDelay = (idx * 0.06) + "s"
    div.innerHTML = `
      <div class="notif-icon-wrap ${n.iconClass}"><i class="fa-solid ${n.icon}"></i></div>
      <div class="notif-body">
        <div class="notif-title-row">
          <span class="notif-msg">${n.msg}</span>
          ${n.unread ? `<span class="notif-unread-dot"></span>` : ""}
        </div>
        <div class="notif-sub">${n.sub}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    `
    div.onclick = () => { n.unread = false; saveNotifList(notifList); renderNotifFeed(); updateNotifDot() }
    container.appendChild(div)
  })
}

function markAllRead() {
  notifList.forEach(n => n.unread = false)
  saveNotifList(notifList)
  renderNotifFeed()
  updateNotifDot()
  showToast("All notifications marked as read")
}

function updateNotifDot() {
  let dot = document.getElementById("notifDot")
  if (!dot) return
  let hasUnread = notifList.some(n => n.unread)
  dot.style.display = hasUnread ? "block" : "none"
}


/* ====================================================
   SECURITY
   ==================================================== */

function togglePass(id, icon) {
  let input = document.getElementById(id)
  if (!input) return
  if (input.type === "password") {
    input.type = "text"
    icon.classList.replace("fa-eye","fa-eye-slash")
  } else {
    input.type = "password"
    icon.classList.replace("fa-eye-slash","fa-eye")
  }
}

function secStrength(val) {
  let fill  = document.getElementById("secStrFill")
  let label = document.getElementById("secStrLbl")
  let score = 0
  if (val.length >= 8)          score++
  if (/[A-Z]/.test(val))        score++
  if (/[0-9]/.test(val))        score++
  if (/[^A-Za-z0-9]/.test(val)) score++
  let widths = ["0%","25%","50%","75%","100%"]
  let colors = ["transparent","rgb(255,80,80)","rgb(255,160,50)","rgb(196,223,154)","rgb(100,210,130)"]
  let labels = ["","Weak","Fair","Good","Strong"]
  fill.style.width      = widths[score]
  fill.style.background = colors[score]
  label.innerText        = labels[score]
  label.style.color      = colors[score]
}

function changePassword() {
  let curr = document.getElementById("secCur").value
  let nw   = document.getElementById("secNew").value
  let conf = document.getElementById("secConf").value
  let err  = document.getElementById("secErr")
  err.innerText = ""

  if (!curr) { err.innerText = "Enter your current password"; return }
  if (nw.length < 8) { err.innerText = "New password must be at least 8 characters"; return }
  if (nw !== conf)   { err.innerText = "Passwords do not match"; return }

  /* Demo: check against stored password */
  let users = JSON.parse(localStorage.getItem("rx_users") || "[]")
  let idx   = users.findIndex(u => u.email === user.email)
  if (idx !== -1 && users[idx].password !== curr) {
    err.innerText = "Current password is incorrect"; return
  }
  if (idx !== -1) { users[idx].password = nw; localStorage.setItem("rx_users", JSON.stringify(users)) }

  document.getElementById("secCur").value  = ""
  document.getElementById("secNew").value  = ""
  document.getElementById("secConf").value = ""
  document.getElementById("secStrFill").style.width = "0%"
  document.getElementById("secStrLbl").innerText    = ""

  showToast("Password updated successfully!")
}


/* ====================================================
   SELLER FORM
   ==================================================== */

function submitSellerForm() {
  let biz = document.getElementById("selBiz").value.trim()
  let gst = document.getElementById("selGst").value.trim()
  let cat = document.getElementById("selCat").value
  let pin = document.getElementById("selPin").value.trim()

  if (!biz || !cat) { showToast("Fill in Business Name and Category", true); return }

  showToast("Application submitted! We'll contact you within 48hrs 🎉")
  document.getElementById("selBiz").value = ""
  document.getElementById("selGst").value = ""
  document.getElementById("selCat").value = ""
  document.getElementById("selPin").value = ""
}


/* ====================================================
   LOGOUT
   ==================================================== */

function handleLogout() {
  localStorage.removeItem("token")
  showToast("Logged out. See you soon!")
  setTimeout(() => window.location.href = "login.html", 1300)
}


/* ====================================================
   TOAST
   ==================================================== */

let toastTimer = null

function showToast(msg, isError = false) {
  let t = document.getElementById("toast")
  t.innerText = msg
  t.className = "toast" + (isError ? " err" : "")
  t.classList.add("show")
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800)
}