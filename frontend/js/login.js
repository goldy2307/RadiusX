/* ====================================================
   RadiusX &#8212; login.js
   Handles: tab switching, validation, password toggle,
            strength meter, pincode lookup, modals, toast,
            seller registration (3-step)
   ==================================================== */


/* ===== TAB SWITCHING ===== */

document.addEventListener("DOMContentLoaded", function () {
  let params = new URLSearchParams(window.location.search)
  let tab = params.get("tab")

  if (tab === "signup") {
    switchTab("signup")
  } else if (tab === "seller") {
    switchTab("seller")
  } else {
    switchTab("signin")
  }
})

function switchTab(tab) {
  let indicator  = document.getElementById("tabIndicator")
  let tabSignIn  = document.getElementById("tabSignIn")
  let tabSignUp  = document.getElementById("tabSignUp")
  let tabSeller  = document.getElementById("tabSeller")
  let formSignIn = document.getElementById("formSignIn")
  let formSignUp = document.getElementById("formSignUp")
  let formSeller = document.getElementById("formSeller")

  // Reset all tabs
  tabSignIn.classList.remove("active")
  tabSignUp.classList.remove("active")
  tabSeller.classList.remove("active")
  formSignIn.classList.add("hidden")
  formSignUp.classList.add("hidden")
  formSeller.classList.add("hidden")
  indicator.classList.remove("pos-2", "pos-3")

  if (tab === "signin") {
    tabSignIn.classList.add("active")
    formSignIn.classList.remove("hidden")
    // indicator stays at default position (pos-1)
    formSignIn.style.animation = "none"
    formSignIn.offsetHeight
    formSignIn.style.animation = ""

  } else if (tab === "signup") {
    tabSignUp.classList.add("active")
    indicator.classList.add("pos-2")
    formSignUp.classList.remove("hidden")
    formSignUp.style.animation = "none"
    formSignUp.offsetHeight
    formSignUp.style.animation = ""

  } else if (tab === "seller") {
    tabSeller.classList.add("active")
    indicator.classList.add("pos-3")
    formSeller.classList.remove("hidden")
    formSeller.style.animation = "none"
    formSeller.offsetHeight
    formSeller.style.animation = ""
  }
}


/* ===== PASSWORD VISIBILITY TOGGLE ===== */

function togglePassword(fieldId, icon) {
  let input = document.getElementById(fieldId)
  if (input.type === "password") {
    input.type = "text"
    icon.classList.remove("fa-eye")
    icon.classList.add("fa-eye-slash")
  } else {
    input.type = "password"
    icon.classList.remove("fa-eye-slash")
    icon.classList.add("fa-eye")
  }
}


/* ===== PASSWORD STRENGTH METER (buyer signup) ===== */

function checkStrength(value) {
  let fill  = document.getElementById("strengthFill")
  let label = document.getElementById("strengthLabel")
  applyStrength(value, fill, label)
}

/* ===== PASSWORD STRENGTH METER (seller) ===== */

function checkSellerStrength(value) {
  let fill  = document.getElementById("sl-strengthFill")
  let label = document.getElementById("sl-strengthLabel")
  applyStrength(value, fill, label)
}

