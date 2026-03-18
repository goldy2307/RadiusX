const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || "smtp.gmail.com",
    port:   parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false, // STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

// -- Shared HTML shell -----------------------------------------
function shell(content) {
  return `
<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#0a0e12;font-family:'Helvetica Neue',Arial,sans-serif;}
  .wrap{max-width:540px;margin:40px auto;background:#0e1216;border:1px solid #232f3a;border-radius:12px;overflow:hidden;}
  .header{padding:28px 36px 20px;background:#0b1117;border-bottom:1px solid #1c2830;}
  .header img{height:36px;}
  .body{padding:32px 36px;}
  h2{color:#c4df9a;font-size:22px;margin:0 0 14px;}
  p{color:#b0bac4;font-size:15px;line-height:1.7;margin:0 0 14px;}
  .badge{display:inline-block;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:18px;}
  .badge.approved{background:rgba(100,215,130,0.12);color:#64d782;border:1px solid rgba(100,215,130,0.25);}
  .badge.rejected{background:rgba(255,95,95,0.12);color:#ff6060;border:1px solid rgba(255,95,95,0.25);}
  .badge.pending {background:rgba(255,195,60,0.12); color:#ffc33c;border:1px solid rgba(255,195,60,0.25);}
  .note{background:#111820;border:1px solid #1c2830;border-radius:8px;padding:14px 18px;margin:16px 0;}
  .note p{color:#8a9aaa;font-size:13px;margin:0;}
  .btn{display:inline-block;padding:12px 28px;background:#c4df9a;color:#08100a;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin-top:8px;}
  .footer{padding:18px 36px;border-top:1px solid #1c2830;font-size:12px;color:#4a5a6a;text-align:center;}
</style></head><body>
<div class="wrap">
  <div class="header"><strong style="color:#c4df9a;font-size:20px;font-weight:700;">RadiusX</strong></div>
  <div class="body">${content}</div>
  <div class="footer">RadiusX &mdash; Your neighbourhood marketplace &nbsp;|&nbsp; This is an automated email, please do not reply.</div>
</div></body></html>`;
}

// -- Seller application received -------------------------------
async function sendSellerReceived(seller) {
  const html = shell(`
    <h2>Application Received!</h2>
    <span class="badge pending">Under Review</span>
    <p>Hi <strong style="color:#dde5ec">${seller.ownerName}</strong>,</p>
    <p>We've received your seller application for <strong style="color:#dde5ec">${seller.storeName}</strong>. Our team will review your documents within <strong style="color:#c4df9a">24&ndash;48 hours</strong>.</p>
    <div class="note"><p>Application ID: <strong>${seller._id}</strong><br>Business: ${seller.bizName}<br>Category: ${seller.category}</p></div>
    <p>We'll send you another email once a decision is made.</p>
    <a href="${process.env.CLIENT_URL}" class="btn">Visit RadiusX</a>
  `);

  await send({ to: seller.email, subject: "RadiusX -- Seller Application Received", html });
}

// -- Seller approved -------------------------------------------
async function sendSellerApproved(seller) {
  const html = shell(`
    <h2>Your store is live! &#127881;</h2>
    <span class="badge approved">Approved</span>
    <p>Hi <strong style="color:#dde5ec">${seller.ownerName}</strong>,</p>
    <p>Congratulations! Your store <strong style="color:#c4df9a">${seller.storeName}</strong> has been approved and is now live on RadiusX.</p>
    <p>You can now log in with your registered email and start adding products.</p>
    <a href="${process.env.CLIENT_URL}/login.html?tab=signin" class="btn">Log in to Dashboard</a>
  `);

  await send({ to: seller.email, subject: "RadiusX -- Your store has been approved!", html });
}

// -- Seller rejected -------------------------------------------
async function sendSellerRejected(seller, reason) {
  const html = shell(`
    <h2>Application Update</h2>
    <span class="badge rejected">Not Approved</span>
    <p>Hi <strong style="color:#dde5ec">${seller.ownerName}</strong>,</p>
    <p>Unfortunately your seller application for <strong style="color:#dde5ec">${seller.storeName}</strong> was not approved at this time.</p>
    <div class="note"><p><strong style="color:#ff9090">Reason:</strong> ${reason || "Documents could not be verified"}</p></div>
    <p>You're welcome to correct the issue and apply again. If you believe this is a mistake, please contact our support team.</p>
    <a href="${process.env.CLIENT_URL}" class="btn">Contact Support</a>
  `);

  await send({ to: seller.email, subject: "RadiusX -- Seller Application Update", html });
}

// -- Welcome email after buyer registration --------------------
async function sendWelcome(user) {
  const html = shell(`
    <h2>Welcome to RadiusX! &#128075;</h2>
    <p>Hi <strong style="color:#dde5ec">${user.name}</strong>,</p>
    <p>Your account has been created successfully. Discover the best local deals around you.</p>
    <a href="${process.env.CLIENT_URL}" class="btn">Start Shopping</a>
  `);

  await send({ to: user.email, subject: "Welcome to RadiusX!", html });
}

// -- Internal send helper (graceful failure -- never crash the request) --
async function send({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[Email] SMTP not configured -- skipping email to", to);
    return;
  }
  try {
    const info = await getTransporter().sendMail({
      from:    process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    console.log("[Email] Sent to", to, "--", info.messageId);
  } catch (err) {
    console.error("[Email] Failed to send to", to, "--", err.message);
  }
}

module.exports = { sendSellerReceived, sendSellerApproved, sendSellerRejected, sendWelcome };