// === 🧠 ARSHAD MUSIC: THE ULTIMATE NEURAL SCRIPT ===
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

const fApp = initializeApp(firebaseConfig);
const db = getFirestore(fApp);

// === 👑 ELITE VIP MASTER DATABASE (Hardcoded for Zero Login Errors) ===
const VIP_DATABASE = {
    "dark_eio": { pass: "moh0909", role: "Supreme Creator 👑", theme: "theme-default", avatar: "darkeio.jpg" },
    "Muskan": { pass: "Love", role: "Elite Empress ❤️", theme: "theme-muskan", avatar: "wife.jpg" },
    "Preeti": { pass: "bff", role: "Core Bestie 🤞", theme: "theme-preeti", avatar: "bff.jpg" }
};

// --- GLOBAL APP STATE ---
let ACTIVE_USER = "";
let IS_ELITE = false;
let QUEUE = [];
let TRACK_INDEX = 0;
let SESSION_TIMER = 0;
const AUDIO = document.getElementById('audioEng');

// === 🚀 BOOT PROTOCOL ===
window.onload = async () => {
    simulateBoot();
    const token = localStorage.getItem('arshad_elite_token');
    if (token) {
        await activateElitePortal(token);
    } else {
        setTimeout(() => {
            document.getElementById('splashScreen').classList.add('hidden');
            document.getElementById('loginScreen').classList.remove('hidden');
        }, 3500);
    }
};

function simulateBoot() {
    let w = 0;
    const bar = document.getElementById('bootProgress');
    const status = document.getElementById('bootStatus');
    const tasks = ["Syncing Clouds...", "Authenticating Neural...", "Connecting to VIP Hub...", "App Ready!"];
    
    const int = setInterval(() => {
        w += 2;
        bar.style.width = w + "%";
        if (w % 25 === 0) status.innerText = tasks[Math.floor(w/26)];
        if (w >= 100) clearInterval(int);
    }, 40);
}

// === 🔐 AUTHENTICATION ENGINE ===
async function activateElitePortal(u) {
    ACTIVE_USER = u;
    IS_ELITE = !!VIP_DATABASE[u];
    
    let data = IS_ELITE ? VIP_DATABASE[u] : (await getDoc(doc(db, "users", u.toLowerCase()))).data();

    if (data) {
        // UI Application
        document.body.className = data.theme || "theme-guest";
        document.getElementById('displayUserName').innerText = u;
        document.getElementById('headerAvatar').src = data.avatar || "guest.jpg";
        document.getElementById('sideAvatar').src = data.avatar || "guest.jpg";
        document.getElementById('sideName').innerText = u;
        document.getElementById('sideRole').innerText = data.role || "Member";

        // Transitions
        document.getElementById('splashScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');

        localStorage.setItem('arshad_elite_token', u);
        
        // Load Real-time Systems
        if (IS_ELITE) startLivePulse();
        startSoulChat();
        startStatsTracker();
        fetchMusic("Top Hindi Trending");
        showToast(`Elite Access Granted: ${u}`);
    } else {
        localStorage.removeItem('arshad_elite_token');
        location.reload();
    }
}

document.getElementById('loginBtn').onclick = async () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    
    if(!u || !p) return showToast("Enter Identity!");

    // Check Local Master DB First
    if (VIP_DATABASE[u] && VIP_DATABASE[u].pass === p) {
        await activateElitePortal(u);
    } else {
        // Check Firestore for Guests
        const snap = await getDoc(doc(db, "users", u.toLowerCase()));
        if (snap.exists() && snap.data().pass === p) {
            await activateElitePortal(u);
        } else {
            document.getElementById('authError').style.display = 'block';
        }
    }
};

// === 💬 MOBILE SOUL CHAT ===
function startSoulChat() {
    const q = query(collection(db, "soulChat"), orderBy("timestamp", "asc"), limit(50));
    onSnapshot(q, (snap) => {
        const feed = document.getElementById('chatFeed');
        feed.innerHTML = '';
        snap.forEach(d => {
            const m = d.data();
            const div = document.createElement('div');
            const isV = !!VIP_DATABASE[m.user];
            div.style.padding = "10px";
            div.style.borderRadius = "12px";
            div.style.background = isV ? "rgba(0, 242, 255, 0.05)" : "rgba(255,255,255,0.03)";
            div.style.fontSize = "12px";
            div.innerHTML = `<b style="color:${isV?'#00f2ff':'#888'}">${m.user}:</b> ${m.text}`;
            feed.appendChild(div);
        });
        feed.scrollTop = feed.scrollHeight;
    });
}

document.getElementById('sendMsg').onclick = async () => {
    const input = document.getElementById('msgInput');
    if(!input.value) return;
    await addDoc(collection(db, "soulChat"), { user: ACTIVE_USER, text: input.value, timestamp: serverTimestamp() });
    input.value = '';
};