function applyStrength(value, fill, label) {
  let score = 0
  if (value.length >= 8) score++
  if (/[A-Z]/.test(value)) score++
  if (/[0-9]/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++

  let widths = ["0%", "25%", "50%", "75%", "100%"]
  let colors = ["transparent", "rgb(255,80,80)", "rgb(255,160,50)", "rgb(196,223,154)", "rgb(100,210,130)"]
  let labels = ["", "Weak", "Fair", "Good", "Strong"]

  fill.style.width      = widths[score]
  fill.style.background = colors[score]
  label.innerText       = labels[score]
  label.style.color     = colors[score]
}


/* ===== PINCODE LOOKUP &#8212; buyer ===== */

let pincodeTimer = null

async function fetchPincode(value) {
  let info = document.getElementById("pincodeInfo")
  let err  = document.getElementById("suPincodeErr")
  info.innerText = ""
  err.innerText  = ""
  if (value.length !== 6 || isNaN(value)) return
  info.innerText = "Looking up..."
  clearTimeout(pincodeTimer)
  pincodeTimer = setTimeout(async () => {
    try {
      let res  = await fetch("https://api.postalpincode.in/pincode/" + value)
      let data = await res.json()
      if (data[0].Status === "Success") {
        let place = data[0].PostOffice[0]
        info.innerText = place.District + ", " + place.State
        let addrField = document.getElementById("suAddress")
        if (!addrField.value) {
          addrField.placeholder = place.District + ", " + place.State + " &#8212; " + value
        }
      } else {
        err.innerText  = "Invalid pincode"
        info.innerText = ""
      }
    } catch (e) { info.innerText = "" }
  }, 500)
}

/* ===== PINCODE LOOKUP &#8212; seller ===== */

let slPincodeTimer = null

async function fetchSellerPincode(value) {
  let info = document.getElementById("sl-pincodeInfo")
  let err  = document.getElementById("sl-pincodeErr")
  info.innerText = ""
  err.innerText  = ""
  if (value.length !== 6 || isNaN(value)) return
  info.innerText = "Looking up..."
  clearTimeout(slPincodeTimer)
  slPincodeTimer = setTimeout(async () => {
    try {
      let res  = await fetch("https://api.postalpincode.in/pincode/" + value)
      let data = await res.json()
      if (data[0].Status === "Success") {
        let place = data[0].PostOffice[0]
        info.innerText = place.District + ", " + place.State
        let addrField = document.getElementById("sl-storeAddr")
        if (!addrField.value) {
          addrField.placeholder = place.District + ", " + place.State + " &#8212; " + value
        }
      } else {
        err.innerText  = "Invalid pincode"
        info.innerText = ""
      }
    } catch (e) { info.innerText = "" }
  }, 500)
}


/* ===== FIELD VALIDATION HELPERS ===== */

function setError(fieldId, errId, message) {
  let el   = document.getElementById(fieldId)
  let wrap = el ? el.closest(".input-wrap") : null
  let err  = document.getElementById(errId)
  if (wrap) wrap.classList.add("error")
  if (err)  err.innerText = message
  return false
}

function clearError(fieldId, errId) {
  let el   = document.getElementById(fieldId)
  let wrap = el ? el.closest(".input-wrap") : null
  let err  = document.getElementById(errId)
  if (wrap) wrap.classList.remove("error")
  if (err)  err.innerText = ""
}

function clearAllErrors(ids) {
  ids.forEach(([fieldId, errId]) => clearError(fieldId, errId))
}


/* ===== SIGN IN HANDLER ===== */

function handleSignIn() {
  clearAllErrors([
    ["siIdentifier", "siIdentifierErr"],
    ["siPassword",   "siPasswordErr"]
  ])

  let identifier = document.getElementById("siIdentifier").value.trim()
  let password   = document.getElementById("siPassword").value
  let valid      = true

  if (!identifier) {
    setError("siIdentifier", "siIdentifierErr", "Email or mobile is required")
    valid = false
  }

  if (!password) {
    setError("siPassword", "siPasswordErr", "Password is required")
    valid = false
  }

  if (!valid) return

  // Check buyers
  let users = JSON.parse(localStorage.getItem("rx_users") || "[]")
  let match = users.find(u =>
    (u.email === identifier || u.mobile === identifier) && u.password === password
  )

  if (match) {
    localStorage.setItem("token", btoa(match.email))
    localStorage.setItem("rx_user_role", "buyer")
    showToast("Welcome back, " + match.name + "! \uD83D\uDC4B")
    setTimeout(() => { window.location.href = "index.html" }, 1400)
    return
  }

  // Check sellers
  let sellers = JSON.parse(localStorage.getItem("rx_sellers") || "[]")
  let sellerMatch = sellers.find(s =>
    s.email === identifier && s.password === password
  )

  if (sellerMatch) {
    localStorage.setItem("token", btoa(sellerMatch.email))
    localStorage.setItem("rx_user_role", "seller")
    showToast("Welcome back, " + sellerMatch.ownerName + "! \uD83C\uDFEA")
    setTimeout(() => { window.location.href = "seller-dashboard.html" }, 1400)
    return
  }

  setError("siPassword", "siPasswordErr", "Incorrect credentials. Please try again.")
}


/* ===== SIGN UP HANDLER ===== */

function handleSignUp() {
  let fields = [
    ["suName",     "suNameErr"],
    ["suEmail",    "suEmailErr"],
    ["suMobile",   "suMobileErr"],
    ["suPincode",  "suPincodeErr"],
    ["suAddress",  "suAddressErr"],
    ["suPassword", "suPasswordErr"],
    ["suConfirm",  "suConfirmErr"]
  ]
  clearAllErrors(fields)

  let name     = document.getElementById("suName").value.trim()
  let email    = document.getElementById("suEmail").value.trim()
  let mobile   = document.getElementById("suMobile").value.trim()
  let pincode  = document.getElementById("suPincode").value.trim()
  let address  = document.getElementById("suAddress").value.trim()
  let password = document.getElementById("suPassword").value
  let confirm  = document.getElementById("suConfirm").value
  let terms    = document.getElementById("suTerms").checked
  let valid    = true

  if (!name || name.length < 2) {
    setError("suName", "suNameErr", "Enter a valid full name")
    valid = false
  }
  if (!email || !/^[^\s@]+@gmail\.com$/.test(email)) {
    setError("suEmail", "suEmailErr", "Enter a valid Gmail address")
    valid = false
  }
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    setError("suMobile", "suMobileErr", "Enter a valid 10-digit Indian mobile number")
    valid = false
  }
  if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
    setError("suPincode", "suPincodeErr", "Enter a valid 6-digit pincode")
    valid = false
  }
  if (!address || address.length < 6) {
    setError("suAddress", "suAddressErr", "Enter your residential address")
    valid = false
  }
  if (!password || password.length < 8) {
    setError("suPassword", "suPasswordErr", "Password must be at least 8 characters")
    valid = false
  }
  if (password !== confirm) {
    setError("suConfirm", "suConfirmErr", "Passwords do not match")
    valid = false
  }
  if (!terms) {
    showToast("Please accept the Terms & Conditions")
    valid = false
  }
  if (!valid) return

  let users    = JSON.parse(localStorage.getItem("rx_users") || "[]")
  let existing = users.find(u => u.email === email || u.mobile === mobile)
  if (existing) {
    setError("suEmail", "suEmailErr", "An account with this email/mobile already exists")
    return
  }

  users.push({ name, email, mobile, pincode, address, password })
  localStorage.setItem("rx_users", JSON.stringify(users))
  localStorage.setItem("token", btoa(email))
  localStorage.setItem("rx_user_role", "buyer")

  showToast("Account created! Welcome, " + name + " \uD83C\uDF89")
  setTimeout(() => { window.location.href = "index.html" }, 1500)
}


