/* ====================================================
   RadiusX — orders.js
   Handles: order history render, filter/search/sort,
            expense calculator with bar chart,
            category breakdown, metrics, order drawer
   ==================================================== */

/* ====================================================
   DEMO ORDER DATA
   In production, load this from your backend API.
   Dates span 2023-2026 so the expense calculator
   has rich data across multiple years to show off.
   ==================================================== */

const ORDERS = [
  {
    id:"RX20240101", date:"2024-01-15", status:"delivered",
    items:[
      {id:1,name:"Laptop",     category:"Electronics",price:45000,originalPrice:52000,qty:1,image:"assets/products/laptop.jpg"},
      {id:2,name:"Headphones", category:"Electronics",price:1200, originalPrice:1800, qty:1,image:"assets/products/headphones.jpg"}
    ],
    couponDiscount:0, delivery:0
  },
  {
    id:"RX20240215", date:"2024-02-20", status:"delivered",
    items:[
      {id:3,name:"Shoes",  category:"Fashion",price:900,originalPrice:1400,qty:2,image:"assets/products/shoes.jpg"}
    ],
    couponDiscount:100, delivery:0
  },
  {
    id:"RX20240312", date:"2024-03-05", status:"returned",
    items:[
      {id:4,name:"Tshirt", category:"Fashion",price:400,originalPrice:600,qty:3,image:"assets/products/tshirt.jpg"}
    ],
    couponDiscount:0, delivery:49
  },
  {
    id:"RX20240410", date:"2024-04-18", status:"delivered",
    items:[
      {id:5,name:"Chair",  category:"Home",price:1500,originalPrice:2000,qty:1,image:"assets/products/chair.jpg"},
      {id:6,name:"Lamp",   category:"Home",price:700, originalPrice:950, qty:2,image:"assets/products/lamp.jpg"}
    ],
    couponDiscount:200, delivery:0
  },
  {
    id:"RX20240520", date:"2024-05-22", status:"cancelled",
    items:[
      {id:1,name:"Laptop",  category:"Electronics",price:45000,originalPrice:52000,qty:1,image:"assets/products/laptop.jpg"}
    ],
    couponDiscount:0, delivery:0
  },
  {
    id:"RX20240608", date:"2024-06-10", status:"delivered",
    items:[
      {id:3,name:"Shoes",  category:"Fashion",price:900,originalPrice:1400,qty:1,image:"assets/products/shoes.jpg"},
      {id:4,name:"Tshirt", category:"Fashion",price:400,originalPrice:600, qty:2,image:"assets/products/tshirt.jpg"}
    ],
    couponDiscount:0, delivery:49
  },
  {
    id:"RX20240715", date:"2024-07-04", status:"delivered",
    items:[
      {id:2,name:"Headphones",category:"Electronics",price:1200,originalPrice:1800,qty:1,image:"assets/products/headphones.jpg"}
    ],
    couponDiscount:0, delivery:0
  },
  {
    id:"RX20240820", date:"2024-08-14", status:"delivered",
    items:[
      {id:5,name:"Chair",category:"Home",price:1500,originalPrice:2000,qty:2,image:"assets/products/chair.jpg"}
    ],
    couponDiscount:150, delivery:0
  },
  {
    id:"RX20240912", date:"2024-09-28", status:"shipped",
    items:[
      {id:6,name:"Lamp",category:"Home",price:700,originalPrice:950,qty:3,image:"assets/products/lamp.jpg"}
    ],
    couponDiscount:0, delivery:49
  },
  {
    id:"RX20241018", date:"2024-10-10", status:"delivered",
    items:[
      {id:1,name:"Laptop",category:"Electronics",price:45000,originalPrice:52000,qty:1,image:"assets/products/laptop.jpg"},
      {id:3,name:"Shoes", category:"Fashion",    price:900, originalPrice:1400, qty:1,image:"assets/products/shoes.jpg"}
    ],
    couponDiscount:500, delivery:0
  },
  {
    id:"RX20241105", date:"2024-11-05", status:"delivered",
    items:[
      {id:4,name:"Tshirt",category:"Fashion",price:400,originalPrice:600,qty:4,image:"assets/products/tshirt.jpg"}
    ],
    couponDiscount:0, delivery:0
  },
  {
    id:"RX20241222", date:"2024-12-20", status:"delivered",
    items:[
      {id:2,name:"Headphones",category:"Electronics",price:1200,originalPrice:1800,qty:2,image:"assets/products/headphones.jpg"},
      {id:6,name:"Lamp",      category:"Home",       price:700, originalPrice:950, qty:1,image:"assets/products/lamp.jpg"}
    ],
    couponDiscount:200, delivery:0
  },
  /* 2025 orders */
  {
    id:"RX20250115", date:"2025-01-15", status:"delivered",
    items:[{id:1,name:"Laptop",category:"Electronics",price:45000,originalPrice:52000,qty:1,image:"assets/products/laptop.jpg"}],
    couponDiscount:1000, delivery:0
  },
  {
    id:"RX20250210", date:"2025-02-10", status:"delivered",
    items:[{id:3,name:"Shoes",category:"Fashion",price:900,originalPrice:1400,qty:2,image:"assets/products/shoes.jpg"}],
    couponDiscount:0, delivery:49
  },
  {
    id:"RX20250318", date:"2025-03-18", status:"returned",
    items:[{id:5,name:"Chair",category:"Home",price:1500,originalPrice:2000,qty:1,image:"assets/products/chair.jpg"}],
    couponDiscount:0, delivery:0
  },
  {
    id:"RX20250425", date:"2025-04-25", status:"delivered",
    items:[
      {id:4,name:"Tshirt",    category:"Fashion",    price:400, originalPrice:600, qty:3,image:"assets/products/tshirt.jpg"},
      {id:2,name:"Headphones",category:"Electronics",price:1200,originalPrice:1800,qty:1,image:"assets/products/headphones.jpg"}
    ],
    couponDiscount:200, delivery:0
  },
  {
    id:"RX20250602", date:"2025-06-02", status:"delivered",
    items:[{id:6,name:"Lamp",category:"Home",price:700,originalPrice:950,qty:2,image:"assets/products/lamp.jpg"}],
    couponDiscount:0, delivery:49
  },
  {
    id:"RX20250715", date:"2025-07-15", status:"cancelled",
    items:[{id:1,name:"Laptop",category:"Electronics",price:45000,originalPrice:52000,qty:1,image:"assets/products/laptop.jpg"}],
    couponDiscount:0, delivery:0
  },
  {
    id:"RX20250820", date:"2025-08-20", status:"delivered",
    items:[{id:3,name:"Shoes",category:"Fashion",price:900,originalPrice:1400,qty:1,image:"assets/products/shoes.jpg"}],
    couponDiscount:100, delivery:0
  },
  {
    id:"RX20250910", date:"2025-09-10", status:"delivered",
    items:[
      {id:5,name:"Chair",category:"Home",price:1500,originalPrice:2000,qty:1,image:"assets/products/chair.jpg"},
      {id:4,name:"Tshirt",category:"Fashion",price:400,originalPrice:600,qty:2,image:"assets/products/tshirt.jpg"}
    ],
    couponDiscount:0, delivery:49
  },
  {
    id:"RX20251105", date:"2025-11-05", status:"shipped",
    items:[{id:2,name:"Headphones",category:"Electronics",price:1200,originalPrice:1800,qty:2,image:"assets/products/headphones.jpg"}],
    couponDiscount:0, delivery:0
  },
  {
    id:"RX20251215", date:"2025-12-15", status:"processing",
    items:[{id:6,name:"Lamp",category:"Home",price:700,originalPrice:950,qty:3,image:"assets/products/lamp.jpg"}],
    couponDiscount:0, delivery:49
  },
  /* 2026 (current year) */
  {
    id:"RX20260105", date:"2026-01-05", status:"delivered",
    items:[{id:1,name:"Laptop",category:"Electronics",price:45000,originalPrice:52000,qty:1,image:"assets/products/laptop.jpg"}],
    couponDiscount:2000, delivery:0
  },
  {
    id:"RX20260208", date:"2026-02-08", status:"processing",
    items:[{id:3,name:"Shoes",category:"Fashion",price:900,originalPrice:1400,qty:2,image:"assets/products/shoes.jpg"}],
    couponDiscount:0, delivery:49
  },
  {
    id:"RX20260301", date:"2026-03-01", status:"shipped",
    items:[
      {id:4,name:"Tshirt",    category:"Fashion",    price:400, originalPrice:600,  qty:2,image:"assets/products/tshirt.jpg"},
      {id:5,name:"Chair",     category:"Home",       price:1500,originalPrice:2000, qty:1,image:"assets/products/chair.jpg"}
    ],
    couponDiscount:300, delivery:0
  }
]

