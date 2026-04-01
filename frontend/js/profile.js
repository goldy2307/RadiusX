/* ====================================================
   RadiusX — profile.js
   Auth-gated. All localStorage namespaced by userId
   so switching accounts never leaks data.
   ==================================================== */

var PRODUCTS = [
  {id:1,name:"Laptop",     price:45000,originalPrice:52000,category:"Electronics",image:"assets/products/laptop.jpg",    rating:4.5,reviews:128},
  {id:2,name:"Headphones", price:1200, originalPrice:1800, category:"Electronics",image:"assets/products/headphones.jpg",rating:4.2,reviews:85},
  {id:3,name:"Shoes",      price:900,  originalPrice:1400, category:"Fashion",    image:"assets/products/shoes.jpg",     rating:4.0,reviews:63},
  {id:4,name:"Tshirt",     price:400,  originalPrice:600,  category:"Fashion",    image:"assets/products/tshirt.jpg",    rating:3.8,reviews:42},
  {id:5,name:"Chair",      price:1500, originalPrice:2000, category:"Home",       image:"assets/products/chair.jpg",     rating:4.3,reviews:34},
  {id:6,name:"Lamp",       price:700,  originalPrice:950,  category:"Home",       image:"assets/products/lamp.jpg",      rating:4.1,reviews:27}
];

var NOTIF_PREFS = [
  {id:"np_order",   title:"Order Updates",       sub:"Delivery, dispatch & status changes", default:true},
  {id:"np_offers",  title:"Offers & Deals",       sub:"Exclusive coupons and flash sales",   default:true},
  {id:"np_account", title:"Account Activity",     sub:"Login alerts and profile changes",    default:true},
  {id:"np_seller",  title:"Seller Notifications", sub:"New seller offers near you",          default:false},
  {id:"np_sms",     title:"SMS Notifications",    sub:"Receive updates via SMS",             default:false}
];

var STATUS_COLORS = {
  delivered:"ros-delivered", shipped:"ros-shipped",
  processing:"ros-processing", cancelled:"ros-cancelled", returned:"ros-returned"
};

/* ── User state ── */
var user       = null;
var addresses  = [];
var notifPrefs = {};
var notifList  = [];

/* ── User-scoped localStorage key ── */
function ukey(k) {
  /* Prefix every key with the user's _id so switching accounts never leaks data */
  var uid = user && (user._id || user.id);
  return uid ? ("u_" + uid + "_" + k) : ("guest_" + k);
}


/* ====================================================
   INIT
   ==================================================== */
window.onload = async function () {
  var loggedIn = await api.init();
  if (!loggedIn) { window.location.href = "login.html?tab=signin"; return; }

  var res = await api.get("/auth/me");
  if (!res.success) { window.location.href = "login.html?tab=signin"; return; }

  user = res.user;

  /* Load localStorage data scoped to THIS user */
  addresses  = getAddresses();
  notifPrefs = getNotifPrefs();
  notifList  = getNotifList();

  applyUserToUI();
  renderRecentOrders();
  renderWishlist();
  renderNotifPrefs();
  renderNotifFeed();
  updateNotifDot();
  renderAddresses();
  loadProfileForm();
};


/* ====================================================
   PANEL SWITCHING
   ==================================================== */
function switchPanel(btnEl, panelId) {
  document.querySelectorAll(".nav-item").forEach(function(b) { b.classList.remove("active"); });
  document.querySelectorAll(".panel").forEach(function(p) { p.classList.remove("active"); });
  if (btnEl) btnEl.classList.add("active");
  var panel = document.getElementById("panel-" + panelId);
  if (panel) {
    panel.classList.add("active");
    panel.style.animation = "none";
    panel.offsetHeight;
    panel.style.animation = "";
  }
}


/* ====================================================
   USER → UI
   ==================================================== */
function applyUserToUI() {
  if (!user) return;
  var initials = (user.name || "R").split(" ").map(function(w){return w[0];}).join("").toUpperCase().slice(0,2);
  var tav = document.getElementById("topbarAvatar");
  if (tav) tav.innerHTML = user.avatar ? '<img src="'+user.avatar+'" alt="avatar">' : (initials[0]||"R");
  setAvatarEl("sidebarAvatar", user.avatar, initials);
  var sn = document.getElementById("sidebarName");  if (sn) sn.innerText = user.name  || "User";
  var se = document.getElementById("sidebarEmail"); if (se) se.innerText = user.email || "";
  var dg = document.getElementById("dashGreetName"); if (dg) dg.innerText = (user.name||"").split(" ")[0]||"there";
  setAvatarEl("profileAvCircle", user.avatar, initials);
  var pan = document.getElementById("profileAvName"); if (pan) pan.innerText = user.name||"User";
}