/* ================================================================
   SELLER REGISTRATION &#8212; 3-step logic
   ================================================================ */

/* Track which step is active */
let sellerCurrentStep = 1

/* Collected data across steps */
let sellerData = {}

/* Uploaded file names */
let sellerDocs = { pan: "", gst: "", biz: "", bank: "" }

/* ---- Step indicator helpers ---- */

function updateStepUI(currentStep) {
  for (let i = 1; i <= 3; i++) {
    let dot       = document.getElementById("step-dot-" + i)
    let connector = document.querySelectorAll(".step-connector")[i - 1]

    dot.classList.remove("active", "done")

    if (i < currentStep)       { dot.classList.add("done");   if (connector) connector.classList.add("done"); }
    else if (i === currentStep){ dot.classList.add("active");  if (connector) connector.classList.remove("done"); }
    else                       {                               if (connector) connector.classList.remove("done"); }
  }
}

function showStep(stepNum) {
  for (let i = 1; i <= 3; i++) {
    document.getElementById("sellerStep" + i).classList.add("hidden")
  }
  document.getElementById("sellerStep" + stepNum).classList.remove("hidden")
  sellerCurrentStep = stepNum
  updateStepUI(stepNum)
}

/* ---- Step 1 validation & proceed ---- */

function sellerNextStep(fromStep) {
  if (fromStep === 1) {
    let valid = validateSellerStep1()
    if (!valid) return
    // Collect step 1 data
    sellerData.ownerName = document.getElementById("sl-ownerName").value.trim()
    sellerData.email     = document.getElementById("sl-email").value.trim()
    sellerData.mobile    = document.getElementById("sl-mobile").value.trim()
    sellerData.bizType   = document.getElementById("sl-bizType").value
    sellerData.bizName   = document.getElementById("sl-bizName").value.trim()
    sellerData.gst       = document.getElementById("sl-gst").value.trim()
    sellerData.pan       = document.getElementById("sl-pan").value.trim()
    showStep(2)

  } else if (fromStep === 2) {
    let valid = validateSellerStep2()
    if (!valid) return
    // Collect step 2 data
    sellerData.storeName  = document.getElementById("sl-storeName").value.trim()
    sellerData.storeDesc  = document.getElementById("sl-storeDesc").value.trim()
    sellerData.category   = document.getElementById("sl-category").value
    sellerData.pincode    = document.getElementById("sl-pincode").value.trim()
    sellerData.storeAddr  = document.getElementById("sl-storeAddr").value.trim()
    sellerData.password   = document.getElementById("sl-password").value
    showStep(3)
  }
}

