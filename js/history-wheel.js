/* The history wheel: a close-up of a spinning bike wheel, hub just above the top edge, photos riding
   the spokes like Ferris-wheel seats. Constant slow spin; a card that goes over the top (out of view)
   picks up the next photo, so any number of photos cycles through in order and then starts over.

   ======================= ADD PHOTOS HERE =======================
   Drop files into assets/history/ and add a line below, oldest first.
   alt is for screen readers only; nothing is printed on the cards.        */
var HISTORY_PHOTOS = [
  { src: "h01.jpg", alt: "Riders cooling their feet in a desert creek pool, saguaros on the hillside" },
  { src: "h02.jpg", alt: "A rider holding up a chainring with an SSAZ 2009 Arizona license plate inside it" },
  { src: "h03.jpg", alt: "A shirtless guy in bib shorts standing in the creek, pouring from a keg" },
  { src: "h04.jpg", alt: "A bearded rider leading a group up a dirt road" },
  { src: "h05.jpg", alt: "A bearded rider in a pink and yellow jersey and a vintage helmet, arms out" },
  { src: "h06.jpg", alt: "A Tecate held out to a rider coming around a bend in the road" },
  { src: "h07.jpg", alt: "A huge group of riders lined up along a desert road, everyone holding a wheel over their head" },
  { src: "h08.jpg", alt: "A rubber dildo standing upright in a parking lot, riders and bikes scattered behind it" },
  { src: "h09.jpg", alt: "A bearded rider on a singlespeed giving a fist pump, the valley far below" },
  { src: "h10.jpg", alt: "A guy in a camp chair hoisting an inflatable sheep, friends drinking beside him" },
  { src: "h11.jpg", alt: "Riders loading bikes into the back of a rental moving truck" },
  { src: "h12.jpg", alt: "A crew of bearded guys outside an old tin shack, one kneeling and flipping the bird" },
  { src: "h13.jpg", alt: "A big crowd of riders and bikes in a gravel lot, a party bus and a moving truck behind them" },
  { src: "h14.jpg", alt: "Riders crowded around a picnic table of beer bottles outside a tin-sided bar" },
  { src: "h15.jpg", alt: "Two guys at a picnic table throwing devil horns, a beached speedboat and a guy chugging behind them" },
  { src: "h16.jpg", alt: "A crowd of riders and bikes on a dirt road high above rolling desert mountains" },
  { src: "h17.jpg", alt: "Bikes lined up along a sidewalk railing outside an old-town patio" },
  { src: "h18.jpg", alt: "Four riders posing on a dirt road, one in a stars-and-stripes shirt, one in tie-dye" },
  { src: "h19.jpg", alt: "A close-up of an SSAZ23 trucker hat that says Getting Inferior down in Superior, tongue sticking out below the brim" },
  { src: "h20.jpg", alt: "Riders crossing a rust-orange suspension bridge strung with party lights" },
  { src: "h21.jpg", alt: "Six riders with drinks lounging on stone steps under a tree with a bike hanging in it" },
  { src: "h22.jpg", alt: "A big bearded guy in a sleeveless shirt holding a bag up so another rider can drink from it" },
  { src: "h23.jpg", alt: "Bikes strewn across a desert lot around a van, a horse trailer and a red truck, a big peak behind" },
  { src: "h24.jpg", alt: "A crowd silhouetted around a huge bonfire at dusk, the trees lit orange" },
  { src: "h25.jpg", alt: "A crowd of riders gathering in the street, a big red mountain behind them" }
];
/* ================================================================ */