function setAvatarEl(id, avatarSrc, initials) {
  var el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = avatarSrc ? '<img src="'+avatarSrc+'" alt="avatar">' : (initials[0]||"R");
}


/* ====================================================
   AVATAR UPLOAD
   ==================================================== */
function handleAvatarUpload(input) {
  var file = input.files[0]; if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    user.avatar = e.target.result;
    applyUserToUI();
    showToast("Photo updated!");
  };
  reader.readAsDataURL(file);
}


/* ====================================================
   PROFILE FORM
   ==================================================== */
function loadProfileForm() {
  if (!user) return;
  var fields = {pfName:user.name,pfEmail:user.email,pfMobile:user.mobile,
    pfDob:user.dob,pfGender:user.gender,pfPincode:user.pincode,pfAddress:user.address};
  Object.keys(fields).forEach(function(id){
    var el=document.getElementById(id); if(el) el.value=fields[id]||"";
  });
  var emailEl = document.getElementById("pfEmail");
  if (emailEl) emailEl.setAttribute("readonly","true");
  if (user.pincode && user.pincode.length===6) lookupPin(user.pincode,"pfPinInfo");
}

async function saveProfile() {
  if (!user) return;
  var name    = (document.getElementById("pfName")||{}).value||"";
  var mobile  = (document.getElementById("pfMobile")||{}).value||"";
  var dob     = (document.getElementById("pfDob")||{}).value||"";
  var gender  = (document.getElementById("pfGender")||{}).value||"";
  var pincode = (document.getElementById("pfPincode")||{}).value||"";
  var address = (document.getElementById("pfAddress")||{}).value||"";
  if (!name.trim()) { showToast("Name cannot be empty",true); return; }

  var saveBtn = document.querySelector(".save-profile-btn");
  if (saveBtn) { saveBtn.disabled=true; saveBtn.innerText="Saving..."; }

  var res = await api.put("/auth/profile",{
    name:name.trim(),mobile:mobile.trim(),dob:dob,gender:gender,
    pincode:pincode.trim(),address:address.trim()
  });
  if (saveBtn) { saveBtn.disabled=false; saveBtn.innerText="Save Changes"; }

  if (res && res.success) {
    user.name=name.trim(); user.mobile=mobile.trim(); user.dob=dob;
    user.gender=gender; user.pincode=pincode.trim(); user.address=address.trim();
    /* Update cached user so navbar reflects new name instantly */
    if (window.api && window.api.setUser) api.setUser(user);
    /* Sync the primary address to the shared address list used by home page */
    if (address.trim() && pincode.trim()) {
      syncPrimaryAddressToList(name.trim(), address.trim(), pincode.trim());
    }
    applyUserToUI();
    showToast("Profile saved successfully!");
  } else {
    showToast((res&&res.message)||"Save failed. Try again.",true);
  }
}


/* ====================================================
   PINCODE LOOKUP
   ==================================================== */
var pinTimers = {};
async function lookupPin(value, infoId) {
  var infoEl = document.getElementById(infoId); if (!infoEl) return;
  infoEl.innerText=""; if (value.length!==6||isNaN(value)) return;
  infoEl.innerText="Looking up...";
  clearTimeout(pinTimers[infoId]);
  pinTimers[infoId] = setTimeout(async function(){
    try {
      var res=await fetch("https://api.postalpincode.in/pincode/"+value);
      var data=await res.json();
      if (data[0].Status==="Success") {
        var po=data[0].PostOffice[0];
        infoEl.innerText="\uD83D\uDCCD "+po.District+", "+po.State;
        var cityField=document.getElementById("aCity");
        if (cityField&&!cityField.value) cityField.value=po.District;
      } else { infoEl.innerText="Pincode not found"; infoEl.style.color="var(--error)"; }
    } catch(e) { infoEl.innerText=""; }
  }, 500);
}


/* ====================================================
   ADDRESSES — namespaced localStorage
   ==================================================== */
