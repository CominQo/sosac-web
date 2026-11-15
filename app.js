(function () {
  "use strict";
  var C = window.SOSAC_CONFIG || {}, t = window.t, $ = function (s) { return document.querySelector(s); }, KEY = "sosac_unlocked";
  $("#yr").textContent = new Date().getFullYear();
  function toast(m) { var e = $("#toast"); e.textContent = m; e.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(function () { e.classList.remove("on"); }, 3200); }
  try { if (!localStorage.getItem("sosac_lang")) { var n = (navigator.language || "").slice(0, 2); if (n === "sk" || n === "cs") window.I18N.set(n); } } catch (e) {}
  function closeLang() { var m = $("#langMenu"), b = $("#langBtn"); if (m) m.hidden = true; if (b) b.setAttribute("aria-expanded", "false"); }
  var LB=$("#langBtn");if(LB)LB.addEventListener("click", function (e) { e.stopPropagation(); var m = $("#langMenu"); m.hidden = !m.hidden; this.setAttribute("aria-expanded", String(!m.hidden)); });
  var LM=$("#langMenu");if(LM)LM.addEventListener("click", function (e) { var b = e.target.closest("[data-lang]"); if (b) { window.I18N.set(b.getAttribute("data-lang")); closeLang(); } });
  document.addEventListener("click", function (e) { if (!e.target.closest(".langw")) closeLang(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLang(); });
  function owned() { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  function sha(s) { return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)).then(function (b) { return Array.from(new Uint8Array(b)).map(function (x) { return x.toString(16).padStart(2, "0"); }).join(""); }); }
  function render() {
    var d = $("#dlCard");
    if (owned()) {
      d.innerHTML = '<h3 data-i18n="dl_ok"></h3>' + (C.DOWNLOAD_URL ? '<a class="btn lg pink" href="' + C.DOWNLOAD_URL + '" data-i18n="dl_btn"></a>' : '<p data-i18n="dl_none"></p>');
    } else {
      d.innerHTML = '<h3 data-i18n="dl_lock"></h3><p data-i18n="s1"></p><p data-i18n="s2"></p><p data-i18n="s3"></p><a class="btn pink" href="' + (C.REVOLUT || "#") + '" target="_blank" rel="noopener" data-i18n="dl_pay"></a><div class="code"><input id="codeIn" type="text" autocomplete="off" spellcheck="false" data-i18n-ph="code_ph"><button class="btn" id="codeGo" type="button" data-i18n="code_go"></button></div><div class="msg" id="codeMsg"></div>';
      var go = function () {
        var v = $("#codeIn").value.trim().toUpperCase();
        sha(v).then(function (h) {
          if (v && (C.CODE_HASHES || []).indexOf(h) > -1) { try { localStorage.setItem(KEY, "1"); } catch (e) {} if (window.__mc) window.__mc.cheer(); toast(t("dl_ok")); render(); }
          else { $("#codeMsg").textContent = t("code_bad"); }
        });
      };
      $("#codeGo").onclick = go; $("#codeIn").addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    }
    window.I18N.apply();
  }
  $("#buyBtn").addEventListener("click", function () { if (window.__mc) window.__mc.cheer(); setTimeout(function () { location.hash = "#download"; }, 500); });
  window.I18N.apply(); render();
})();
