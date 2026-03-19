/* ================================================================
   help.js
   ================================================================ */

window.addEventListener("DOMContentLoaded", function () {
  applyTheme();
});

/* ================================================================
   THEME
   ================================================================ */
function applyTheme() {
  if (localStorage.getItem("rx_theme") === "light") {
    document.body.classList.add("light-mode");
    document.getElementById("themeIconSun").style.display  = "none";
    document.getElementById("themeIconMoon").style.display = "";
    swapLogos(true);
  }
}

function toggleTheme() {
  var isLight = document.body.classList.toggle("light-mode");
  document.getElementById("themeIconSun").style.display  = isLight ? "none" : "";
  document.getElementById("themeIconMoon").style.display = isLight ? "" : "none";
  localStorage.setItem("rx_theme", isLight ? "light" : "dark");
  swapLogos(isLight);
}

function swapLogos(isLight) {
  var src = isLight ? "assets/logo/logo-light.png" : "assets/logo/logo.png";
  ["helpLogo","footerLogo"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.src = src;
  });
}

/* ================================================================
   FAQ ACCORDION
   ================================================================ */
function toggleFAQ(btn) {
  var item = btn.closest(".faq-item");
  var isOpen = item.classList.contains("open");

  /* Close all others */
  document.querySelectorAll(".faq-item.open").forEach(function (el) {
    el.classList.remove("open");
  });

  /* Toggle this one */
  if (!isOpen) item.classList.add("open");
}

/* ================================================================
   SCROLL TO SECTION
   ================================================================ */
function scrollToSection(id) {
  var el = document.getElementById("section-" + id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* ================================================================
   SEARCH FAQ
   ================================================================ */
function searchFAQ(query) {
  var q = query.toLowerCase().trim();

  document.querySelectorAll(".faq-item").forEach(function (item) {
    if (!q) {
      item.classList.remove("hidden-faq");
      return;
    }
    var text = item.textContent.toLowerCase();
    item.classList.toggle("hidden-faq", !text.includes(q));
  });

  /* Show/hide section headers based on visible items */
  document.querySelectorAll(".faq-section").forEach(function (section) {
    var visible = section.querySelectorAll(".faq-item:not(.hidden-faq)").length;
    section.style.display = visible > 0 ? "" : "none";
  });

  /* If no query, restore all sections */
  if (!q) {
    document.querySelectorAll(".faq-section").forEach(function (s) {
      s.style.display = "";
    });
  }
}

/* ================================================================
   CONTACT FORM
   ================================================================ */
function submitContactForm() {
  var name    = document.getElementById("cfName").value.trim();
  var email   = document.getElementById("cfEmail").value.trim();
  var topic   = document.getElementById("cfTopic").value;
  var message = document.getElementById("cfMessage").value.trim();
  var msg     = document.getElementById("cfMsg");

  if (!name || !email || !topic || message.length < 10) {
    msg.textContent = "Please fill in all fields (message must be at least 10 characters).";
    msg.className = "form-msg err";
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg.textContent = "Please enter a valid email address.";
    msg.className = "form-msg err";
    return;
  }

  /* In a real app this would POST to /support/contact
     For now we simulate success */
  msg.textContent = "Message sent! We'll get back to you within 24 hours.";
  msg.className = "form-msg";

  /* Clear form */
  ["cfName","cfEmail","cfOrderId","cfMessage"].forEach(function (id) {
    document.getElementById(id).value = "";
  });
  document.getElementById("cfTopic").value = "";

  showToast("Message sent successfully!");
}

/* ================================================================
   TOAST
   ================================================================ */
var toastTimer = null;
function showToast(msg) {
  var el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2800);
}