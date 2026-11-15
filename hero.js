(function(){"use strict";var $=function(s){return document.querySelector(s)},rm=matchMedia("(prefers-reduced-motion:reduce)").matches;
var h=$("#mcHost");if(h&&window.Mascot){try{window.__mc=new window.Mascot(h,{base:"mascot/"});window.__mc.work(true)}catch(e){}}
function lg(){document.querySelectorAll(".isl-lg [data-lang]").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-lang")===window.I18N.lang)})}
document.querySelectorAll(".isl-lg [data-lang]").forEach(function(b){b.onclick=function(){window.I18N.set(b.getAttribute("data-lang"))}});document.addEventListener("langchange",lg);lg();
var cp=$("#abCp");if(cp)cp.onclick=function(){var m=$("#abMail").textContent;(navigator.clipboard?navigator.clipboard.writeText(m):Promise.reject()).catch(function(){}).then(function(){cp.textContent=window.t("ab_ok");setTimeout(function(){cp.textContent=window.t("ab_cp")},1600)})};
/* scroll bar + parallax blobs */
var sb=$("#sbar"),bl=document.querySelectorAll(".blob");
function sc(){var y=scrollY,m=document.documentElement.scrollHeight-innerHeight;if(sb)sb.style.transform="scaleX("+(m>0?y/m:0)+")";if(!rm)bl.forEach(function(b,i){b.style.transform="translateY("+(y*(.08+i*.05))+"px)"})}
addEventListener("scroll",sc,{passive:true});sc();
/* demo videos: lazy, play only in view; click = lightbox */
var vs=document.querySelectorAll(".vid video");
var vio=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target;if(e.isIntersecting){if(!v.src)v.src=v.getAttribute("data-src");if(!rm)v.play().catch(function(){})}else v.pause()})},{threshold:.25});
vs.forEach(function(v){vio.observe(v);v.parentNode.addEventListener("click",function(){var lb=document.createElement("div");lb.className="lb";lb.innerHTML='<video src="'+v.getAttribute("data-src")+'" muted loop playsinline autoplay controls></video><button type="button" aria-label="Close">✕</button>';lb.onclick=function(e){if(e.target.tagName!=="VIDEO"){lb.remove()}};document.body.appendChild(lb)})});
document.addEventListener("keydown",function(e){var l=document.querySelector(".lb");if(e.key==="Escape"&&l)l.remove()});
if(rm)return;
/* reveal on scroll */
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var t=e.target;t.classList.add("in");io.unobserve(t);setTimeout(function(){t.classList.add("done");t.style.transitionDelay=""},900)}})},{threshold:.12});
document.querySelectorAll(".sec-h,.sec-s,.card,.about,.vid").forEach(function(e,i){e.classList.add("rv");e.style.transitionDelay=(i%4)*70+"ms";io.observe(e)});
/* card tilt */
document.querySelectorAll(".card").forEach(function(c){c.addEventListener("pointermove",function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform="perspective(700px) rotateX("+(-y*8)+"deg) rotateY("+(x*8)+"deg) translateY(-4px)"});c.addEventListener("pointerleave",function(){c.style.transform=""})});
/* sparkle trail */
var last=0,cols=["#FFC53D","#FF6B9A","#9B8CFF","#36D6C3"];
addEventListener("pointermove",function(e){var n=Date.now();if(n-last<70)return;last=n;var s=document.createElement("span");s.className="spk";s.textContent="✦";s.style.cssText="left:"+e.clientX+"px;top:"+e.clientY+"px;color:"+cols[n%4];document.body.appendChild(s);setTimeout(function(){s.remove()},800)});
/* click on a big letter = hop + cheer */
document.querySelectorAll(".mega .L").forEach(function(l){l.addEventListener("click",function(){if(window.__mc)window.__mc.cheer()})});
})();
