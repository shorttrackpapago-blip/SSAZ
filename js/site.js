/* SSAZ 2027 site-wide junk: chiptune, sound effects, mute button, phone toast, snapshot strips.
   The tune is an original composition ("Bumble Bee Stomp", Management, 2027), synthesized live
   with WebAudio so there is no audio file to license, host, or blame. */

(function () {
  "use strict";

  // ---------- storage (wrapped, because private windows hate fun) ----------
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* whatever */ } }
  };

  // ---------- audio ----------
  var ctx = null, master = null, musicBus = null, timer = null, playing = false;
  var nextTime = 0, step = 0;
  var BPM = 138, EIGHTH = 60 / BPM / 2;

  // melody in MIDI note numbers, one per eighth note, 0 = rest. 8 bars, then it loops. Forever. Sorry.
  var LEAD = [
    72, 0, 76, 79, 76, 0, 72, 74,   76, 76, 74, 72, 69, 0, 67, 0,
    72, 0, 76, 79, 81, 79, 76, 74,  72, 0, 0, 67, 72, 0, 0, 0,
    77, 0, 81, 84, 81, 77, 76, 74,  79, 0, 83, 86, 83, 79, 77, 76,
    76, 0, 72, 69, 72, 76, 79, 76,  74, 72, 71, 67, 74, 0, 79, 0
  ];
  var ROOTS = [48, 48, 45, 43, 41, 43, 45, 43]; // C C Am G | F G Am G

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = isMuted() ? 0 : 1;
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.55;
    musicBus.connect(master);
    return ctx;
  }

  function tone(type, freq, t, dur, vol, dest) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(dest || musicBus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  var noiseBuf = null;
  function noise(t, dur, vol, hp, dest) {
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
    s.connect(f); f.connect(g); g.connect(dest || musicBus);
    s.start(t); s.stop(t + dur + 0.02);
  }

  function scheduleStep(i, t) {
    var n = LEAD[i % LEAD.length];
    if (n) tone("square", mtof(n), t, EIGHTH * 0.9, 0.07);
    var bar = Math.floor(i / 8) % 8, beat = i % 8;
    var root = ROOTS[bar] + (beat % 2 ? 12 : 0);
    tone("triangle", mtof(root), t, EIGHTH * 0.95, 0.22);
    if (beat === 0 || beat === 4) tone("sine", 70, t, 0.18, 0.5);      // kick
    if (beat === 2 || beat === 6) noise(t, 0.12, 0.18, 1200);          // snare
    noise(t, 0.03, 0.05, 7000);                                        // hat
  }

  function tick() {
    while (nextTime < ctx.currentTime + 0.15) {
      scheduleStep(step, nextTime);
      step++;
      nextTime += EIGHTH;
    }
  }

  function startMusic() {
    if (playing || !ensureCtx()) return;
    playing = true;
    if (ctx.state === "suspended") ctx.resume();
    nextTime = ctx.currentTime + 0.08;
    timer = setInterval(tick, 40);
  }

  // Sound effects for the gate: knock-knock-knock, creeeak, FLUSH.
  function sfxDoor() {
    if (!ensureCtx()) return 0;
    if (ctx.state === "suspended") ctx.resume();
    var t = ctx.currentTime + 0.02;
    [0, 0.16, 0.32].forEach(function (d) { tone("sine", 140, t + d, 0.12, 0.7, master); noise(t + d, 0.05, 0.3, 300, master); });
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

  function isMuted() { return store.get("ssaz-muted") === "1"; }

  function setMuted(m, fromUser) {
    store.set("ssaz-muted", m ? "1" : "0");
    if (master) master.gain.value = m ? 0 : 1;
    var b = document.querySelector(".mute");
    if (b) {
      b.setAttribute("aria-pressed", m ? "true" : "false");
      b.setAttribute("aria-label", m ? "Unmute the sick jams" : "Mute the sick jams");
    }
    if (fromUser && !m && hasKnocked()) startMusic();
  }

  function hasKnocked() { return store.get("ssaz-knocked") === "1"; }

  function mountMute() {
    var b = document.createElement("button");
    b.className = "mute";
    b.type = "button";
    b.innerHTML =
      '<svg viewBox="0 0 40 40" aria-hidden="true">' +
      '<path d="M5 15h7l9-8v26l-9-8H5z" fill="#2E3351" stroke="#000" stroke-width="2"/>' +
      '<g class="waves" fill="none" stroke="#A03263" stroke-width="3"><path d="M25 14q4 6 0 12"/><path d="M29 10q7 10 0 20"/></g>' +
      '<g class="x" stroke="#A03263" stroke-width="4"><path d="M26 14l10 12M36 14l-10 12"/></g></svg>';
    var lbl = document.createElement("div");
    lbl.className = "mute-label";
    lbl.textContent = "sound on/off";
    b.addEventListener("click", function () { setMuted(!isMuted(), true); });
    document.body.appendChild(b);
    document.body.appendChild(lbl);
    setMuted(isMuted());
  }

  // On inner pages, the music resumes if you already knocked. Browsers may still demand a
  // click first, so the first click/keypress anywhere kicks it.
  function resumeMusicIfKnocked() {
    if (!hasKnocked() || isMuted()) return;
    startMusic();
    var kick = function () {
      if (ctx && ctx.state === "suspended") ctx.resume();
      if (!playing && !isMuted()) startMusic();
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
    window.addEventListener("pointerdown", kick);
    window.addEventListener("keydown", kick);
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

  window.SSAZ = { startMusic: startMusic, sfxDoor: sfxDoor, store: store, isMuted: isMuted, setMuted: setMuted };

  document.addEventListener("DOMContentLoaded", function () {
    mountMute();
    mountStrips();
    phoneToast();
    if (!document.body.hasAttribute("data-gate")) resumeMusicIfKnocked();
  });
})();
