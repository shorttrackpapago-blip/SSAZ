/* SSAZ 2027 site-wide junk: door sound effect, phone toast, snapshot strips. */

(function () {
  "use strict";

  // ---------- storage (wrapped, because private windows hate fun) ----------
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* whatever */ } }
  };

  // ---------- door sound effect (synthesized with WebAudio, no audio files) ----------
  var ctx = null, master = null;

  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    return ctx;
  }

  function tone(type, freq, t, dur, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  var noiseBuf = null;
  function noise(t, dur, vol, hp) {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = "highpass"; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + dur + 0.02);
  }

  // Sound effects for the gate: knock-knock-knock, creeeak, FLUSH.
  function sfxDoor() {
    if (!ensureCtx()) return 0;
    if (ctx.state === "suspended") ctx.resume();
    var t = ctx.currentTime + 0.02;
    [0, 0.16, 0.32].forEach(function (d) { tone("sine", 140, t + d, 0.12, 0.7); noise(t + d, 0.05, 0.3, 300); });
    // creak: a detuned sawtooth wandering down through a bandpass
    var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(210, t + 0.5);
    o.frequency.linearRampToValueAtTime(150, t + 0.8);
    o.frequency.linearRampToValueAtTime(230, t + 1.0);
    o.frequency.linearRampToValueAtTime(95, t + 1.35);
    f.type = "bandpass"; f.frequency.value = 900; f.Q.value = 6;
    g.gain.setValueAtTime(0.0001, t + 0.5);
    g.gain.linearRampToValueAtTime(0.25, t + 0.6);
    g.gain.linearRampToValueAtTime(0.0001, t + 1.4);
    o.connect(f); f.connect(g); g.connect(master);
    o.start(t + 0.5); o.stop(t + 1.45);
    // flush: noise through a closing lowpass
    if (!noiseBuf) noise(t, 0.001, 0.0001, 100);
    var s = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), fg = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true;
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(2600, t + 1.3);
    lp.frequency.exponentialRampToValueAtTime(220, t + 2.6);
    fg.gain.setValueAtTime(0.0001, t + 1.3);
    fg.gain.linearRampToValueAtTime(0.5, t + 1.5);
    fg.gain.exponentialRampToValueAtTime(0.0008, t + 2.7);
    s.connect(lp); lp.connect(fg); fg.connect(master);
    s.start(t + 1.3); s.stop(t + 2.8);
    return 2300; // ms until the flush is mostly done
  }

  // ---------- phone toast ----------
  function phoneToast() {
    var small = window.matchMedia && (window.matchMedia("(max-width: 768px)").matches || window.matchMedia("(pointer: coarse)").matches);
    if (!small || store.get("ssaz-phone-toast") === "1") return;
    var t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "alertdialog");
    t.setAttribute("aria-label", "Phone warning");
    t.innerHTML =
      '<div class="tb"><span>SSAZ.EXE — Fatal Exception 0E</span><button type="button" aria-label="Close">×</button></div>' +
      '<div class="bd"><span class="ico" aria-hidden="true">⚠️</span><p style="margin:0">Put the phone down and find a real computer, you animal. ' +
      'This site was built for a CRT monitor and a dial-up connection.<br><br>Fine. We made you a baby version. The important stuff still works.</p></div>' +
      '<button type="button" class="ok">OK, Dad</button>';
    var close = function () { store.set("ssaz-phone-toast", "1"); t.remove(); };
    t.querySelectorAll("button").forEach(function (b) { b.addEventListener("click", close); });
    document.body.appendChild(t);
  }

  // ---------- snapshot strips ----------
  var STRIPS = {
    itinerary: ["Whose tent is this", "He said the beer was 2 miles ago", "Kaolin, pre-bonfire", "Kaolin, post-bonfire (eyebrows TBD)", "Karl, 6:02 AM, already yelling", "Cleator Yacht Club dress code", "Band TBD, vibes confirmed", "Sunday. Nobody is okay."],
    register: ["Actual photo of the $120", "Mailbox, emotionally prepared", "Legible handwriting (rare)", "Illegible handwriting (uninvited)", "Stamp licker of the year", "Kaolin opening mail", "The Cave Creek HQ", "Your envelope, probably"],
    gear: ["Gear ratio: vibes", "Derailleur, not invited", "Rigid fork, rigid personality", "Chainline by eyeball", "Tire pressure: yes", "Van rack, 11 bikes, 0 gears", "Spare tube (it's a beer)", "Titanium, allegedly"],
    gallery: ["Whose tent is this", "Nobody remembers this", "Allegedly a trail", "Fire code violation #4", "The morning after the morning after", "Found one (1) sock", "Yacht Club, low tide", "Stars. Or the beer."],
    misc: ["Hydration station", "Box wine, 5L, zero regrets", "Lance-free since forever", "Rule #5 in action", "The 2-mile beer, found", "Anti-doping control (Karl)", "Clunker archaeology", "Mug quotes, unsourced"],
    guestbook: ["Dear diary", "Signed in blood (ketchup)", "Pen on a string, stolen", "Our webmaster", "Visitor #069,421", "Web ring? Web ring.", "Sign it or else", "Management reads these"]
  };

  function mountStrips() {
    document.querySelectorAll("[data-strip]").forEach(function (el) {
      var caps = STRIPS[el.getAttribute("data-strip")] || STRIPS.gallery;
      var offset = (el.getAttribute("data-strip").length * 3) % 12;
      el.setAttribute("aria-label", "Snapshot strip");
      el.innerHTML = caps.map(function (c, i) {
        var n = ((i + offset) % 12) + 1;
        var file = "assets/photos/placeholder-" + (n < 10 ? "0" + n : n) + ".png";
        return '<figure class="snap"><img src="' + file + '" alt="" loading="lazy"><figcaption>' + c + "</figcaption></figure>";
      }).join("");
    });
  }

  // ---------- Spokey: our Clippy. A spoke wrench who talks shit and won't be touched ----------
  var SPOKEY = {
    general: [
      "You should bring tennis shoes. You're just going to walk the whole ride anyway.",
      "The drive isn't worth it. Don't come.",
      "It looks like you're trying to have fun. Would you like help ruining that?",
      "One gear, and you'll still pick the wrong one.",
      "Your wheels are out of true. So are you.",
      "I'm a spoke wrench. I've fixed wobblier things than you. Not many.",
      "That climb? You're walking it. I've seen your Strava.",
      "Management told me to be nice. Management isn't here.",
      "Your derailleur called. It's not coming either.",
      "Maybe try a sport with fewer hills. Like napping.",
      "Hydration tip: water exists. Nobody here has tried it.",
      "Your tent is going to blow away. I've seen your tent.",
      "Bring a puffy. You'll forget it anyway.",
      "Karl's going to yell \"RACE DAY!\" at 6am and you're going to deserve it.",
      "You'll be asleep by 9. Everyone knows.",
      "Ride starts at 10. You'll show up at 10:40 and act like you were there.",
      "You're going to crash on the first descent and blame the tires.",
      "Nobody cares about your gear ratio. Especially you, around mile 3.",
      "Leave no trace. Starting with your dignity.",
      "Zero bars of cell service out there. Finally, some peace from you.",
      "Stop hovering. It's needy.",
      "I've seen scorpions with more grit than you.",
      "Did you mail your $120? No? Typical.",
      "The fire jump is for professionals. You're a professional at nothing.",
      "Your mom's house is on the itinerary page. She gives better directions than you do."
    ],
    index: ["Knock already. The line's getting long.", "It's a porta-john. What did you expect, a lobby?"],
    camp: ["Click the fire guy. Or don't. I'm a wrench, not a cop.", "Everything here is a link except your fitness."],
    itinerary: ["\"Loosely\" planned. Like your training.", "You read the whole schedule? Nerd. You'll still miss the start."],
    register: ["It looks like you're trying to pay cash by mail. In this economy?", "Write your email neatly. I've seen your handwriting."],
    gear: ["A new bike won't make you faster. It'll make you broke and slow.", "Your gear list is longer than your ride will be."],
    gallery: ["Don't look for yourself in these. We cropped you out.", "These photos are AI generated. So is your fitness."],
    guestbook: ["Sign it. It's the only thing you'll finish this weekend.", "Write something nice. Or honest. Not both."],
    misc: ["You're on the Misc. page. Even the website doesn't know what to do with you.", "Read the doping section. Then look at your bottle. Sus."]
  };
  var SPOKEY_TAUNTS = ["Nope.", "Too slow.", "Can't mute me either.", "Missed me.", "Hands off, pervert.", "Ha! Like your Saturday attack.", "You'll never catch me. Like the group ride.", "Personal space, please.", "Catch me on the climb. Oh wait."];

  function pick(list, not) {
    if (list.length < 2) return list[0];
    var s; do { s = list[Math.floor(Math.random() * list.length)]; } while (s === not);
    return s;
  }

  function mountSpokey() {
    var page = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
    var extra = SPOKEY[page] || [];
    var pool = SPOKEY.general.concat(extra, extra); // this page's lines come up twice as often

    // He ignores the pointer completely (pointer-events: none in CSS), so he can't be hovered,
    // clicked, or silenced. The page watches the pointer instead and he bolts before it arrives.
    var el = document.createElement("div");
    el.className = "spokey";
    el.innerHTML =
      '<div class="spokey-bubble"><b>Spokey says:</b><p></p></div>' +
      '<img src="assets/spokey.png" width="220" height="337" alt="Spokey, a spoke wrench with googly eyes" draggable="false">';
    document.body.appendChild(el);
    var p = el.querySelector("p"), img = el.querySelector("img"), bubble = el.querySelector(".spokey-bubble");
    var line = pick(pool), revert = null, x = 0, y = 0, lastFlee = 0;
    var NEAR = 70; // px of personal space around him and his bubble
    p.textContent = line;

    function place(nx, ny) {
      var W = el.offsetWidth, H = el.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
      x = Math.max(6, Math.min(nx, vw - W - 6));
      y = Math.max(6, Math.min(ny, vh - H - 6));
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.classList.toggle("on-left", x + W / 2 < vw / 2);   // bubble opens toward the middle of the screen
      el.classList.toggle("bubble-below", y < 170);        // no room above: talk from underneath
    }
    function home() { place(window.innerWidth - el.offsetWidth - 16, window.innerHeight - el.offsetHeight - 16); }
    home();
    if (!img.complete) img.addEventListener("load", home);   // re-measure once he has a real height

    // a new line every minute
    setInterval(function () { if (!revert) { line = pick(pool, line); p.textContent = line; } }, 60000);

    // the area he defends: himself plus his bubble, padded by NEAR
    function tooClose(mx, my) {
      var a = el.getBoundingClientRect(), b = bubble.getBoundingClientRect();
      var l = Math.min(a.left, b.left) - NEAR, t = Math.min(a.top, b.top) - NEAR;
      var r = Math.max(a.right, b.right) + NEAR, btm = Math.max(a.bottom, b.bottom) + NEAR;
      return mx > l && mx < r && my > t && my < btm;
    }

    function flee(mx, my) {
      var W = el.offsetWidth, H = el.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
      var best = null, bestD = -1;
      for (var i = 0; i < 16; i++) {           // farthest of a handful of random spots from the pointer
        var cx = 6 + Math.random() * Math.max(1, vw - W - 12), cy = 6 + Math.random() * Math.max(1, vh - H - 12);
        var d = Math.hypot(cx + W / 2 - mx, cy + H / 2 - my);
        if (d > bestD) { bestD = d; best = [cx, cy]; }
      }
      place(best[0], best[1]);
      lastFlee = Date.now();
      p.textContent = pick(SPOKEY_TAUNTS);
      clearTimeout(revert);
      revert = setTimeout(function () { revert = null; p.textContent = line; }, 2500);
    }

    document.addEventListener("pointermove", function (e) {
      if (Date.now() - lastFlee > 120 && tooClose(e.clientX, e.clientY)) flee(e.clientX, e.clientY);
    }, { passive: true });
    document.addEventListener("touchstart", function (e) {
      var t = e.touches[0];
      if (t && tooClose(t.clientX, t.clientY)) flee(t.clientX, t.clientY);
    }, { passive: true });
    window.addEventListener("resize", function () { place(x, y); });
  }

  window.SSAZ = { sfxDoor: sfxDoor, store: store };

  document.addEventListener("DOMContentLoaded", function () {
    mountStrips();
    phoneToast();
    mountSpokey();
  });
})();
