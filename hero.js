(function(){"use strict";var $=function(s){return document.querySelector(s)};
var h=$("#mcHost");if(h&&window.Mascot){try{new window.Mascot(h,{base:"mascot/"}).work(true)}catch(e){}}
var acc=$("#islAcc"),na=$("#navAcc");
if(acc&&na){acc.onclick=function(){na.click()};var sync=function(){acc.textContent=na.textContent;document.querySelectorAll(".isl-lg [data-lang]").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-lang")===window.I18N.lang)})};
new MutationObserver(sync).observe(na,{childList:true,characterData:true,subtree:true});document.addEventListener("langchange",sync);sync();
document.querySelectorAll(".isl-lg [data-lang]").forEach(function(b){b.onclick=function(){window.I18N.set(b.getAttribute("data-lang"))}})}
var cp=$("#abCp");if(cp)cp.onclick=function(){var m=$("#abMail").textContent;(navigator.clipboard?navigator.clipboard.writeText(m):Promise.reject()).catch(function(){}).then(function(){cp.textContent=window.t("ab_ok");setTimeout(function(){cp.textContent=window.t("ab_cp")},1600)})};
})();