// === 🕵️‍♂️ ELITE LIVE PULSE ===
function startLivePulse() {
    onSnapshot(collection(db, "liveStatus"), (snap) => {
        const list = document.getElementById('storiesList');
        list.innerHTML = '';
        let count = 0;
        snap.forEach(d => {
            const user = d.id; const data = d.data();
            if (user !== ACTIVE_USER && VIP_DATABASE[user] && data.isPlaying) {
                count++;
                const story = document.createElement('div');
                story.className = 'story-card-v4';
                story.innerHTML = `<div class="story-ring"><img src="${VIP_DATABASE[user].avatar}"></div><span style="font-size:10px;">${user}</span>`;
                story.onclick = () => syncWithVIP(data);
                list.appendChild(story);
            }
        });
        document.getElementById('livePulse').classList.toggle('hidden', count === 0);
    });
}

function syncWithVIP(data) {
    showToast(`Syncing Frequency: ${data.user} 🔗`);
    AUDIO.src = data.audio;
    AUDIO.play();
}

// === 🎵 MOBILE MUSIC ENGINE ===
async function fetchMusic(q) {
    const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${q}`);
    const data = await res.json();
    if(data.success) {
        QUEUE = data.data.results;
        renderLibrary();
    }
}

function renderLibrary() {
    const grid = document.getElementById('songsGrid');
    grid.innerHTML = '';
    QUEUE.forEach((s, i) => {
        const card = document.createElement('div');
        card.style.display = "flex";
        card.style.alignItems = "center";
        card.style.gap = "15px";
        card.style.padding = "12px";
        card.style.background = "rgba(255,255,255,0.03)";
        card.style.borderRadius = "15px";
        card.style.marginBottom = "10px";
        card.innerHTML = `<img src="${s.image[1].url}" style="width:50px; border-radius:10px;" onclick="playTrack(${i})"><div onclick="playTrack(${i})"><h5>${s.name}</h5><p style="font-size:10px; color:#777;">${s.artists.primary[0].name}</p></div>`;
        grid.appendChild(card);
    });
}

function playTrack(i) {
    TRACK_INDEX = i;
    const s = QUEUE[i];
    AUDIO.src = s.downloadUrl[4].url;
    AUDIO.play();
    document.getElementById('trackTitle').innerText = s.name;
    document.getElementById('trackArtist').innerText = s.artists.primary[0].name;
    document.getElementById('coverArt').src = s.image[1].url;
    document.getElementById('vinylPlay').style.animationPlayState = "running";
    updateLiveBroadcast(true, s);
}

async function updateLiveBroadcast(active, s = null) {
    if (!IS_ELITE) return;
    const ref = doc(db, "liveStatus", ACTIVE_USER);
    if(active) {
        await setDoc(ref, { isPlaying:true, songName:s.name, artist:s.artists.primary[0].name, audio:s.downloadUrl[4].url, cover:s.image[2].url, user:ACTIVE_USER, timestamp: serverTimestamp() });
    } else {
        await updateDoc(ref, { isPlaying: false });
    }
}

// --- UI HANDLERS ---
document.getElementById('showChat').onclick = () => document.getElementById('chatDrawer').classList.add('open');
document.getElementById('hideChat').onclick = () => document.getElementById('chatDrawer').classList.remove('open');
document.getElementById('pfpTrigger').onclick = () => document.getElementById('sideMenu').classList.add('open');
document.getElementById('hideMenu').onclick = () => document.getElementById('sideMenu').classList.remove('open');
document.getElementById('searchBtn').onclick = () => fetchMusic(document.getElementById('searchBar').value);
document.getElementById('playBtn').onclick = () => AUDIO.paused ? (AUDIO.play(), updateLiveBroadcast(true, QUEUE[TRACK_INDEX])) : (AUDIO.pause(), updateLiveBroadcast(false));
document.getElementById('logoutBtn').onclick = () => { localStorage.removeItem('arshad_elite_token'); location.reload(); };

function startStatsTracker() {
    setInterval(async () => {
        SESSION_TIMER++;
        if(SESSION_TIMER % 60 === 0) {
            document.getElementById('valSession').innerText = `${Math.floor(SESSION_TIMER/60)}m`;
            await updateDoc(doc(db, "stats", ACTIVE_USER), { today: increment(1) });
        }
    }, 1000);
}

function showToast(m) {
    const t = document.getElementById('toast');
    t.innerText = m; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

AUDIO.onplay = () => document.getElementById('playBtn').innerHTML = '<i class="fa-solid fa-pause"></i>';
AUDIO.onpause = () => document.getElementById('playBtn').innerHTML = '<i class="fa-solid fa-play"></i>';
