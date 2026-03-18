const jwt    = require("jsonwebtoken");
const { isBlocked } = require("../config/redis");

async function verifyToken(req, res, next) {
  try {
    // Accept token from Authorization header OR cookie
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Access token required" });
    }

    // Verify signature + expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (e) {
      if (e.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Access token expired", code: "TOKEN_EXPIRED" });
      }
      return res.status(401).json({ success: false, message: "Invalid access token" });
    }

    // Check Redis blocklist (catches logged-out tokens)
    if (decoded.jti && await isBlocked(decoded.jti)) {
      return res.status(401).json({ success: false, message: "Token has been revoked" });
    }

    req.user = decoded; // { id, email, role, jti, iat, exp }
    next();
  } catch (err) {
    console.error("[auth middleware]", err.message);
    res.status(500).json({ success: false, message: "Auth error" });
  }
}

module.exports = verifyToken;