(function () {
  var stage = document.getElementById("history-wheel");
  if (!stage || !HISTORY_PHOTOS.length) return;

  var SLOTS = 9;                 // cards on the wheel at once
  var DEG_PER_SEC = 4;           // one turn every 90 seconds
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- the wheel itself (SVG, drawn once) ----------
  var ns = "http://www.w3.org/2000/svg", svg = '<svg class="hw-svg" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">';
  svg += '<circle r="99.3" fill="none" stroke="#1b1b1b" stroke-width="3" stroke-dasharray="2.6 2.4"/>';   // tread knobs
  svg += '<circle r="94.5" fill="none" stroke="#222" stroke-width="8"/>';                                 // tire
  svg += '<circle r="94.5" fill="none" stroke="#3a3a3a" stroke-width="1" stroke-dasharray="1 5"/>';
  svg += '<circle r="89" fill="none" stroke="#c9ced3" stroke-width="4.2"/>';                              // rim
  svg += '<circle r="86.6" fill="none" stroke="#7f878f" stroke-width=".8"/>';
  svg += '<g stroke="#dfe3e7" stroke-width=".75" stroke-linecap="round">';
  for (var i = 0; i < 32; i++) {                                                                          // 32 spokes, crossed
    var h = i * 11.25 * Math.PI / 180, t = h + (i % 2 ? 1 : -1) * 0.62;
    svg += '<line x1="' + (7.5 * Math.sin(h)).toFixed(2) + '" y1="' + (7.5 * Math.cos(h)).toFixed(2) +
           '" x2="' + (86.5 * Math.sin(t)).toFixed(2) + '" y2="' + (86.5 * Math.cos(t)).toFixed(2) + '"/>';
  }
  svg += '</g><g fill="#9aa1a8">';
  for (i = 0; i < 32; i++) { var a = (i * 11.25 + (i % 2 ? 35.5 : -35.5)) * Math.PI / 180; svg += '<circle cx="' + (86.5 * Math.sin(a)).toFixed(2) + '" cy="' + (86.5 * Math.cos(a)).toFixed(2) + '" r=".9"/>'; }
  svg += '</g>';
  svg += '<rect x="-1.6" y="84" width="3.2" height="7" rx="1" fill="#b08d3c" stroke="#555" stroke-width=".4"/>'; // valve stem
  var cog = "";                                                                                           // the one and only cog
  for (i = 0; i < 18; i++) {
    var c0 = (i / 18) * 2 * Math.PI, c1 = c0 + 0.09, c2 = c0 + 0.26, c3 = c0 + 0.35;
    cog += (i ? "L" : "M") + (12 * Math.sin(c0)).toFixed(2) + " " + (12 * Math.cos(c0)).toFixed(2) +
      "L" + (15 * Math.sin(c1)).toFixed(2) + " " + (15 * Math.cos(c1)).toFixed(2) +
      "L" + (15 * Math.sin(c2)).toFixed(2) + " " + (15 * Math.cos(c2)).toFixed(2) +
      "L" + (12 * Math.sin(c3)).toFixed(2) + " " + (12 * Math.cos(c3)).toFixed(2);
  }
  svg += '<path d="' + cog + 'Z" fill="#3c3c3c" stroke="#111" stroke-width=".6"/>';
  svg += '<circle r="9" fill="#b8bec4" stroke="#555" stroke-width=".8"/><circle r="3.2" fill="#666"/></svg>';

  var wheel = document.createElement("div");
  wheel.className = "hw-wheel";
  wheel.innerHTML = svg;
  stage.appendChild(wheel);

  // ---------- the cards ----------
  var slots = [], next = 0;
  for (i = 0; i < SLOTS; i++) {
    var slot = document.createElement("div");
    slot.className = "hw-slot";
    var card = document.createElement("figure");
    card.className = "hw-card";
    var img = document.createElement("img");
    img.addEventListener("load", function () { this.parentNode.classList.toggle("tall", this.naturalHeight > this.naturalWidth); });
    card.appendChild(img);
    slot.appendChild(card);
    wheel.appendChild(slot);
    slots.push({ base: i * 360 / SLOTS, slot: slot, card: card, img: img, p: 0 });
  }
  function load(s) {
    var ph = HISTORY_PHOTOS[next % HISTORY_PHOTOS.length];
    next++;
    s.img.src = "assets/history/" + ph.src;
    s.img.alt = ph.alt;
  }

  // progress of a slot along its trip: 0 = entering at 3 o'clock, 90 = bottom, 180 = leaving at 9 o'clock,
  // 180-360 = hidden above the hub line (it swaps photos at 270, straight up, where nobody can see)
  var spin = 0;
  function progress(s) { var w = ((s.base + spin) % 360 + 360) % 360; return (w - 270 + 360) % 360; }

  // first fill: whoever leaves the screen soonest gets the oldest photo
  slots.forEach(function (s) { s.p = progress(s); });
  slots.slice().sort(function (a, b) { return ((180 - a.p + 360) % 360) - ((180 - b.p + 360) % 360); }).forEach(load);

  var D = 0, R = 0;
  function size() {
    var W = stage.clientWidth;
    D = Math.max(560, Math.min(980, W * 1.05));
    R = D * 0.33;
    stage.style.height = Math.round(D / 2 + 4) + "px";
    wheel.style.width = wheel.style.height = D + "px";
    wheel.style.left = Math.round((W - D) / 2) + "px";
    wheel.style.top = Math.round(-D / 2) + "px";
    stage.style.setProperty("--card", Math.round(D * 0.19) + "px");
    draw();
  }
  function draw() {
    wheel.firstChild.style.transform = "rotate(" + spin + "deg)";
    slots.forEach(function (s) {
      var a = s.base + spin;
      s.slot.style.transform = "rotate(" + a + "deg) translateY(" + R + "px)";
      s.card.style.transform = "translate(-50%, -50%) rotate(" + (-a) + "deg)";   // stays upright, like a Ferris wheel seat
    });
  }

  var paused = false, last = 0;
  stage.addEventListener("mouseenter", function () { paused = true; });
  stage.addEventListener("mouseleave", function () { paused = false; });
  function tick(now) {
    var dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (!paused && !reduce) {
      spin = (spin + DEG_PER_SEC * dt) % 360;
      slots.forEach(function (s) {
        var p = progress(s);
        if (s.p < 270 && p >= 270) load(s);
        s.p = p;
      });
      draw();
    }
    requestAnimationFrame(tick);
  }
  size();
  window.addEventListener("resize", size);
  requestAnimationFrame(tick);
})();
