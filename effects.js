/* GROKI-FX v2 (liquid glass + in-motion tiles)
   GROKI effects layer. Decorative only: nothing here touches story content,
   the category filter in script.js, or the music player.
   Keep this file and effects.css when rewriting the daily edition. */
(function () {
  "use strict";
  var doc = document;
  var root = doc.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var small = window.matchMedia("(max-width: 860px)").matches;

  function deco(tag, cls) {
    var el = doc.createElement(tag);
    el.className = cls;
    el.setAttribute("aria-hidden", "true");
    return el;
  }

  /* Three drifting color blobs behind everything (static when motion is off). */
  var host = doc.querySelector(".void");
  if (host && !host.querySelector(".fx-blob")) {
    ["b3", "b2", "b1"].forEach(function (b) { host.insertBefore(deco("div", "fx-blob " + b), host.firstChild); });
    host.classList.add("fx-has-blobs");
  }

  /* HUD corner brackets on the sheet, lead, and every card. */
  var sheet = doc.querySelector(".sheet");
  if (sheet) {
    sheet.appendChild(deco("span", "fx-hud"));
    var beam = deco("span", "fx-beam");
    beam.appendChild(doc.createElement("i"));
    sheet.insertBefore(beam, sheet.firstChild);
  }
  var stories = Array.prototype.slice.call(doc.querySelectorAll(".story"));

  /* Per-card timing so the pans, borders and sheens never move in sync. */
  stories.forEach(function (story, i) {
    story.appendChild(deco("span", "fx-hud"));
    var dur = 14 + ((i * 2.3) % 6);              /* 14s to 20s */
    story.style.setProperty("--fx-kb-dur", dur.toFixed(1) + "s");
    story.style.setProperty("--fx-kb-delay", (-((i * 3.7) % dur)).toFixed(1) + "s");
    story.style.setProperty("--fx-sheen-delay", (-((i * 2.9) % 9)).toFixed(1) + "s");
    story.style.setProperty("--fx-ang-delay", (-((i * 1.7) % 9)).toFixed(1) + "s");
    if (i % 2) story.classList.add("fx-kb-b");
  });

  /* "In motion" pill on the lead picture only. */
  var leadViz = doc.querySelector(".lead .viz");
  if (leadViz && !leadViz.querySelector(".fx-live")) {
    var pill = deco("div", "fx-live");
    pill.textContent = "In motion";
    leadViz.appendChild(pill);
  }

  /* Glitch layers on the masthead title. */
  var title = doc.querySelector(".mast h1");
  if (title) title.setAttribute("data-text", title.textContent.trim());

  if (!reduce && "IntersectionObserver" in window) {
    /* Only animate cards that are on (or near) the screen. */
    root.classList.add("fx-io");
    var vis = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { entry.target.classList.toggle("fx-vis", entry.isIntersecting); });
    }, { rootMargin: "200px 0px 200px 0px" });
    stories.forEach(function (story) { vis.observe(story); });

    /* Scroll-in reveals. */
    root.classList.add("fx-ready");
    var reveal = function (story) { story.classList.add("fx-in"); };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { reveal(entry.target); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    stories.forEach(function (story) { io.observe(story); });
    /* After a desk tab is tapped, show the filtered stories right away. */
    var cats = doc.querySelector(".cats");
    if (cats) {
      cats.addEventListener("click", function () {
        setTimeout(function () { stories.forEach(function (s) { if (!s.hidden) reveal(s); }); }, 0);
      });
    }
  }

  /* Hover speeds up the pan smoothly (no jump), like the 99designs tiles. */
  if (!reduce && finePointer) {
    stories.forEach(function (story) {
      var img = story.querySelector(".viz img");
      if (!img || !img.getAnimations) return;
      function rate(r) {
        img.getAnimations().forEach(function (a) {
          if (a.updatePlaybackRate) a.updatePlaybackRate(r); else a.playbackRate = r;
        });
      }
      story.addEventListener("pointerenter", function () { rate(3.5); });
      story.addEventListener("pointerleave", function () { rate(1); });
    });
  }

  /* Decode reveal: scrambled glyphs resolve into the real text, left to right. */
  function decode(el, duration) {
    if (!el || reduce) return;
    var finalText = el.textContent;
    var glyphs = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=<>/";
    var start = null;
    var label = el.getAttribute("aria-label");
    el.setAttribute("aria-label", finalText);
    function frame(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / duration);
      var out = "";
      for (var i = 0; i < finalText.length; i++) {
        var ch = finalText.charAt(i);
        if (ch === " " || i / finalText.length < p) { out += ch; }
        else { out += glyphs.charAt((Math.random() * glyphs.length) | 0); }
      }
      el.textContent = out;
      if (p < 1) { requestAnimationFrame(frame); }
      else {
        el.textContent = finalText;
        if (label === null) el.removeAttribute("aria-label"); else el.setAttribute("aria-label", label);
      }
    }
    requestAnimationFrame(frame);
  }
  if (title) decode(title, 900);
  var leadLink = doc.querySelector(".lead h2 a");
  if (leadLink) setTimeout(function () { decode(leadLink, 1300); }, 350);

  /* Particle field with parallax depth, drawn behind the sheet. */
  if (!host || reduce) return;
  var canvas = deco("canvas", "fx-field");
  host.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  var dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
  var w = 0, h = 0, pts = [];
  var colors = ["94,246,255", "255,61,190", "141,123,255"];
  var count = small ? 34 : 70;
  var linkDist = small ? 90 : 130;
  var mouseX = 0, mouseY = 0;

  function size() {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function seed() {
    pts = [];
    for (var i = 0; i < count; i++) {
      var z = 0.25 + Math.random() * 0.75;
      pts.push({
        x: Math.random() * w, y: Math.random() * h, z: z,
        vx: (Math.random() - 0.5) * 0.12 * z, vy: -(0.05 + Math.random() * 0.18) * z,
        c: colors[i % colors.length], tw: Math.random() * 6.28
      });
    }
  }
  size(); seed();
  /* Phones fire resize when the address bar slides; only reseed on real width changes. */
  var lastW = w;
  window.addEventListener("resize", function () {
    size();
    if (Math.abs(w - lastW) > 40) { seed(); lastW = w; }
  });
  if (finePointer) {
    window.addEventListener("pointermove", function (e) {
      mouseX = (e.clientX / w - 0.5); mouseY = (e.clientY / h - 0.5);
    }, { passive: true });
  }

  var last = 0, running = true, step = small ? 1000 / 30 : 0;
  function draw(now) {
    if (!running) return;
    requestAnimationFrame(draw);
    if (step && now - last < step) return;
    last = now;
    var scroll = window.scrollY || 0;
    ctx.clearRect(0, 0, w, h);
    var proj = [];
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      p.x += p.vx; p.y += p.vy; p.tw += 0.03;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
      var py = ((p.y - scroll * 0.25 * p.z) % (h + 20) + h + 20) % (h + 20) - 10;
      var px = p.x - mouseX * 30 * p.z;
      py -= mouseY * 20 * p.z;
      proj.push([px, py, p]);
    }
    ctx.lineWidth = 0.6;
    for (var a = 0; a < proj.length; a++) {
      for (var b = a + 1; b < proj.length; b++) {
        var dx = proj[a][0] - proj[b][0], dy = proj[a][1] - proj[b][1];
        var d2 = dx * dx + dy * dy;
        if (d2 < linkDist * linkDist) {
          var al = (1 - Math.sqrt(d2) / linkDist) * 0.22 * Math.min(proj[a][2].z, proj[b][2].z);
          ctx.strokeStyle = "rgba(94,246,255," + al.toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(proj[a][0], proj[a][1]); ctx.lineTo(proj[b][0], proj[b][1]); ctx.stroke();
        }
      }
    }
    for (var k = 0; k < proj.length; k++) {
      var q = proj[k][2];
      var r = 0.6 + q.z * 1.6;
      var alpha = (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(q.tw))) * q.z;
      ctx.fillStyle = "rgba(" + q.c + "," + alpha.toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(proj[k][0], proj[k][1], r, 0, 6.283); ctx.fill();
    }
  }
  requestAnimationFrame(draw);
  doc.addEventListener("visibilitychange", function () {
    var wasRunning = running;
    running = !doc.hidden;
    if (running && !wasRunning) requestAnimationFrame(draw);
  });
})();
