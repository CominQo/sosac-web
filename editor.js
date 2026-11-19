/* Sosáč browser editor: everything runs locally (canvas + MediaRecorder). Nothing is uploaded. */
(function(){"use strict";
var $=function(s){return document.querySelector(s)},tr=function(k){return window.t?window.t(k):k},MAXLEN=120;
var S={ratio:"orig",fit:"crop",focus:.5,start:0,end:0,text:"",size:9,color:"#ffffff",pos:"bot",anim:"none",vol:100,mute:false,fin:0,fout:0};
var SZ={"9:16":[720,1280],"1:1":[1000,1000],"4:5":[864,1080],"16:9":[1280,720]};
var v=null,url=null,cv=$("#edCv"),ctx=cv.getContext("2d"),bgc=document.createElement("canvas"),bgx=bgc.getContext("2d");
var ticker=0,guardT=0,playing=false,exporting=false,dirty=true,AC=null,gain=null,node=null,recorder=null,chunks=[],outUrl=null;
function even(n){return Math.max(2,Math.round(n/2)*2)}
function clamp(x){return Math.max(0,Math.min(1,x))}
function fmt(t){var m=Math.floor(t/60),s=(t-m*60).toFixed(1);return m+":"+(s<10?"0":"")+s}
function err(m){var e=$("#edErr");e.textContent=m||""}
function sizeCanvas(){var s;if(S.ratio!=="orig")s=SZ[S.ratio];else{var k=Math.min(1,1280/Math.max(v.videoWidth,v.videoHeight));s=[even(v.videoWidth*k),even(v.videoHeight*k)]}cv.width=s[0];cv.height=s[1];bgc.width=48;bgc.height=Math.max(8,Math.round(48*s[1]/s[0]));dirty=true}
function wrapText(txt,maxW){var out=[];txt.split("\n").forEach(function(line){var cur="";line.split(" ").forEach(function(w){var t=cur?cur+" "+w:w;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=w}else cur=t});out.push(cur)});return out}
function draw(){if(!v||!v.videoWidth)return;var W=cv.width,H=cv.height,t=v.currentTime,vw=v.videoWidth,vh=v.videoHeight,sc;
 ctx.fillStyle="#1A1530";ctx.fillRect(0,0,W,H);
 if(S.fit==="crop"){sc=Math.max(W/vw,H/vh);ctx.drawImage(v,(W-vw*sc)*S.focus,(H-vh*sc)/2,vw*sc,vh*sc)}
 else{if(S.fit==="blur"){sc=Math.max(bgc.width/vw,bgc.height/vh);bgx.drawImage(v,(bgc.width-vw*sc)/2,(bgc.height-vh*sc)/2,vw*sc,vh*sc);ctx.imageSmoothingQuality="high";ctx.drawImage(bgc,0,0,W,H);ctx.fillStyle="rgba(26,21,48,.3)";ctx.fillRect(0,0,W,H)}
  sc=Math.min(W/vw,H/vh);ctx.drawImage(v,(W-vw*sc)/2,(H-vh*sc)/2,vw*sc,vh*sc)}
 if(S.text.trim()){var fs=Math.round(H*S.size/100),rel=t-S.start,al=1,oy=0;ctx.save();ctx.font="700 "+fs+"px Outfit,Arial,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
  var lines=wrapText(S.text,W*.88),lh=fs*1.15,tot=lines.length*lh;
  if(S.anim==="fade")al=clamp(rel/.6);else if(S.anim==="up"){var e=clamp(rel/.55);al=e;oy=Math.pow(1-e,3)*H*.08}
  var cy=S.pos==="top"?H*.16:S.pos==="mid"?H*.5:H*.84;ctx.globalAlpha=al;ctx.lineJoin="round";ctx.lineWidth=fs*.2;ctx.strokeStyle="#1A1530";ctx.fillStyle=S.color;
  lines.forEach(function(l,i){var y=cy+oy-tot/2+lh*(i+.5);ctx.strokeText(l,W/2,y);ctx.fillText(l,W/2,y)});ctx.restore()}
 var a=0,left=S.end-t,rel2=t-S.start;if(S.fin>0&&rel2<S.fin)a=Math.max(a,1-rel2/S.fin);if(S.fout>0&&left<S.fout)a=Math.max(a,1-left/S.fout);
 if(a>0){ctx.fillStyle="rgba(0,0,0,"+clamp(a)+")";ctx.fillRect(0,0,W,H)}}
function step(){if(!v)return;
 if(exporting&&v.seeking)return;if(playing||exporting){if(v.currentTime>=S.end-.02){if(exporting){finishExport();return}v.currentTime=S.start}dirty=true}
 if(exporting){$("#edPb").style.width=Math.round(clamp((v.currentTime-S.start)/Math.max(.1,S.end-S.start))*100)+"%"}
 if(dirty){dirty=false;draw()}}
function loop(){requestAnimationFrame(loop);step()}
function ensureAudio(){if(!AC){var C=window.AudioContext||window.webkitAudioContext;if(!C)return;AC=new C()}
 if(v&&!v._wired){node=AC.createMediaElementSource(v);gain=AC.createGain();node.connect(gain);gain.connect(AC.destination);v._wired=true;applyVol()}}
function applyVol(){if(gain&&!exporting)gain.gain.value=S.mute?0:S.vol/100}
function seek(t){return new Promise(function(res){var done=false,h=function(){if(done||Math.abs(v.currentTime-t)>.25)return;done=true;v.removeEventListener("seeked",h);res()};
 v.addEventListener("seeked",h);v.currentTime=t;setTimeout(function(){if(!done){done=true;v.removeEventListener("seeked",h);res()}},2500)})}
function updPlay(){var k=playing?"ed_pause":"ed_play",el=$("#edPlayL");el.setAttribute("data-i18n",k);el.textContent=tr(k)}
function setRange(){var d=v.duration||0,a=$("#edStart"),b=$("#edEnd");a.max=b.max=d.toFixed(1);a.value=S.start;b.value=S.end;$("#edStartV").textContent=fmt(S.start);$("#edEndV").textContent=fmt(S.end)}
function load(src,name){err("");if(url&&url!==src)URL.revokeObjectURL(url);url=src;var el=document.createElement("video");el.playsInline=true;el.preload="auto";el.crossOrigin="anonymous";el.src=src;
 el.onerror=function(){err(tr("ed_err_type"))};el.onended=function(){if(exporting)finishExport()};
 el.onloadedmetadata=function(){if(!el.videoWidth){err(tr("ed_err_type"));return}
  if(v){v.pause()}v=el;playing=false;exporting=false;AC&&gain&&(gain=null,node=null);S.start=0;S.end=Math.min(el.duration||MAXLEN,MAXLEN);
  $("#edName").textContent=name||"video";$("#edInfo").textContent=el.videoWidth+"×"+el.videoHeight+" · "+fmt(el.duration);
  $("#edDrop").style.display="none";$("#edWork").classList.add("on");$("#edResult").hidden=true;sizeCanvas();setRange();updPlay();
  if(document.fonts&&document.fonts.load)document.fonts.load("700 40px Outfit");
  el.currentTime=.01;el.onseeked=function(){dirty=true}}}
function back(){if(v)v.pause();playing=false;v=null;$("#edWork").classList.remove("on");$("#edDrop").style.display="";$("#edFile").value=""}
/* controls */
function seg(id,attr,cb){var box=$(id);box.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;box.querySelectorAll("button").forEach(function(x){x.classList.toggle("on",x===b)});cb(b.getAttribute(attr));dirty=true})}
seg("#edRatio","data-r",function(r){S.ratio=r;if(v)sizeCanvas()});
seg("#edFit","data-f",function(f){S.fit=f;$("#edFocusRow").style.display=f==="crop"?"":"none"});
seg("#edPos","data-p",function(p){S.pos=p});seg("#edAnim","data-a",function(a){S.anim=a;if(v&&!playing){v.currentTime=S.start}});
seg("#edColor","data-c",function(c){S.color=c});
function rng(id,vid,cb,suf){var el=$(id);el.addEventListener("input",function(){var x=+el.value;cb(x);if(vid)$(vid).textContent=suf==="s"?x.toFixed(1)+"s":x+"%";dirty=true})}
rng("#edFocus","#edFocusV",function(x){S.focus=x/100});rng("#edSize","#edSizeV",function(x){S.size=x});
rng("#edVol","#edVolV",function(x){S.vol=x;applyVol()});rng("#edFin","#edFinV",function(x){S.fin=x},"s");rng("#edFout","#edFoutV",function(x){S.fout=x},"s");
$("#edMute").addEventListener("change",function(){S.mute=this.checked;applyVol()});
$("#edText").addEventListener("input",function(){S.text=this.value;dirty=true});
$("#edStart").addEventListener("input",function(){var x=+this.value;S.start=Math.min(x,S.end-.3);if(S.end-S.start>MAXLEN)S.end=S.start+MAXLEN;setRange();if(v){v.currentTime=S.start}dirty=true});
$("#edEnd").addEventListener("input",function(){var x=+this.value;S.end=Math.max(x,S.start+.3);if(S.end-S.start>MAXLEN)S.start=S.end-MAXLEN;setRange();if(v){v.currentTime=Math.max(S.start,S.end-.1)}dirty=true});
$("#edPlay").addEventListener("click",function(){if(!v)return;if(playing){v.pause();playing=false;updPlay();return}ensureAudio();if(AC&&AC.state==="suspended")AC.resume();if(v.currentTime<S.start||v.currentTime>=S.end-.05)v.currentTime=S.start;v.play().then(function(){playing=true;updPlay()}).catch(function(){})});
$("#edReset").addEventListener("click",back);
/* file input / drop / sample */
$("#edFile").addEventListener("change",function(){var f=this.files&&this.files[0];if(f)load(URL.createObjectURL(f),f.name)});
var dz=$("#edDrop");["dragover","dragenter"].forEach(function(n){dz.addEventListener(n,function(e){e.preventDefault();dz.classList.add("over")})});["dragleave","drop"].forEach(function(n){dz.addEventListener(n,function(e){e.preventDefault();dz.classList.remove("over")})});
dz.addEventListener("drop",function(e){var f=e.dataTransfer&&e.dataTransfer.files[0];if(f)load(URL.createObjectURL(f),f.name)});
$("#edSample").addEventListener("click",function(){load("assets/vid/2.mp4","sosac-sample.mp4")});
/* export */
function pickMime(){var c=["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"];for(var i=0;i<c.length;i++)if(window.MediaRecorder&&MediaRecorder.isTypeSupported(c[i]))return c[i];return""}
function lock(on){$("#edExport").disabled=on;$("#edProg").hidden=!on;if(on)$("#edResult").hidden=true}
function fail(){exporting=false;clearInterval(ticker);clearTimeout(guardT);lock(false);err(tr("ed_err_rec"));if(gain&&AC){try{gain.disconnect();gain.connect(AC.destination)}catch(e){}}}
async function doExport(){
 if(!v||!window.MediaRecorder||!cv.captureStream){err(tr("ed_err_rec"));return}
 err("");var dur=S.end-S.start;exporting=true;playing=false;v.pause();updPlay();lock(true);$("#edPb").style.width="0%";
 ensureAudio();if(AC&&AC.state==="suspended")await AC.resume();
 await seek(S.start);draw();
 var stream=cv.captureStream(30);
 if(AC&&gain){var dest=AC.createMediaStreamDestination();gain.disconnect();gain.connect(dest);var base=S.mute?0:S.vol/100,t0=AC.currentTime;gain.gain.cancelScheduledValues(t0);gain.gain.setValueAtTime(S.fin>0?0:base,t0);if(S.fin>0)gain.gain.linearRampToValueAtTime(base,t0+S.fin);
  if(S.fout>0){gain.gain.setValueAtTime(base,t0+Math.max(S.fin,dur-S.fout));gain.gain.linearRampToValueAtTime(0,t0+dur)}
  dest.stream.getAudioTracks().forEach(function(k){stream.addTrack(k)})}
 var mime=pickMime(),rec;try{rec=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:6000000}:undefined)}catch(e){fail();return}
 chunks=[];rec.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data)};
 rec.onstop=function(){if(gain&&AC){try{gain.disconnect();gain.connect(AC.destination)}catch(e){}}gain&&(gain.gain.cancelScheduledValues(0),applyVol());
  var type=rec.mimeType||mime||"video/webm",blob=new Blob(chunks,{type:type});if(outUrl)URL.revokeObjectURL(outUrl);outUrl=URL.createObjectURL(blob);
  lock(false);var o=$("#edOut");o.src=outUrl;var a=$("#edDl"),mp4=/mp4/.test(type);a.href=outUrl;a.download="sosac-edit."+(mp4?"mp4":"webm");$("#edWebm").hidden=mp4;$("#edResult").hidden=false;
  window.__edLast={size:blob.size,type:type};$("#edResult").scrollIntoView({behavior:"smooth",block:"center"})};
 recorder=rec;rec.start(300);ticker=setInterval(step,33);guardT=setTimeout(finishExport,dur*1000+1500);
 if(v.requestVideoFrameCallback){var cb=function(n,md){if(!exporting)return;if(md.mediaTime>=S.end-.03){finishExport();return}v.requestVideoFrameCallback(cb)};v.requestVideoFrameCallback(cb)}
 try{await v.play();if(!exporting)v.pause()}catch(e){try{rec.stop()}catch(x){}fail()}}
function finishExport(){if(!exporting)return;exporting=false;clearInterval(ticker);clearTimeout(guardT);v.pause();if(recorder&&recorder.state!=="inactive")recorder.stop()}
$("#edExport").addEventListener("click",doExport);
$("#edText").placeholder=tr("ed_text_ph");document.addEventListener("langchange",function(){$("#edText").placeholder=tr("ed_text_ph");updPlay()});
requestAnimationFrame(loop);
})();
