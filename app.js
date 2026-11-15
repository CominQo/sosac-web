(function () {
  "use strict";
  var C = window.SOSAC_CONFIG || {};
  var t = window.t;
  var $ = function (s) { return document.querySelector(s); };
  var configured = C.SUPABASE_URL && C.SUPABASE_URL.indexOf("TVOJ-") === -1;
  var sb = configured ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;
  var state = { user: null, owned: false, release: null };
  var recovering = false;

  $("#yr").textContent = new Date().getFullYear();

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function toast(m) { var e = $("#toast"); e.textContent = m; e.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(function () { e.classList.remove("on"); }, 3200); }
  function openModal(html) { $("#modal").innerHTML = html; $("#ov").classList.add("on"); document.body.classList.add("modal-open"); }
  function closeModal() { $("#ov").classList.remove("on"); document.body.classList.remove("modal-open"); }
  $("#ov").addEventListener("click", function (e) { if (e.target.id === "ov") closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeModal(); closeLangMenu(); } });

  var ICON_DL = '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>';

  /* ---------- language menu ---------- */
  function closeLangMenu() { $("#langMenu").hidden = true; $("#langBtn").setAttribute("aria-expanded", "false"); }
  $("#langBtn").addEventListener("click", function (e) {
    e.stopPropagation();
    var m = $("#langMenu"); m.hidden = !m.hidden;
    this.setAttribute("aria-expanded", String(!m.hidden));
  });
  $("#langMenu").addEventListener("click", function (e) {
    var b = e.target.closest("[data-lang]"); if (!b) return;
    window.I18N.set(b.getAttribute("data-lang")); closeLangMenu();
  });
  document.addEventListener("click", function (e) { if (!e.target.closest(".langw")) closeLangMenu(); });
  document.addEventListener("langchange", function () { closeModal(); render(); });

  /* ---------- data ---------- */
  async function loadState() {
    state.user = null; state.owned = false; state.release = null;
    if (!sb) return render();
    var s = await sb.auth.getSession();
    state.user = s.data.session ? s.data.session.user : null;
    if (state.user) {
      var p = await sb.from("purchases").select("id").eq("user_id", state.user.id).eq("status", "paid").limit(1);
      state.owned = !!(p.data && p.data.length);
      if (state.owned) {
        var r = await sb.from("releases").select("*").order("created_at", { ascending: false }).limit(1);
        state.release = r.data && r.data[0] || null;
      }
    }
    render();
  }

  /* ---------- UI ---------- */
  function render() {
    $("#navAcc").textContent = state.user ? t("account") : t("login");
    var buy = $("#buyBtn");
    buy.textContent = state.owned ? t("b_owned") : t("b_btn");
    buy.disabled = !!state.owned;
    renderDownload();
  }

  function renderDownload() {
    var el = $("#dlCard");
    if (!sb) { el.innerHTML = '<div class="lock">⚙️ ' + esc(t("cfg_missing")) + '</div>'; return; }
    if (!state.user) {
      el.innerHTML = '<h3>' + esc(t("d_locked_h")) + '</h3><p>' + esc(t("d_locked_p")) + '</p>' +
        '<div class="row"><button class="btn pri" data-act="login">' + esc(t("d_login")) + '</button><button class="btn ghost" data-act="buy">' + esc(t("d_nothave")) + '</button></div>';
    } else if (!state.owned) {
      el.innerHTML = '<h3>' + esc(t("d_hi")) + '</h3><p>' + esc(t("d_nolic")) + ' <b>' + esc(state.user.email) + '</b></p>' +
        '<div class="lock">' + esc(t("d_pay_note")) + ' <a href="#" data-act="refresh"><b>' + esc(t("d_refresh")) + '</b></a>.</div>' +
        '<div class="row"><button class="btn pink" data-act="buy">' + esc(t("b_btn")) + '</button></div>';
    } else if (state.release) {
      var r = state.release;
      el.innerHTML = '<span class="tag ok">' + esc(t("d_bought")) + '</span><h3 style="margin-top:10px">Sosáč ' + esc(r.version) + '</h3>' +
        '<p>' + esc(t("d_latest")) + (r.size_mb ? ' · ' + esc(r.size_mb) + ' MB' : '') + '</p>' +
        '<div class="row"><button class="btn lg ok" data-act="download">' + ICON_DL + ' ' + esc(t("d_btn")) + '</button></div>' +
        (r.notes ? '<div class="notes"><b>' + esc(t("d_new")) + '</b>\n' + esc(r.notes) + '</div>' : '') +
        '<div class="msg" id="dlMsg"></div>';
    } else {
      el.innerHTML = '<span class="tag ok">' + esc(t("d_bought")) + '</span><h3 style="margin-top:10px">' + esc(t("d_none_h")) + '</h3><p>' + esc(t("d_none_p")) + '</p>';
    }
  }

  function authModal(mode) {
    var reg = mode === "register";
    openModal('<button class="x" data-act="close" aria-label="' + esc(t("m_close")) + '">✕</button>' +
      '<h3>' + esc(reg ? t("m_reg_h") : t("m_login_h")) + '</h3>' +
      '<p class="sub">' + esc(reg ? t("m_reg_s") : t("m_login_s")) + '</p>' +
      '<div class="tabs"><button data-act="tab-login" class="' + (reg ? '' : 'on') + '">' + esc(t("m_tab_login")) + '</button><button data-act="tab-reg" class="' + (reg ? 'on' : '') + '">' + esc(t("m_tab_reg")) + '</button></div>' +
      '<label for="em">' + esc(t("m_email")) + '</label><input id="em" type="email" autocomplete="email" placeholder="you@example.com">' +
      '<label for="pw">' + esc(t("m_pw")) + '</label><input id="pw" type="password" autocomplete="' + (reg ? 'new-password' : 'current-password') + '" placeholder="' + esc(t("m_pw_ph")) + '">' +
      '<div class="stack"><button class="btn pri" data-act="' + (reg ? 'do-reg' : 'do-login') + '">' + esc(reg ? t("m_do_reg") : t("m_do_login")) + '</button>' +
      (reg ? '' : '<button class="btn sm ghost" data-act="forgot">' + esc(t("m_forgot")) + '</button>') + '</div>' +
      '<div class="msg" id="aMsg"></div>');
    setTimeout(function () { var e = $("#em"); if (e) e.focus(); }, 50);
    $("#pw").addEventListener("keydown", function (e) { if (e.key === "Enter") act(reg ? "do-reg" : "do-login"); });
  }

  function profileModal() {
    var u = state.user;
    openModal('<button class="x" data-act="close" aria-label="' + esc(t("m_close")) + '">✕</button><div class="profile"><h3>' + esc(t("p_h")) + '</h3>' +
      '<div class="who"><div class="avatar">' + esc((u.email || "?")[0].toUpperCase()) + '</div><div><div class="em">' + esc(u.email) + '</div>' +
      '<span class="tag ' + (state.owned ? 'ok' : '') + '">' + esc(state.owned ? t("p_full") : t("p_none")) + '</span></div></div>' +
      '<div class="stack">' + (state.owned ? '<a class="btn ok" href="#download" data-act="close">' + esc(t("p_go")) + '</a>' : '<button class="btn pink" data-act="buy">' + esc(t("b_btn")) + '</button>') +
      '<button class="btn ghost" data-act="logout">' + esc(t("p_out")) + '</button></div></div>');
  }

  function aMsg(m, good) { var e = $("#aMsg"); if (e) { e.textContent = m || ""; e.className = "msg " + (good ? "good" : "err"); } }

  /* ---------- actions ---------- */
  async function act(a) {
    if (!sb && a !== "close") { toast(t("cfg_toast")); return; }
    switch (a) {
      case "close": closeModal(); break;
      case "login": case "tab-login": authModal("login"); break;
      case "tab-reg": authModal("register"); break;
      case "do-login": {
        aMsg(t("m_logging"), true);
        var r = await sb.auth.signInWithPassword({ email: $("#em").value.trim(), password: $("#pw").value });
        if (r.error) return aMsg(r.error.message === "Invalid login credentials" ? t("m_bad") : r.error.message);
        closeModal(); toast(t("t_welcome")); await loadState(); break;
      }
      case "do-reg": {
        var pw = $("#pw").value; if (pw.length < 8) return aMsg(t("m_short"));
        aMsg(t("m_creating"), true);
        var g = await sb.auth.signUp({ email: $("#em").value.trim(), password: pw, options: { emailRedirectTo: location.origin + location.pathname } });
        if (g.error) return aMsg(g.error.message);
        if (g.data.session) { closeModal(); toast(t("t_created")); await loadState(); }
        else aMsg(t("m_confirm"), true);
        break;
      }
      case "forgot": {
        var em = $("#em").value.trim(); if (!em) return aMsg(t("m_need_email"));
        var f = await sb.auth.resetPasswordForEmail(em, { redirectTo: location.origin + location.pathname });
        aMsg(f.error ? f.error.message : t("m_reset_sent"), !f.error); break;
      }
      case "logout": await sb.auth.signOut(); closeModal(); toast(t("t_out")); await loadState(); break;
      case "refresh": await loadState(); toast(state.owned ? t("t_found") : t("t_nothing")); break;
      case "buy": return buy();
      case "download": return download();
    }
  }

  function buy() {
    if (!sb) return toast(t("cfg_toast"));
    if (state.owned) return toast(t("t_have"));
    if (!state.user) { authModal("register"); aMsg(t("buy_need_acc"), true); return; }
    var url = new URL(C.CHECKOUT_URL);
    url.searchParams.set("client_reference_id", state.user.id);
    url.searchParams.set("prefilled_email", state.user.email);
    location.href = url.toString();
  }

  async function download() {
    var r = state.release, m = $("#dlMsg");
    if (!r) return;
    m.textContent = t("dl_prep"); m.className = "msg good";
    var s = await sb.storage.from(C.RELEASES_BUCKET).createSignedUrl(r.file_path, 120, { download: r.file_name || true });
    if (s.error) { m.textContent = t("dl_fail") + s.error.message; m.className = "msg err"; return; }
    m.textContent = t("dl_start");
    location.href = s.data.signedUrl;
  }

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]");
    if (el) { var a = el.getAttribute("data-act"); if (el.tagName === "A" && a !== "close") e.preventDefault(); act(a); }
  });
  $("#navAcc").addEventListener("click", function () { if (!sb) return toast(t("cfg_toast")); state.user ? profileModal() : authModal("login"); });
  $("#buyBtn").addEventListener("click", buy);

  if (sb) sb.auth.onAuthStateChange(function (ev) { if (ev === "PASSWORD_RECOVERY") recovery(); });
  function recovery() {
    openModal('<h3>' + esc(t("rec_h")) + '</h3><p class="sub">' + esc(t("rec_s")) + '</p><label for="np">' + esc(t("m_pw")) + '</label><input id="np" type="password" autocomplete="new-password"><div class="stack"><button class="btn pri" id="npb">' + esc(t("rec_save")) + '</button></div><div class="msg" id="aMsg"></div>');
    $("#npb").onclick = async function () {
      var v = $("#np").value; if (v.length < 8) return aMsg(t("rec_min"));
      var r = await sb.auth.updateUser({ password: v }); if (r.error) return aMsg(r.error.message);
      closeModal(); toast(t("t_pw")); loadState();
    };
  }

  // návrat z platby: pár sekúnd čakáme na webhook
  var paid = /[?&]paid=1/.test(location.search);
  window.I18N.apply();
  loadState().then(async function () {
    if (paid && state.user && !state.owned) {
      toast(t("t_paid"));
      for (var i = 0; i < 10 && !state.owned; i++) { await new Promise(function (r) { setTimeout(r, 2000); }); await loadState(); }
      if (state.owned) { toast(t("t_done")); location.hash = "download"; }
    }
  });
})();
