/* ====================================================
   RadiusX — forgot.js
   Flow:
     Step 1 → User enters email → "Send Reset Link" → 
              demo email logged to console + shown in UI
     Step 2 → User opens link (?reset=true) → 
              enters email + new password → "Send OTP"
     Step 3 → User enters 6-digit OTP → "Verify & Reset"
   
   NOTE: This is a front-end demo.
   In production, replace the sendResetEmail() and
   sendOtpEmail() functions with real API calls to
   your backend / email service (e.g. EmailJS, NodeMailer).
   ==================================================== */


/* ===== INIT — check URL params ===== */

window.onload = function () {
  let params  = new URLSearchParams(window.location.search)
  let isReset = params.get("reset") === "true"
  let token   = params.get("token") || ""

  if (isReset) {
    /* User arrived from email reset link */
    showStep("stepReset")
    activateStepDot(2)
    markStepDone(1)

    /* Pre-fill email if encoded in token (demo: base64) */
    try {
      let decoded = atob(token)
      if (decoded.includes("@")) {
        document.getElementById("resetEmail").value = decoded
      }
    } catch (e) { /* ignore bad tokens */ }
  } else {
    showStep("stepEmail")
    activateStepDot(1)
  }
}


/* ===== STEP NAVIGATION ===== */

function showStep(stepId) {
  let all = ["stepEmail", "stepReset", "stepOtp", "stepSuccess"]
  all.forEach(id => {
    let el = document.getElementById(id)
    if (id === stepId) {
      el.classList.remove("hidden")
      /* re-trigger enter animation */
      el.style.animation = "none"
      el.offsetHeight
      el.style.animation = ""
    } else {
      el.classList.add("hidden")
    }
  })
}

function activateStepDot(n) {
  [1,2,3].forEach(i => {
    let dot = document.getElementById("step" + i + "Dot")
    dot.classList.remove("active")
  })
  let active = document.getElementById("step" + n + "Dot")
  if (active) active.classList.add("active")
}

function markStepDone(n) {
  let dot = document.getElementById("step" + n + "Dot")
  if (dot) {
    dot.classList.remove("active")
    dot.classList.add("done")
  }
  let line = document.getElementById("line" + n)
  if (line) line.classList.add("done")
}


/* ===== FIELD HELPERS ===== */

function clearFpError(errId) {
  let el = document.getElementById(errId)
  if (el) el.innerText = ""
}

function setFpError(inputId, errId, msg) {
  let input = document.getElementById(inputId)
  let err   = document.getElementById(errId)
  if (input) input.closest(".input-wrap")?.classList.add("error")
  if (err)   err.innerText = msg
}

function clearWrap(inputId) {
  let input = document.getElementById(inputId)
  if (input) input.closest(".input-wrap")?.classList.remove("error")
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}


/* ===== PASSWORD VISIBILITY ===== */

function togglePassword(fieldId, icon) {
  let input = document.getElementById(fieldId)
  if (input.type === "password") {
    input.type = "text"
    icon.classList.replace("fa-eye", "fa-eye-slash")
  } else {
    input.type = "password"
    icon.classList.replace("fa-eye-slash", "fa-eye")
  }
}


/* ===== STRENGTH METER ===== */

function checkResetStrength(value) {
  let fill  = document.getElementById("resetStrengthFill")
  let label = document.getElementById("resetStrengthLabel")
  let score = 0
  if (value.length >= 8)           score++
  if (/[A-Z]/.test(value))         score++
  if (/[0-9]/.test(value))         score++
  if (/[^A-Za-z0-9]/.test(value))  score++

  let widths  = ["0%", "25%", "50%", "75%", "100%"]
  let colors  = ["transparent", "rgb(255,80,80)", "rgb(255,160,50)", "rgb(196,223,154)", "rgb(100,210,130)"]
  let labels  = ["", "Weak", "Fair", "Good", "Strong"]

  fill.style.width      = widths[score]
  fill.style.background = colors[score]
  label.innerText        = labels[score]
  label.style.color      = colors[score]
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
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000)
}


/* ===================================================
   STEP 1 — SEND RESET LINK
   =================================================== */

let linkSent = false

