/* ================================================================
   RadiusX -- api.js
   Place at: frontend/js/api.js
   Include before ALL other JS files on every page.
   ================================================================ */

const API_BASE = "http://localhost:5000";

const api = (() => {
  /* Access token lives in memory AND sessionStorage.
     sessionStorage persists across page navigations within the same
     browser tab but is cleared when the tab is closed — perfect for JWT. */
  let _accessToken = sessionStorage.getItem("rx_access_token") || null;
  let _refreshing  = null;

  function setToken(t) {
    _accessToken = t;
    if (t) sessionStorage.setItem("rx_access_token", t);
    else   sessionStorage.removeItem("rx_access_token");
  }

  /* ── User cache — stored in sessionStorage so it survives page navigation
     without requiring an extra /auth/me network call every page load.
     Cleared on logout or when refresh fails.                              ── */
  var _user = null;
  try {
    var _cached = sessionStorage.getItem("rx_session_user");
    if (_cached) _user = JSON.parse(_cached);
  } catch(e) {}

  function setUser(u) {
    _user = u;
    if (u) sessionStorage.setItem("rx_session_user", JSON.stringify(u));
    else   sessionStorage.removeItem("rx_session_user");
  }

  function getUser() { return _user; }

  function getToken()   { return _accessToken; }

  function clearToken() {
    _accessToken = null;
    sessionStorage.removeItem("rx_access_token");
    setUser(null);
  }

  /* ── Core fetch wrapper ───────────────────────────────────── */
  async function request(method, path, body, opts) {
    opts = opts || {};
    var headers = { "Content-Type": "application/json" };
    if (_accessToken) headers["Authorization"] = "Bearer " + _accessToken;

    var res = await fetch(API_BASE + path, {
      method,
      headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    /* Auto-refresh if access token expired (401 + TOKEN_EXPIRED code) */
    if (res.status === 401 && !opts._retry) {
      var json = await res.json().catch(() => ({}));

      if (json.code === "TOKEN_EXPIRED" || json.message === "jwt expired") {
        var refreshed = await silentRefresh();
        if (refreshed) {
          opts._retry = true;
          return request(method, path, body, opts);
        }
      }

      /* Only clear token and redirect if this was NOT a silent/optional check */
      if (!opts.noRedirect) {
        clearToken();
        if (window.location.pathname.indexOf("login") === -1) {
          var p    = window.location.pathname;
          var base = p.substring(0, p.indexOf("/frontend/") + "/frontend".length) || "/frontend";
          window.location.href = base + "/login.html";
        }
      }
      return { success: false, message: (json && json.message) || "Unauthorized" };
    }

    return res.json().catch(() => ({ success: false, message: "Invalid server response" }));
  }

  /* ── Silent refresh ───────────────────────────────────────── */
  async function silentRefresh() {
    /* If a refresh is already in flight, wait for it instead of firing another */
    if (_refreshing) return _refreshing;

    _refreshing = (async () => {
      try {
        var res  = await fetch(API_BASE + "/auth/refresh", {
          method:      "POST",
          credentials: "include",
          headers:     { "Content-Type": "application/json" },
        });
        var data = await res.json();
        if (data.success && data.accessToken) {
          setToken(data.accessToken);
          return true;
        }
        clearToken();
        return false;
      } catch (e) {
        return false;
      } finally {
        _refreshing = null;
      }
    })();

    return _refreshing;
  }

  /* ── HTTP helpers ─────────────────────────────────────────── */
  function get(path, opts)         { return request("GET",    path, null, opts); }
  function post(path, body, opts)  { return request("POST",   path, body, opts); }
  function put(path, body, opts)   { return request("PUT",    path, body, opts); }
  function patch(path, body, opts) { return request("PATCH",  path, body, opts); }
  function del(path, opts)         { return request("DELETE", path, null, opts); }

  /* ── Multipart upload ─────────────────────────────────────── */
  async function upload(path, formData) {
    var headers = {};
    if (_accessToken) headers["Authorization"] = "Bearer " + _accessToken;
    var res = await fetch(API_BASE + path, {
      method:      "POST",
      headers,
      credentials: "include",
      body:        formData,
    });
    return res.json().catch(() => ({ success: false, message: "Upload failed" }));
  }

  /* ── Auth shortcuts ───────────────────────────────────────── */
  async function login(identifier, password) {
    var data = await post("/auth/login", { identifier, password });
    if (data.success && data.accessToken) {
      setToken(data.accessToken);
      if (data.user) setUser(data.user);
    }
    return data;
  }

  async function register(payload) {
    var data = await post("/auth/register", payload);
    if (data.success && data.accessToken) {
      setToken(data.accessToken);
      if (data.user) setUser(data.user);
    }
    return data;
  }

  async function logout() {
    await post("/auth/logout");
    clearToken();
  }

  /* ── init() — called on every page load ──────────────────────
     1. If we already have a valid token in sessionStorage, use it directly
        without hitting the backend — this is the key fix for rapid navigation.
     2. If no token, try silent refresh from the httpOnly cookie.
     3. If both fail, user is not logged in.
  ─────────────────────────────────────────────────────────────── */
  async function init() {
    /* Fast path: token already in sessionStorage — verify it's not expired */
    if (_accessToken) {
      try {
        var parts   = _accessToken.split(".");
        var payload = JSON.parse(atob(parts[1]));
        var now     = Math.floor(Date.now() / 1000);
        /* If token has more than 60 seconds left, use it without a network call */
        if (payload.exp && payload.exp - now > 60) {
          return true;
        }
      } catch (e) {
        /* Malformed token — fall through to refresh */
      }
    }

    /* Slow path: no token or token almost expired — hit /auth/refresh */
    var refreshed = await silentRefresh();
    if (!refreshed) clearToken();
    return refreshed;
  }

  return {
    get, post, put, patch, del,
    upload, login, register, logout, init,
    setToken, getToken, clearToken,
    setUser, getUser,
    BASE: API_BASE,
  };
})();

window.api = api;