/* helpers */
function orderTotal(o) {
  let sum = o.items.reduce((s,i) => s + i.price * i.qty, 0)
  return sum - o.couponDiscount + o.delivery
}

function orderOriginalTotal(o) {
  return o.items.reduce((s,i) => s + i.originalPrice * i.qty, 0)
}

function orderSavings(o) {
  return orderOriginalTotal(o) - orderTotal(o)
}

/* ====================================================
   STATE
   ==================================================== */
let activeFilter   = "all"
let selectedYear   = new Date().getFullYear()
let toastTimer     = null

/* ====================================================
   INIT
   ==================================================== */
window.onload = function () {
  renderStatCards()
  renderOrders()
  buildYearTabs()
  renderExpense(selectedYear)
}

/* ====================================================
   STAT CARDS (top row)
   ==================================================== */
function renderStatCards() {
  let all       = ORDERS
  let totalSpent= all.reduce((s,o) => s + orderTotal(o), 0)
  let delivered = all.filter(o => o.status === "delivered").length
  let returned  = all.filter(o => o.status === "returned").length

  animateCount("statTotal",     all.length)
  animateRupee("statSpent",     totalSpent)
  animateCount("statDelivered", delivered)
  animateCount("statReturned",  returned)
}

function animateCount(id, target) {
  let el = document.getElementById(id)
  let start = 0; let duration = 800
  let step = Math.ceil(target / (duration / 16))
  let iv = setInterval(() => {
    start = Math.min(start + step, target)
    el.innerText = start
    if (start >= target) clearInterval(iv)
  }, 16)
}