function sellerBackStep(fromStep) {
  showStep(fromStep - 1)
}

/* ---- Step 1 Validation ---- */

function validateSellerStep1() {
  clearAllErrors([
    ["sl-ownerName", "sl-ownerNameErr"],
    ["sl-email",     "sl-emailErr"],
    ["sl-mobile",    "sl-mobileErr"],
    ["sl-bizType",   "sl-bizTypeErr"],
    ["sl-bizName",   "sl-bizNameErr"],
    ["sl-pan",       "sl-panErr"]
  ])

  let ownerName = document.getElementById("sl-ownerName").value.trim()
  let email     = document.getElementById("sl-email").value.trim()
  let mobile    = document.getElementById("sl-mobile").value.trim()
  let bizType   = document.getElementById("sl-bizType").value
  let bizName   = document.getElementById("sl-bizName").value.trim()
  let gst       = document.getElementById("sl-gst").value.trim()
  let pan       = document.getElementById("sl-pan").value.trim()
  let valid     = true

  if (!ownerName || ownerName.length < 2) {
    setError("sl-ownerName", "sl-ownerNameErr", "Enter owner / contact name")
    valid = false
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError("sl-email", "sl-emailErr", "Enter a valid business email")
    valid = false
  }
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    setError("sl-mobile", "sl-mobileErr", "Enter a valid 10-digit mobile number")
    valid = false
  }
  if (!bizType) {
    setError("sl-bizType", "sl-bizTypeErr", "Select a business type")
    valid = false
  }
  if (!bizName || bizName.length < 3) {
    setError("sl-bizName", "sl-bizNameErr", "Enter your business / legal name")
    valid = false
  }
  if (gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst)) {
    setError("sl-gst", "sl-gstErr", "Enter a valid GST number (e.g. 22AAAAA0000A1Z5)")
    valid = false
  }
  if (!pan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
    setError("sl-pan", "sl-panErr", "Enter a valid 10-character PAN (e.g. ABCDE1234F)")
    valid = false
  }

  return valid
}

/* ---- Step 2 Validation ---- */

function validateSellerStep2() {
  clearAllErrors([
    ["sl-storeName", "sl-storeNameErr"],
    ["sl-storeDesc", "sl-storeDescErr"],
    ["sl-category",  "sl-categoryErr"],
    ["sl-pincode",   "sl-pincodeErr"],
    ["sl-storeAddr", "sl-storeAddrErr"],
    ["sl-password",  "sl-passwordErr"],
    ["sl-confirm",   "sl-confirmErr"]
  ])

  let storeName = document.getElementById("sl-storeName").value.trim()
  let storeDesc = document.getElementById("sl-storeDesc").value.trim()
  let category  = document.getElementById("sl-category").value
  let pincode   = document.getElementById("sl-pincode").value.trim()
  let storeAddr = document.getElementById("sl-storeAddr").value.trim()
  let password  = document.getElementById("sl-password").value
  let confirm   = document.getElementById("sl-confirm").value
  let valid     = true

  if (!storeName || storeName.length < 3) {
    setError("sl-storeName", "sl-storeNameErr", "Enter your store / shop name")
    valid = false
  }
  if (!storeDesc || storeDesc.length < 10) {
    setError("sl-storeDesc", "sl-storeDescErr", "Write a brief description (min 10 characters)")
    valid = false
  }
  if (!category) {
    setError("sl-category", "sl-categoryErr", "Select a product category")
    valid = false
  }
  if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
    setError("sl-pincode", "sl-pincodeErr", "Enter a valid 6-digit pincode")
    valid = false
  }
  if (!storeAddr || storeAddr.length < 8) {
    setError("sl-storeAddr", "sl-storeAddrErr", "Enter your store address")
    valid = false
  }
  if (!password || password.length < 8) {
    setError("sl-password", "sl-passwordErr", "Password must be at least 8 characters")
    valid = false
  }
  if (password !== confirm) {
    setError("sl-confirm", "sl-confirmErr", "Passwords do not match")
    valid = false
  }

  return valid
}

