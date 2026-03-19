/* ================================================================
   services/notifyService.js
   All transactional emails for RadiusX.
   ================================================================ */

const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || "smtp.gmail.com",
    port:   parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

/* ================================================================
   HTML shell — dark theme matching the RadiusX UI
   ================================================================ */
function shell(content) {
  return `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#0a0e12;font-family:'Helvetica Neue',Arial,sans-serif;}
  .wrap{max-width:540px;margin:40px auto;background:#0e1216;border:1px solid #232f3a;border-radius:12px;overflow:hidden;}
  .header{padding:24px 36px 18px;background:#0b1117;border-bottom:1px solid #1c2830;}
  .logo{color:#c4df9a;font-size:22px;font-weight:700;letter-spacing:-0.5px;}
  .body{padding:30px 36px;}
  h2{color:#c4df9a;font-size:21px;margin:0 0 12px;}
  p{color:#b0bac4;font-size:15px;line-height:1.7;margin:0 0 14px;}
  .badge{display:inline-block;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:16px;}
  .badge.approved{background:rgba(100,215,130,0.12);color:#64d782;border:1px solid rgba(100,215,130,0.25);}
  .badge.rejected{background:rgba(255,95,95,0.12);color:#ff6060;border:1px solid rgba(255,95,95,0.25);}
  .badge.pending{background:rgba(255,195,60,0.12);color:#ffc33c;border:1px solid rgba(255,195,60,0.25);}
  .badge.info{background:rgba(100,170,255,0.12);color:#64aaff;border:1px solid rgba(100,170,255,0.25);}
  .note{background:#111820;border:1px solid #1c2830;border-radius:8px;padding:14px 18px;margin:16px 0;}
  .note p{color:#8a9aaa;font-size:13px;margin:0;line-height:1.6;}
  .btn{display:inline-block;padding:12px 28px;background:#c4df9a;color:#08100a;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin-top:8px;}
  .btn-outline{display:inline-block;padding:10px 24px;background:transparent;color:#c4df9a;border:1px solid #c4df9a;border-radius:8px;text-decoration:none;font-size:14px;margin-top:8px;margin-left:10px;}
  .divider{border:none;border-top:1px solid #1c2830;margin:20px 0;}
  .product-row{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid #1a2430;}
  .product-row:last-child{border-bottom:none;}
  .product-info{flex:1;}
  .product-name{color:#dde5ec;font-size:14px;font-weight:600;}
  .product-meta{color:#6a7a8a;font-size:12px;margin-top:2px;}
  .product-price{color:#c4df9a;font-size:14px;font-weight:700;white-space:nowrap;}
  .footer{padding:16px 36px;border-top:1px solid #1c2830;font-size:12px;color:#4a5a6a;text-align:center;}
  strong.hl{color:#dde5ec;}
  strong.ac{color:#c4df9a;}
</style></head><body>
<div class="wrap">
  <div class="header"><span class="logo">RadiusX</span></div>
  <div class="body">${content}</div>
  <div class="footer">RadiusX &mdash; Your neighbourhood marketplace &nbsp;|&nbsp; This is an automated email. Please do not reply directly.</div>
</div></body></html>`;
}

/* ================================================================
   1. WELCOME — on register
   ================================================================ */
async function sendWelcome(user) {
  const html = shell(`
    <h2>Welcome to RadiusX! &#128075;</h2>
    <p>Hi <strong class="hl">${user.name}</strong>,</p>
    <p>Your account has been created successfully. You can now discover the best local deals around you, track orders, and manage your profile.</p>
    <div class="note"><p>
      <strong>Email:</strong> ${user.email}<br>
      <strong>Joined:</strong> ${new Date().toLocaleDateString("en-IN", {day:"2-digit",month:"long",year:"numeric"})}
    </p></div>
    <a href="${process.env.CLIENT_URL || ""}/index.html" class="btn">Start Shopping</a>
  `);
  await send({ to: user.email, subject: "Welcome to RadiusX!", html });
}

/* ================================================================
   2. CART ABANDONMENT — item added but not purchased in 10 minutes
   ================================================================ */