function animateRupee(id, target) {
  let el = document.getElementById(id)
  let start = 0; let duration = 900
  let step = Math.ceil(target / (duration / 16))
  let iv = setInterval(() => {
    start = Math.min(start + step, target)
    el.innerText = "₹" + start.toLocaleString()
    if (start >= target) clearInterval(iv)
  }, 16)
}

/* ====================================================
   ORDER LIST RENDER
   ==================================================== */
let currentFilterValue = "all"

function setFilter(btn, filter) {
  document.querySelectorAll(".ftab").forEach(b => b.classList.remove("active"))
  btn.classList.add("active")
  currentFilterValue = filter
  filterOrders()
}

function filterOrders() {
  let search = document.getElementById("orderSearch").value.toLowerCase()
  let sort   = document.getElementById("orderSort").value

  let list = ORDERS.filter(o => {
    /* status filter */
    if (currentFilterValue !== "all" && o.status !== currentFilterValue) return false
    /* search */
    if (search) {
      let match = o.id.toLowerCase().includes(search) ||
                  o.items.some(i => i.name.toLowerCase().includes(search))
      if (!match) return false
    }
    return true
  })

  /* sort */
  list = [...list].sort((a,b) => {
    if (sort === "newest") return new Date(b.date) - new Date(a.date)
    if (sort === "oldest") return new Date(a.date) - new Date(b.date)
    if (sort === "high")   return orderTotal(b) - orderTotal(a)
    if (sort === "low")    return orderTotal(a) - orderTotal(b)
    return 0
  })

  renderOrderList(list)
}

