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

  window.SSAZ = { sfxDoor: sfxDoor, store: store };

  document.addEventListener("DOMContentLoaded", function () {
    mountStrips();
    phoneToast();
  });
})();
