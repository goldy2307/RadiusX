/* ====================================================
   RadiusX — forgot.js
   Wired to real backend API:
   Step 1: Enter email → POST /auth/forgot-password → OTP sent
   Step 2: Enter new password → shown after email entry
   Step 3: Enter OTP → POST /auth/verify-otp → get resetToken
           then POST /auth/reset-password → done
   ==================================================== */

var pendingEmail    = "";
var resetToken      = "";
var timerInterval   = null;
var toastTimer      = null;

window.onload = function () {
  showStep("stepEmail");
  activateStepDot(1);
};


/* ====================================================
   STEP UI
   ==================================================== */
function showStep(stepId) {
  ["stepEmail","stepReset","stepOtp","stepSuccess"].forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (id === stepId) {
      el.classList.remove("hidden");
      el.style.animation = "none";
      el.offsetHeight;
      el.style.animation = "";
    } else {
      el.classList.add("hidden");
    }
  });
}

function activateStepDot(n) {
  [1,2,3].forEach(function(i) {
    var dot = document.getElementById("step" + i + "Dot");
    if (dot) dot.classList.remove("active");
  });
  var active = document.getElementById("step" + n + "Dot");
  if (active) active.classList.add("active");
}

function markStepDone(n) {
  var dot = document.getElementById("step" + n + "Dot");
  if (dot) { dot.classList.remove("active"); dot.classList.add("done"); }
  var line = document.getElementById("line" + n);
  if (line) line.classList.add("done");
}


/* ====================================================
   FIELD HELPERS
   ==================================================== */
function clearFpError(errId) {
  var el = document.getElementById(errId); if (el) el.innerText = "";
}
function setFpError(inputId, errId, msg) {
  var input = document.getElementById(inputId);
  var err   = document.getElementById(errId);
  if (input) { var w = input.closest(".input-wrap"); if (w) w.classList.add("error"); }
  if (err)   err.innerText = msg;
}
function clearWrap(inputId) {
  var input = document.getElementById(inputId);
  if (input) { var w = input.closest(".input-wrap"); if (w) w.classList.remove("error"); }
}
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

function togglePassword(fieldId, icon) {
  var input = document.getElementById(fieldId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text"; icon.classList.replace("fa-eye","fa-eye-slash");
  } else {
    input.type = "password"; icon.classList.replace("fa-eye-slash","fa-eye");
  }
}

function checkResetStrength(value) {
  var fill  = document.getElementById("resetStrengthFill");
  var label = document.getElementById("resetStrengthLabel");
  if (!fill || !label) return;
  var score = 0;
  if (value.length>=8) score++; if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++; if (/[^A-Za-z0-9]/.test(value)) score++;
  var w=["0%","25%","50%","75%","100%"];
  var c=["transparent","rgb(255,80,80)","rgb(255,160,50)","rgb(196,223,154)","rgb(100,210,130)"];
  var l=["","Weak","Fair","Good","Strong"];
  fill.style.width=w[score]; fill.style.background=c[score];
  label.innerText=l[score]; label.style.color=c[score];
}


/* ====================================================
   STEP 1 — SEND OTP
   ==================================================== */
async function handleSendLink() {
  clearFpError("fpEmailErr"); clearWrap("fpEmail");

  var email = document.getElementById("fpEmail").value.trim();
  if (!email)              { setFpError("fpEmail","fpEmailErr","Please enter your email address"); return; }
  if (!isValidEmail(email)){ setFpError("fpEmail","fpEmailErr","Enter a valid email address"); return; }

  var btn = document.getElementById("sendLinkBtn");
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending...'; }

  var res = await api.post("/auth/forgot-password", { email: email }, { noRedirect: true });

  if (btn) { btn.disabled = false; btn.innerHTML = '<span>Send Reset Code</span> <i class="fa-solid fa-paper-plane"></i>'; }

  if (res && res.success) {
    pendingEmail = email;
    /* Show confirmation */
    var confirm  = document.getElementById("sentConfirm");
    var display  = document.getElementById("sentEmailDisplay");
    if (display) display.innerText = email;
    if (confirm) confirm.classList.remove("hidden");
    showToast("Reset code sent to " + email);
    /* Move to step 2 (password entry) after a moment */
    setTimeout(function() {
      markStepDone(1); activateStepDot(2);
      showStep("stepReset");
      var emailField = document.getElementById("resetEmail");
      if (emailField) { emailField.value = email; emailField.setAttribute("readonly","true"); }
    }, 1200);
  } else {
    setFpError("fpEmail","fpEmailErr", (res && res.message) || "Could not send reset code.");
  }
}

function resendLink() {
  if (!pendingEmail) { showToast("Enter your email first", true); return; }
  handleSendLink();
}


/* ====================================================
   STEP 2 — ENTER NEW PASSWORD, THEN GET OTP
   ==================================================== */
