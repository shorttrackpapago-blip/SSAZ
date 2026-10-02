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

  // Sound effects for the gate: knock-knock-knock, creeeak, VROOM (the Roca Roller leaves for camp).
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
    // engine: the Roca Roller turns over and pulls away (low sawtooth revving up through a lowpass)
    var e = ctx.createOscillator(), e2 = ctx.createOscillator(), elp = ctx.createBiquadFilter(), eg = ctx.createGain();
    e.type = "sawtooth"; e2.type = "square";
    e.frequency.setValueAtTime(38, t + 1.1); e.frequency.linearRampToValueAtTime(52, t + 1.5);
    e.frequency.linearRampToValueAtTime(44, t + 1.7); e.frequency.exponentialRampToValueAtTime(120, t + 2.6);
    e2.frequency.setValueAtTime(19, t + 1.1); e2.frequency.exponentialRampToValueAtTime(60, t + 2.6);
    elp.type = "lowpass"; elp.frequency.setValueAtTime(320, t + 1.1); elp.frequency.linearRampToValueAtTime(900, t + 2.6);
    eg.gain.setValueAtTime(0.0001, t + 1.1);
    eg.gain.linearRampToValueAtTime(0.35, t + 1.3);
    eg.gain.linearRampToValueAtTime(0.28, t + 2.2);
    eg.gain.exponentialRampToValueAtTime(0.0008, t + 2.8);
    e.connect(elp); e2.connect(elp); elp.connect(eg); eg.connect(master);
    e.start(t + 1.1); e2.start(t + 1.1); e.stop(t + 2.85); e2.stop(t + 2.85);
    return 2200; // ms until the rig has mostly driven off
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
  // The row of little photos at the bottom of each inner page. No captions.
  // To change the photos, edit this list (files live in assets/strip/, cropped 4:3). Each page shows 8,
  // starting at a different spot in the list so the strips don't all look the same.
  var STRIP_PHOTOS = [
    "band-bar.jpg", "tongue.jpg", "group-stop.jpg", "mountain-ride.jpg",
    "uhaul.jpg", "plaid-grin.jpg", "vista-ride.jpg", "bus.jpg"
  ];
  var STRIP_START = { itinerary: 0, register: 1, gear: 2, venue: 3, guestbook: 4, misc: 5 };

  function mountStrips() {
    document.querySelectorAll("[data-strip]").forEach(function (el) {
      var start = STRIP_START[el.getAttribute("data-strip")] || 0, n = STRIP_PHOTOS.length;
      el.setAttribute("aria-label", "Snapshot strip");
      var html = "";
      for (var i = 0; i < Math.min(8, n); i++) {
        html += '<figure class="snap"><img src="assets/strip/' + STRIP_PHOTOS[(start + i) % n] + '" alt="" loading="lazy"></figure>';
      }
      el.innerHTML = html;
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
      "Your mom's house is on the itinerary page. She gives better directions than you do.",
      "Your mom.",
      "Why don't you just give up and e-bike?",
      "Wow, your keyboard is sticky!",
      "I didn't know the circus was in town.",
      "If you don't belong, don't be long.",
      "No, your White Claw isn't invited.",
      "Whiskey is my yoga.",
      "I thought we had a restraining order against Ira?",
      "Do you follow Scandinavian Jesus this closely?",
      "Most of the people at this event don't even ride bikes.",
      "You claim it's about \"simplicity and connection with the trail.\"",
      "I don't think you're invited.",
      "Shomer fucking shabbos!",
      "Donny, you're out of your element.",
      "If you're coming, I guess I won't be, then.",
      "I will not abide another gear.",
      "They peed on your rug.",
      "I don't like you, jerk off.",
      "Hold up, you're still wanted in Bumble Bee.",
      "I swear if you bring another 22t on your bike, I'm cancelling the event.",
      "You STILL work at a bike shop?",
      "Which way would you spin me to tighten your little spoke?",
      "Is it \"speak\" or \"spoke\"?",
      "I've never even heard of drunkcyclist.",
      "Why is your mom just like me? We're both in a bike shop and everyone gets a turn!",
      "Shitter's full... already.",
      "What are you, a fucking park ranger?",
      "You're killing my buzz.",
      "This isn't the website you're looking for.",
      "Get lost, e-biker.",
      "Why don't you do us a favor and lick the battery leads on your e-bike?",
      "Chinga tu madre.",
      "I'm way too faded for this.",
      "Whose nipple do I have to twist to get a good live band?",
      "I heart nipples... get it?!",
      "I'm one constitutional crisis away from leaving.",
      "You're not fooling anyone with that denim.",
      "What's that crust in your mustache?",
      "Dangit, Bobby.",
      "If I could kick, I would kick your ass.",
      "Everyone has to believe in something. I believe I'll have another beer.",
      "Yeah, yeah, yeah, you've got a nickname. Real original."
    ],
    index: ["Knock already. Kaolin's burning daylight.", "It's the Roca Roller. Wipe your feet."],
    camp: ["Click the fire guy. Or don't. I'm a wrench, not a cop.", "Everything here is a link except your fitness."],
    itinerary: ["\"Loosely\" planned. Like your training.", "You read the whole schedule? Nerd. You'll still miss the start."],
    register: ["There's a reason it's called a teddy bear cholla. Go ahead, give it a nice hug.", "It looks like you're trying to pay cash by mail. In this economy?", "Write your email neatly. I've seen your handwriting."],
    gear: ["A new bike won't make you faster. It'll make you broke and slow.", "Your gear list is longer than your ride will be."],
    venue: ["Tandems are singlespeeds.", "Load the map before you lose signal. You won't.", "Bumble Bee has one road in. You'll still get lost.", "Don't look for yourself in these. We cropped you out.", "These photos are AI generated. So is your fitness."],
    guestbook: ["Sign it. It's the only thing you'll finish this weekend.", "Write something nice. Or honest. Not both."],
    misc: ["I'm trying to warn you, this is just a porn site.", "Where's all the ladies' porn?", "You're on the Misc. page. Even the website doesn't know what to do with you.", "Read the doping section. Then look at your bottle. Sus."]
  };
  var SPOKEY_TRIP = [
    "Dude. I'm not a wrench anymore. I'm a guy. With feelings.",
    "Can you hear the colors? The purple is SO loud right now.",
    "I have hands now. Look at my hands. LOOK at them.",
    "Whoa, your face is doing a thing.",
    "We're all just spokes in the great wheel, man.",
    "I trued my own wheel and now I can see time.",
    "Is the guestbook breathing, or is that me?",
    "Who put the cactus in the cactus?",
    "I'm fine. Totally fine. Are the walls supposed to be furry?",
    "Barf it up if you need to. The X is right there.",
    "Kaolin's motorhome just winked at me.",
    "I can taste the singlespeed.",
    "Have you found Scandinavian Jesus yet? I think he found ME."
  ];
  var SPOKEY_TAUNTS = ["Nope.", "Too slow.", "Can't mute me either.", "Missed me.", "Hands off, pervert.", "Ha! Like your Saturday attack.", "You'll never catch me. Like the group ride.", "Personal space, please.", "Catch me on the climb. Oh wait."];

  // Spokey never repeats himself within a browser session: every line he's said is remembered in
  // sessionStorage (shared across pages, cleared when the tab closes). Only once he's used up the
  // whole list does it reset, and even then never the line he just said.
  var session = {
    get: function (k) { try { return JSON.parse(window.sessionStorage.getItem(k)) || []; } catch (e) { return []; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* whatever */ } }
  };
  function pickFresh(list, key, preferred) {
    var used = session.get(key), fresh = list.filter(function (l) { return used.indexOf(l) < 0; });
    if (!fresh.length) { used = used.slice(-1); fresh = list.filter(function (l) { return used.indexOf(l) < 0; }); }
    if (!fresh.length) fresh = list;
    var freshPreferred = (preferred || []).filter(function (l) { return fresh.indexOf(l) >= 0; });
    var from = freshPreferred.length && Math.random() < 0.5 ? freshPreferred : fresh; // this page's lines come up more often
    var line = from[Math.floor(Math.random() * from.length)];
    used.push(line); session.set(key, used);
    return line;
  }

  function mountSpokey() {
    var page = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
    var extra = SPOKEY[page] || [];
    var pool = SPOKEY.general.concat(extra);
    var normalPool = pool, normalExtra = extra, key = "ssaz-spokey-said";

    // He ignores the pointer completely (pointer-events: none in CSS), so he can't be hovered,
    // clicked, or silenced. The page watches the pointer instead and he bolts before it arrives.
    var el = document.createElement("div");
    el.className = "spokey";
    el.innerHTML =
      '<div class="spokey-bubble"><b>Spokey says:</b><p></p></div>' +
      '<img src="assets/spokey.png" width="220" height="337" alt="Spokey, a spoke wrench with googly eyes" draggable="false">';
    document.body.appendChild(el);
    var p = el.querySelector("p"), img = el.querySelector("img"), bubble = el.querySelector(".spokey-bubble");
    var line = pickFresh(pool, key, extra), revert = null, x = 0, y = 0, lastFlee = 0;
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
    setInterval(function () { if (!revert) { line = pickFresh(pool, key, extra); p.textContent = line; } }, 60000);

    // on mushrooms he becomes a person (still very much Spokey) with new material
    function trip(on) {
      img.src = on ? "assets/spokey-human.svg" : "assets/spokey.png";
      img.alt = on ? "Spokey, now a human being with a spoke-wrench head, googly eyes and a beer" : "Spokey, a spoke wrench with googly eyes";
      pool = on ? SPOKEY_TRIP : normalPool; extra = on ? [] : normalExtra; key = on ? "ssaz-spokey-trip" : "ssaz-spokey-said";
      clearTimeout(revert); revert = null;
      line = pickFresh(pool, key, extra); p.textContent = line;
    }
    document.addEventListener("ssaz-trip", function (e) { trip(e.detail); });
    if (document.documentElement.classList.contains("tripping")) trip(true);

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
      p.textContent = pickFresh(SPOKEY_TAUNTS, "ssaz-spokey-taunts");
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

  // ---------- roamers: cutouts scattered around the site, 2 random ones per page load ----------
  var ROAMERS = [
    { src: "bikes-guy.png", alt: "A mustachioed man in a fedora and purple glasses yelling \"Bikes\"" },
    { src: "roadies.png", alt: "Three roadies riding toward you, grinning" },
    { src: "clunker.png", alt: "A guy in denim hunched over an old clunker bike" },
    { src: "segura.png", alt: "Tom Segura with a microphone saying \"Bikes!\" (opens a YouTube video in a new tab)", href: "https://www.youtube.com/watch?v=LOvj5iiCmO8&pp=ygUQdG9tIHNlZ3VyYSBiaWtlcw%3D%3D" },
    { src: "gears.png", alt: "A mustachioed 80s mountain biker saying \"Fuck your gears\"" },
    { src: "crew-01.png", alt: "Two guys grinning, one with arms crossed" },
    { src: "crew-02.png", alt: "Two guys arm in arm, one giving a thumbs up with a beer" },
    { src: "crew-03.png", alt: "A band playing on a corrugated-metal stage" },
    { src: "crew-04.png", alt: "A guy with dreads flexing both arms and yelling" },
    { src: "crew-05.png", alt: "A crowd standing around a roaring bonfire at night" },
    { src: "crew-06.png", alt: "A rider in a green helmet squirting a bottle into their mouth" },
    { src: "crew-07.png", alt: "Three riders posing, one taking a swig" },
    { src: "crew-08.png", alt: "Three friends posing, one holding a can" },
    { src: "crew-09.png", alt: "A rider getting worked on at a massage table" },
    { src: "crew-10.png", alt: "Two riders in helmets grinning at the camera" },
    { src: "crew-11.png", alt: "A rider in giant purple shield sunglasses and a patched denim vest" },
    { src: "crew-12.png", alt: "A rider leaning on her handlebars, smiling" },
    { src: "crew-13.png", alt: "Two riders on the trail, one in a blazer" },
    { src: "crew-14.png", alt: "Two riders coming down the trail" },
    { src: "crew-15.png", alt: "A van with bikes on the back rack" },
    { src: "crew-16.png", alt: "Two riders charging toward the camera" },
    { src: "crew-17.png", alt: "A rider sitting cross-legged while someone holds things over his head" },
    { src: "crew-18.png", alt: "A rider on a teal bike" },
    { src: "crew-19.png", alt: "A rider in plaid grinning on the trail" },
    { src: "crew-20.png", alt: "A rider descending the trail" },
    { src: "crew-21.png", alt: "A barefoot rider carrying his bike on his shoulder" },
    { src: "crew-22.png", alt: "A rider riding no-handed with arms spread wide" },
    { src: "crew-23.png", alt: "A rider on a green fat bike charging the trail" },
    { src: "crew-24.png", alt: "A smiling rider on a pink hardtail" },
    { src: "crew-25.png", alt: "A rider in a yellow helmet coming down the trail" },
    { src: "crew-26.png", alt: "A crowd of riders standing around with beers" },
    { src: "crew-27.png", alt: "A cartoon chili pepper in sunglasses saying \"Moto, baby!\"" },
    { src: "crew-28.png", alt: "A rider in neon 90s kit popping a wheelie" },
    { src: "wiens.png", alt: "A 90s racer in a loud jersey on a yellow-forked hardtail (opens a speed game in a new tab)", href: "https://neal.fun/speed/", label: "think you're fast?" },
    { src: "crew-30.png", alt: "A 90s rock singer in a leather vest belting into a mic" },
    { src: "crew-31.png", alt: "A psychedelic cartoon sun with a face" },
    { src: "crew-32.png", alt: "A 90s racer kicking a leg out mid-trail" },
    { src: "crew-33.png", alt: "A 90s racer in blue kit on a yellow hardtail" },
    { src: "crew-34.png", alt: "A black-and-white portrait of a tattooed guy baring his teeth" },
    { src: "crew-35.png", alt: "A bald movie villain with his pinky to his lip" },
    { src: "crew-36.png", alt: "A woman with a huge afro in a studded crop top" },
    { src: "crew-37.png", alt: "A smiling 90s racer in a yellow team jersey" },
    { src: "crew-38.png", alt: "A bearded rider with a brass eagle on his helmet" },
    { src: "crew-39.png", alt: "A cartoon guy in an orange cap and mirrored shades" },
    { src: "crew-40.png", alt: "A cartoon guy in glasses cracking open a can" },
    { src: "crew-41.png", alt: "A goth rock singer in a black suit" },
    { src: "crew-42.png", alt: "A rainbow-striped novelty toy" },
    { src: "crew-43.png", alt: "An old rocker in a headband holding a cigarette" },
    { src: "crew-44.png", alt: "A country singer flipping off the camera" },
    { src: "crew-45.png", alt: "A guy in a straw sombrero" },
    { src: "crew-46.png", alt: "The Arizona Trail Association logo" },
    { src: "crew-47.png", alt: "The Arizona state flag" },
    { src: "crew-48.png", alt: "A long-haired cycling commentator grinning" },
    { src: "crew-49.png", alt: "A man holding a baby kangaroo" },
    { src: "crew-50.png", alt: "A pro rider in a green helmet and mirrored glasses" },
    { src: "crew-51.png", alt: "A black-and-white Arizona bike company badge" },
    { src: "crew-52.png", alt: "A cartoon superhero slumped at a desk" },
    { src: "crew-53.png", alt: "A bare backside on a bike saddle" },
    { src: "crew-54.png", alt: "A rider in a helmet chugging a beer" },
    { src: "crew-55.png", alt: "A long-haired guy in a bathrobe and shades, sitting slumped" },
    { src: "crew-56.png", alt: "A small-town sheriff looking skeptical" },
    { src: "crew-57.png", alt: "A magazine spread about the Cactus Cup race" },
    { src: "crew-58.png", alt: "A 90s racer in a neon jersey on a green bike" },
    { src: "crew-59.png", alt: "A rider jumping a line of guys in striped jail uniforms" },
    { src: "crew-60.png", alt: "A Gila monster sticking its tongue out" },
    { src: "crew-61.png", alt: "A coiled rattlesnake" },
    { src: "crew-62.png", alt: "The Napster cat logo" },
    { src: "crew-63.png", alt: "A Diamondback Racing team sticker" },
    { src: "crew-64.png", alt: "A Yeti Cycles vintage badge" },
    { src: "crew-65.png", alt: "A man with a jheri curl in a black suit" },
    { src: "sign-scandi-jesus.svg", alt: "A brown backcountry road sign: Have you found Scandinavian Jesus yet?" },
    { src: "scandi-jesus.jpg", alt: "A holy card of Scandinavian Jesus, in a backwards cap with sunglasses on his head", label: "Good fuckin' job, you found me. I got nothin'", big: true }
  ];

  function mountRoamers() {
    var host = document.querySelector(".catalog");
    if (!host) return;
    var COUNT = 4, picks = [], forced = [];
    var bySrc = function (src) { return ROAMERS.filter(function (r) { return r.src === src; })[0]; };
    var SIGN = bySrc("sign-scandi-jesus.svg"), JESUS = bySrc("scandi-jesus.jpg");
    var isCamp = !!document.querySelector(".scene");

    // Scandinavian Jesus quest: everyone sees the sign on the camp page; the next page they
    // open after that shows the man himself. Stage lives in localStorage: 0 -> 1 (saw sign) -> 2 (found him).
    var stage = store.get("ssaz-sj") || "0";
    if (isCamp && stage !== "2") { forced.push(SIGN); store.set("ssaz-sj", "1"); }
    else if (!isCamp && stage === "1") { forced.push(JESUS); store.set("ssaz-sj", "2"); }

    // on the campsite they'd sit on top of the clickable scene, so unless the screen is wide enough
    // for the gutters, only the forced sign shows (parked by the banner instead of in a gutter)
    var narrowCamp = isCamp && window.innerWidth < 1360;
    if (narrowCamp && !forced.length) return;

    // no repeats until you've seen them all: remember what's been shown (per browser) and draw
    // from the unseen ones in random order; when they run out, start a fresh cycle
    var seen = [];
    try { seen = JSON.parse(store.get("ssaz-roamers-seen") || "[]") || []; } catch (e) { seen = []; }
    var shuffle = function (a) { for (var n = a.length - 1; n > 0; n--) { var m = Math.floor(Math.random() * (n + 1)), t = a[n]; a[n] = a[m]; a[m] = t; } return a; };
    var notIn = function (list) { return function (r) { return list.indexOf(r.src) < 0; }; };
    picks = forced.slice();
    if (!narrowCamp) {
      var want = COUNT - picks.length, taken = picks.map(function (r) { return r.src; });
      var fresh = shuffle(ROAMERS.filter(notIn(seen.concat(taken))));
      var draw = fresh.slice(0, want);
      if (draw.length < want) {   // cycle complete: everything has been seen, start over
        seen = [];
        var used = taken.concat(draw.map(function (r) { return r.src; }));
        draw = draw.concat(shuffle(ROAMERS.filter(notIn(used))).slice(0, want - draw.length));
      }
      picks = picks.concat(draw);
    }
    picks.forEach(function (r) { if (seen.indexOf(r.src) < 0) seen.push(r.src); });
    store.set("ssaz-roamers-seen", JSON.stringify(seen));

    var firstLeft = Math.random() < 0.5;
    picks.forEach(function (r, i) {
      var el = document.createElement(r.href ? "a" : "div");
      if (r.href) { el.href = r.href; el.target = "_blank"; el.rel = "noopener"; }
      el.className = "roamer " + ((i % 2 === 0) === firstLeft ? "left" : "right");
      if (r.label) el.setAttribute("data-label", r.label);
      if (r.big) el.classList.add("big");
      if (narrowCamp) { el.classList.add("parked"); el.style.removeProperty("top"); }
      // split the page into COUNT bands top to bottom, drop one in each at a random height, sides alternating
      var band = 80 / picks.length;
      el.style.top = (12 + i * band + Math.random() * (band - 8)).toFixed(1) + "%";
      el.style.setProperty("--tilt", (Math.random() * 12 - 6).toFixed(1) + "deg");
      if (narrowCamp) el.style.top = "";
      el.innerHTML = '<img src="assets/roamers/' + r.src + '" alt="' + r.alt.replace(/"/g, "&quot;") + '">';
      host.appendChild(el);
    });
    // push each one out into the page margin; when there's no margin, let it peek in from the screen edge
    function tuck() {
      var gutter = host.getBoundingClientRect().left;
      host.querySelectorAll(".roamer:not(.parked)").forEach(function (el) {
        var w = el.offsetWidth;
        var out = Math.min(w + 12, Math.max(0, gutter - 10) + 0.4 * w);
        if (gutter > 0.6 * w) out = Math.min(out, gutter - 6 - 0.1 * w);   // real margin: stay fully on screen, overlap the page edge a little instead
        el.style[el.classList.contains("left") ? "left" : "right"] = -out + "px";
      });
    }
    tuck();
    window.addEventListener("resize", tuck);
  }

  // ---------- a bag of mushrooms in the header. DO NOT EAT. (click it to eat it) ----------
  var BAG_SVG =
    '<svg viewBox="0 0 120 150" aria-hidden="true" focusable="false">' +
    '<rect x="10" y="16" width="100" height="128" rx="10" fill="rgba(236,246,255,.78)" stroke="#7d95a8" stroke-width="3"/>' +
    '<rect x="14" y="26" width="92" height="4" fill="#CC1218"/><rect x="14" y="32" width="92" height="3" fill="#0161C9"/>' +
    '<g stroke="#3d2412" stroke-width="2.5">' +
    '<path d="M28 132 v-14 h10 v14 Z M60 136 v-16 h11 v16 Z M86 130 v-13 h10 v13 Z M46 112 v-10 h8 v10 Z" fill="#F2E6C8"/>' +
    '<path d="M18 120 q15 -22 30 0 Z M50 122 q16 -24 32 0 Z M78 119 q15 -20 30 0 Z M38 104 q12 -18 24 0 Z" fill="#8A5A2B"/>' +
    '</g>' +
    '<g fill="#F2E6C8" opacity=".9"><circle cx="30" cy="114" r="2.5"/><circle cx="64" cy="114" r="3"/><circle cx="92" cy="112" r="2.5"/><circle cx="48" cy="97" r="2"/></g>' +
    '<g transform="rotate(-5 60 64)">' +
    '<rect x="20" y="42" width="80" height="50" rx="4" fill="#fff" stroke="#111" stroke-width="3"/>' +
    '<path d="M50 50 l20 14 M70 50 l-20 14" stroke="#111" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="60" cy="52" r="7" fill="#111"/><circle cx="57" cy="51" r="1.8" fill="#fff"/><circle cx="63" cy="51" r="1.8" fill="#fff"/>' +
    '<text x="60" y="85" text-anchor="middle" font-family="Impact, \'Arial Black\', sans-serif" font-size="15" fill="#CC1218">DO NOT EAT!</text>' +
    '</g>' +
    '<path d="M18 40 q4 40 0 96" stroke="#fff" stroke-width="4" fill="none" opacity=".7" stroke-linecap="round"/>' +
    '</svg>' +
    '<span class="spark s1">&#10022;</span><span class="spark s2">&#10022;</span><span class="spark s3">&#10023;</span><span class="spark s4">&#10022;</span>';

  var TRIP_DEFS =
    '<svg class="trip-defs" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">' +
    '<filter id="ssaz-melt" x="-12%" y="-12%" width="124%" height="124%">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="2" seed="7" result="n">' +
    '<animate attributeName="baseFrequency" dur="9s" values="0.012 0.04;0.022 0.07;0.012 0.04" repeatCount="indefinite"/></feTurbulence>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="24" xChannelSelector="R" yChannelSelector="G"/></filter>' +
    '<filter id="ssaz-fur" x="-3%" y="-3%" width="106%" height="106%">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="2" result="f"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="f" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter>' +
    '</svg>';

  function setTrip(on) {
    document.documentElement.classList.toggle("tripping", on);
    try { on ? window.sessionStorage.setItem("ssaz-trip", "1") : window.sessionStorage.removeItem("ssaz-trip"); } catch (e) { /* whatever */ }
    var exit = document.querySelector(".barf");
    if (on) {
      if (!document.querySelector(".trip-defs")) document.body.insertAdjacentHTML("beforeend", TRIP_DEFS);
      if (!exit) {
        exit = document.createElement("button");
        exit.type = "button";
        exit.className = "barf";
        exit.setAttribute("aria-label", "Barf it up (end the trip)");
        exit.setAttribute("data-label", "barf it up");
        exit.innerHTML = "&#10005;";
        exit.addEventListener("click", function () { setTrip(false); });
        document.body.appendChild(exit);
      }
    } else if (exit) exit.remove();
    var ev; try { ev = new CustomEvent("ssaz-trip", { detail: on }); } catch (e) { ev = document.createEvent("CustomEvent"); ev.initCustomEvent("ssaz-trip", false, false, on); }
    document.dispatchEvent(ev);
  }

  function mountShrooms() {
    var tripping = false;
    try { tripping = window.sessionStorage.getItem("ssaz-trip") === "1"; } catch (e) { /* whatever */ }
    var banner = document.querySelector(".banner");
    if (banner) {
      var bag = document.createElement("button");
      bag.type = "button";
      bag.className = "shroom-bag";
      bag.setAttribute("aria-label", "A bag of mushrooms labeled DO NOT EAT. Eat them anyway.");
      bag.innerHTML = BAG_SVG;
      bag.addEventListener("click", function () { setTrip(true); });
      banner.appendChild(bag);

      // sit just right of the page title; if a floating cutout is in the way, sit after the tagline instead
      var place = function () {
        var B = banner.getBoundingClientRect(), W = bag.offsetWidth || 58, H = bag.offsetHeight || 73, PAD = 12;
        var rects = function (el) { if (!el) return []; var r = document.createRange(); r.selectNodeContents(el); return [].slice.call(r.getClientRects()); };
        var titleR = rects(banner.querySelector("h1")), kickR = rects(banner.querySelector(".kicker"));
        // things the bag must not cover: floating cutouts, the title, the tagline
        var blockers = [].slice.call(document.querySelectorAll(".floater, .roamer")).map(function (n) { return n.getBoundingClientRect(); }).concat(titleR, kickR);
        var free = function (x, y) {
          if (x < B.left + 6 || x + W > B.right - 6 || y < B.top + 4 || y + H > B.bottom - 4) return false;
          return !blockers.some(function (r) { return x < r.right + PAD && x + W > r.left - PAD && y < r.bottom + PAD && y + H > r.top - PAD; });
        };
        var beside = function (rs) {   // just right of a block of text, nudged up/down if needed
          if (!rs.length) return null;
          var x = Math.max.apply(null, rs.map(function (q) { return q.right; })) + 16;
          var mid = (rs[0].top + rs[rs.length - 1].bottom) / 2 - H / 2;
          for (var d = 0; d <= 60; d += 6) {
            if (free(x, mid - d)) return { x: x, y: mid - d };
            if (free(x, mid + d)) return { x: x, y: mid + d };
          }
          return null;
        };
        var pick = beside(titleR) || beside(kickR);
        if (!pick && !banner.classList.contains("bag-shelf")) { banner.classList.add("bag-shelf"); return place(); }   // grow a strip under the tagline
        for (var y = B.bottom - H - 6; !pick && y >= B.top + 4; y -= 8)
          for (var x = B.left + 16; !pick && x + W <= B.right - 6; x += 12)
            if (free(x, y)) pick = { x: x, y: y };
        bag.hidden = !pick;
        if (pick) { bag.style.left = (pick.x - B.left) + "px"; bag.style.top = (pick.y - B.top) + "px"; }
      };
      place();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
      window.addEventListener("load", place);
      window.addEventListener("resize", place);
      [].forEach.call(document.querySelectorAll(".floater img, .roamer img"), function (im) { if (!im.complete) im.addEventListener("load", place); });
    }
    if (tripping) setTrip(true);
  }

  // desktop banner cutouts are big (1.5x): stretch the banner so the cutout never hangs over the page below
  function fitBannerFloater() {
    var fl = document.querySelector(".floater"), banner = document.querySelector(".banner");
    if (!fl || !banner) return;
    var fit = function () {
      banner.style.minHeight = "";
      if (window.innerWidth <= 1300) return;
      var need = fl.getBoundingClientRect().bottom - banner.getBoundingClientRect().top + 14;
      if (need > banner.offsetHeight) banner.style.minHeight = Math.ceil(need) + "px";
    };
    fit();
    var im = fl.querySelector("img"); if (im && !im.complete) im.addEventListener("load", fit);
    window.addEventListener("resize", fit);
  }

  window.SSAZ = { sfxDoor: sfxDoor, store: store };

  document.addEventListener("DOMContentLoaded", function () {
    mountStrips();
    phoneToast();
    mountSpokey();
    if (!document.body.hasAttribute("data-gate")) mountRoamers();
    fitBannerFloater();
    mountShrooms();
  });
})();
