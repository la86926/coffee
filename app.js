(() => {
  "use strict";
  const root = document.documentElement;

  // Portadas extraídas de los MP4 originales. Se guardan en fragmentos de texto
  // para mantener GitHub Pages ligero y se reconstruyen una sola vez en el navegador.
  (async function loadLocalPosters(){
    try{
      const parts = await Promise.all([0,1,2,3,4].map(i =>
        fetch("./assets/media-"+i+".b64", {cache:"force-cache"}).then(r => {
          if(!r.ok) throw new Error("poster part");
          return r.text();
        })
      ));
      const raw = atob(parts.join("").replace(/\s+/g,""));
      const bytes = new Uint8Array(raw.length);
      for(let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i);
      const posterUrl = URL.createObjectURL(new Blob([bytes],{type:"image/webp"}));
      root.style.setProperty("--poster-atlas", 'url("'+posterUrl+'")');
      document.body.classList.add("has-local-posters");
      window.addEventListener("pagehide",()=>URL.revokeObjectURL(posterUrl),{once:true});
    }catch(_){
      // Las miniaturas de YouTube quedan como respaldo si el atlas no carga.
    }
  })();

  const themeButton = document.getElementById("themeButton");
  const savedTheme = localStorage.getItem("coffee-theme");
  if (savedTheme === "light" || savedTheme === "dark") root.dataset.theme = savedTheme;

  function themeMode() { return root.dataset.theme || "system"; }
  function paintTheme() {
    const mode = themeMode();
    const names = {system:"sistema", light:"claro", dark:"oscuro"};
    const icons = {system:"◐", light:"☀", dark:"☾"};
    themeButton.textContent = icons[mode];
    themeButton.setAttribute("aria-label", "Tema: " + names[mode]);
    themeButton.title = "Tema: " + names[mode];
  }
  themeButton.addEventListener("click", () => {
    const mode = themeMode();
    const next = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    if (next === "system") {
      root.removeAttribute("data-theme");
      localStorage.removeItem("coffee-theme");
    } else {
      root.dataset.theme = next;
      localStorage.setItem("coffee-theme", next);
    }
    paintTheme();
  });
  paintTheme();

  document.querySelectorAll(".tool-card").forEach(card => {
    card.addEventListener("click", () => {
      const opening = !card.classList.contains("open");
      document.querySelectorAll(".tool-card.open").forEach(item => item.classList.remove("open"));
      if (opening) card.classList.add("open");
    });
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });
  });

  const stepCards = Array.from(document.querySelectorAll(".step-card"));
  const progressLabel = document.getElementById("stepProgressLabel");
  const progressBar = document.getElementById("stepProgressBar");
  function setProgress(n) {
    n = Math.max(1, Math.min(10, Number(n) || 1));
    progressLabel.textContent = "Paso " + n + " de 10";
    progressBar.style.width = (n * 10) + "%";
  }
  if ("IntersectionObserver" in window) {
    const ratios = new Map();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) ratios.set(entry.target, entry.intersectionRatio);
        else ratios.delete(entry.target);
      });
      if (!ratios.size) return;
      const best = Array.from(ratios.entries()).sort((a,b) => b[1] - a[1])[0][0];
      setProgress(best.dataset.step);
    }, {threshold:[0.2,0.4,0.65], rootMargin:"-18% 0px -45% 0px"});
    stepCards.forEach(card => observer.observe(card));
  }

  document.querySelectorAll("[data-timer]").forEach(timer => {
    let initial = Number(timer.dataset.duration);
    let remaining = initial;
    let interval = null;
    let deadline = null;
    const display = timer.querySelector(".timer-display");

    function draw() {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      display.textContent = String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0");
      if (interval) document.title = display.textContent + " · Mi café";
    }
    function stop() {
      if (interval) clearInterval(interval);
      interval = null;
      deadline = null;
      document.title = "Mi café · Prensa francesa";
    }
    function tick() {
      if (!deadline) return;
      remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      draw();
      if (remaining <= 0) {
        stop();
        timer.classList.add("done");
        try { if ("vibrate" in navigator) navigator.vibrate([160,90,160]); } catch (_) {}
      }
    }

    timer.addEventListener("click", event => {
      const action = event.target.dataset.action;
      const duration = event.target.dataset.duration;

      if (duration) {
        stop();
        initial = Number(duration);
        remaining = initial;
        timer.dataset.duration = String(initial);
        timer.classList.remove("done");
        timer.querySelectorAll("[data-duration]").forEach(button => button.classList.toggle("selected", button === event.target));
        draw();
        return;
      }
      if (action === "start" && !interval && remaining > 0) {
        timer.classList.remove("done");
        deadline = Date.now() + remaining * 1000;
        interval = setInterval(tick, 250);
        tick();
      }
      if (action === "pause") {
        if (deadline) remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        stop();
        draw();
      }
      if (action === "reset") {
        stop();
        remaining = initial;
        timer.classList.remove("done");
        draw();
      }
    });
    document.addEventListener("visibilitychange", () => { if (!document.hidden && interval) tick(); });
    draw();
  });

  const dialog = document.getElementById("videoDialog");
  const frame = document.getElementById("videoFrame");
  const dialogTitle = document.getElementById("videoDialogTitle");
  const closeVideo = document.getElementById("closeVideo");

  function openVideo(id, title) {
    if (!id) return;
    dialogTitle.textContent = title || "Video";
    frame.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&playsinline=1&rel=0";
    iframe.title = title || "Video";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    frame.appendChild(iframe);
    document.body.classList.add("video-open");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open","");
  }
  function closeDialog() {
    frame.innerHTML = "";
    document.body.classList.remove("video-open");
    if (dialog.open && typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }
  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-video]");
    if (trigger) openVideo(trigger.dataset.video, trigger.dataset.title);
  });
  closeVideo.addEventListener("click", closeDialog);
  dialog.addEventListener("click", event => {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog();
  });
  dialog.addEventListener("close", () => {
    frame.innerHTML = "";
    document.body.classList.remove("video-open");
  });

  document.addEventListener("gesturestart", event => event.preventDefault(), {passive:false});
  let lastTouchEnd = 0;
  document.addEventListener("touchend", event => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) event.preventDefault();
    lastTouchEnd = now;
  }, {passive:false});
  window.addEventListener("wheel", event => {
    if (event.ctrlKey || event.metaKey) event.preventDefault();
  }, {passive:false});
})();