function renderOrders() { filterOrders() }

function renderOrderList(list) {
  let container = document.getElementById("ordersList")
  let empty     = document.getElementById("ordersEmpty")

  container.innerHTML = ""

  if (list.length === 0) {
    empty.classList.remove("hidden")
    return
  }
  empty.classList.add("hidden")

  list.forEach((order, idx) => {
    let card = buildOrderCard(order, idx)
    container.appendChild(card)
  })
}

const STATUS_ICONS = {
  delivered:  "fa-circle-check",
  shipped:    "fa-truck",
  processing: "fa-gear",
  cancelled:  "fa-xmark-circle",
  returned:   "fa-rotate-left"
}

const TRACKER_STEPS = ["Order Placed", "Processing", "Shipped", "Delivered"]
const TRACKER_STATUS_IDX = { processing:1, shipped:2, delivered:3, cancelled:0, returned:0 }

function buildOrderCard(order, idx) {
  let card = document.createElement("div")
  card.className = "order-card"
  card.style.animationDelay = (idx * 0.06) + "s"
  card.onclick = () => openDrawer(order)

  let total    = orderTotal(order)
  let savings  = orderSavings(order)
  let names    = order.items.map(i => i.name).join(", ")
  let date     = new Date(order.date).toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"})
  let totalQty = order.items.reduce((s,i) => s + i.qty, 0)

  /* images (max 3 shown + overflow badge) */
  let imgsHTML = ""
  let showImgs = order.items.slice(0,3)
  showImgs.forEach(i => {
    imgsHTML += `<img class="order-img" src="${i.image}" onerror="this.src='assets/products/demo.jpg'" alt="${i.name}">`
  })
  if (order.items.length > 3) {
    imgsHTML += `<div class="order-more-badge">+${order.items.length - 3}</div>`
  }

  /* mini tracker */
  let trackerHTML = ""
  let statusIdx = TRACKER_STATUS_IDX[order.status] ?? 0
  if (order.status === "cancelled" || order.status === "returned") {
    trackerHTML = `<span style="font-size:12px;color:var(--muted)">—</span>`
  } else {
    TRACKER_STEPS.forEach((s, i) => {
      let dotClass = i < statusIdx ? "done" : (i === statusIdx ? "current" : "")
      trackerHTML += `<div class="tracker-dot ${dotClass}"></div>`
      if (i < TRACKER_STEPS.length - 1) {
        trackerHTML += `<div class="tracker-line ${i < statusIdx ? "done" : ""}"></div>`
      }
    })
  }

  card.innerHTML = `
    <div class="order-card-header">
      <div>
        <div class="order-id">${order.id}</div>
        <div class="order-date">${date}</div>
      </div>
      <span class="order-status-badge status-${order.status}">
        <i class="fa-solid ${STATUS_ICONS[order.status]}"></i> ${order.status}
      </span>
    </div>
    <div class="order-card-body">
      <div class="order-imgs">${imgsHTML}</div>
      <div class="order-meta">
        <div class="order-items-summary">${names}</div>
        <div class="order-items-count">${totalQty} item${totalQty > 1 ? "s" : ""}</div>
        <div class="order-tracker">${trackerHTML}</div>
      </div>
      <div class="order-card-right">
        <div class="order-total">₹${total.toLocaleString()}</div>
        ${savings > 0 ? `<div class="order-savings">Saved ₹${savings.toLocaleString()}</div>` : ""}
        <div class="order-action-btn"><i class="fa-solid fa-chevron-right"></i> View Details</div>
      </div>
    </div>
  `
  return card
}