function handleSendLink() {
  clearFpError("fpEmailErr")
  clearWrap("fpEmail")

  let email = document.getElementById("fpEmail").value.trim()

  if (!email) {
    setFpError("fpEmail", "fpEmailErr", "Please enter your email address")
    return
  }

  if (!isValidEmail(email)) {
    setFpError("fpEmail", "fpEmailErr", "Enter a valid email address")
    return
  }

  /* Check if user exists in demo localStorage */
  let users = JSON.parse(localStorage.getItem("rx_users") || "[]")
  let user  = users.find(u => u.email === email)

  if (!user) {
    setFpError("fpEmail", "fpEmailErr", "No account found with this email")
    return
  }

  /* Build reset link (demo: encodes email as base64 token) */
  let token     = btoa(email)
  let resetLink = `${window.location.origin}${window.location.pathname}?reset=true&token=${token}`

  /* ---- In production: call your backend/email API here ---- */
  sendResetEmail(email, user.name, resetLink)

  /* Show confirmation panel */
  linkSent = true
  let confirm  = document.getElementById("sentConfirm")
  let display  = document.getElementById("sentEmailDisplay")
  display.innerText = email
  confirm.classList.remove("hidden")

  let btn = document.getElementById("sendLinkBtn")
  btn.innerHTML = `<span>Link Sent</span> <i class="fa-solid fa-check"></i>`
  btn.style.background = "rgba(196,223,154,0.15)"
  btn.style.color      = "var(--accent)"
  btn.style.border     = "1px solid var(--accent)"
  btn.disabled         = true
}

function resendLink() {
  if (!linkSent) { showToast("Enter your email first", true); return }
  let email = document.getElementById("fpEmail").value.trim()
  if (!email) return
  showToast("Reset link resent to " + email)
}

/* ---- Demo email logger (replace with real send in production) ---- */
function sendResetEmail(email, name, link) {

  /* === EMAIL TEMPLATE PREVIEW (logged to console) ===
     In production pass this HTML to your email API     */

  let html = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧  RadiusX — Password Reset Email
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To      : ${email}
Subject : Reset your RadiusX password

Hi ${name},

We received a request to reset the password for your RadiusX account.
Click the link below to set a new password. This link is valid for 15 minutes.

🔗 RESET LINK:
${link}

If you didn't request a password reset, please ignore this email.
Your account remains secure.

— The RadiusX Team
support.radiusx@gmail.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

  console.log("%c[RadiusX] Reset Email Sent", "color:#c4df9a;font-weight:bold")
  console.log(html)

  /* PRODUCTION: replace console.log with your API call, e.g.:
     EmailJS:   emailjs.send("service_id","template_id",{email,name,link})
     Fetch API: fetch("/api/send-reset-email", {method:"POST", body: JSON.stringify({email,name,link})})
  */
}


/* ===================================================
   STEP 2 — SEND OTP
   =================================================== */

let pendingEmail   = ""
let pendingPassword = ""
let generatedOtp   = ""

function handleSendOtp() {
  /* clear previous errors */
  ["resetEmail","resetPassword","resetConfirm"].forEach(id => {
    clearWrap(id)
  })
  clearFpError("resetEmailErr")
  clearFpError("resetPasswordErr")
  clearFpError("resetConfirmErr")

  let email    = document.getElementById("resetEmail").value.trim()
  let password = document.getElementById("resetPassword").value
  let confirm  = document.getElementById("resetConfirm").value

  let valid = true

  if (!email || !isValidEmail(email)) {
    setFpError("resetEmail", "resetEmailErr", "Enter a valid email address")
    valid = false
  }

  if (!password || password.length < 8) {
    setFpError("resetPassword", "resetPasswordErr", "Password must be at least 8 characters")
    valid = false
  }

  if (password !== confirm) {
    setFpError("resetConfirm", "resetConfirmErr", "Passwords do not match")
    valid = false
  }

  if (!valid) return

  /* Verify account exists */
  let users = JSON.parse(localStorage.getItem("rx_users") || "[]")
  let user  = users.find(u => u.email === email)

  if (!user) {
    setFpError("resetEmail", "resetEmailErr", "No account found with this email")
    return
  }

  /* Generate 6-digit OTP */
  generatedOtp    = String(Math.floor(100000 + Math.random() * 900000))
  pendingEmail    = email
  pendingPassword = password

  /* Send OTP email (demo: logs to console) */
  sendOtpEmail(email, user.name, generatedOtp)

  /* Move to OTP step */
  markStepDone(1)
  markStepDone(2)
  activateStepDot(3)
  showStep("stepOtp")

  document.getElementById("otpEmailDisplay").innerText = email

  /* Start countdown */
  startOtpTimer(10 * 60)

  showToast("OTP sent to " + email)
}

