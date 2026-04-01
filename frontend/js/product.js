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
  },
  {id:7,  name:"Samsung Galaxy S26", category:"Electronics", price:65000, originalPrice:75000, rating:4.1, reviews:27, stock:true, deliveryDays:"2-3", images:["assets/products/S26.jpg"], colours:["#1a1a2e","#c0c0c0"], description:"The Samsung Galaxy S26 features a stunning AMOLED display and next-gen processor.", highlights:["6.8-inch Dynamic AMOLED 120Hz","200MP rear camera","5000mAh 65W fast charge","Snapdragon 8 Gen 3","IP68"], specs:[["Brand","Samsung"],["RAM","12GB"],["Storage","256GB"],["Camera","200MP triple"],["Battery","5000mAh"],["OS","Android 15"]]},
  {id:8,  name:"Slim Fit Jeans", category:"Fashion", price:700, originalPrice:950, rating:4.1, reviews:27, stock:true, deliveryDays:"3-5", images:["assets/products/jeans.jpg"], colours:["#1a237e","#333"], description:"Classic slim-fit jeans from premium stretch denim.", highlights:["Premium stretch denim","Slim fit","5-pocket styling","Machine washable"], specs:[["Material","98% Cotton 2% Elastane"],["Fit","Slim Fit"],["Care","Machine wash cold"]]},
  {id:9,  name:"OnePlus 15R", category:"Electronics", price:35000, originalPrice:40000, rating:4.1, reviews:27, stock:true, deliveryDays:"2-3", images:["assets/products/15r.jpg"], colours:["#1c1c1c","#2e7d32"], description:"OnePlus 15R - flagship performance at a mid-range price.", highlights:["6.7-inch AMOLED 120Hz","Snapdragon 7s Gen 3","50MP Sony IMX890","100W SuperVOOC charging"], specs:[["Brand","OnePlus"],["RAM","8GB"],["Storage","128GB"],["Camera","50+8+2 MP"],["Battery","5500mAh 100W"]]},
  {id:10, name:"DSLR Camera", category:"Electronics", price:85000, originalPrice:95000, rating:4.1, reviews:27, stock:true, deliveryDays:"3-5", images:["assets/products/camera.jpg"], colours:["#1c1c1c"], description:"Professional DSLR camera with 24.2MP APS-C sensor and 4K video.", highlights:["24.2MP APS-C sensor","4K UHD video","45-point AF","3-inch vari-angle screen"], specs:[["Megapixels","24.2MP"],["Sensor","APS-C"],["Video","4K UHD 30fps"],["AF Points","45"],["Weight","765g"]]},
  {id:11, name:"Gaming Headset", category:"Electronics", price:2500, originalPrice:3200, rating:4.2, reviews:44, stock:true, deliveryDays:"2-3", images:["assets/products/headphones.jpg"], colours:["#1c1c1c","#c62828"], description:"Surround sound gaming headset with noise-cancelling mic and RGB lighting.", highlights:["7.1 virtual surround","Noise-cancelling mic","50mm drivers","RGB lighting"], specs:[["Driver","50mm"],["Mic","Retractable noise-cancelling"],["Interface","USB + 3.5mm"],["Weight","310g"]]},
  {id:12, name:"Formal Shirt", category:"Fashion", price:800, originalPrice:1200, rating:4.0, reviews:31, stock:true, deliveryDays:"3-5", images:["assets/products/tshirt.jpg"], colours:["#fff","#1565c0"], description:"Premium cotton formal shirt with slim fit and easy-iron finish.", highlights:["100% premium cotton","Slim fit spread collar","Easy-iron finish","Machine washable"], specs:[["Material","100% Cotton"],["Fit","Slim Fit"],["Collar","Spread collar"],["Care","Machine wash"]]},
  {id:13, name:"Coffee Table", category:"Home", price:4500, originalPrice:6000, rating:4.3, reviews:28, stock:true, deliveryDays:"5-7", images:["assets/products/chair.jpg"], colours:["#795548","#1c1c1c"], description:"Solid sheesham wood coffee table with storage shelf.", highlights:["Solid sheesham wood","Lower storage shelf","Wax polish finish","Easy assembly"], specs:[["Dimensions","110x60x45cm"],["Material","Solid Sheesham"],["Finish","Natural wax"],["Weight","18kg"]]},
  {id:14, name:"Fitness Band", category:"Electronics", price:1500, originalPrice:2000, rating:4.0, reviews:52, stock:true, deliveryDays:"2-3", images:["assets/products/smartwatch.jpg"], colours:["#1c1c1c","#c4df9a"], description:"Smart fitness band with 14-day battery, heart rate, SpO2, and 100 workout modes.", highlights:["14-day battery","Heart rate and SpO2","100 workout modes","5ATM waterproof"], specs:[["Display","1.47-inch AMOLED"],["Battery","14 days"],["Water Rating","5ATM"],["Connectivity","Bluetooth 5.0"]]},
  {id:15, name:"Yoga Mat", category:"Sports", price:600, originalPrice:900, rating:4.1, reviews:38, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#c4df9a","#c62828","#1565c0"], description:"Anti-slip yoga mat with alignment lines and 6mm thickness.", highlights:["6mm thick TPE foam","Anti-slip both sides","Alignment guide","Eco-friendly material"], specs:[["Dimensions","183x61cm"],["Thickness","6mm"],["Material","TPE foam"],["Weight","900g"]]},
  {id:16, name:"Stainless Steel Pan", category:"Home", price:1200, originalPrice:1600, rating:4.2, reviews:41, stock:true, deliveryDays:"3-5", images:["assets/products/lamp.jpg"], colours:["#c0c0c0"], description:"Tri-ply stainless steel frying pan with even heat distribution and induction compatibility.", highlights:["Tri-ply stainless steel","Induction compatible","Ergonomic handle","Dishwasher safe","PFOA free"], specs:[["Size","26cm"],["Material","Tri-ply stainless steel"],["Compatible","All cooktops"],["Warranty","5 years"]]},
  {id:17, name:"Tablet", category:"Electronics", price:18000, originalPrice:21000, rating:4.2, reviews:54, stock:true, deliveryDays:"2-3", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#c0c0c0"], description:"10.4-inch tablet with 2K display and all-day battery.", highlights:["10.4-inch 2K display","Octa-core processor","6000mAh battery","Wi-Fi 6"], specs:[["Display","10.4-inch 2K"],["RAM","4GB"],["Storage","64GB"],["Battery","6000mAh"]]},
  {id:18, name:"Smartwatch Pro", category:"Electronics", price:3500, originalPrice:4200, rating:4.3, reviews:66, stock:true, deliveryDays:"2-3", images:["assets/products/smartwatch.jpg"], colours:["#1c1c1c","#c0c0c0","#c4df9a"], description:"Smartwatch with health monitoring, GPS, and 7-day battery.", highlights:["7-day battery","SpO2 and heart rate","Built-in GPS","100 workout modes","5ATM"], specs:[["Display","1.43-inch AMOLED"],["Battery","7 days"],["GPS","Built-in"],["Water Rating","5ATM"]]},
  {id:19, name:"Mechanical Keyboard", category:"Electronics", price:800, originalPrice:1100, rating:4.0, reviews:33, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#fff"], description:"Compact TKL mechanical keyboard with tactile switches and RGB backlighting.", highlights:["TKL 87-key layout","Blue tactile switches","Per-key RGB","USB-C cable"], specs:[["Layout","TKL 87-key"],["Switch","Blue Mechanical"],["Interface","USB-C"],["Polling Rate","1000Hz"]]},
  {id:20, name:"Wireless Mouse", category:"Electronics", price:500, originalPrice:700, rating:4.1, reviews:41, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#fff"], description:"Ergonomic wireless mouse with precise tracking and silent clicks.", highlights:["2.4GHz wireless","4000 DPI sensor","Silent clicks","12-month battery"], specs:[["Connectivity","2.4GHz"],["DPI","400-4000"],["Battery","12 months"],["Weight","101g"]]},
  {id:21, name:"Winter Jacket", category:"Fashion", price:1600, originalPrice:2200, rating:4.2, reviews:58, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#5d4037"], description:"Warm padded winter jacket with water-resistant shell.", highlights:["Water-resistant shell","Synthetic insulation","Zip-off hood","4 utility pockets"], specs:[["Material","Polyester outer Fleece inner"],["Closure","YKK zip"],["Pockets","4"]]},
  {id:22, name:"Cap", category:"Fashion", price:250, originalPrice:400, rating:3.9, reviews:25, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#1a237e","#c4df9a"], description:"Classic 6-panel cotton cap with adjustable strap.", highlights:["100% cotton","6-panel structured","Adjustable strap"], specs:[["Material","100% Cotton"],["Size","One size fits most"]]},
  {id:23, name:"Woollen Sweater", category:"Fashion", price:900, originalPrice:1300, rating:4.1, reviews:39, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#5d4037","#1a237e","#c62828"], description:"Cosy crew-neck sweater from soft wool blend.", highlights:["60% wool 40% acrylic","Crew neck","Ribbed cuffs","Dry clean recommended"], specs:[["Material","60% Wool 40% Acrylic"],["Neckline","Crew neck"],["Fit","Regular"]]},
  {id:24, name:"Cargo Shorts", category:"Fashion", price:500, originalPrice:800, rating:3.8, reviews:21, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#37474f"], description:"Lightweight cargo shorts with multiple pockets.", highlights:["Ripstop fabric","6 utility pockets","Elastic waistband","Quick-dry"], specs:[["Material","100% Polyester"],["Pockets","6"],["Waist","Elastic"]]},
  {id:25, name:"Study Table", category:"Home", price:3000, originalPrice:3800, rating:4.3, reviews:44, stock:true, deliveryDays:"5-7", images:["assets/products/demo.jpg"], colours:["#795548","#1c1c1c"], description:"Minimalist study table with keyboard tray and cable management.", highlights:["120x60cm surface","Keyboard tray","Cable management","Easy assembly"], specs:[["Dimensions","120x60x75cm"],["Material","MDF + Steel"],["Load Capacity","60kg"]]},
  {id:26, name:"3-Seat Sofa", category:"Home", price:12000, originalPrice:15000, rating:4.5, reviews:52, stock:true, deliveryDays:"7-10", images:["assets/products/demo.jpg"], colours:["#795548","#37474f"], description:"Premium 3-seat fabric sofa with high-density foam cushions.", highlights:["High-density foam","Solid sheesham legs","Stain-resistant fabric","5-year warranty"], specs:[["Seating","3 persons"],["Frame","Solid wood"],["Warranty","5 years"]]},
  {id:27, name:"King Size Bed", category:"Home", price:14000, originalPrice:18000, rating:4.4, reviews:47, stock:true, deliveryDays:"7-14", images:["assets/products/demo.jpg"], colours:["#795548","#1c1c1c"], description:"King size bed with hydraulic storage and upholstered headboard.", highlights:["King size 180x200cm","Hydraulic storage","Upholstered headboard"], specs:[["Size","King 180x200cm"],["Storage","Hydraulic lift"]]},
  {id:28, name:"Ceiling Fan", category:"Home", price:1800, originalPrice:2300, rating:4.0, reviews:30, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#fff"], description:"Energy-efficient BLDC ceiling fan with remote control.", highlights:["BLDC motor saves 65% energy","1200mm sweep","Remote control","5 speeds"], specs:[["Sweep","1200mm"],["Motor","BLDC"],["Power","28W"],["Warranty","2 years"]]},
  {id:29, name:"Bluetooth Speaker", category:"Electronics", price:2200, originalPrice:2800, rating:4.3, reviews:63, stock:true, deliveryDays:"2-3", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#c62828"], description:"360 degree surround sound portable speaker with 24-hour battery.", highlights:["360 degree sound","24hr battery","IPX7 waterproof","USB-C"], specs:[["Output","20W RMS"],["Battery","24hr"],["Waterproof","IPX7"]]},
  {id:30, name:"Wi-Fi Router", category:"Electronics", price:1500, originalPrice:2000, rating:4.1, reviews:37, stock:true, deliveryDays:"2-3", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#fff"], description:"Dual-band Wi-Fi 6 router covering up to 150 sq metre.", highlights:["Wi-Fi 6 AX3000","4 Gigabit LAN","MU-MIMO","Easy app setup"], specs:[["Standard","Wi-Fi 6"],["Speed","AX3000"],["Coverage","150 sq m"]]},
  {id:31, name:"27-inch Monitor", category:"Electronics", price:9000, originalPrice:11000, rating:4.4, reviews:48, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#1c1c1c"], description:"QHD IPS 144Hz monitor with HDR400 support.", highlights:["27-inch QHD IPS","144Hz","HDR400","AMD FreeSync"], specs:[["Size","27-inch"],["Resolution","2560x1440"],["Panel","IPS"],["Refresh Rate","144Hz"]]},
  {id:32, name:"Power Bank 20000mAh", category:"Electronics", price:1200, originalPrice:1600, rating:4.2, reviews:53, stock:true, deliveryDays:"2-3", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#c4df9a"], description:"20000mAh power bank with 65W PD fast charging.", highlights:["20000mAh","65W PD","3 output ports","Charges laptops"], specs:[["Capacity","20000mAh"],["Input","USB-C 65W"],["Weight","430g"]]},
  {id:33, name:"Floral Dress", category:"Fashion", price:1300, originalPrice:1700, rating:4.1, reviews:36, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#e91e63","#1565c0"], description:"Flowy midi dress with floral print and side pockets.", highlights:["A-line midi length","Side pockets","Breathable rayon"], specs:[["Material","Rayon"],["Length","Midi"],["Fit","A-line"]]},
  {id:34, name:"Woollen Scarf", category:"Fashion", price:300, originalPrice:450, rating:3.7, reviews:18, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#c62828","#1c1c1c"], description:"Soft merino wool scarf, oversized and warm.", highlights:["80% merino wool","200cm long","Ultra-soft texture"], specs:[["Material","80% Merino 20% Acrylic"],["Dimensions","200x70cm"]]},
  {id:35, name:"Aviator Sunglasses", category:"Fashion", price:600, originalPrice:900, rating:4.0, reviews:27, stock:true, deliveryDays:"2-3", images:["assets/products/demo.jpg"], colours:["#c0c0c0","#1c1c1c"], description:"Classic aviator sunglasses with UV400 polarised lenses.", highlights:["UV400 polarised","Lightweight alloy frame","Spring hinges","Unisex"], specs:[["Lens","Polarised UV400"],["Frame","Alloy"],["Gender","Unisex"]]},
  {id:36, name:"Leather Belt", category:"Fashion", price:350, originalPrice:500, rating:3.9, reviews:20, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#3e2723","#1c1c1c"], description:"Genuine leather belt with brushed silver pin buckle.", highlights:["Full-grain leather","3.5cm width","Stitched edges"], specs:[["Material","Full-grain leather"],["Width","3.5cm"],["Sizes","28 to 44"]]},
  {id:37, name:"Blackout Curtains", category:"Home", price:1100, originalPrice:1500, rating:4.1, reviews:29, stock:true, deliveryDays:"4-6", images:["assets/products/demo.jpg"], colours:["#37474f","#c62828"], description:"100% blackout curtains with thermal insulation and noise reduction.", highlights:["100% blackout","Thermal insulation","Noise reduction","Machine washable"], specs:[["Size","4.5x7 ft per panel"],["Material","Triple-weave polyester"],["Blackout","100%"]]},
  {id:38, name:"Handmade Carpet", category:"Home", price:2000, originalPrice:2600, rating:4.2, reviews:34, stock:true, deliveryDays:"5-7", images:["assets/products/demo.jpg"], colours:["#795548","#c62828"], description:"Handmade wool carpet with traditional geometric pattern.", highlights:["Hand-knotted wool","Geometric design","Anti-slip backing","Stain resistant"], specs:[["Size","5x8 ft"],["Material","100% Wool"],["Backing","Anti-slip latex"]]},
  {id:39, name:"Wall Clock", category:"Home", price:450, originalPrice:650, rating:3.8, reviews:22, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#fff"], description:"Silent sweep wall clock with scratch-resistant glass face.", highlights:["Silent sweep","30cm diameter","Scratch-resistant glass"], specs:[["Diameter","30cm"],["Movement","Silent quartz"],["Power","1x AA battery"]]},
  {id:40, name:"Full-length Mirror", category:"Home", price:900, originalPrice:1200, rating:4.0, reviews:26, stock:true, deliveryDays:"4-7", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#c0c0c0"], description:"Full-length floor mirror with slim aluminium frame.", highlights:["165x55cm full length","5mm glass","Wall mount or floor stand"], specs:[["Dimensions","165x55cm"],["Frame","Aluminium 2cm"],["Weight","8kg"]]},
  {id:41, name:"TWS Earbuds", category:"Electronics", price:1800, originalPrice:2300, rating:4.3, reviews:49, stock:true, deliveryDays:"2-3", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#fff","#c4df9a"], description:"True wireless earbuds with Active Noise Cancellation and 30-hour battery.", highlights:["ANC","30hr total battery","10ms gaming mode","IPX5"], specs:[["Driver","11mm"],["ANC","Hybrid ANC"],["Battery","7hr + 23hr case"],["Water","IPX5"]]},
  {id:42, name:"Mini Drone", category:"Electronics", price:6000, originalPrice:7500, rating:4.4, reviews:32, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#c4df9a"], description:"Foldable mini drone with 4K camera and 30-minute flight time.", highlights:["4K 30fps camera","3-axis gimbal","30 min flight","GPS auto return"], specs:[["Camera","4K 30fps"],["Flight Time","30 min"],["Weight","249g"],["GPS","Yes"]]},
  {id:43, name:"Camera Tripod", category:"Electronics", price:700, originalPrice:950, rating:4.0, reviews:28, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#1c1c1c"], description:"Aluminium tripod with ball head and quick-release plate up to 170cm.", highlights:["Max height 170cm","Ball head 360-degree","Quick-release plate","Carry bag"], specs:[["Max Height","170cm"],["Load Capacity","5kg"],["Weight","1.2kg"]]},
  {id:44, name:"Portable Projector", category:"Electronics", price:8500, originalPrice:10000, rating:4.2, reviews:31, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#fff","#1c1c1c"], description:"Full HD portable projector with Android TV and 500 ANSI lumens.", highlights:["Full HD 1080p","500 ANSI lumens","Android TV","Auto keystone"], specs:[["Resolution","1920x1080"],["Brightness","500 ANSI lumens"],["OS","Android TV"]]},
  {id:45, name:"35L Backpack", category:"Fashion", price:1200, originalPrice:1600, rating:4.1, reviews:35, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#37474f","#c62828"], description:"35L travel backpack with laptop compartment and anti-theft zip.", highlights:["35L capacity","15.6-inch laptop slot","Anti-theft zip","Rain cover"], specs:[["Capacity","35L"],["Material","900D ripstop"],["Weight","0.9kg"]]},
  {id:46, name:"Slim Wallet", category:"Fashion", price:500, originalPrice:750, rating:3.9, reviews:24, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#3e2723","#1c1c1c"], description:"RFID-blocking genuine leather wallet with 6 card slots.", highlights:["RFID blocking","6 card slots","Genuine leather","Ultra-slim 8mm"], specs:[["Material","Genuine leather"],["Card Slots","6"],["RFID","Blocked"],["Thickness","8mm"]]},
  {id:47, name:"Sports Sandals", category:"Fashion", price:700, originalPrice:950, rating:4.0, reviews:26, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#795548"], description:"Waterproof sports sandals with EVA footbed and rubber outsole.", highlights:["Waterproof","Quick-dry straps","EVA footbed","Adjustable 3-strap"], specs:[["Upper","Nylon webbing"],["Footbed","EVA foam"],["Closure","Hook and loop"]]},
  {id:48, name:"Steel Water Bottle", category:"Home", price:300, originalPrice:450, rating:3.8, reviews:19, stock:true, deliveryDays:"2-3", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#c4df9a","#c62828"], description:"Double-wall vacuum insulated bottle. Cold 24hr or hot 12hr.", highlights:["Double-wall vacuum","Cold 24hr Hot 12hr","BPA-free","Leak-proof","1L"], specs:[["Capacity","1 Litre"],["Material","18/8 Stainless steel"],["Cold","24 hours"],["Hot","12 hours"]]},
  {id:49, name:"Lunch Box Set", category:"Home", price:450, originalPrice:650, rating:3.9, reviews:21, stock:true, deliveryDays:"2-3", images:["assets/products/demo.jpg"], colours:["#1c1c1c","#c4df9a"], description:"3-tier stainless steel lunch box with clip-lock lid and insulated bag.", highlights:["3-tier tiffin","Clip-lock lid","Food-grade steel","Insulated carry bag"], specs:[["Tiers","3"],["Material","304 Stainless steel"],["Capacity","1000ml"],["Dishwasher Safe","Yes"]]},
  {id:50, name:"Indoor Plant", category:"Home", price:350, originalPrice:500, rating:4.2, reviews:23, stock:true, deliveryDays:"3-5", images:["assets/products/demo.jpg"], colours:["#2e7d32"], description:"Low-maintenance money plant in ceramic pot. Purifies air.", highlights:["Air-purifying money plant","Ceramic pot","Low maintenance","Indoor suitable"], specs:[["Plant","Money plant Pothos"],["Pot","Ceramic 15cm"],["Light","Indirect sunlight"],["Watering","Once a week"]]}
]


/* ===================================================
   GLOBAL STATE
   =================================================== */

let currentProduct  = null
let selectedQty     = 1
let selectedColour  = 0
let pickedStar      = 0
let currentUser     = null

function cartKey()     { var uid = currentUser && (currentUser._id || currentUser.id); return uid ? ("u_" + uid + "_cart")    : "guest_cart"; }
function wishlistKey() { var uid = currentUser && (currentUser._id || currentUser.id); return uid ? ("u_" + uid + "_wishlist") : "guest_wishlist"; }

let wishlistIds = []


/* ===================================================
   INIT
   =================================================== */

window.onload = async function () {
  /* Restore session — product page is public, never redirect on failure */
  var loggedIn = await api.init();
  if (loggedIn) {
    /* Use cached user from sessionStorage first (set on login) */
    currentUser = api.getUser();
    /* If no cache, decode from token payload as fallback */
    if (!currentUser) {
      var token = api.getToken();
      if (token) {
        try {
          var payload = JSON.parse(atob(token.split(".")[1]));
          currentUser = { _id: payload.id, id: payload.id, name: payload.name || "", email: payload.email || "", role: payload.role || "buyer" };
        } catch(e) { currentUser = null; }
      }
    }
  } else {
    currentUser = null;
  }
  wishlistIds = JSON.parse(localStorage.getItem(wishlistKey()) || "[]");

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
  var list = document.getElementById("highlightsList"); if (!list) return;
  var highlights = (currentProduct && currentProduct.highlights) || [];
  if (!highlights.length) { list.innerHTML = "<li>Premium quality product</li>"; return; }
  highlights.forEach(function(h) { var li = document.createElement("li"); li.innerText = h; list.appendChild(li); });
}


/* ===================================================
   SPECIFICATIONS
   =================================================== */

function renderSpecs() {
  var table = document.getElementById("specsTable"); if (!table) return;
  var specs = (currentProduct && currentProduct.specs) || [];
  if (!specs.length) {
    var r1 = document.createElement("tr"); r1.innerHTML = "<td>Category</td><td>" + (currentProduct.category||"General") + "</td>"; table.appendChild(r1);
    var r2 = document.createElement("tr"); r2.innerHTML = "<td>Price</td><td>&#8377;" + ((currentProduct.price||0).toLocaleString()) + "</td>"; table.appendChild(r2);
    return;
  }
  specs.forEach(function(row) {
    var key = Array.isArray(row) ? row[0] : row.key;
    var val = Array.isArray(row) ? row[1] : row.val;
    var tr = document.createElement("tr");
    tr.innerHTML = "<td>" + (key||"") + "</td><td>" + (val||"") + "</td>";
    table.appendChild(tr);
  });
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
  if (!currentUser) {
    showToast("Please sign in to leave a review", true)
    setTimeout(function() { window.location.href = "login.html" }, 1200)
    return
  }
  var text = document.getElementById("reviewText").value.trim()
  if (!pickedStar) { showToast("Please select a star rating", true); return }
  if (!text)        { showToast("Please write your review", true); return }
  var name = currentUser.name || "Anonymous"

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
  var key      = cartKey();
  var cart     = JSON.parse(localStorage.getItem(key) || "[]")
  var existing = cart.find(function(i){ return i.id === product.id; })
  if (existing) { existing.qty += qty; }
  else { cart.push(Object.assign({}, product, { images: undefined, image: product.images[0], qty: qty })); }
  localStorage.setItem(key, JSON.stringify(cart))
  updateCartBadge()
}

function updateCartBadge() {
  var cart  = JSON.parse(localStorage.getItem(cartKey()) || "[]")
  var total = cart.reduce(function(s,i){ return s+i.qty; }, 0)
  var badge = document.getElementById("navCartBadge"); if (badge) badge.innerText = total;
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

  localStorage.setItem(wishlistKey(), JSON.stringify(wishlistIds))
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
,
  {id:7,  name:"Samsung Galaxy S26", category:"Electronics", price:65000, originalPrice:75000, rating:4.1, reviews:27, stock:true, deliveryDays:"2-3",
   images:["assets/products/S26.jpg"], colours:["#1a1a2e","#c0c0c0"],
   description:"The Samsung Galaxy S26 features a stunning AMOLED display, next-gen processor, and a pro-grade camera system.",
   highlights:["6.8-inch Dynamic AMOLED 2X 120Hz","200MP rear camera system","5000mAh battery 65W fast charge","Snapdragon 8 Gen 3","IP68 water resistant"],
   specs:[["Brand","Samsung"],["Display","6.8 inch AMOLED 120Hz"],["RAM","12GB"],["Storage","256GB"],["Camera","200MP triple"],["Battery","5000mAh"],["OS","Android 15"]]},
  {id:8,  name:"Slim Fit Jeans", category:"Fashion", price:700, originalPrice:950, rating:4.1, reviews:27, stock:true, deliveryDays:"3-5",
   images:["assets/products/jeans.jpg"], colours:["#1a237e","#333"],
   description:"Classic slim-fit jeans crafted from premium stretch denim. Durable, comfortable, and stylish for everyday wear.",
   highlights:["Premium stretch denim","Slim fit design","5-pocket styling","Machine washable"],
   specs:[["Material","98% Cotton 2% Elastane"],["Fit","Slim Fit"],["Closure","Zip fly with button"],["Care","Machine wash cold"]]},
  {id:9,  name:"OnePlus 15R", category:"Electronics", price:35000, originalPrice:40000, rating:4.1, reviews:27, stock:true, deliveryDays:"2-3",
   images:["assets/products/15r.jpg"], colours:["#1c1c1c","#2e7d32"],
   description:"OnePlus 15R - flagship performance at a mid-range price. Blazing fast charging and silky smooth display.",
   highlights:["6.7 inch AMOLED 120Hz","Snapdragon 7s Gen 3","50MP Sony IMX890 camera","100W SuperVOOC charging","OxygenOS 15"],
   specs:[["Brand","OnePlus"],["Display","6.7 inch AMOLED 120Hz"],["RAM","8GB"],["Storage","128GB"],["Camera","50+8+2 MP"],["Battery","5500mAh 100W"]]},
  {id:10, name:"DSLR Camera", category:"Electronics", price:85000, originalPrice:95000, rating:4.1, reviews:27, stock:true, deliveryDays:"3-5",
   images:["assets/products/camera.jpg"], colours:["#1c1c1c"],
   description:"Professional DSLR camera with 24.2MP APS-C sensor, 4K video, and advanced autofocus system.",
   highlights:["24.2MP APS-C CMOS sensor","4K UHD video recording","45-point all cross-type AF","3-inch vari-angle touchscreen"],
   specs:[["Megapixels","24.2MP"],["Sensor","APS-C CMOS"],["Video","4K UHD 30fps"],["AF Points","45"],["Battery Life","1200 shots"],["Weight","765g"]]},
  {id:11, name:"Gaming Headset", category:"Electronics", price:2500, originalPrice:3200, rating:4.2, reviews:44, stock:true, deliveryDays:"2-3",
   images:["assets/products/headphones.jpg"], colours:["#1c1c1c","#c62828"],
   description:"Surround sound gaming headset with noise-cancelling mic, 50mm drivers, and RGB lighting.",
   highlights:["7.1 virtual surround sound","Noise-cancelling mic","50mm neodymium drivers","RGB lighting","Compatible PC PS5 Xbox"],
   specs:[["Driver","50mm"],["Frequency","20-20000Hz"],["Mic","Retractable, noise-cancelling"],["Interface","USB + 3.5mm"],["Weight","310g"]]},
  {id:12, name:"Formal Shirt", category:"Fashion", price:800, originalPrice:1200, rating:4.0, reviews:31, stock:true, deliveryDays:"3-5",
   images:["assets/products/tshirt.jpg"], colours:["#fff","#1565c0","#c62828"],
   description:"Premium cotton formal shirt with slim fit, spread collar, and easy-iron finish. Perfect for office wear.",
   highlights:["100% premium cotton","Slim fit spread collar","Easy-iron finish","Reinforced stitching","Machine washable"],
   specs:[["Material","100% Cotton"],["Fit","Slim Fit"],["Collar","Spread collar"],["Sleeve","Full sleeve"],["Care","Machine wash warm"]]},
  {id:13, name:"Coffee Table", category:"Home", price:4500, originalPrice:6000, rating:4.3, reviews:28, stock:true, deliveryDays:"5-7",
   images:["assets/products/chair.jpg"], colours:["#795548","#1c1c1c"],
   description:"Solid wood coffee table with a shelf underneath. Minimalist design fits any living room style.",
   highlights:["Solid sheesham wood","Lower storage shelf","Wax polish finish","Easy assembly","No harmful chemicals"],
   specs:[["Dimensions","110x60x45cm"],["Material","Solid Sheesham wood"],["Finish","Natural wax"],["Assembly","Required"],["Weight","18kg"]]},
  {id:14, name:"Fitness Band", category:"Electronics", price:1500, originalPrice:2000, rating:4.0, reviews:52, stock:true, deliveryDays:"2-3",
   images:["assets/products/smartwatch.jpg"], colours:["#1c1c1c","#c4df9a","#c62828"],
   description:"Smart fitness band with 14-day battery, heart rate, SpO2, sleep tracking, and 100 workout modes.",
   highlights:["14-day battery life","Heart rate and SpO2 monitor","100 workout modes","5ATM waterproof","1.47 inch AMOLED display"],
   specs:[["Display","1.47 inch AMOLED"],["Battery","14 days"],["Sensors","Heart rate SpO2"],["Water Rating","5ATM"],["Connectivity","Bluetooth 5.0"]]},
  {id:15, name:"Yoga Mat", category:"Sports", price:600, originalPrice:900, rating:4.1, reviews:38, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#c4df9a","#c62828","#1565c0"],
   description:"Anti-slip yoga mat with alignment lines, 6mm thickness, and carry strap. Ideal for yoga, pilates, and stretching.",
   highlights:["6mm thick TPE foam","Anti-slip both sides","Alignment line guide","Lightweight carry strap","Eco-friendly TPE material"],
   specs:[["Dimensions","183x61cm"],["Thickness","6mm"],["Material","TPE foam"],["Weight","900g"],["Non-slip","Both sides"]]},
  {id:16, name:"Stainless Steel Pan", category:"Home", price:1200, originalPrice:1600, rating:4.2, reviews:41, stock:true, deliveryDays:"3-5",
   images:["assets/products/lamp.jpg"], colours:["#c0c0c0"],
   description:"Tri-ply stainless steel frying pan with even heat distribution, ergonomic handle, and induction compatibility.",
   highlights:["Tri-ply stainless steel","Induction compatible","Ergonomic riveted handle","Dishwasher safe","PFOA free"],
   specs:[["Size","26cm diameter"],["Material","Tri-ply stainless steel"],["Compatible","All cooktops incl. induction"],["Weight","1.2kg"],["Warranty","5 years"]]},
  {id:17, name:"Tablet", category:"Electronics", price:18000, originalPrice:21000, rating:4.2, reviews:54, stock:true, deliveryDays:"2-3",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#c0c0c0"],
   description:"10.4-inch tablet with 2K display, powerful processor, and all-day battery. Great for streaming and productivity.",
   highlights:["10.4-inch 2K display","Octa-core processor","6000mAh battery","8MP rear camera","Wi-Fi 6 support"],
   specs:[["Display","10.4-inch 2K 60Hz"],["RAM","4GB"],["Storage","64GB"],["Battery","6000mAh"],["Camera","8MP + 5MP"],["OS","Android 13"]]},
  {id:18, name:"Smartwatch", category:"Electronics", price:3500, originalPrice:4200, rating:4.3, reviews:66, stock:true, deliveryDays:"2-3",
   images:["assets/products/smartwatch.jpg"], colours:["#1c1c1c","#c0c0c0","#c4df9a"],
   description:"Feature-packed smartwatch with health monitoring, GPS, and 7-day battery. Tracks workouts, sleep, and keeps you connected.",
   highlights:["7-day battery life","SpO2 and heart rate monitor","Built-in GPS","100 workout modes","5ATM water resistant"],
   specs:[["Display","1.43-inch AMOLED"],["Battery","7 days"],["GPS","Built-in"],["Water Rating","5ATM"],["Bluetooth","5.2"]]},
  {id:19, name:"Mechanical Keyboard", category:"Electronics", price:800, originalPrice:1100, rating:4.0, reviews:33, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#fff"],
   description:"Compact TKL mechanical keyboard with tactile switches, RGB backlighting, and aluminium frame.",
   highlights:["TKL compact layout","Blue tactile switches","Per-key RGB","Aluminium top frame","USB-C detachable cable"],
   specs:[["Layout","TKL 87-key"],["Switch","Blue Mechanical"],["Backlight","RGB per-key"],["Interface","USB-C"],["Polling Rate","1000Hz"]]},
  {id:20, name:"Wireless Mouse", category:"Electronics", price:500, originalPrice:700, rating:4.1, reviews:41, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#fff"],
   description:"Ergonomic wireless mouse with precise tracking, silent clicks, and 12-month battery life.",
   highlights:["2.4GHz wireless","4000 DPI optical sensor","Silent click switches","12-month battery","Ergonomic design"],
   specs:[["Connectivity","2.4GHz Wireless"],["DPI","400-4000"],["Battery","AA x1 12 months"],["Buttons","6"],["Weight","101g"]]},
  {id:21, name:"Winter Jacket", category:"Fashion", price:1600, originalPrice:2200, rating:4.2, reviews:58, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#5d4037","#1a237e"],
   description:"Warm padded winter jacket with water-resistant outer shell. Lightweight yet insulating.",
   highlights:["Water-resistant shell","Synthetic insulation","Zip-off hood","4 utility pockets","Warm fleece lining"],
   specs:[["Material","Polyester outer Fleece inner"],["Closure","YKK zip"],["Pockets","4 external"],["Care","Machine wash"]]},
  {id:22, name:"Cap", category:"Fashion", price:250, originalPrice:400, rating:3.9, reviews:25, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#1a237e","#c4df9a"],
   description:"Classic 6-panel cap with embroidered logo, adjustable strap, and breathable cotton construction.",
   highlights:["100% cotton twill","6-panel structured","Adjustable back strap","Pre-curved brim"],
   specs:[["Material","100% Cotton"],["Closure","Adjustable strap"],["Size","One size fits most"],["Wash","Hand wash"]]},
  {id:23, name:"Woollen Sweater", category:"Fashion", price:900, originalPrice:1300, rating:4.1, reviews:39, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#5d4037","#1a237e","#c62828"],
   description:"Cosy crew-neck sweater knitted from soft wool blend. Timeless design that pairs with everything.",
   highlights:["60% wool 40% acrylic","Crew neck design","Ribbed cuffs and hem","Dry clean recommended"],
   specs:[["Material","60% Wool 40% Acrylic"],["Neckline","Crew neck"],["Fit","Regular fit"],["Care","Dry clean"]]},
  {id:24, name:"Cargo Shorts", category:"Fashion", price:500, originalPrice:800, rating:3.8, reviews:21, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#37474f","#1b5e20"],
   description:"Lightweight cargo shorts with multiple pockets. Ideal for warm weather and casual outings.",
   highlights:["Lightweight ripstop fabric","6 utility pockets","Elastic waistband","Quick-dry finish","Relaxed fit"],
   specs:[["Material","100% Polyester ripstop"],["Pockets","6"],["Waist","Elastic + drawcord"],["Length","Above knee"]]},
  {id:25, name:"Study Table", category:"Home", price:3000, originalPrice:3800, rating:4.3, reviews:44, stock:true, deliveryDays:"5-7",
   images:["assets/products/demo.jpg"], colours:["#795548","#1c1c1c"],
   description:"Minimalist study table with large work surface, keyboard tray, and cable management.",
   highlights:["120x60cm work surface","Keyboard tray","Cable management cutout","Adjustable foot levellers","Easy assembly"],
   specs:[["Dimensions","120x60x75cm"],["Material","MDF + Steel legs"],["Load Capacity","60kg"],["Warranty","1 year"]]},
  {id:26, name:"3-Seat Sofa", category:"Home", price:12000, originalPrice:15000, rating:4.5, reviews:52, stock:true, deliveryDays:"7-10",
   images:["assets/products/demo.jpg"], colours:["#795548","#37474f","#c62828"],
   description:"Premium 3-seat fabric sofa with high-density foam cushions and solid wood legs.",
   highlights:["High-density foam cushions","Solid sheesham wood legs","Stain-resistant fabric","5-year frame warranty"],
   specs:[["Seating","3 persons"],["Dimensions","210x85x85cm"],["Frame","Solid wood"],["Cushion","High-density foam"],["Warranty","5 years"]]},
  {id:27, name:"King Size Bed", category:"Home", price:14000, originalPrice:18000, rating:4.4, reviews:47, stock:true, deliveryDays:"7-14",
   images:["assets/products/demo.jpg"], colours:["#795548","#1c1c1c"],
   description:"King size bed frame with hydraulic storage, upholstered headboard, and sturdy plywood slats.",
   highlights:["King size 180x200cm","Hydraulic storage lift","Upholstered headboard","Plywood slats"],
   specs:[["Size","King 180x200cm"],["Material","Engineered wood + Fabric"],["Storage","Hydraulic lift"]]},
  {id:28, name:"Ceiling Fan", category:"Home", price:1800, originalPrice:2300, rating:4.0, reviews:30, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#fff","#c0c0c0"],
   description:"Energy-efficient 5-blade ceiling fan with BLDC motor, remote control, and 5-speed settings.",
   highlights:["BLDC motor saves 65% energy","5 blades 1200mm sweep","Remote control","5 speed settings","ISI marked"],
   specs:[["Sweep","1200mm"],["Motor","BLDC"],["Speeds","5"],["Power","28W"],["Warranty","2 years"]]},
  {id:29, name:"Bluetooth Speaker", category:"Electronics", price:2200, originalPrice:2800, rating:4.3, reviews:63, stock:true, deliveryDays:"2-3",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#c62828","#1565c0"],
   description:"360 degree surround sound portable speaker with 24-hour battery and waterproof body.",
   highlights:["360 degree surround sound","24-hour battery","IPX7 waterproof","USB-C charging","Speakerphone built-in"],
   specs:[["Output","20W RMS"],["Battery","24hr"],["Waterproof","IPX7"],["Connectivity","Bluetooth 5.3 AUX"],["Weight","450g"]]},
  {id:30, name:"Wi-Fi Router", category:"Electronics", price:1500, originalPrice:2000, rating:4.1, reviews:37, stock:true, deliveryDays:"2-3",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#fff"],
   description:"Dual-band Wi-Fi 6 router covering up to 150 sq metre with blazing fast speeds.",
   highlights:["Wi-Fi 6 AX3000","Covers 150 sq metre","4 Gigabit LAN ports","MU-MIMO","Easy app setup"],
   specs:[["Standard","Wi-Fi 6 802.11ax"],["Speed","AX3000"],["LAN Ports","4x Gigabit"],["Coverage","150 sq metre"],["Security","WPA3"]]},
  {id:31, name:"27-inch Monitor", category:"Electronics", price:9000, originalPrice:11000, rating:4.4, reviews:48, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c"],
   description:"QHD IPS monitor with 144Hz refresh rate and HDR400 support. Perfect for gaming and creative work.",
   highlights:["27-inch QHD IPS panel","144Hz refresh rate","HDR400 support","AMD FreeSync Premium","Height-adjustable stand"],
   specs:[["Size","27-inch"],["Resolution","2560x1440 QHD"],["Panel","IPS"],["Refresh Rate","144Hz"],["Response Time","1ms"]]},
  {id:32, name:"Power Bank 20000mAh", category:"Electronics", price:1200, originalPrice:1600, rating:4.2, reviews:53, stock:true, deliveryDays:"2-3",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#fff","#c4df9a"],
   description:"20000mAh power bank with 65W PD fast charging. Charges laptops, phones, and tablets simultaneously.",
   highlights:["20000mAh capacity","65W PD fast charge","3 output ports","Charges laptops","LED battery indicator"],
   specs:[["Capacity","20000mAh"],["Input","USB-C 65W"],["Output","65W + 22.5W + 10W"],["Weight","430g"]]},
  {id:33, name:"Floral Dress", category:"Fashion", price:1300, originalPrice:1700, rating:4.1, reviews:36, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#e91e63","#1565c0","#2e7d32"],
   description:"Flowy midi dress with floral print, side pockets, and comfortable A-line silhouette.",
   highlights:["A-line midi length","Side pockets","Floral print","Breathable rayon fabric"],
   specs:[["Material","Rayon"],["Length","Midi"],["Fit","A-line"],["Closure","Concealed zip"]]},
  {id:34, name:"Woollen Scarf", category:"Fashion", price:300, originalPrice:450, rating:3.7, reviews:18, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#c62828","#1c1c1c","#c4df9a"],
   description:"Soft merino wool scarf, oversized and warm. A winter essential that pairs with any outfit.",
   highlights:["80% merino wool","Extra-long 200cm","Fringed edges","Ultra-soft texture"],
   specs:[["Material","80% Merino 20% Acrylic"],["Dimensions","200x70cm"],["Care","Machine wash cold"]]},
  {id:35, name:"Aviator Sunglasses", category:"Fashion", price:600, originalPrice:900, rating:4.0, reviews:27, stock:true, deliveryDays:"2-3",
   images:["assets/products/demo.jpg"], colours:["#c0c0c0","#c8a000","#1c1c1c"],
   description:"Classic aviator sunglasses with UV400 polarised lenses and lightweight metal frame.",
   highlights:["UV400 polarised lenses","Lightweight alloy frame","Spring hinges","Anti-scratch coating","Unisex design"],
   specs:[["Lens","Polarised UV400"],["Frame","Alloy"],["Lens Width","58mm"],["Temple","140mm"],["Gender","Unisex"]]},
  {id:36, name:"Leather Belt", category:"Fashion", price:350, originalPrice:500, rating:3.9, reviews:20, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#3e2723","#1c1c1c","#795548"],
   description:"Genuine leather belt with brushed silver pin buckle. Durable, refined, and versatile.",
   highlights:["Genuine full-grain leather","Brushed silver buckle","3.5cm width","Stitched edges"],
   specs:[["Material","Full-grain leather"],["Width","3.5cm"],["Buckle","Brushed silver pin"],["Sizes","28 to 44 inch"]]},
  {id:37, name:"Blackout Curtains", category:"Home", price:1100, originalPrice:1500, rating:4.1, reviews:29, stock:true, deliveryDays:"4-6",
   images:["assets/products/demo.jpg"], colours:["#37474f","#c62828","#1a237e"],
   description:"100% blackout curtains that block light completely, reduce noise, and insulate your room.",
   highlights:["100% blackout","Thermal insulation","Noise reduction","Silver grommet top","Machine washable"],
   specs:[["Size","4.5ft x 7ft per panel"],["Material","Triple-weave polyester"],["Grommets","Silver 1.6-inch"],["Blackout","100%"]]},
  {id:38, name:"Handmade Carpet", category:"Home", price:2000, originalPrice:2600, rating:4.2, reviews:34, stock:true, deliveryDays:"5-7",
   images:["assets/products/demo.jpg"], colours:["#795548","#c62828","#1a237e"],
   description:"Handmade wool carpet with traditional geometric pattern. Adds warmth and character to any room.",
   highlights:["Hand-knotted wool pile","Geometric design","Anti-slip backing","Stain resistant"],
   specs:[["Size","5x8 ft"],["Material","100% Wool pile"],["Backing","Anti-slip latex"],["Pile Height","10mm"]]},
  {id:39, name:"Wall Clock", category:"Home", price:450, originalPrice:650, rating:3.8, reviews:22, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#fff","#795548"],
   description:"Silent sweep wall clock with minimal design, large numerals, and scratch-resistant glass face.",
   highlights:["Silent sweep movement","30cm diameter","Scratch-resistant glass","Large Arabic numerals","AA battery operated"],
   specs:[["Diameter","30cm"],["Movement","Silent quartz sweep"],["Power","1x AA battery"],["Face","Glass"]]},
  {id:40, name:"Full-length Mirror", category:"Home", price:900, originalPrice:1200, rating:4.0, reviews:26, stock:true, deliveryDays:"4-7",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#c0c0c0","#795548"],
   description:"Full-length floor mirror with slim aluminium frame. Wall-mounted or leaned against any wall.",
   highlights:["165x55cm full length","5mm silver-backed glass","Slim 2cm aluminium frame","Wall mount or free-stand"],
   specs:[["Dimensions","165x55cm"],["Glass","5mm silver-backed"],["Frame","Aluminium 2cm"],["Weight","8kg"]]},
  {id:41, name:"TWS Earbuds", category:"Electronics", price:1800, originalPrice:2300, rating:4.3, reviews:49, stock:true, deliveryDays:"2-3",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#fff","#c4df9a"],
   description:"True wireless earbuds with Active Noise Cancellation, 30-hour total battery, and ultra-low latency gaming mode.",
   highlights:["Active Noise Cancellation","30hr total battery","10ms gaming mode","Hi-Res Audio","IPX5 sweat resistant"],
   specs:[["Driver","11mm dynamic"],["ANC","Hybrid ANC"],["Battery","7hr buds + 23hr case"],["Bluetooth","5.3"],["Water","IPX5"]]},
  {id:42, name:"Mini Drone", category:"Electronics", price:6000, originalPrice:7500, rating:4.4, reviews:32, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#c4df9a"],
   description:"Foldable mini drone with 4K camera, 3-axis gimbal stabilisation, and 30-minute flight time.",
   highlights:["4K 30fps camera","3-axis gimbal","30 min flight time","GPS auto return","Foldable pocket-size"],
   specs:[["Camera","4K 30fps"],["Gimbal","3-axis"],["Flight Time","30 min"],["Range","4km"],["Weight","249g"],["GPS","Yes"]]},
  {id:43, name:"Camera Tripod", category:"Electronics", price:700, originalPrice:950, rating:4.0, reviews:28, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c"],
   description:"Aluminium tripod with ball head, quick-release plate, and extendable legs up to 170cm.",
   highlights:["Max height 170cm","Ball head 360-degree pan","Quick-release plate","Carry bag included"],
   specs:[["Max Height","170cm"],["Load Capacity","5kg"],["Weight","1.2kg"],["Head","Ball head 360-degree"]]},
  {id:44, name:"Portable Projector", category:"Electronics", price:8500, originalPrice:10000, rating:4.2, reviews:31, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#fff","#1c1c1c"],
   description:"Full HD portable projector with built-in Android TV, 500 ANSI lumens, and keystone correction.",
   highlights:["Full HD 1080p","500 ANSI lumens","Built-in Android TV","Auto keystone correction"],
   specs:[["Resolution","1920x1080"],["Brightness","500 ANSI lumens"],["OS","Android TV"],["Ports","HDMI USB 3.5mm"]]},
  {id:45, name:"35L Backpack", category:"Fashion", price:1200, originalPrice:1600, rating:4.1, reviews:35, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#37474f","#c62828"],
   description:"35L travel backpack with laptop compartment, anti-theft zip, rain cover, and ergonomic straps.",
   highlights:["35L capacity","15.6-inch laptop compartment","Anti-theft hidden zip","Rain cover included"],
   specs:[["Capacity","35L"],["Laptop","Up to 15.6-inch"],["Material","900D ripstop polyester"],["Weight","0.9kg"]]},
  {id:46, name:"Slim Wallet", category:"Fashion", price:500, originalPrice:750, rating:3.9, reviews:24, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#3e2723","#1c1c1c","#795548"],
   description:"Ultra-slim RFID-blocking genuine leather wallet with 6 card slots and pull-tab access.",
   highlights:["RFID blocking","6 card slots","Pull-tab access","Genuine leather","Ultra-slim 8mm"],
   specs:[["Material","Genuine leather"],["Card Slots","6"],["RFID","Blocked"],["Thickness","8mm"]]},
  {id:47, name:"Sports Sandals", category:"Fashion", price:700, originalPrice:950, rating:4.0, reviews:26, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#795548","#0288d1"],
   description:"Waterproof sports sandals with quick-dry straps, contoured EVA footbed, and grippy rubber outsole.",
   highlights:["Waterproof construction","Quick-dry straps","Contoured EVA footbed","Adjustable 3-strap system"],
   specs:[["Upper","Nylon webbing"],["Footbed","EVA foam"],["Outsole","Rubber"],["Closure","Hook and loop"]]},
  {id:48, name:"Steel Water Bottle", category:"Home", price:300, originalPrice:450, rating:3.8, reviews:19, stock:true, deliveryDays:"2-3",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#c4df9a","#c62828"],
   description:"Double-wall vacuum insulated steel bottle. Keeps cold 24hr or hot 12hr. BPA free, leak proof.",
   highlights:["Double-wall vacuum insulation","Cold 24hr Hot 12hr","BPA-free food-grade steel","Leak-proof lid","1L capacity"],
   specs:[["Capacity","1 Litre"],["Material","18/8 Stainless steel"],["Cold","24 hours"],["Hot","12 hours"]]},
  {id:49, name:"Lunch Box Set", category:"Home", price:450, originalPrice:650, rating:3.9, reviews:21, stock:true, deliveryDays:"2-3",
   images:["assets/products/demo.jpg"], colours:["#1c1c1c","#c4df9a","#0288d1"],
   description:"3-tier stainless steel lunch box with clip-lock lid, leak-proof design, and insulated carry bag.",
   highlights:["3-tier tiffin","Clip-lock lid leak-proof","Food-grade stainless steel","Insulated carry bag"],
   specs:[["Tiers","3"],["Material","304 Stainless steel"],["Capacity","1000ml total"],["Dishwasher Safe","Yes"]]},
  {id:50, name:"Indoor Plant", category:"Home", price:350, originalPrice:500, rating:4.2, reviews:23, stock:true, deliveryDays:"3-5",
   images:["assets/products/demo.jpg"], colours:["#2e7d32"],
   description:"Low-maintenance money plant in a ceramic pot. Purifies air and is perfect for home or office.",
   highlights:["Air-purifying money plant","Ceramic pot included","Low maintenance","Suitable for indoor"],
   specs:[["Plant","Money plant Pothos"],["Pot","Ceramic 15cm"],["Light","Indirect sunlight"],["Watering","Once a week"]]}}