/* ---- Step 3 Validation & Final Submit ---- */

function handleSellerSubmit() {
  // Clear doc errors
  document.getElementById("sl-panDocErr").innerText  = ""
  document.getElementById("sl-bizDocErr").innerText  = ""
  document.getElementById("sl-bankDocErr").innerText = ""

  clearAllErrors([
    ["sl-accName",  "sl-accNameErr"],
    ["sl-bankName", "sl-bankNameErr"],
    ["sl-accNo",    "sl-accNoErr"],
    ["sl-ifsc",     "sl-ifscErr"]
  ])

  let accName  = document.getElementById("sl-accName").value.trim()
  let bankName = document.getElementById("sl-bankName").value.trim()
  let accNo    = document.getElementById("sl-accNo").value.trim()
  let ifsc     = document.getElementById("sl-ifsc").value.trim()
  let terms    = document.getElementById("slTerms").checked
  let valid    = true

  if (!accName || accName.length < 2) {
    setError("sl-accName", "sl-accNameErr", "Enter account holder name")
    valid = false
  }
  if (!bankName || bankName.length < 2) {
    setError("sl-bankName", "sl-bankNameErr", "Enter bank name")
    valid = false
  }
  if (!accNo || accNo.length < 9) {
    setError("sl-accNo", "sl-accNoErr", "Enter a valid account number")
    valid = false
  }
  if (!ifsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
    setError("sl-ifsc", "sl-ifscErr", "Enter a valid IFSC code (e.g. SBIN0001234)")
    valid = false
  }
  if (!sellerDocs.pan) {
    document.getElementById("sl-panDocErr").innerText  = "Please upload your PAN card"
    valid = false
  }
  if (!sellerDocs.biz) {
    document.getElementById("sl-bizDocErr").innerText  = "Please upload a business proof document"
    valid = false
  }
  if (!sellerDocs.bank) {
    document.getElementById("sl-bankDocErr").innerText = "Please upload a cancelled cheque or passbook"
    valid = false
  }
  if (!terms) {
    showToast("Please accept the Seller Terms & Conditions")
    valid = false
  }

  if (!valid) return

  // Check duplicate seller email
  let sellers  = JSON.parse(localStorage.getItem("rx_sellers") || "[]")
  let existing = sellers.find(s => s.email === sellerData.email)
  if (existing) {
    showToast("A seller account with this email already exists.")
    showStep(1)
    setError("sl-email", "sl-emailErr", "This email is already registered as a seller")
    return
  }

  // Build full seller record
  let seller = Object.assign({}, sellerData, {
    accName  : accName,
    bankName : bankName,
    accNo    : accNo,
    ifsc     : ifsc,
    docs     : { pan: sellerDocs.pan, gst: sellerDocs.gst, biz: sellerDocs.biz, bank: sellerDocs.bank },
    status   : "pending",       // pending | approved | rejected
    appliedAt: new Date().toISOString(),
    id       : "seller_" + Date.now()
  })

  sellers.push(seller)
  localStorage.setItem("rx_sellers", JSON.stringify(sellers))

  // Show success state
  showSellerSuccess(seller.ownerName, seller.storeName)
}