function getAddresses() {
  var s=localStorage.getItem(ukey("addresses"));
  if (s) { try { return JSON.parse(s); } catch(e){} }
  return [];
}
function saveAddressesLocal(a) { localStorage.setItem(ukey("addresses"),JSON.stringify(a)); }

function renderAddresses() {
  var grid=document.getElementById("addressesGrid"); if (!grid) return;
  grid.innerHTML="";
  if (!addresses.length) {
    grid.innerHTML='<p style="color:var(--muted);font-size:13px">No saved addresses. Add one!</p>';
    return;
  }
  addresses.forEach(function(a,idx){
    var card=document.createElement("div");
    card.className="addr-card"+(a.isDefault?" addr-default":"");
    card.style.animationDelay=(idx*0.07)+"s";
    card.innerHTML=
      (a.isDefault?'<span class="addr-default-tag">\u2713 Default</span>':'')+
      '<div class="addr-type-tag">'+esc(a.type)+'</div>'+
      '<div class="addr-name">'+esc(a.name)+'</div>'+
      '<div class="addr-mobile">+91 '+esc(a.mobile)+'</div>'+
      '<div class="addr-line">'+esc(a.line)+', '+esc(a.city)+' \u2014 '+esc(a.pin)+'</div>'+
      '<div class="addr-actions">'+
        '<button class="addr-btn edit-btn" onclick="editAddress('+a.id+')"><i class="fa-solid fa-pen"></i> Edit</button>'+
        '<button class="addr-btn del-btn" onclick="deleteAddress('+a.id+')"><i class="fa-regular fa-trash-can"></i> Remove</button>'+
      '</div>';
    grid.appendChild(card);
  });
}

var editingAddrId = null;
function openAddrModal(id) {
  editingAddrId=id||null;
  document.getElementById("addrModalTitle").innerText=id?"Edit Address":"Add New Address";
  document.getElementById("aPinInfo").innerText="";
  document.querySelectorAll(".atype").forEach(function(b){b.classList.remove("active");});
  var homeBtn=document.querySelector(".atype[data-t='Home']"); if(homeBtn) homeBtn.classList.add("active");
  if (id) {
    var a=addresses.find(function(x){return x.id===id;});
    if (a) {
      document.getElementById("aName").value=a.name;
      document.getElementById("aMobile").value=a.mobile;
      document.getElementById("aLine").value=a.line;
      document.getElementById("aPin").value=a.pin;
      document.getElementById("aCity").value=a.city;
      document.getElementById("aDefault").checked=a.isDefault;
      document.querySelectorAll(".atype").forEach(function(b){b.classList.toggle("active",b.dataset.t===a.type);});
    }
  } else {
    ["aName","aMobile","aLine","aPin","aCity"].forEach(function(id){document.getElementById(id).value="";});
    if (user) {
      var n=document.getElementById("aName"); if(n) n.value=user.name||"";
      var m=document.getElementById("aMobile"); if(m) m.value=user.mobile||"";
    }
    document.getElementById("aDefault").checked=false;
  }
  document.getElementById("addrModal").classList.add("open");
}
function editAddress(id) { openAddrModal(id); }
function closeAddrModal() { document.getElementById("addrModal").classList.remove("open"); }
function selectAddrType(btn) {
  document.querySelectorAll(".atype").forEach(function(b){b.classList.remove("active");});
  btn.classList.add("active");
}
function saveAddress() {
  var name=document.getElementById("aName").value.trim();
  var mobile=document.getElementById("aMobile").value.trim();
  var line=document.getElementById("aLine").value.trim();
  var pin=document.getElementById("aPin").value.trim();
  var city=document.getElementById("aCity").value.trim();
  var isDefault=document.getElementById("aDefault").checked;
  var activeBtn=document.querySelector(".atype.active");
  var type=activeBtn?activeBtn.dataset.t:"Home";
  if (!name||!mobile||!line||!pin) { showToast("Fill all required fields",true); return; }
  if (isDefault) addresses.forEach(function(a){a.isDefault=false;});
  if (editingAddrId) {
    var idx=addresses.findIndex(function(a){return a.id===editingAddrId;});
    if (idx!==-1) addresses[idx]=Object.assign({},addresses[idx],{type,name,mobile,line,pin,city,isDefault});
  } else {
    addresses.push({id:Date.now(),type,name,mobile,line,pin,city,isDefault});
  }
  saveAddressesLocal(addresses);
  renderAddresses(); closeAddrModal();
  showToast(editingAddrId?"Address updated!":"Address saved!"); editingAddrId=null;
}
function deleteAddress(id) {
  addresses=addresses.filter(function(a){return a.id!==id;});
  if (addresses.length&&!addresses.some(function(a){return a.isDefault;})) addresses[0].isDefault=true;
  saveAddressesLocal(addresses); renderAddresses(); showToast("Address removed");
}