/* ====================================================
   ORDER DETAIL DRAWER
   ==================================================== */
function openDrawer(order) {
  let body = document.getElementById("drawerBody")
  let date = new Date(order.date).toLocaleDateString("en-IN", {weekday:"long",day:"2-digit",month:"long",year:"numeric"})
  let total       = orderTotal(order)
  let subtotal    = order.items.reduce((s,i) => s + i.price * i.qty, 0)
  let origTotal   = orderOriginalTotal(order)
  let savings     = origTotal - subtotal
  let statusIdx   = TRACKER_STATUS_IDX[order.status] ?? 0

  /* full tracker */
  let steps = [
    {label:"Placed",     icon:"fa-file-circle-check"},
    {label:"Processing", icon:"fa-gear"},
    {label:"Shipped",    icon:"fa-truck"},
    {label:"Delivered",  icon:"fa-house"}
  ]

  let trackerHTML = `<div class="drawer-tracker">`
  steps.forEach((s, i) => {
    let cls = ""
    if (order.status === "cancelled" || order.status === "returned") {
      cls = i === 0 ? "done" : ""
    } else {
      cls = i < statusIdx ? "done" : (i === statusIdx ? "current" : "")
    }
    trackerHTML += `
      <div class="tracker-step ${cls}">
        <div class="tracker-step-icon"><i class="fa-solid ${s.icon}"></i></div>
        <span class="tracker-step-label">${s.label}</span>
      </div>`
    if (i < steps.length - 1) {
      trackerHTML += `<div class="tracker-connector ${i < statusIdx && order.status !== "cancelled" ? "done" : ""}"></div>`
    }
  })
  trackerHTML += `</div>`

  /* items */
  let itemsHTML = order.items.map(i => `
    <div class="drawer-item">
      <img src="${i.image}" onerror="this.src='assets/products/demo.jpg'" alt="${i.name}">
      <div class="drawer-item-info">
        <div class="drawer-item-name">${i.name}</div>
        <div class="drawer-item-cat">${i.category}</div>
        <div class="drawer-item-qty">Qty: ${i.qty}</div>
      </div>
      <div class="drawer-item-price">₹${(i.price * i.qty).toLocaleString()}</div>
    </div>
  `).join("")

  /* action buttons */
  let actionsHTML = ""
  if (order.status === "delivered") {
    actionsHTML = `
      <button class="drawer-btn primary" onclick="showToast('Reorder placed! 🎉')"><i class="fa-solid fa-rotate-right"></i> Reorder</button>
      <button class="drawer-btn secondary" onclick="showToast('Return request submitted',false)"><i class="fa-solid fa-rotate-left"></i> Return</button>
    `
  } else if (order.status === "shipped" || order.status === "processing") {
    actionsHTML = `
      <button class="drawer-btn primary" onclick="showToast('Tracking info sent to your email')"><i class="fa-solid fa-location-dot"></i> Track Order</button>
      <button class="drawer-btn secondary" onclick="showToast('Cancellation request sent',false)"><i class="fa-solid fa-xmark"></i> Cancel</button>
    `
  } else {
    actionsHTML = `
      <button class="drawer-btn primary" onclick="window.location.href='index.html'"><i class="fa-solid fa-store"></i> Shop Again</button>
    `
  }

  body.innerHTML = `
    <div class="drawer-order-meta">
      <div>
        <span class="drawer-order-id">${order.id}</span>
        <span class="drawer-order-date">${date}</span>
      </div>
      <span class="order-status-badge status-${order.status}">
        <i class="fa-solid ${STATUS_ICONS[order.status]}"></i> ${order.status}
      </span>
    </div>

    ${trackerHTML}

    <div class="drawer-items">${itemsHTML}</div>

    <div class="drawer-price-summary">
      <div class="drawer-price-row"><span>Subtotal</span><span>₹${subtotal.toLocaleString()}</span></div>
      ${savings > 0 ? `<div class="drawer-price-row"><span>Savings</span><span class="dr-savings">−₹${savings.toLocaleString()}</span></div>` : ""}
      ${order.couponDiscount > 0 ? `<div class="drawer-price-row"><span>Coupon Discount</span><span class="dr-savings">−₹${order.couponDiscount.toLocaleString()}</span></div>` : ""}
      <div class="drawer-price-row"><span>Delivery</span><span>${order.delivery === 0 ? "FREE" : "₹"+order.delivery}</span></div>
      <div class="drawer-price-row total-row"><span>Total Paid</span><span>₹${total.toLocaleString()}</span></div>
    </div>

    <div class="drawer-actions">${actionsHTML}</div>
  `

  document.getElementById("drawerOverlay").classList.add("open")
  document.getElementById("orderDrawer").classList.add("open")
}