async function handleSendOtp() {
  ["resetEmail","resetPassword","resetConfirm"].forEach(function(id){ clearWrap(id); });
  clearFpError("resetEmailErr"); clearFpError("resetPasswordErr"); clearFpError("resetConfirmErr");

  var email    = (document.getElementById("resetEmail") || {}).value || pendingEmail;
  var password = document.getElementById("resetPassword").value;
  var confirm  = document.getElementById("resetConfirm").value;
  var valid    = true;

  email = email.trim();
  if (!email || !isValidEmail(email))  { setFpError("resetEmail","resetEmailErr","Valid email required"); valid = false; }
  if (!password || password.length<8)  { setFpError("resetPassword","resetPasswordErr","Min 8 characters"); valid = false; }
  if (password !== confirm)            { setFpError("resetConfirm","resetConfirmErr","Passwords do not match"); valid = false; }
  if (!valid) return;

  pendingEmail = email;

  /* Show OTP step immediately — OTP was already sent in step 1 */
  markStepDone(1); markStepDone(2); activateStepDot(3);
  showStep("stepOtp");
  var display = document.getElementById("otpEmailDisplay");
  if (display) display.innerText = email;
  startOtpTimer(10 * 60);
  showToast("Enter the code sent to " + email);

  /* Store password for use in step 3 */
  window._pendingPassword = password;
}


/* ====================================================
   OTP TIMER
   ==================================================== */
function startOtpTimer(seconds) {
  clearInterval(timerInterval);
  var timerEl = document.getElementById("otpTimer");
  var remaining = seconds;
  function tick() {
    var m = String(Math.floor(remaining/60)).padStart(2,"0");
    var s = String(remaining%60).padStart(2,"0");
    if (timerEl) timerEl.innerText = m + ":" + s;
    if (remaining <= 0) {
      clearInterval(timerInterval);
      if (timerEl) { timerEl.innerText = "Expired"; timerEl.classList.add("expired"); }
    }
    remaining--;
  }
  tick(); timerInterval = setInterval(tick, 1000);
}

async function resendOtp() {
  if (!pendingEmail) { showToast("Session expired. Start over.", true); return; }
  var res = await api.post("/auth/forgot-password", { email: pendingEmail }, { noRedirect: true });
  if (res && res.success) {
    startOtpTimer(10 * 60);
    showToast("New code sent to " + pendingEmail);
    document.querySelectorAll(".otp-box").forEach(function(b){
      b.value=""; b.classList.remove("filled","error-box");
    });
    document.getElementById("otpErr").innerText = "";
    var first = document.querySelectorAll(".otp-box")[0];
    if (first) first.focus();
  } else {
    showToast((res && res.message) || "Could not resend code.", true);
  }
}


/* ====================================================
   OTP BOX KEYBOARD NAV
   ==================================================== */
function otpInput(el, index) {
  var boxes = document.querySelectorAll(".otp-box");
  var val   = el.value.replace(/\D/g,"");
  el.value  = val;
  if (val) { el.classList.add("filled"); el.classList.remove("error-box"); if (index<5) boxes[index+1].focus(); }
  else { el.classList.remove("filled"); }
}

function otpBack(el, index, event) {
  var boxes = document.querySelectorAll(".otp-box");
  if (event.key==="Backspace" && !el.value && index>0) {
    boxes[index-1].focus(); boxes[index-1].value=""; boxes[index-1].classList.remove("filled");
  }
}

function getOtpValue() {
  return Array.from(document.querySelectorAll(".otp-box")).map(function(b){return b.value;}).join("");
}

function shakeBoxes() {
  document.querySelectorAll(".otp-box").forEach(function(b){
    b.classList.add("error-box");
    setTimeout(function(){ b.classList.remove("error-box"); }, 500);
  });
}


/* ====================================================
   STEP 3 — VERIFY OTP + RESET PASSWORD
   ==================================================== */
async function handleVerifyOtp() {
  var otpErr = document.getElementById("otpErr");
  if (otpErr) otpErr.innerText = "";

  var entered = getOtpValue();
  if (entered.length < 6) { if (otpErr) otpErr.innerText = "Enter the complete 6-digit code"; shakeBoxes(); return; }

  var verifyBtn = document.querySelector(".otp-verify-btn") || document.querySelector("[onclick='handleVerifyOtp()']");
  if (verifyBtn) { verifyBtn.disabled = true; verifyBtn.innerText = "Verifying..."; }

  /* Step A: Verify OTP */
  var verifyRes = await api.post("/auth/verify-otp", { email: pendingEmail, otp: entered }, { noRedirect: true });

  if (!verifyRes || !verifyRes.success) {
    if (verifyBtn) { verifyBtn.disabled = false; verifyBtn.innerText = "Verify & Reset Password"; }
    if (otpErr) otpErr.innerText = (verifyRes && verifyRes.message) || "Invalid code.";
    shakeBoxes(); return;
  }

  resetToken = verifyRes.resetToken;

  /* Step B: Reset password */
  var resetRes = await api.post("/auth/reset-password", {
    email:       pendingEmail,
    resetToken:  resetToken,
    newPassword: window._pendingPassword,
  }, { noRedirect: true });

  if (verifyBtn) { verifyBtn.disabled = false; verifyBtn.innerText = "Verify & Reset Password"; }

  if (!resetRes || !resetRes.success) {
    if (otpErr) otpErr.innerText = (resetRes && resetRes.message) || "Reset failed. Try again.";
    return;
  }

  clearInterval(timerInterval);
  window._pendingPassword = null;
  markStepDone(3);
  showStep("stepSuccess");
  showToast("Password updated successfully!");
}


/* ====================================================
   TOAST
   ==================================================== */
function showToast(message, isError) {
  var toast = document.getElementById("toast");
  if (!toast) return;
  toast.innerText = message;
  toast.classList.remove("error-toast");
  if (isError) toast.classList.add("error-toast");
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ toast.classList.remove("show"); }, 3000);
}