async function sendCartAbandonment(user, cartItems) {
  if (!cartItems || !cartItems.length) return;

  const total = cartItems.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const itemsHTML = cartItems.slice(0, 3).map(i => `
    <div class="product-row">
      <div class="product-info">
        <div class="product-name">${escHtml(i.name)}</div>
        <div class="product-meta">Qty: ${i.qty || 1} &nbsp;&middot;&nbsp; ${escHtml(i.category || "")}</div>
      </div>
      <div class="product-price">&#8377;${(i.price * (i.qty || 1)).toLocaleString()}</div>
    </div>`).join("");

  const moreNote = cartItems.length > 3
    ? `<p style="color:#6a7a8a;font-size:13px;margin-top:8px">...and ${cartItems.length - 3} more item${cartItems.length - 3 > 1 ? "s" : ""}</p>`
    : "";

  const html = shell(`
    <h2>You left something behind &#128722;</h2>
    <span class="badge info">Cart Reminder</span>
    <p>Hi <strong class="hl">${user.name}</strong>,</p>
    <p>You added items to your cart but didn't complete your purchase. Your items are still waiting!</p>
    <div class="note">${itemsHTML}${moreNote}</div>
    <p>Total: <strong class="ac">&#8377;${total.toLocaleString()}</strong></p>
    <a href="${process.env.CLIENT_URL || ""}/cart.html" class="btn">Complete Purchase</a>
    <a href="${process.env.CLIENT_URL || ""}/index.html" class="btn-outline">Continue Shopping</a>
    <hr class="divider">
    <p style="font-size:12px;color:#4a5a6a">If you've already completed your purchase, please ignore this email.</p>
  `);
  await send({ to: user.email, subject: "You left something in your cart — RadiusX", html });
}

/* ================================================================
   3. ORDER PLACED — on checkout
   ================================================================ */