/* ====================================================
   RECENT ORDERS — real data from backend
   ==================================================== */
async function renderRecentOrders() {
  var container=document.getElementById("recentOrders"); if (!container) return;
  container.innerHTML='<div style="color:var(--muted);font-size:13px;padding:10px 0">Loading...</div>';

  var res=await api.get("/orders?limit=4");
  if (!res.success||!res.orders||!res.orders.length) {
    container.innerHTML=
      '<div style="color:var(--muted);font-size:13px;padding:10px 0">'+
        'No orders yet. <a href="index.html" style="color:var(--accent)">Start shopping!</a>'+
      '</div>';
    return;
  }

  container.innerHTML="";
  res.orders.slice(0,4).forEach(function(o,idx){
    var date=new Date(o.createdAt||o.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
    var total=(o.items||[]).reduce(function(s,i){return s+i.price*i.qty;},0);
    var img=(o.items&&o.items[0]&&o.items[0].image)||"assets/products/demo.jpg";
    var name=(o.items||[]).map(function(i){return i.name;}).join(", ");
    var item=document.createElement("div");
    item.className="ro-item";
    item.style.animationDelay=(idx*0.07)+"s";
    item.innerHTML=
      '<img class="ro-img" src="'+img+'" onerror="this.src=\'assets/products/demo.jpg\'" alt="">'+
      '<div class="ro-info">'+
        '<div class="ro-name">'+esc(name)+'</div>'+
        '<div class="ro-date">'+date+'</div>'+
      '</div>'+
      '<span class="ro-status '+(STATUS_COLORS[o.status]||"")+'">'+esc(o.status)+'</span>'+
      '<span class="ro-amount">\u20B9'+total.toLocaleString()+'</span>';
    item.onclick=function(){ window.location.href="orders.html"; };
    container.appendChild(item);
  });
}


/* ====================================================
   WISHLIST — namespaced localStorage
   ==================================================== */
function getWishlist() {
  var s=localStorage.getItem(ukey("wishlist"));
  if (s) { try { return JSON.parse(s); } catch(e){} }
  return []; /* empty for new users — no demo data */
}
function saveWishlist(w) { localStorage.setItem(ukey("wishlist"),JSON.stringify(w)); }

function renderWishlist() {
  var grid=document.getElementById("wishlistGrid"); if (!grid) return;
  grid.innerHTML="";
  var wishlist=getWishlist();
  var items=PRODUCTS.filter(function(p){return wishlist.includes(p.id);});
  if (!items.length) {
    grid.innerHTML=
      '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--muted)">'+
        '<i class="fa-regular fa-heart" style="font-size:40px;margin-bottom:12px;display:block"></i>'+
        '<p style="font-size:14px">Your wishlist is empty.</p>'+
        '<a href="index.html" style="color:var(--accent);font-size:13px;margin-top:10px;display:inline-block">Shop Now \u2192</a>'+
      '</div>';
    return;
  }
  items.forEach(function(p,idx){
    var card=document.createElement("div");
    card.className="wl-card"; card.style.animationDelay=(idx*0.07)+"s";
    card.innerHTML=
      '<img src="'+p.image+'" onerror="this.src=\'assets/products/demo.jpg\'" alt="'+esc(p.name)+'">'+
      '<div class="wl-name">'+esc(p.name)+'</div>'+
      '<div><span class="wl-price">\u20B9'+p.price.toLocaleString()+'</span><span class="wl-orig">\u20B9'+p.originalPrice.toLocaleString()+'</span></div>'+
      '<div class="wl-actions">'+
        '<button class="wl-btn wl-add" onclick="addWishlistToCart('+p.id+',event)"><i class="fa-solid fa-basket-shopping"></i> Add to Cart</button>'+
        '<button class="wl-btn wl-rem" onclick="removeFromWishlist('+p.id+')"><i class="fa-regular fa-trash-can"></i></button>'+
      '</div>';
    card.onclick=function(){window.location.href="product.html?id="+p.id;};
    grid.appendChild(card);
  });
}
function addWishlistToCart(id,event) {
  event.stopPropagation();
  var cart=JSON.parse(localStorage.getItem(ukey("cart"))||"[]");
  var prod=PRODUCTS.find(function(p){return p.id===id;});
  if (!prod) return;
  var ex=cart.find(function(i){return i.id===id;});
  if (ex) { ex.qty++; } else { cart.push(Object.assign({},prod,{qty:1})); }
  localStorage.setItem(ukey("cart"),JSON.stringify(cart));
  showToast(prod.name+" added to cart!");
}
function removeFromWishlist(id) {
  var wl=getWishlist().filter(function(i){return i!==id;});
  saveWishlist(wl); renderWishlist(); showToast("Removed from wishlist");
}


/* ====================================================
   NOTIFICATIONS — namespaced localStorage
   ==================================================== */
function getNotifPrefs() {
  var s=localStorage.getItem(ukey("notif_prefs"));
  if (s) { try { return JSON.parse(s); } catch(e){} }
  var map={}; NOTIF_PREFS.forEach(function(p){map[p.id]=p.default;}); return map;
}
function saveNotifPrefs(m) { localStorage.setItem(ukey("notif_prefs"),JSON.stringify(m)); }

function getNotifList() {
  var s=localStorage.getItem(ukey("notifs"));
  if (s) { try { return JSON.parse(s); } catch(e){} }
  return []; /* no demo notifications for new users */
}
function saveNotifList(n) { localStorage.setItem(ukey("notifs"),JSON.stringify(n)); }

function renderNotifPrefs() {
  var container=document.getElementById("notifPrefList"); if (!container) return;
  container.innerHTML="";
  NOTIF_PREFS.forEach(function(pref){
    var on=notifPrefs[pref.id]!==undefined?notifPrefs[pref.id]:pref.default;
    var div=document.createElement("div"); div.className="notif-pref-item";
    div.innerHTML=
      '<div class="notif-pref-info">'+
        '<span class="notif-pref-title">'+pref.title+'</span>'+
        '<span class="notif-pref-sub">'+pref.sub+'</span>'+
      '</div>'+
      '<label class="tog">'+
        '<input type="checkbox" id="np_'+pref.id+'" '+(on?"checked":"")+' onchange="toggleNotifPref(\''+pref.id+'\',this.checked)">'+
        '<span class="tog-slider"></span>'+
      '</label>';
    container.appendChild(div);
  });
}
function toggleNotifPref(id,val) {
  notifPrefs[id]=val; saveNotifPrefs(notifPrefs);
  showToast(val?"Notifications enabled":"Notifications disabled");
}
function renderNotifFeed() {
  var container=document.getElementById("notifFeed"); if (!container) return;
  container.innerHTML="";
  if (!notifList.length) {
    container.innerHTML='<div style="text-align:center;padding:40px 20px;color:var(--muted);font-size:13px">No notifications yet.</div>';
    return;
  }
  notifList.forEach(function(n,idx){
    var div=document.createElement("div");
    div.className="notif-item"+(n.unread?" unread":"");
    div.style.animationDelay=(idx*0.06)+"s";
    div.innerHTML=
      '<div class="notif-icon-wrap '+(n.iconClass||"")+'"><i class="fa-solid '+(n.icon||"fa-bell")+'"></i></div>'+
      '<div class="notif-body">'+
        '<div class="notif-title-row">'+
          '<span class="notif-msg">'+esc(n.msg)+'</span>'+
          (n.unread?'<span class="notif-unread-dot"></span>':'')+
        '</div>'+
        '<div class="notif-sub">'+esc(n.sub||"")+'</div>'+
        '<div class="notif-time">'+esc(n.time||"")+'</div>'+
      '</div>';
    div.onclick=function(){n.unread=false;saveNotifList(notifList);renderNotifFeed();updateNotifDot();};
    container.appendChild(div);
  });
}
function markAllRead() {
  notifList.forEach(function(n){n.unread=false;});
  saveNotifList(notifList); renderNotifFeed(); updateNotifDot();
  showToast("All notifications marked as read");
}
function updateNotifDot() {
  var dot=document.getElementById("notifDot"); if (!dot) return;
  dot.style.display=notifList.some(function(n){return n.unread;})?"block":"none";
}


/* ====================================================
   SECURITY
   ==================================================== */
function togglePass(id,icon) {
  var input=document.getElementById(id); if (!input) return;
  if (input.type==="password") { input.type="text"; icon.classList.replace("fa-eye","fa-eye-slash"); }
  else { input.type="password"; icon.classList.replace("fa-eye-slash","fa-eye"); }
}
function secStrength(val) {
  var fill=document.getElementById("secStrFill");
  var label=document.getElementById("secStrLbl");
  if (!fill||!label) return;
  var score=0;
  if (val.length>=8) score++; if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++; if (/[^A-Za-z0-9]/.test(val)) score++;
  var w=["0%","25%","50%","75%","100%"],c=["transparent","rgb(255,80,80)","rgb(255,160,50)","rgb(196,223,154)","rgb(100,210,130)"],l=["","Weak","Fair","Good","Strong"];
  fill.style.width=w[score]; fill.style.background=c[score];
  label.innerText=l[score]; label.style.color=c[score];
}
async function changePassword() {
  var curr=document.getElementById("secCur").value;
  var nw=document.getElementById("secNew").value;
  var conf=document.getElementById("secConf").value;
  var err=document.getElementById("secErr");
  err.innerText="";
  if (!curr) { err.innerText="Enter your current password"; return; }
  if (nw.length<8) { err.innerText="Min 8 characters"; return; }
  if (nw!==conf) { err.innerText="Passwords do not match"; return; }
  var res=await api.post("/auth/change-password",{currentPassword:curr,newPassword:nw});
  if (res&&res.success) {
    ["secCur","secNew","secConf"].forEach(function(id){document.getElementById(id).value="";});
    document.getElementById("secStrFill").style.width="0%";
    document.getElementById("secStrLbl").innerText="";
    showToast("Password updated successfully!");
  } else {
    err.innerText=(res&&res.message)||"Failed. Check your current password.";
  }
}


/* ====================================================
   SELLER FORM
   ==================================================== */
function submitSellerForm() {
  var biz=document.getElementById("selBiz").value.trim();
  var cat=document.getElementById("selCat").value;
  if (!biz||!cat) { showToast("Fill in Business Name and Category",true); return; }
  showToast("Application submitted! We'll contact you within 48hrs");
  ["selBiz","selGst","selPin"].forEach(function(id){document.getElementById(id).value="";});
  document.getElementById("selCat").value="";
}


/* ====================================================
   SYNC PRIMARY ADDRESS → SHARED ADDRESS LIST
   Keeps home page location dropdown in sync with profile
   ==================================================== */
function syncPrimaryAddressToList(name, addressLine, pincode) {
  var uid = user && (user._id || user.id);
  if (!uid) return;
  var key  = "u_" + uid + "_addresses";
  var list = [];
  try { list = JSON.parse(localStorage.getItem(key) || "[]"); } catch(e) {}

  /* Find existing "primary" entry and update, or add it */
  var existing = list.find(function(a){ return a.isPrimary; });
  if (existing) {
    existing.name    = name;
    existing.line    = addressLine;
    existing.pin     = pincode;
    existing.city    = "";
  } else {
    list.unshift({
      id:        "primary_" + uid,
      type:      "Home",
      name:      name,
      mobile:    user.mobile || "",
      line:      addressLine,
      city:      "",
      pin:       pincode,
      isDefault: true,
      isPrimary: true,
    });
  }
  localStorage.setItem(key, JSON.stringify(list));
}

/* ====================================================
   LOGOUT
   ==================================================== */
async function handleLogout() {
  /* Clear only THIS user's cart from localStorage before logout */
  if (user) {
    localStorage.removeItem(ukey("cart"));
  }
  await api.logout();
  localStorage.removeItem("rx_user_name");
  localStorage.removeItem("rx_user_role");
  showToast("Logged out. See you soon!");
  setTimeout(function(){ window.location.href="login.html"; }, 1000);
}


/* ====================================================
   HELPERS
   ==================================================== */
function esc(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
var toastTimer=null;
function showToast(msg,isError) {
  var t=document.getElementById("toast");
  t.innerText=msg; t.className="toast"+(isError?" err":"");
  t.classList.add("show"); clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){t.classList.remove("show");},2800);
}