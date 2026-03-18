/* ====================================================
   RadiusX — product.js
   Reads ?id= from URL, loads matching product data,
   renders gallery, info, specs, reviews, related items.
   All product data lives in PRODUCTS_DB below —
   add more products here following the same schema.
   ==================================================== */


/* ===================================================
   PRODUCTS DATABASE
   Add as many products as you need here.
   Each product follows this schema exactly.
   =================================================== */

const PRODUCTS_DB = [
  {
    id: 1,
    name: "Laptop",
    category: "Electronics",
    price: 45000,
    originalPrice: 52000,
    rating: 4.5,
    reviews: 128,
    stock: true,
    deliveryDays: "2–3",
    images: [
      "assets/products/laptop.jpg",
      "assets/products/laptop-2.jpg",
      "assets/products/laptop-3.jpg",
      "assets/products/laptop-4.jpg"
    ],
    colours: ["#1a1a2e","#2d2d44","#c4df9a"],
    description: `The RadiusX Laptop is engineered for those who demand power and portability in equal measure. With a stunning high-resolution display, ultra-fast processor, and all-day battery life, it handles everything from heavy multitasking to creative work with effortless precision. The sleek aluminium chassis keeps it feather-light without sacrificing structural integrity. Whether you're in a café, office, or on a flight, this laptop is built to move with you.`,
    highlights: [
      "Latest-gen processor — blazing fast performance",
      "15.6\" Full HD IPS display, 144Hz refresh rate",
      "16GB DDR5 RAM, upgradeable to 32GB",
      "512GB NVMe SSD — loads in under 1 second",
      "10-hour battery life with fast-charge support",
      "Backlit keyboard with fingerprint sensor",
      "Wi-Fi 6 + Bluetooth 5.2"
    ],
    specs: [
      ["Brand",       "RadiusX Tech"],
      ["Processor",   "Intel Core i7-13th Gen"],
      ["RAM",         "16 GB DDR5"],
      ["Storage",     "512 GB NVMe SSD"],
      ["Display",     "15.6\" FHD IPS 144Hz"],
      ["Graphics",    "NVIDIA RTX 3050 4GB"],
      ["Battery",     "72 Wh, 10 hrs"],
      ["OS",          "Windows 11 Home"],
      ["Weight",      "1.8 kg"],
      ["Ports",       "2× USB-A, 1× USB-C, HDMI, SD Card"],
      ["Warranty",    "1 Year On-Site"]
    ],
    userReviews: [
      { name:"Aryan Verma",   rating:5, date:"Jan 2026", text:"Absolutely love this laptop! The display is gorgeous and the performance is top-notch. Battery lasts all day at work without any issues.", helpful:24 },
      { name:"Priya Nair",    rating:4, date:"Feb 2026", text:"Great build quality and very fast. The fans can be a bit loud under heavy load but nothing deal-breaking. Would definitely recommend.", helpful:17 },
      { name:"Rohit Sharma",  rating:5, date:"Mar 2026", text:"Best laptop I've owned. Gaming performance is excellent and the keyboard is super comfortable. Worth every rupee.", helpful:31 }
    ]
  },
  {
    id: 2,
    name: "Headphones",
    category: "Electronics",
    price: 1200,
    originalPrice: 1800,
    rating: 4.2,
    reviews: 85,
    stock: true,
    deliveryDays: "1–2",
    images: [
      "assets/products/headphones.jpg",
      "assets/products/headphones-2.jpg"
    ],
    colours: ["#111","#2a2a2a","#c4df9a","#e84545"],
    description: `Immerse yourself in sound with these premium over-ear headphones. Featuring deep bass, crisp highs, and a soundstage that puts you right inside the music, they're built for audiophiles and casual listeners alike. The cushioned ear cups and adjustable headband ensure hours of comfortable listening, while the 40mm driver delivers room-filling audio. With a foldable design and included carry pouch, they're made for life on the move.`,
    highlights: [
      "40mm dynamic driver — rich full-range sound",
      "Active Noise Cancellation (ANC)",
      "30-hour battery on a single charge",
      "Bluetooth 5.3 + 3.5mm wired mode",
      "Built-in mic for calls & voice assistant",
      "Foldable design with carry pouch",
      "Fast charge — 15 min for 3 hours playback"
    ],
    specs: [
      ["Type",          "Over-Ear Wireless"],
      ["Driver",        "40mm Dynamic"],
      ["Frequency",     "20Hz – 20kHz"],
      ["Impedance",     "32Ω"],
      ["Connectivity",  "Bluetooth 5.3, 3.5mm AUX"],
      ["Battery",       "800mAh — 30 hrs"],
      ["Noise Cancel",  "Active (ANC)"],
      ["Weight",        "250g"],
      ["Colour",        "Black / Olive / Red"],
      ["Warranty",      "1 Year"]
    ],
    userReviews: [
      { name:"Sneha Joshi",  rating:4, date:"Feb 2026", text:"Really good sound for the price. ANC works well in public transport. Comfortable to wear for long sessions.", helpful:12 },
      { name:"Karan Mehta", rating:5, date:"Jan 2026", text:"Exceeded my expectations completely. Bass is powerful, mids are clear. Battery life is phenomenal.", helpful:22 }
    ]
  },
  {
    id: 3,
    name: "Shoes",
    category: "Fashion",
    price: 900,
    originalPrice: 1400,
    rating: 4.0,
    reviews: 63,
    stock: true,
    deliveryDays: "2–4",
    images: [
      "assets/products/shoes.jpg",
      "assets/products/shoes-2.jpg"
    ],
    colours: ["#1a1a1a","#fff","#c4df9a","#8b4513"],
    description: `Step out in style with these premium everyday sneakers. Crafted with a breathable mesh upper, responsive EVA midsole, and durable rubber outsole, they deliver unmatched comfort from morning to night. The minimalist design pairs effortlessly with casual and semi-formal looks. Reinforced heel support and padded collar prevent blisters, making them ideal for long walks, travel, or just a day out in the city.`,
    highlights: [
      "Breathable mesh upper — keeps feet cool",
      "EVA foam midsole — lightweight cushioning",
      "Anti-slip rubber outsole",
      "Reinforced heel & toe cap",
      "Padded collar & insole",
      "Available in sizes 6–12",
      "Machine washable"
    ],
    specs: [
      ["Upper",       "Breathable Mesh"],
      ["Midsole",     "EVA Foam"],
      ["Outsole",     "Rubber"],
      ["Closure",     "Lace-up"],
      ["Sizes",       "UK 6 – 12"],
      ["Weight",      "310g per shoe"],
      ["Care",        "Machine Washable"],
      ["Warranty",    "6 Months"]
    ],
    userReviews: [
      { name:"Aarav Singh", rating:4, date:"Mar 2026", text:"Really comfortable for all-day wear. The mesh keeps feet from getting too warm. Looks great with jeans.", helpful:8 },
      { name:"Meera Das",   rating:4, date:"Feb 2026", text:"Good quality at this price point. Size runs true. Would buy again in another colour.", helpful:14 }
    ]
  },
  {
    id: 4,
    name: "Tshirt",
    category: "Fashion",
    price: 400,
    originalPrice: 600,
    rating: 3.8,
    reviews: 42,
    stock: true,
    deliveryDays: "1–3",
    images: [
      "assets/products/tshirt.jpg"
    ],
    colours: ["#1a1a2e","#fff","#c4df9a","#8b2323"],
    description: `A wardrobe essential done right. This premium cotton T-shirt is crafted from 100% combed cotton for a smooth, breathable feel. The relaxed fit flatters all body types, while the reinforced neckline holds its shape even after multiple washes. Ideal as a standalone piece or a layering base, it's available in a range of colours to suit every style. Thoughtful details like taped neck seams and side vents make this anything but ordinary.`,
    highlights: [
      "100% combed cotton — soft & breathable",
      "Relaxed fit — suits all body types",
      "Pre-shrunk fabric — wash-proof sizing",
      "Reinforced neckband — retains shape",
      "Side vents for mobility & airflow",
      "Taped shoulder seams",
      "Sizes XS to XXL"
    ],
    specs: [
      ["Fabric",      "100% Combed Cotton"],
      ["Fit",         "Relaxed"],
      ["Neck",        "Round Neck"],
      ["Sleeve",      "Half Sleeve"],
      ["Sizes",       "XS, S, M, L, XL, XXL"],
      ["GSM",         "180 GSM"],
      ["Care",        "Machine Wash Cold"],
      ["Warranty",    "Not Applicable"]
    ],
    userReviews: [
      { name:"Dev Kapoor", rating:4, date:"Jan 2026", text:"Very soft fabric, fits perfectly. The colour hasn't faded after many washes which is great.", helpful:5 }
    ]
  },
  {
    id: 5,
    name: "Chair",
    category: "Home",
    price: 1500,
    originalPrice: 2000,
    rating: 4.3,
    reviews: 34,
    stock: true,
    deliveryDays: "3–5",
    images: [
      "assets/products/chair.jpg",
      "assets/products/chair-2.jpg"
    ],
    colours: ["#1a1a2e","#5c3a1e","#2d4a2d"],
    description: `Bring both form and function into your home with this ergonomic study and work chair. Designed for long-hour usage, it features an adjustable lumbar support, breathable mesh back, and padded seat cushion that distributes weight evenly. The 360° swivel base with smooth-rolling casters makes it easy to move across any floor type. The minimalist design blends with any home décor, from modern to Scandinavian.`,
    highlights: [
      "Adjustable lumbar support — posture-friendly",
      "Breathable mesh backrest",
      "High-density foam seat cushion",
      "Height adjustable — 45–55cm seat height",
      "360° swivel with silent casters",
      "Supports up to 120 kg",
      "Easy flat-pack assembly included"
    ],
    specs: [
      ["Material",     "Mesh + Metal Frame"],
      ["Seat Height",  "45–55 cm (adjustable)"],
      ["Weight Cap",   "120 kg"],
      ["Armrests",     "Fixed padded armrests"],
      ["Base",         "5-star steel base"],
      ["Casters",      "Soft PU — all floors"],
      ["Assembly",     "Required (30 min)"],
      ["Warranty",     "2 Years"]
    ],
    userReviews: [
      { name:"Ishaan Roy",   rating:5, date:"Feb 2026", text:"Best chair I've bought for home office. Back support is excellent, no fatigue after 8-hour work days.", helpful:19 },
      { name:"Nisha Patel",  rating:4, date:"Mar 2026", text:"Sturdy and comfortable. Assembly was straightforward. The mesh back is very breathable.", helpful:9 }
    ]
  },
  {
    id: 6,
    name: "Lamp",
    category: "Home",
    price: 700,
    originalPrice: 950,
    rating: 4.1,
    reviews: 27,
    stock: true,
    deliveryDays: "2–4",
    images: [
      "assets/products/lamp.jpg"
    ],
    colours: ["#c4df9a","#f5c518","#fff"],
    description: `Illuminate your space with purpose. This modern LED desk lamp features a flexible gooseneck arm that bends to any angle, delivering focused light exactly where you need it. With three colour temperatures (warm, neutral, daylight) and five brightness levels, it adapts to any activity — from late-night reading to precision tasks. Touch-sensitive controls, a USB charging port in the base, and a stable weighted base complete the package.`,
    highlights: [
      "3 colour temperatures — warm, neutral, daylight",
      "5 brightness levels — touch control",
      "Flexible 360° gooseneck arm",
      "USB-A port in base for charging",
      "LED lifespan 50,000+ hours",
      "Flicker-free, eye-care certified",
      "Auto-off timer (30 / 60 min)"
    ],
    specs: [
      ["Light Source",  "LED"],
      ["Power",         "10W"],
      ["Colour Temp",   "2700K / 4000K / 6500K"],
      ["Brightness",    "5 levels (100–500 lux)"],
      ["Control",       "Touch panel"],
      ["Arm",           "360° flexible gooseneck"],
      ["USB Port",      "5V 1A USB-A"],
      ["Warranty",      "1 Year"]
    ],
    userReviews: [
      { name:"Ayesha Khan", rating:4, date:"Jan 2026", text:"Excellent lamp for studying. The colour temperature options are very useful. USB port is a nice bonus.", helpful:7 }
    ]
  }
]


