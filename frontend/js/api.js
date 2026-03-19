/* ================================================================
   RadiusX -- api.js
   Place at: frontend/js/api.js
   Include before login.js, main.js, and all other JS files.
   ================================================================ */

const API_BASE = "http://localhost:5000";
// For local development change to: http://localhost:5000

const api = (() => {
  let _accessToken = null;
  let _refreshing  = null;

  function setToken(t)  { _accessToken = t; }
  function getToken()   { return _accessToken; }
  function clearToken() { _accessToken = null; }

  // Core fetch wrapper with auto token refresh
  async function request(method, path, body, opts) {
    opts = opts || {};
    var headers = { "Content-Type": "application/json" };
    if (_accessToken) headers["Authorization"] = "Bearer " + _accessToken;

    var res = await fetch(API_BASE + path, {
      method:      method,
      headers:     headers,
      credentials: "include",
      body:        body ? JSON.stringify(body) : undefined,
    });

    // Auto refresh if access token expired
    if (res.status === 401 && !opts._retry) {
      var json = await res.json().catch(function() { return {}; });
      if (json.code === "TOKEN_EXPIRED") {
        var refreshed = await silentRefresh();
        if (refreshed) {
          opts._retry = true;
          return request(method, path, body, opts);
        }
      }
      clearToken();
      if (!opts.noRedirect && window.location.pathname.indexOf("login") === -1) {
        window.location.href = "/RadiusX/frontend/login.html";
      }
      return { success: false, message: (json && json.message) || "Unauthorized" };
    }

    return res.json().catch(function() {
      return { success: false, message: "Invalid server response" };
    });
  }

  // Silent refresh -- called automatically when access token expires
  async function silentRefresh() {
    if (_refreshing) return _refreshing;
    _refreshing = (async function() {
      try {
        var res = await fetch(API_BASE + "/auth/refresh", {
          method:      "POST",
          credentials: "include",
          headers:     { "Content-Type": "application/json" },
        });
        var data = await res.json();
        if (data.success && data.accessToken) {
          setToken(data.accessToken);
          return true;
        }
        return false;
      } catch (e) {
        return false;
      } finally {
        _refreshing = null;
      }
    })();
    return _refreshing;
  }

  // HTTP helpers
  function get(path, opts)         { return request("GET",    path, null, opts); }
  function post(path, body, opts)  { return request("POST",   path, body, opts); }
  function put(path, body, opts)   { return request("PUT",    path, body, opts); }
  function patch(path, body, opts) { return request("PATCH",  path, body, opts); }
  function del(path, opts)         { return request("DELETE", path, null, opts); }

  // Multipart upload for product images
  async function upload(path, formData) {
    var headers = {};
    if (_accessToken) headers["Authorization"] = "Bearer " + _accessToken;
    var res = await fetch(API_BASE + path, {
      method:      "POST",
      headers:     headers,
      credentials: "include",
      body:        formData,
    });
    return res.json().catch(function() {
      return { success: false, message: "Upload failed" };
    });
  }

  // Auth shortcuts
  async function login(identifier, password) {
    var data = await post("/auth/login", { identifier: identifier, password: password });
    if (data.success && data.accessToken) setToken(data.accessToken);
    return data;
  }

  async function register(payload) {
    var data = await post("/auth/register", payload);
    if (data.success && data.accessToken) setToken(data.accessToken);
    return data;
  }

  async function logout() {
    await post("/auth/logout");
    clearToken();
  }

  // Call on every page load to restore session from refresh cookie
  async function init() {
    var refreshed = await silentRefresh();
    if (!refreshed) clearToken();
    return refreshed;
  }

  return {
    get:        get,
    post:       post,
    put:        put,
    patch:      patch,
    del:        del,
    upload:     upload,
    login:      login,
    register:   register,
    logout:     logout,
    init:       init,
    setToken:   setToken,
    getToken:   getToken,
    clearToken: clearToken,
    BASE:       API_BASE,
  };
})();

window.api = api;