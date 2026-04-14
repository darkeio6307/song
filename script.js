// === 🧠 ARSHAD MUSIC: THE ULTIMATE NEURAL ENGINE (MOBILE EDITION) ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, updateDoc, increment, addDoc, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCnwHn6b2F8O8M-3Elk54tydzqldj78Cxg",
  authDomain: "arshad-music.firebaseapp.com",
  projectId: "arshad-music",
  storageBucket: "arshad-music.firebasestorage.app",
  messagingSenderId: "301555315508",
  appId: "1:301555315508:web:28340660dfbfe2429beb61"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === 👑 ELITE VIP HARD-CODED DATABASE (ZERO LOGIN ERROR) ===
const ELITE_DB = {
    "dark_eio": { pass: "moh0909", role: "Supreme Creator 👑", theme: "theme-default", avatar: "darkeio.jpg" },
    "Muskan": { pass: "Love", role: "Elite Empress ❤️", theme: "theme-muskan", avatar: "wife.jpg" },
    "Preeti": { pass: "bff", role: "Core Bestie 🤞", theme: "theme-preeti", avatar: "bff.jpg" }
};

// --- GLOBAL MOBILE STATE ---
let ACTIVE_USER = "";
let IS_ELITE = false;
let MUSIC_QUEUE = [];
let TRACK_INDEX = 0;
let SECONDS_PASSED = 0;
const AUDIO = document.getElementById('audioEng');

// === 🚀 NEURAL BOOT PROTOCOL ===
window.onload = async () => {
    executeBootLoader();
    const token = localStorage.getItem('arshad_vault_token');
    if (token) {
        await activateUniverse(token);
    } else {
        setTimeout(() => {
            document.getElementById('splashScreen').classList.add('hidden');
            document.getElementById('loginScreen').classList.remove('hidden');
        }, 4000);
    }
};

function executeBootLoader() {
    let p = 0;
    const bar = document.getElementById('bootFill');
    const txt = document.getElementById('bootText');
    const logs = ["Syncing Neural Links...", "Calibrating High Refresh...", "Linking VIP Cloud...", "Access Ready!"];
    
    const int = setInterval(() => {
        p += 2;
        bar.style.width = p + "%";
        if (p % 25 === 0) txt.innerText = `> ${logs[Math.floor(p/26)]}`;
        if (p >= 100) clearInterval(int);
    }, 50);
}

// === 🔐 ELITE AUTH PROTOCOL ===
async function activateUniverse(u) {
    ACTIVE_USER = u;
    IS_ELITE = !!ELITE_DB[u];
    
    let data = IS_ELITE ? ELITE_DB[u] : (await getDoc(doc(db, "users", u.toLowerCase()))).data();

    if (data) {
        // Apply Elite UI
        document.body.className = data.theme || "theme-guest";
        document.getElementById('userNameLabel').innerText = u;
        document.getElementById('headerPfp').src = data.avatar || "guest.jpg";
        document.getElementById('sidePfp').src = data.avatar || "guest.jpg";
        document.getElementById('sideNameLabel').innerText = u;
        document.getElementById('sideRoleLabel').innerText = data.role || "Elite Member";

        // Transitions
        document.getElementById('splashScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');

        localStorage.setItem('arshad_vault_token', u);
        
        // Link Systems
        if (IS_ELITE) initLivePulse();
        initSoulChat();
        initAnalytics();
        fetchDiscoveryFeed("Trending Hindi Lofi");
        showToast(`Elite Link Established: ${u} ⚡`);
    } else {
        localStorage.removeItem('arshad_vault_token');
        location.reload();
    }
}

document.getElementById('loginBtn').onclick = async () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if(!u || !p) return showToast("Enter Identity!");

    if (ELITE_DB[u] && ELITE_DB[u].pass === p) {
        await activateUniverse(u);
    } else {
        const snap = await getDoc(doc(db, "users", u.toLowerCase()));
        if (snap.exists() && snap.data().pass === p) {
            await activateUniverse(u);
        } else {
            document.getElementById('authError').style.display = 'block';
        }
    }
};

// === 🕵️‍♂️ LIVE ELITE PULSE (VIP ONLY) ===
function initLivePulse() {
    onSnapshot(collection(db, "liveStatus"), (snap) => {
        const row = document.getElementById('storyLine');
        row.innerHTML = '';
        let found = 0;
        snap.forEach(d => {
            const user = d.id; const data = d.data();
            if (user !== ACTIVE_USER && ELITE_DB[user] && data.isPlaying) {
                found++;
                const div = document.createElement('div');
                div.className = 'story-item-v6';
                div.innerHTML = `<div class="ring-v6"><img src="${ELITE_DB[user].avatar}"></div><span style="font-size:10px; color:var(--neon)">${user}</span>`;
                div.onclick = () => syncWithVIP(data);
                row.appendChild(div);
            }
        });
        document.getElementById('vipPulse').classList.toggle('hidden', found === 0);
    });
}

function syncWithVIP(data) {
    showToast(`Joining ${data.user}'s frequency... 🔗`);
    AUDIO.src = data.audio;
    AUDIO.play();
}