/* ===================================================
   GLOBAL STATE
   =================================================== */

let currentProduct  = null
let selectedQty     = 1
let selectedColour  = 0
let pickedStar      = 0
let wishlistIds     = JSON.parse(localStorage.getItem("rx_wishlist") || "[]")


/* ===================================================
   INIT
   =================================================== */

window.onload = function () {
  let params = new URLSearchParams(window.location.search)
  let id     = parseInt(params.get("id"))

  currentProduct = PRODUCTS_DB.find(p => p.id === id)

  if (!currentProduct) {
    /* product not found — redirect home */
    document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:16px;background:rgb(8,12,16);color:rgb(230,235,240);">
        <i class="fa-solid fa-circle-exclamation" style="font-size:48px;color:rgb(255,95,95);"></i>
        <h2 style="font-family:'Playfair Display',serif;font-size:26px;">Product not found</h2>
        <a href="index.html" style="color:rgb(196,223,154);font-size:14px;text-decoration:none;">← Back to Home</a>
      </div>`
    return
  }

  updateCartBadge()
  renderBreadcrumb()
  renderGallery()
  renderInfo()
  renderHighlights()
  renderSpecs()
  renderReviews()
  renderRelated()
  initTabUnderline()
  initWishlist()
}


/* ===================================================
   BREADCRUMB
   =================================================== */

function renderBreadcrumb() {
  document.getElementById("bcCategory").innerText = currentProduct.category
  document.getElementById("bcName").innerText     = currentProduct.name
  document.title = "RadiusX — " + currentProduct.name
}


/* ===================================================
   GALLERY
   =================================================== */

function renderGallery() {
  let p        = currentProduct
  let rail     = document.getElementById("thumbRail")
  let mainImg  = document.getElementById("mainImage")

  /* set first image */
  mainImg.src = p.images[0]
  mainImg.onclick = () => openLightbox(p.images[0])

  if (p.images.length <= 1) {
    rail.style.display = "none"
    return
  }

  p.images.forEach((src, i) => {
    let thumb     = document.createElement("div")
    thumb.className = "thumb" + (i === 0 ? " active" : "")
    thumb.innerHTML = `<img src="${src}" onerror="this.src='assets/products/demo.jpg'" alt="view ${i+1}">`
    thumb.onclick   = () => setMainImage(src, thumb)
    rail.appendChild(thumb)
  })
}

function setMainImage(src, thumbEl) {
  document.getElementById("mainImage").src  = src
  document.getElementById("mainImage").onclick = () => openLightbox(src)
  document.querySelectorAll(".thumb").forEach(t => t.classList.remove("active"))
  thumbEl.classList.add("active")
}


/* ===================================================
   PRODUCT INFO
   =================================================== */

function renderInfo() {
  let p = currentProduct

  document.getElementById("productCategory").innerText = p.category
  document.getElementById("productName").innerText     = p.name

  /* stars */
  document.getElementById("productStars").innerHTML = buildStars(p.rating)
  document.getElementById("ratingVal").innerText    = p.rating.toFixed(1)
  document.getElementById("reviewLink").innerText   = `(${p.reviews} reviews)`

  /* stock */
  let stockEl = document.getElementById("stockStatus")
  stockEl.innerText   = p.stock ? "In Stock" : "Out of Stock"
  stockEl.className   = "in-stock " + (p.stock ? "yes" : "no")

  /* prices */
  let discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
  document.getElementById("priceMain").innerText     = "₹" + p.price.toLocaleString()
  document.getElementById("priceOriginal").innerText = "₹" + p.originalPrice.toLocaleString()
  document.getElementById("priceOff").innerText      = discount + "% off"

  /* free delivery note */
  let freeNote = document.getElementById("freeDelNote")
  if (p.price >= 999) {
    freeNote.innerText = "Free delivery on this order."
  } else {
    freeNote.innerText = ""
  }

  /* delivery days */
  document.getElementById("deliveryDays").innerText = p.deliveryDays

  /* discount badge */
  document.getElementById("discountBadge").innerText = discount + "% OFF"

  /* description */
  document.getElementById("productDescription").innerText = p.description

  /* colour swatches */
  let swatchWrap = document.getElementById("swatches")
  if (p.colours && p.colours.length) {
    p.colours.forEach((col, i) => {
      let sw       = document.createElement("div")
      sw.className = "swatch" + (i === 0 ? " active" : "")
      sw.style.background = col
      sw.title     = col
      sw.onclick   = () => {
        document.querySelectorAll(".swatch").forEach(s => s.classList.remove("active"))
        sw.classList.add("active")
        selectedColour = i
      }
      swatchWrap.appendChild(sw)
    })
  } else {
    document.getElementById("variantsWrap").style.display = "none"
  }
}


/* ===================================================
   HIGHLIGHTS
   =================================================== */

function renderHighlights() {
  let list = document.getElementById("highlightsList")
  currentProduct.highlights.forEach(h => {
    let li = document.createElement("li")
    li.innerText = h
    list.appendChild(li)
  })
}


/* ===================================================
   SPECIFICATIONS
   =================================================== */

function renderSpecs() {
  let table = document.getElementById("specsTable")
  currentProduct.specs.forEach(([key, val]) => {
    let tr = document.createElement("tr")
    tr.innerHTML = `<td>${key}</td><td>${val}</td>`
    table.appendChild(tr)
  })
}


/* ===================================================
   REVIEWS
   =================================================== */

function renderReviews() {
  let p = currentProduct

  /* big rating number */
  document.getElementById("bigRating").innerHTML = `
    <span class="big-num">${p.rating.toFixed(1)}</span>
    <div class="big-stars">${buildStars(p.rating)}</div>
    <span class="big-total">${p.reviews} reviews</span>
  `

  /* rating distribution bars (demo percentages) */
  let bars   = document.getElementById("ratingBars")
  let dist   = [0, 5, 10, 35, 50] /* % for 1★ to 5★ */
  for (let i = 5; i >= 1; i--) {
    let pct  = dist[i - 1]
    let row  = document.createElement("div")
    row.className = "rating-bar-row"
    row.innerHTML = `
      <span>${i}★</span>
      <div class="rating-bar-bg">
        <div class="rating-bar-fill" style="width:0%" data-pct="${pct}%"></div>
      </div>
      <span>${pct}%</span>
    `
    bars.appendChild(row)
  }

  /* animate bars after paint */
  setTimeout(() => {
    document.querySelectorAll(".rating-bar-fill").forEach(el => {
      el.style.width = el.dataset.pct
    })
  }, 200)

  /* review cards */
  renderReviewCards(p.userReviews)
}

function renderReviewCards(reviews) {
  let list = document.getElementById("reviewsList")
  list.innerHTML = ""
  reviews.forEach((r, idx) => {
    let card = document.createElement("div")
    card.className = "review-card"
    card.style.animationDelay = (idx * 0.08) + "s"
    card.innerHTML = `
      <div class="review-header">
        <div class="reviewer-info">
          <span class="reviewer-name">${r.name}</span>
          <span class="review-meta">Verified Purchase · ${r.date}</span>
        </div>
        <div class="review-stars">${buildStars(r.rating)}</div>
      </div>
      <p class="review-body">${r.text}</p>
      <div class="review-helpful">
        Helpful?
        <button class="helpful-btn" onclick="markHelpful(this, ${idx})">
          <i class="fa-regular fa-thumbs-up"></i> ${r.helpful}
        </button>
      </div>
    `
    list.appendChild(card)
  })
}


/* ===================================================
   WRITE REVIEW
   =================================================== */

function pickStar(n) {
  pickedStar = n
  document.querySelectorAll(".rev-star").forEach((star, i) => {
    star.className = "fa-star rev-star " + (i < n ? "fa-solid selected" : "fa-regular")
  })
}

function submitReview() {
  let token = localStorage.getItem("token")
  if (!token) {
    showToast("Please sign in to leave a review", true)
    setTimeout(() => { window.location.href = "login.html" }, 1200)
    return
  }

  let text = document.getElementById("reviewText").value.trim()
  if (!pickedStar) { showToast("Please select a star rating", true); return }
  if (!text)        { showToast("Please write your review", true); return }

  /* Get user name from localStorage */
  let users = JSON.parse(localStorage.getItem("rx_users") || "[]")
  let email = atob(token)
  let user  = users.find(u => u.email === email)
  let name  = user ? user.name : "Anonymous"

  let newReview = {
    name,
    rating: pickedStar,
    date: new Date().toLocaleDateString("en-IN", { month:"short", year:"numeric" }),
    text,
    helpful: 0
  }

  currentProduct.userReviews.unshift(newReview)

  /* re-render reviews */
  renderReviewCards(currentProduct.userReviews)

  /* reset form */
  document.getElementById("reviewText").value = ""
  pickedStar = 0
  document.querySelectorAll(".rev-star").forEach(s => {
    s.className = "fa-regular fa-star rev-star"
  })

  showToast("Review submitted! Thank you 🙏")

  /* scroll back to list */
  document.getElementById("reviewsList").scrollIntoView({ behavior: "smooth", block: "start" })
}

function markHelpful(btn, idx) {
  currentProduct.userReviews[idx].helpful++
  let count = currentProduct.userReviews[idx].helpful
  btn.innerHTML = `<i class="fa-solid fa-thumbs-up"></i> ${count}`
  btn.disabled = true
  btn.style.color         = "var(--accent)"
  btn.style.borderColor   = "var(--accent)"
}


/* ===================================================
   RELATED PRODUCTS
   =================================================== */

function renderRelated() {
  let p       = currentProduct
  let related = PRODUCTS_DB.filter(prod =>
    prod.id !== p.id && prod.category === p.category
  )

  /* If nothing in same category, show others */
  if (related.length === 0) {
    related = PRODUCTS_DB.filter(prod => prod.id !== p.id).slice(0, 4)
  }

  let grid    = document.getElementById("relatedGrid")
  let section = document.getElementById("relatedSection")

  if (related.length === 0) { section.style.display = "none"; return }

  related.forEach((prod, idx) => {
    let card = document.createElement("div")
    card.className = "related-card"
    card.style.animationDelay = (idx * 0.08) + "s"
    let discount = Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)

    card.innerHTML = `
      <img src="${prod.images[0]}" onerror="this.src='assets/products/demo.jpg'" alt="${prod.name}">
      <h4>${prod.name}</h4>
      <div class="rc-stars">${buildStars(prod.rating)}</div>
      <div>
        <span class="rc-price">₹${prod.price.toLocaleString()}</span>
        <span class="rc-original">₹${prod.originalPrice.toLocaleString()}</span>
      </div>
      <button class="rc-btn" onclick="addRelatedToCart(${prod.id}, this, event)">
        <i class="fa-solid fa-basket-shopping"></i> Add to Cart
      </button>
    `

    card.onclick = () => {
      window.location.href = "product.html?id=" + prod.id
    }

    grid.appendChild(card)
  })
}

function addRelatedToCart(id, btn, event) {
  event.stopPropagation()
  let prod = PRODUCTS_DB.find(p => p.id === id)
  if (!prod) return
  addToCartStore(prod, 1)
  btn.innerHTML = `<i class="fa-solid fa-check"></i> Added!`
  btn.style.color         = "var(--success)"
  btn.style.borderColor   = "var(--success)"
  btn.style.background    = "rgba(100,215,130,.1)"
  setTimeout(() => {
    btn.innerHTML = `<i class="fa-solid fa-basket-shopping"></i> Add to Cart`
    btn.style.color = btn.style.borderColor = btn.style.background = ""
  }, 1800)
}


/* ===================================================
   QTY STEPPER
   =================================================== */

function changeQty(delta) {
  selectedQty = Math.max(1, selectedQty + delta)
  document.getElementById("qtyVal").innerText = selectedQty
}


/* ===================================================
   ADD TO CART / BUY NOW
   =================================================== */

function handleAddToCart() {
  let p = currentProduct
  addToCartStore(p, selectedQty)

  let btn = document.getElementById("btnCart")
  btn.innerHTML = `<i class="fa-solid fa-check"></i> Added!`
  btn.style.background  = "rgba(100,215,130,.12)"
  btn.style.borderColor = "var(--success)"
  btn.style.color       = "var(--success)"

  setTimeout(() => {
    btn.innerHTML = `<i class="fa-solid fa-basket-shopping"></i> Add to Cart`
    btn.style.background = btn.style.borderColor = btn.style.color = ""
  }, 1800)

  showToast(p.name + " added to cart 🛒")
}

function handleBuyNow() {
  addToCartStore(currentProduct, selectedQty)
  window.location.href = "cart.html"
}

function addToCartStore(product, qty) {
  let cart     = JSON.parse(localStorage.getItem("rx_cart") || "[]")
  let existing = cart.find(i => i.id === product.id)
  if (existing) {
    existing.qty += qty
  } else {
    cart.push({ ...product, images: undefined, image: product.images[0], qty })
  }
  localStorage.setItem("rx_cart", JSON.stringify(cart))
  updateCartBadge()
}

function updateCartBadge() {
  let cart  = JSON.parse(localStorage.getItem("rx_cart") || "[]")
  let total = cart.reduce((s, i) => s + i.qty, 0)
  document.getElementById("navCartBadge").innerText = total
}


/* ===================================================
   WISHLIST
   =================================================== */

function initWishlist() {
  let btn = document.getElementById("wishlistBtn")
  if (wishlistIds.includes(currentProduct.id)) {
    btn.classList.add("active")
    document.getElementById("wishlistIcon").className = "fa-solid fa-heart"
  }
}

function toggleWishlist() {
  let btn  = document.getElementById("wishlistBtn")
  let icon = document.getElementById("wishlistIcon")
  let id   = currentProduct.id

  if (wishlistIds.includes(id)) {
    wishlistIds = wishlistIds.filter(i => i !== id)
    btn.classList.remove("active")
    icon.className = "fa-regular fa-heart"
    showToast("Removed from wishlist")
  } else {
    wishlistIds.push(id)
    btn.classList.add("active")
    icon.className = "fa-solid fa-heart"
    showToast("Added to wishlist ❤️")
  }

  localStorage.setItem("rx_wishlist", JSON.stringify(wishlistIds))
}


/* ===================================================
   TABS
   =================================================== */

function initTabUnderline() {
  let firstBtn = document.querySelector(".tab-btn.active")
  if (firstBtn) positionUnderline(firstBtn)
}

function switchTab(btn, tabId) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"))
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"))
  btn.classList.add("active")
  document.getElementById("tab" + tabId.charAt(0).toUpperCase() + tabId.slice(1)).classList.add("active")
  positionUnderline(btn)
}

function positionUnderline(btn) {
  let line = document.getElementById("tabUnderline")
  line.style.left  = btn.offsetLeft + "px"
  line.style.width = btn.offsetWidth + "px"
}

function scrollToReviews() {
  document.querySelector('[data-tab="reviews"]').click()
  document.getElementById("tabsWrapper").scrollIntoView({ behavior:"smooth" })
}


/* ===================================================
   IMAGE ZOOM LIGHTBOX
   =================================================== */

function openLightbox(src) {
  document.getElementById("lightboxImg").src = src
  document.getElementById("lightbox").classList.add("open")
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("open")
}


/* ===================================================
   SHARE
   =================================================== */

function shareProduct(platform) {
  let url  = window.location.href
  let name = currentProduct.name

  if (platform === "whatsapp") {
    window.open("https://wa.me/?text=Check out this " + name + " on RadiusX: " + url, "_blank")
  } else if (platform === "twitter") {
    window.open("https://twitter.com/intent/tweet?text=Check out " + name + " on RadiusX&url=" + url, "_blank")
  } else if (platform === "copy") {
    navigator.clipboard.writeText(url).then(() => showToast("Link copied! 🔗"))
  }
}


/* ===================================================
   HELPERS
   =================================================== */

function buildStars(rating) {
  let full  = Math.floor(rating)
  let half  = rating % 1 >= 0.5
  let out   = ""
  for (let i = 0; i < 5; i++) {
    if      (i < full)           out += `<i class="fa-solid fa-star"></i>`
    else if (i === full && half) out += `<i class="fa-solid fa-star-half-stroke"></i>`
    else                         out += `<i class="fa-regular fa-star"></i>`
  }
  return out
}


/* ===== TOAST ===== */

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