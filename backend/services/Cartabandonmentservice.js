/* ================================================================
   services/cartAbandonmentService.js
   Tracks cart activity per user and sends a reminder email
   10 minutes after the last cart update if no order was placed.

   Usage:
     const cart = require("./cartAbandonmentService");
     cart.track(user, cartItems);   // call on every cart update
     cart.cancel(userId);           // call when order is placed
   ================================================================ */

const { sendCartAbandonment } = require("./notifyService");

/* Map of userId -> timeout handle */
const timers = new Map();

const DELAY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Start or reset the abandonment timer for a user.
 * Call this every time the user updates their cart.
 */
function track(user, cartItems) {
  if (!user || !user.email || !cartItems || !cartItems.length) return;

  /* Cancel any existing timer for this user */
  cancel(user._id || user.id);

  const userId = String(user._id || user.id);

  const handle = setTimeout(async () => {
    timers.delete(userId);
    try {
      console.log("[CartAbandonment] Sending reminder to", user.email);
      await sendCartAbandonment(user, cartItems);
    } catch (err) {
      console.error("[CartAbandonment] Email failed:", err.message);
    }
  }, DELAY_MS);

  timers.set(userId, handle);
  console.log("[CartAbandonment] Timer set for", user.email, "— fires in 10 min");
}

/**
 * Cancel the timer (user placed an order or cleared cart).
 */
function cancel(userId) {
  const id = String(userId);
  if (timers.has(id)) {
    clearTimeout(timers.get(id));
    timers.delete(id);
    console.log("[CartAbandonment] Timer cancelled for user", id);
  }
}

module.exports = { track, cancel };