// === 💬 SOUL CHAT MOBILE ===
function initSoulChat() {
    const q = query(collection(db, "soulChat"), orderBy("timestamp", "asc"), limit(50));
    onSnapshot(q, (snap) => {
        const feed = document.getElementById('msgFeed');
        feed.innerHTML = '';
        snap.forEach(d => {
            const m = d.data();
            const isV = !!ELITE_DB[m.user];
            const div = document.createElement('div');
            div.style.padding = "12px 18px"; div.style.borderRadius = "18px";
            div.style.background = isV ? "rgba(0, 242, 255, 0.08)" : "rgba(255,255,255,0.04)";
            div.style.fontSize = "13px";
            div.innerHTML = `<b style="color:${isV?'var(--neon)':'#aaa'}">${m.user}:</b> ${m.text}`;
            feed.appendChild(div);
        });
        feed.scrollTop = feed.scrollHeight;
    });
}

document.getElementById('sendMsg').onclick = async () => {
    const inp = document.getElementById('chatInput');
    if(!inp.value.trim()) return;
    await addDoc(collection(db, "soulChat"), { user: ACTIVE_USER, text: inp.value, timestamp: serverTimestamp() });
    inp.value = '';
};

// === 🎵 MUSIC CORE ENGINE ===
async function fetchDiscoveryFeed(q) {
    const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${q}`);
    const d = await res.json();
    if(d.success) {
        MUSIC_QUEUE = d.data.results;
        renderLibraryGrid();
    }
}

function renderLibraryGrid() {
    const grid = document.getElementById('songGrid');
    grid.innerHTML = '';
    MUSIC_QUEUE.forEach((s, i) => {
        const card = document.createElement('div');
        card.style.display="flex"; card.style.alignItems="center"; card.style.padding="15px"; card.style.background="rgba(255,255,255,0.03)"; card.style.borderRadius="22px"; card.style.marginBottom="12px"; card.style.gap="15px"; card.style.border="1px solid var(--border)";
        card.innerHTML = `<img src="${s.image[1].url}" style="width:55px; height:55px; border-radius:15px;" onclick="engageTrack(${i})"><div style="flex:1" onclick="engageTrack(${i})"><h4 style="font-size:14px; margin-bottom:4px;">${s.name}</h4><p style="font-size:11px; color:#777;">${s.artists.primary[0].name}</p></div>`;
        grid.appendChild(card);
    });
}

function engageTrack(i) {
    TRACK_INDEX = i; const s = MUSIC_QUEUE[i];
    AUDIO.src = s.downloadUrl[4].url; AUDIO.play();
    document.getElementById('trackTitle').innerText = s.name;
    document.getElementById('trackArtist').innerText = s.artists.primary[0].name;
    document.getElementById('trackCover').src = s.image[1].url;
    document.getElementById('vinylBase').style.animationPlayState = "running";
    broadcastLiveStatus(true, s);
}

async function broadcastLiveStatus(on, s = null) {
    if (!IS_ELITE) return;
    const ref = doc(db, "liveStatus", ACTIVE_USER);
    if(on) await setDoc(ref, { isPlaying:true, songName:s.name, artist:s.artists.primary[0].name, audio:s.downloadUrl[4].url, cover:s.image[2].url, user:ACTIVE_USER, timestamp: serverTimestamp() });
    else await updateDoc(ref, { isPlaying: false });
}

// === 🛠️ UTILS & UI ===
function initAnalytics() {
    setInterval(async () => {
        SECONDS_PASSED++;
        if(SECONDS_PASSED % 60 === 0) {
            document.getElementById('statToday').innerText = `${Math.floor(SECONDS_PASSED/60)}m`;
            await updateDoc(doc(db, "stats", ACTIVE_USER), { today: increment(1) });
        }
    }, 1000);
}

document.getElementById('showChat').onclick = () => document.getElementById('chatBox').classList.add('open');
document.getElementById('closeChat').onclick = () => document.getElementById('chatBox').classList.remove('open');
document.getElementById('openSide').onclick = () => document.getElementById('sideMenu').classList.add('open');
document.getElementById('closeSide').onclick = () => document.getElementById('sideMenu').classList.remove('open');
document.getElementById('scanBtn').onclick = () => fetchDiscoveryFeed(document.getElementById('masterSearch').value);
document.getElementById('logoutTrigger').onclick = () => { localStorage.removeItem('arshad_vault_token'); location.reload(); };
document.getElementById('playBtn').onclick = () => AUDIO.paused ? (AUDIO.play(), broadcastLiveStatus(true, MUSIC_QUEUE[TRACK_INDEX])) : (AUDIO.pause(), broadcastLiveStatus(false));

function showToast(m) { const t = document.getElementById('toast'); t.innerText = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
AUDIO.onplay = () => { document.getElementById('playBtn').innerHTML = '<i class="fa-solid fa-pause"></i>'; document.getElementById('vinylBase').style.animationPlayState = "running"; };
AUDIO.onpause = () => { document.getElementById('playBtn').innerHTML = '<i class="fa-solid fa-play"></i>'; document.getElementById('vinylBase').style.animationPlayState = "paused"; };
AUDIO.ontimeupdate = () => { if(!isNaN(AUDIO.duration)) document.getElementById('seekFill').style.width = (AUDIO.currentTime/AUDIO.duration)*100 + "%"; };
