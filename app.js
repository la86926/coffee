(function(){
  const root=document.documentElement;
  const themeBtn=document.getElementById("themeToggle");
  const saved=localStorage.getItem("coffee-theme");
  if(saved) root.dataset.theme=saved;
  themeBtn.addEventListener("click",function(){
    const dark=root.dataset.theme==="dark"||(!root.dataset.theme&&matchMedia("(prefers-color-scheme: dark)").matches);
    root.dataset.theme=dark?"light":"dark";
    localStorage.setItem("coffee-theme",root.dataset.theme);
  });

  const hero=document.getElementById("heroPhoto"),fallback=document.getElementById("heroFallback");
  hero.addEventListener("error",function(){hero.style.display="none";fallback.style.display="grid";});
  document.querySelectorAll(".object-card img").forEach(function(img){
    img.addEventListener("error",function(){img.style.display="none";img.nextElementSibling.style.display="grid";});
  });

  const steps=[].slice.call(document.querySelectorAll(".step"));
  const dots=[].slice.call(document.querySelectorAll(".step-dot"));
  const bar=document.getElementById("progressBar"),txt=document.getElementById("progressText");
  let current=0;
  function showStep(i,scroll){
    current=Math.max(0,Math.min(steps.length-1,i));
    steps.forEach(function(s,n){s.classList.toggle("active",n===current);});
    dots.forEach(function(d,n){d.classList.toggle("active",n===current);});
    bar.style.width=((current+1)/steps.length*100)+"%";
    txt.textContent="Paso "+(current+1)+" de "+steps.length;
    document.getElementById("prevStep").disabled=current===0;
    document.getElementById("nextStep").textContent=current===steps.length-1?"Volver al paso 1":"Siguiente →";
    if(scroll&&matchMedia("(max-width: 680px)").matches) document.querySelector(".sticky-title").scrollIntoView({behavior:"smooth",block:"start"});
  }
  dots.forEach(function(d){d.addEventListener("click",function(){showStep(Number(d.dataset.go),true);});});
  document.getElementById("prevStep").addEventListener("click",function(){showStep(current-1,true);});
  document.getElementById("nextStep").addEventListener("click",function(){showStep(current===steps.length-1?0:current+1,true);});
  let touchX=null;
  document.getElementById("stepsTrack").addEventListener("touchstart",function(e){touchX=e.changedTouches[0].clientX;},{passive:true});
  document.getElementById("stepsTrack").addEventListener("touchend",function(e){
    if(touchX===null)return; const dx=e.changedTouches[0].clientX-touchX; touchX=null;
    if(Math.abs(dx)>55) showStep(current+(dx<0?1:-1),false);
  },{passive:true});
  showStep(0,false);

  document.querySelectorAll(".timer-card").forEach(function(card){
    let initial=Number(card.dataset.seconds),left=initial,timer=null;
    const display=card.querySelector(".timer-display");
    function draw(){const m=Math.floor(left/60),s=left%60;display.textContent=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");}
    function pause(){if(timer){clearInterval(timer);timer=null;}}
    card.addEventListener("click",function(e){
      const action=e.target.dataset.action;
      if(action==="start"&&!timer&&left>0) timer=setInterval(function(){left--;draw();if(left<=0){pause();card.classList.add("done");}},1000);
      if(action==="pause") pause();
      if(action==="reset"){pause();left=initial;card.classList.remove("done");draw();}
      if(e.target.dataset.duration){
        pause();initial=Number(e.target.dataset.duration);left=initial;card.dataset.seconds=initial;
        card.querySelectorAll("[data-duration]").forEach(function(b){b.classList.toggle("selected",b===e.target);});draw();
      }
    });
    draw();
  });

  const titles=["Las dos aguas","Calentar y enjuagar","Calentar 2 minutos","Añadir y nivelar","Añadir el agua limpia","Mezclar","Tapa y émbolo","Esperar 4–5 minutos","Bajar el émbolo","Servir inmediatamente"];
  const grid=document.getElementById("videoGrid");
  titles.forEach(function(title,i){
    const n=String(i+1).padStart(2,"0"),card=document.createElement("article");card.className="video-card";
    card.innerHTML='<div class="video-placeholder"><button class="load-video" type="button" data-src="./videos/video-'+n+'.mp4">▶ Cargar video '+n+'</button></div><h3>Paso '+(i+1)+' · '+title+'</h3><p>Archivo esperado: video-'+n+'.mp4</p>';
    grid.appendChild(card);
  });
  grid.addEventListener("click",function(e){
    if(!e.target.matches(".load-video"))return;
    const wrap=e.target.parentElement,src=e.target.dataset.src;
    const video=document.createElement("video");video.controls=true;video.playsInline=true;video.preload="metadata";video.setAttribute("aria-label","Video del "+e.target.textContent.replace("Cargar ",""));
    video.addEventListener("error",function(){wrap.innerHTML='<div><strong>Video aún no disponible</strong><br><small>Coloca el archivo correspondiente en la carpeta videos.</small></div>';});
    wrap.innerHTML="";wrap.appendChild(video);video.src=src;video.load();
  });
})();