function showSellerSuccess(ownerName, storeName) {
  let form = document.getElementById("formSeller")
  form.innerHTML =
    '<div style="text-align:center;padding:40px 0;">' +
      '<div style="font-size:58px;margin-bottom:20px;">\uD83C\uDF89</div>' +
      '<h2 style="font-family:\'Playfair Display\',serif;font-size:26px;color:var(--accent);margin-bottom:12px">' +
        'Application Submitted!' +
      '</h2>' +
      '<p style="color:var(--muted);font-size:14px;line-height:1.7;max-width:340px;margin:0 auto 10px;">' +
        'Hi <strong style="color:var(--text)">' + ownerName + '</strong>, your store ' +
        '<strong style="color:var(--text)">' + storeName + '</strong> is under review.' +
      '</p>' +
      '<p style="color:var(--muted);font-size:13px;line-height:1.7;max-width:340px;margin:0 auto 28px;">' +
        'Our team will verify your documents within <strong style="color:var(--accent)">24&#8211;48 hours</strong>. ' +
        'You\'ll get an email once your store is approved and live.' +
      '</p>' +
      '<a href="index.html" style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;' +
        'background:var(--accent);color:rgb(8,12,16);border-radius:8px;text-decoration:none;' +
        'font-weight:700;font-size:14px;transition:background 0.2s;">' +
        '<i class="fa-solid fa-house"></i> Back to RadiusX' +
      '</a>' +
    '</div>'
}

/* ---- File upload handlers ---- */

function triggerUpload(inputId, boxId, nameId) {
  document.getElementById(inputId).click()
}

function handleUpload(inputId, boxId, nameId) {
  let input = document.getElementById(inputId)
  let box   = document.getElementById(boxId)
  let label = document.getElementById(nameId)
  if (!input.files || !input.files[0]) return

  let file = input.files[0]
  // Limit 5 MB
  if (file.size > 5 * 1024 * 1024) {
    showToast("File too large. Max 5 MB allowed.")
    input.value = ""
    return
  }

  label.innerText = "\u2713 " + file.name
  box.classList.add("uploaded")

  // Store filename in sellerDocs
  if (inputId === "filePAN")  sellerDocs.pan  = file.name
  if (inputId === "fileGST")  sellerDocs.gst  = file.name
  if (inputId === "fileBiz")  sellerDocs.biz  = file.name
  if (inputId === "fileBank") sellerDocs.bank = file.name
}


/* ===== MODALS ===== */

let modalContents = {

  forgot: `
    <h3>Forgot Password</h3>
    <p>Enter your registered email or mobile number. We'll send you a reset link.</p>
    <div class="modal-input-wrap">
      <i class="fa-regular fa-envelope"></i>
      <input type="text" id="forgotInput" placeholder="Email or Mobile">
    </div>
    <button class="modal-btn" onclick="handleForgot()">Send Reset Link</button>
  `,

  seller: `
    <h3>Become a Seller</h3>
    <p>Join RadiusX as a local seller and reach customers near you.</p>
    <p>To register as a seller, you'll need:</p>
    <p>&#8226; GST / Business registration number<br>&#8226; Bank account details<br>&#8226; Store photos &amp; product catalogue</p>
    <br>
    <button class="modal-btn" onclick="closeModal(); switchTab('seller')">Start Registration</button>
  `,

  help: `
    <h3>Help &amp; Support</h3>
    <p>Need assistance? We're here for you.</p>
    <p>&#128231; <strong>Email:</strong> support.radiusx@gmail.com</p>
    <p>&#128222; <strong>Helpline:</strong> 1800-XXX-XXXX (9AM &#8211; 9PM)</p>
    <p>&#128172; <strong>Chat Support:</strong> Available on the app</p>
    <br>
    <p style="font-size:12px;color:var(--muted)">Common topics: Order issues &#183; Refunds &#183; Account recovery &#183; Seller queries</p>
    <br>
    <button class="modal-btn" onclick="closeModal()">Got it</button>
  `
}

function showModal(type) {
  let overlay = document.getElementById("modalOverlay")
  let content = document.getElementById("modalContent")
  content.innerHTML = modalContents[type] || ""
  overlay.classList.add("open")
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open")
}

function handleForgot() {
  let val = document.getElementById("forgotInput").value.trim()
  if (!val) return
  showToast("Reset link sent to " + val)
  closeModal()
}


/* ===== TOAST ===== */

let toastTimer = null

function showToast(message) {
  let toast = document.getElementById("toast")
  toast.innerText = message
  toast.classList.add("show")
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.classList.remove("show")
  }, 2800)
}