async function sendOrderPlaced(user, order) {
  const items  = order.items || [];
  const total  = items.reduce((s, i) => s + i.price * i.qty, 0) + (order.deliveryCharge || 0) - (order.couponDiscount || 0);
  const itemsHTML = items.map(i => `
    <div class="product-row">
      <div class="product-info">
        <div class="product-name">${escHtml(i.name)}</div>
        <div class="product-meta">Qty: ${i.qty}</div>
      </div>
      <div class="product-price">&#8377;${(i.price * i.qty).toLocaleString()}</div>
    </div>`).join("");

  const html = shell(`
    <h2>Order Confirmed! &#127881;</h2>
    <span class="badge approved">Order Placed</span>
    <p>Hi <strong class="hl">${user.name}</strong>,</p>
    <p>Your order has been placed successfully. We'll notify you when it's shipped.</p>
    <div class="note">
      <p><strong>Order ID:</strong> ${order._id || order.id}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString("en-IN", {day:"2-digit",month:"long",year:"numeric"})}</p>
    </div>
    <div style="margin:16px 0">${itemsHTML}</div>
    <div class="note">
      <p><strong>Total Paid:</strong> <strong class="ac">&#8377;${total.toLocaleString()}</strong></p>
      ${order.deliveryCharge ? `<p><strong>Delivery:</strong> &#8377;${order.deliveryCharge}</p>` : "<p><strong>Delivery:</strong> FREE</p>"}
      ${order.couponDiscount ? `<p><strong>Coupon Discount:</strong> &#8722;&#8377;${order.couponDiscount}</p>` : ""}
    </div>
    <a href="${process.env.CLIENT_URL || ""}/orders.html" class="btn">Track Order</a>
  `);
  await send({ to: user.email, subject: `Order Confirmed — ${order._id || order.id} | RadiusX`, html });
}

/* ================================================================
   4. ORDER STATUS UPDATE — when seller/admin updates status
   ================================================================ */
async function sendOrderStatusUpdate(user, order) {
  const statusMessages = {
    processing: { badge: "pending",  text: "Your order is being processed",         icon: "&#9881;" },
    shipped:    { badge: "info",     text: "Your order is on its way!",             icon: "&#128666;" },
    delivered:  { badge: "approved", text: "Your order has been delivered",         icon: "&#127881;" },
    cancelled:  { badge: "rejected", text: "Your order has been cancelled",         icon: "&#10060;" },
    returned:   { badge: "pending",  text: "Your return request is being processed", icon: "&#8635;" },
  };

  const info = statusMessages[order.status] || { badge: "info", text: "Order update", icon: "&#128203;" };

  const html = shell(`
    <h2>${info.icon} Order Update</h2>
    <span class="badge ${info.badge}">${order.status.toUpperCase()}</span>
    <p>Hi <strong class="hl">${user.name}</strong>,</p>
    <p>${info.text}.</p>
    <div class="note">
      <p><strong>Order ID:</strong> ${order._id || order.id}</p>
      <p><strong>Status:</strong> <strong class="ac">${order.status}</strong></p>
      ${order.status === "shipped" && order.trackingId ? `<p><strong>Tracking ID:</strong> ${order.trackingId}</p>` : ""}
    </div>
    <a href="${process.env.CLIENT_URL || ""}/orders.html" class="btn">View Order</a>
  `);
  await send({ to: user.email, subject: `Order ${order.status} — ${order._id || order.id} | RadiusX`, html });
}

/* ================================================================
   5. PASSWORD CHANGED — security alert
   ================================================================ */
async function sendPasswordChanged(user) {
  const html = shell(`
    <h2>Password Changed &#128274;</h2>
    <span class="badge info">Security Alert</span>
    <p>Hi <strong class="hl">${user.name}</strong>,</p>
    <p>Your RadiusX account password was changed successfully on <strong class="ac">${new Date().toLocaleString("en-IN")}</strong>.</p>
    <p>All other active sessions have been logged out for your security.</p>
    <div class="note"><p>If you did not make this change, your account may be compromised. Please contact support immediately.</p></div>
    <a href="${process.env.CLIENT_URL || ""}/help.html" class="btn">Contact Support</a>
  `);
  await send({ to: user.email, subject: "Your RadiusX password was changed", html });
}

/* ================================================================
   6. SELLER APPLICATION RECEIVED
   ================================================================ */
async function sendSellerReceived(seller) {
  const html = shell(`
    <h2>Application Received!</h2>
    <span class="badge pending">Under Review</span>
    <p>Hi <strong class="hl">${seller.ownerName}</strong>,</p>
    <p>We've received your seller application for <strong class="hl">${seller.storeName}</strong>. Our team will review your documents within <strong class="ac">24&ndash;48 hours</strong>.</p>
    <div class="note"><p>
      Application ID: <strong>${seller._id}</strong><br>
      Business: ${escHtml(seller.bizName)}<br>
      Category: ${escHtml(seller.category)}
    </p></div>
    <p>We'll email you once a decision is made.</p>
    <a href="${process.env.CLIENT_URL || ""}" class="btn">Visit RadiusX</a>
  `);
  await send({ to: seller.email, subject: "RadiusX — Seller Application Received", html });
}

/* ================================================================
   7. SELLER APPROVED
   ================================================================ */
async function sendSellerApproved(seller) {
  const html = shell(`
    <h2>Your store is live! &#127881;</h2>
    <span class="badge approved">Approved</span>
    <p>Hi <strong class="hl">${seller.ownerName}</strong>,</p>
    <p>Congratulations! Your store <strong class="ac">${escHtml(seller.storeName)}</strong> has been approved and is now live on RadiusX.</p>
    <p>Log in with your registered email to access your Seller Dashboard and start listing products.</p>
    <a href="${process.env.CLIENT_URL || ""}/login.html?tab=signin" class="btn">Go to Dashboard</a>
  `);
  await send({ to: seller.email, subject: "RadiusX — Your store has been approved!", html });
}

/* ================================================================
   8. SELLER REJECTED
   ================================================================ */
async function sendSellerRejected(seller, reason) {
  const html = shell(`
    <h2>Application Update</h2>
    <span class="badge rejected">Not Approved</span>
    <p>Hi <strong class="hl">${seller.ownerName}</strong>,</p>
    <p>Your seller application for <strong class="hl">${escHtml(seller.storeName)}</strong> was not approved at this time.</p>
    <div class="note"><p><strong style="color:#ff9090">Reason:</strong> ${escHtml(reason || "Documents could not be verified")}</p></div>
    <p>You may fix the issue and apply again. Contact support if you believe this is a mistake.</p>
    <a href="${process.env.CLIENT_URL || ""}/login.html?tab=seller" class="btn">Apply Again</a>
  `);
  await send({ to: seller.email, subject: "RadiusX — Seller Application Update", html });
}

/* ================================================================
   Internal send helper
   ================================================================ */
async function send({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[Email] SMTP not configured — skipping email to", to);
    return;
  }
  try {
    const info = await getTransporter().sendMail({
      from:    process.env.SMTP_FROM || process.env.SMTP_USER,
      to, subject, html,
    });
    console.log("[Email] Sent to", to, "—", info.messageId);
  } catch (err) {
    console.error("[Email] Failed to send to", to, "—", err.message);
  }
}

function escHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

module.exports = {
  sendWelcome,
  sendCartAbandonment,
  sendOrderPlaced,
  sendOrderStatusUpdate,
  sendPasswordChanged,
  sendSellerReceived,
  sendSellerApproved,
  sendSellerRejected,
};