/* ---- Demo OTP email logger ---- */
function sendOtpEmail(email, name, otp) {

  let html = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧  RadiusX — OTP Verification Email
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To      : ${email}
Subject : Your RadiusX OTP — ${otp}

Hi ${name},

Your One-Time Password (OTP) for resetting your RadiusX password is:

┌─────────────────┐
│   ${otp}    │
└─────────────────┘

This OTP is valid for 10 minutes. Do not share it with anyone.

If you did not request this, please contact support immediately.

— The RadiusX Team
support.radiusx@gmail.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

  console.log("%c[RadiusX] OTP Email Sent", "color:#c4df9a;font-weight:bold")
  console.log(html)
  console.log("%cDEV MODE — OTP: " + otp, "color:#ffcc44;font-size:16px;font-weight:bold")

  /* PRODUCTION: replace with real email API call */
}


/* ===== OTP COUNTDOWN TIMER ===== */

let timerInterval = null

function startOtpTimer(seconds) {
  clearInterval(timerInterval)
  let timerEl = document.getElementById("otpTimer")
  let remaining = seconds

  function tick() {
    let m = String(Math.floor(remaining / 60)).padStart(2, "0")
    let s = String(remaining % 60).padStart(2, "0")
    timerEl.innerText = m + ":" + s

    if (remaining <= 0) {
      clearInterval(timerInterval)
      timerEl.innerText = "Expired"
      timerEl.classList.add("expired")
      generatedOtp = "" /* invalidate OTP */
    }
    remaining--
  }

  tick()
  timerInterval = setInterval(tick, 1000)
}

function resendOtp() {
  if (!pendingEmail) { showToast("Session expired. Start over.", true); return }

  let users = JSON.parse(localStorage.getItem("rx_users") || "[]")
  let user  = users.find(u => u.email === pendingEmail)

  generatedOtp = String(Math.floor(100000 + Math.random() * 900000))
  sendOtpEmail(pendingEmail, user ? user.name : "User", generatedOtp)
  startOtpTimer(10 * 60)
  showToast("New OTP sent to " + pendingEmail)

  /* reset boxes */
  document.querySelectorAll(".otp-box").forEach(b => {
    b.value = ""
    b.classList.remove("filled","error-box")
  })
  document.getElementById("otpErr").innerText = ""
  document.querySelectorAll(".otp-box")[0].focus()
}


/* ===== OTP BOX KEYBOARD NAVIGATION ===== */

function otpInput(el, index) {
  let boxes = document.querySelectorAll(".otp-box")
  let val   = el.value.replace(/\D/g, "")
  el.value  = val

  if (val) {
    el.classList.add("filled")
    el.classList.remove("error-box")
    if (index < 5) boxes[index + 1].focus()
  } else {
    el.classList.remove("filled")
  }
}

function otpBack(el, index, event) {
  let boxes = document.querySelectorAll(".otp-box")
  if (event.key === "Backspace" && !el.value && index > 0) {
    boxes[index - 1].focus()
    boxes[index - 1].value = ""
    boxes[index - 1].classList.remove("filled")
  }
}

function getOtpValue() {
  let boxes = document.querySelectorAll(".otp-box")
  return Array.from(boxes).map(b => b.value).join("")
}


/* ===================================================
   STEP 3 — VERIFY OTP & RESET PASSWORD
   =================================================== */

function handleVerifyOtp() {
  let otpErr  = document.getElementById("otpErr")
  otpErr.innerText = ""

  let entered = getOtpValue()

  if (entered.length < 6) {
    otpErr.innerText = "Please enter the complete 6-digit OTP"
    shakeBoxes()
    return
  }

  if (!generatedOtp) {
    otpErr.innerText = "OTP has expired. Please request a new one."
    shakeBoxes()
    return
  }

  if (entered !== generatedOtp) {
    otpErr.innerText = "Incorrect OTP. Please check and try again."
    shakeBoxes()
    return
  }

  /* OTP matched — update password in localStorage */
  let users = JSON.parse(localStorage.getItem("rx_users") || "[]")
  let idx   = users.findIndex(u => u.email === pendingEmail)

  if (idx !== -1) {
    users[idx].password = pendingPassword
    localStorage.setItem("rx_users", JSON.stringify(users))
  }

  clearInterval(timerInterval)
  generatedOtp = ""

  /* Show success */
  markStepDone(3)
  showStep("stepSuccess")
  showToast("Password updated successfully! 🎉")
}

function shakeBoxes() {
  document.querySelectorAll(".otp-box").forEach(b => {
    b.classList.add("error-box")
    setTimeout(() => b.classList.remove("error-box"), 500)
  })
}