/* Title bar line drawn like a pencil: two thin paths that keep gently waving (same idea as the app's pencil line). */
(function(){"use strict";
var bar=document.querySelector(".mq-top"),svg=bar&&bar.querySelector(".pencil");if(!svg)return;
var pb=svg.querySelector(".pc-b"),pa=svg.querySelector(".pc-a"),P=[],last=0,rm=matchMedia("(prefers-reduced-motion:reduce)").matches;
function layout(){var W=bar.offsetWidth,L=[],s=0,x;svg.setAttribute("viewBox","0 0 "+W+" 18");for(x=-24;x<=W+24;x+=46){L.push({x:x,y:9,s:s});s+=46}P=L}
function dOf(p){var f=function(v){return v.toFixed(1)},d="M"+f(p[0][0])+" "+f(p[0][1]),i,m,e=p[p.length-1];
 for(i=1;i<p.length-1;i++){m=[(p[i][0]+p[i+1][0])/2,(p[i][1]+p[i+1][1])/2];d+=" Q"+f(p[i][0])+" "+f(p[i][1])+" "+f(m[0])+" "+f(m[1])}
 return d+" L"+f(e[0])+" "+f(e[1])}
function shape(t,k,ph){var e=.9+.1*Math.sin(t*.37);return P.map(function(p){var w=Math.sin(p.s*.026+t*1.9+ph)*.55+Math.sin(p.s*.0093-t*1.25+ph*1.7)*.45;return [p.x,p.y+(.5+k*e)*w]})}
function draw(t){pb.setAttribute("d",dOf(shape(t,3.4,0)));pa.setAttribute("d",dOf(shape(t,1.7,1.3)))}
function frame(now){requestAnimationFrame(frame);if(document.hidden||now-last<32)return;last=now;draw(now/1000)}
layout();draw(performance.now()/1000);if(!rm)requestAnimationFrame(frame);
addEventListener("resize",function(){layout();draw(performance.now()/1000)});
})();