function closeDrawer() {
  document.getElementById("drawerOverlay").classList.remove("open")
  document.getElementById("orderDrawer").classList.remove("open")
}

/* ====================================================
   EXPENSE CALCULATOR
   ==================================================== */

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

function getYears() {
  let years = [...new Set(ORDERS.map(o => new Date(o.date).getFullYear()))]
  return years.sort((a,b) => b - a)
}

function buildYearTabs() {
  let container = document.getElementById("yearTabs")
  let years     = getYears()

  container.innerHTML = ""
  years.forEach(y => {
    let btn = document.createElement("button")
    btn.className = "ytab" + (y === selectedYear ? " active" : "")
    btn.innerText = y
    btn.onclick = () => {
      document.querySelectorAll(".ytab").forEach(b => b.classList.remove("active"))
      btn.classList.add("active")
      selectedYear = y
      renderExpense(y)
    }
    container.appendChild(btn)
  })
}

function ordersForYear(year) {
  return ORDERS.filter(o => new Date(o.date).getFullYear() === year)
}

function renderExpense(year) {
  document.getElementById("selectedYearLabel").innerText = year

  let yearOrders = ordersForYear(year)
  /* exclude cancelled for spending */
  let spendOrders = yearOrders.filter(o => o.status !== "cancelled")

  let totalSpent = spendOrders.reduce((s,o) => s + orderTotal(o), 0)
  let totalSaved = spendOrders.reduce((s,o) => s + orderSavings(o), 0)
  let avgPerOrder = spendOrders.length ? Math.round(totalSpent / spendOrders.length) : 0

  /* animate total */
  animateExpenseTotal(totalSpent)
  document.getElementById("expenseTotalMeta").innerText =
    `${spendOrders.length} order${spendOrders.length !== 1 ? "s" : ""} · avg ₹${avgPerOrder.toLocaleString()}/order`

  /* metrics */
  let amounts = spendOrders.map(o => orderTotal(o))
  document.getElementById("metricHighest").innerText = amounts.length ? "₹" + Math.max(...amounts).toLocaleString() : "—"
  document.getElementById("metricLowest").innerText  = amounts.length ? "₹" + Math.min(...amounts).toLocaleString() : "—"
  document.getElementById("metricAvgMonth").innerText= "₹" + Math.round(totalSpent / 12).toLocaleString()

  /* most bought category */
  let catMap = {}
  spendOrders.forEach(o => o.items.forEach(i => {
    catMap[i.category] = (catMap[i.category] || 0) + i.qty
  }))
  let topCat = Object.entries(catMap).sort((a,b) => b[1]-a[1])[0]
  document.getElementById("metricCategory").innerText = topCat ? topCat[0] : "—"

  document.getElementById("expenseSavings").innerText = "₹" + totalSaved.toLocaleString()

  renderBarChart(year, spendOrders)
  renderCategoryBreakdown(spendOrders)
}

function animateExpenseTotal(target) {
  let el = document.getElementById("expenseTotalAmount")
  let start = 0; let duration = 900
  let step = Math.max(1, Math.ceil(target / (duration / 16)))
  let iv = setInterval(() => {
    start = Math.min(start + step, target)
    el.innerText = "₹" + start.toLocaleString()
    if (start >= target) clearInterval(iv)
  }, 16)
}

/* --- Monthly Bar Chart --- */
function renderBarChart(year, spendOrders) {
  let monthlyTotals = Array(12).fill(0)
  spendOrders.forEach(o => {
    let m = new Date(o.date).getMonth()
    monthlyTotals[m] += orderTotal(o)
  })

  let maxVal   = Math.max(...monthlyTotals, 1)
  let peakIdx  = monthlyTotals.indexOf(Math.max(...monthlyTotals))

  let chart  = document.getElementById("barChart")
  let labels = document.getElementById("monthLabels")
  chart.innerHTML  = ""
  labels.innerHTML = ""

  monthlyTotals.forEach((val, i) => {
    let pct = (val / maxVal) * 100
    let col = document.createElement("div")
    col.className = "bar-col"

    let fill = document.createElement("div")
    fill.className = "bar-fill" + (val === 0 ? " empty-bar" : "") + (i === peakIdx && val > 0 ? " peak-bar" : "")
    fill.style.height = "3px"
    fill.setAttribute("data-tip", val > 0 ? `${MONTHS[i]}: ₹${val.toLocaleString()}` : `${MONTHS[i]}: No spend`)

    col.appendChild(fill)
    chart.appendChild(col)

    /* animate height after paint */
    setTimeout(() => {
      fill.style.height = pct + "%"
    }, 80 + i * 40)

    let lbl = document.createElement("div")
    lbl.className = "month-lbl"
    lbl.innerText = MONTHS[i]
    labels.appendChild(lbl)
  })

  /* peak label */
  let peakEl = document.getElementById("chartPeak")
  if (monthlyTotals[peakIdx] > 0) {
    peakEl.innerText = `Peak: ${MONTHS[peakIdx]} ₹${monthlyTotals[peakIdx].toLocaleString()}`
  } else {
    peakEl.innerText = ""
  }
}

/* --- Category Breakdown --- */
function renderCategoryBreakdown(spendOrders) {
  let catSpend = {}
  spendOrders.forEach(o => {
    o.items.forEach(i => {
      let amt = i.price * i.qty
      catSpend[i.category] = (catSpend[i.category] || 0) + amt
    })
  })

  let total   = Object.values(catSpend).reduce((s,v) => s + v, 0) || 1
  let sorted  = Object.entries(catSpend).sort((a,b) => b[1] - a[1])
  let container = document.getElementById("categoryBars")
  container.innerHTML = ""

  if (sorted.length === 0) {
    container.innerHTML = `<p style="font-size:13px;color:var(--muted)">No data for this year</p>`
    return
  }

  sorted.forEach(([cat, amt], idx) => {
    let pct = Math.round((amt / total) * 100)
    let row = document.createElement("div")
    row.className = "cat-row"
    row.style.animationDelay = (idx * 0.08) + "s"

    row.innerHTML = `
      <div class="cat-row-top">
        <span class="cat-name">${cat}</span>
        <span>
          <span class="cat-amount">₹${amt.toLocaleString()}</span>
          &nbsp;
          <span class="cat-pct">${pct}%</span>
        </span>
      </div>
      <div class="cat-bar-track">
        <div class="cat-bar-fill" style="width:0%" data-pct="${pct}%"></div>
      </div>
    `
    container.appendChild(row)

    /* animate fill */
    setTimeout(() => {
      row.querySelector(".cat-bar-fill").style.width = pct + "%"
    }, 100 + idx * 80)
  })
}

/* ====================================================
   TOAST
   ==================================================== */
function showToast(message, isError = false) {
  let toast = document.getElementById("toast")
  toast.innerText = message
  toast.classList.remove("error-toast")
  if (isError) toast.classList.add("error-toast")
  toast.classList.add("show")
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800)
}