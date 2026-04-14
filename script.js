/**
 * =========================================================================
 * 🌌 ARSHAD SUPREME ENGINE v7.0 (The Final Architect)
 * Created with Love for: Dark_eio
 * Fixed: Loading Screen Freeze, App Persistence, Login Flow, FM Control
 * =========================================================================
 */

// === 🚀 1. FIREBASE ATOMIC IMPORTS ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { 
    getFirestore, doc, setDoc, getDoc, onSnapshot, 
    collection, updateDoc, increment, addDoc, query, 
    orderBy, limit, where 
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// --- Cloud Identity (Zero Leak Config) ---
const firebaseConfig = {
  apiKey: "AIzaSyCnwHn6b2F8O8M-3Elk54tydzqldj78Cxg",
  authDomain: "arshad-music.firebaseapp.com",
  projectId: "arshad-music",
  storageBucket: "arshad-music.firebasestorage.app",
  messagingSenderId: "301555315508",
  appId: "1:301555315508:web:28340660dfbfe2429beb61"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// === 👑 2. MASTER VIP DATABASE (Immediate Access) ===
const vipDB = { 
    "dark_eio": { 
        pass: "moh0909", 
        relation: "The Creator 👑", 
        theme: "theme-default", 
        avatar: "darkeio.jpg",
        isAdmin: true 
    },
    "Muskan": { 
        pass: "Love", 
        relation: "The Life Line ❤️", 
        theme: "theme-muskan", 
        avatar: "wife.jpg",
        isAdmin: false
    },
    "Preeti": { 
        pass: "bff", 
        relation: "Best Friend 🤞", 
        theme: "theme-preeti", 
        avatar: "bff.jpg",
        isAdmin: false
    }
};

// === 🎛️ 3. CORE ELEMENT SELECTORS ===
const splash = document.getElementById('splashScreen');
const login = document.getElementById('loginScreen');
const app = document.getElementById('mainApp');
const audioEngine = document.getElementById('audioEngine');
const playBtn = document.getElementById('playBtn');
const seekSlider = document.getElementById('seekSlider');
const vinylDisk = document.getElementById('vinylDisk');
const songsList = document.getElementById('songsList');
const searchInput = document.getElementById('searchInput');
const chatWidget = document.getElementById('chatWidget');
const openChatBtn = document.getElementById('openChatBtn');
const fmBroadcastBtn = document.getElementById('fmBroadcastBtn');
const fmLiveTag = document.getElementById('fmLiveTag');
const micBtn = document.getElementById('micBtn');
const sleepTimerBtn = document.getElementById('sleepTimerBtn');
const dailyMixBanner = document.getElementById('dailyMixBanner');
const lyricsPanel = document.getElementById('lyricsPanel');

// === 📊 4. UNIVERSE STATE MANAGEMENT ===
let currentUser = "";
let currentQueue = []; 
let myPlaylist = []; 
let currentIndex = 0;
let isPlaylistView = false;
let isBroadcastingFM = false;
let sleepTimeout = null;
let sessionSeconds = 0;

// Export for Global Access
window.playSong = playSong;
window.toggleFav = toggleFav;

// === 🔮 5. ANTI-FREEZE BOOTUP PROTOCOL ===
window.onload = () => {
    console.log("System Status: Booting Supreme Engine...");
    const savedUser = localStorage.getItem('keepMeLoggedIn');
    
    // 🔥 THE ULTIMATE ANTI-FREEZE: 3.5 Second Hard Kill for Splash
    const forceStart = setTimeout(() => {
        if (!splash.classList.contains('hidden')) {
            console.warn("Handshake Timeout: Forcing UI Transition...");
            splash.classList.add('hidden');
            if (savedUser) fastBoot(savedUser);
            else login.classList.remove('hidden');
        }
    }, 3500);

    if (savedUser) {
        initializeUserSession(savedUser).then(() => {
            clearTimeout(forceStart);
        }).catch(err => {
            console.error("Boot Error:", err);
            fastBoot(savedUser);
        });
    } else {
        setTimeout(() => {
            splash.classList.add('hidden');
            login.classList.remove('hidden');
            clearTimeout(forceStart);
        }, 2500);
    }
};

function fastBoot(u) {
    currentUser = u;
    splash.classList.add('hidden');
    login.classList.add('hidden');
    app.classList.remove('hidden');
    document.getElementById('userName').innerText = currentUser;
    fetchMusic("Top Trending Hindi");
}

// === 🔐 6. AUTHENTICATION (FORCED UI FIRST) ===
document.getElementById('loginBtn').onclick = async () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if(!u || !p) return;
    
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> AUTHENTICATING...';
    
    try {
        let userData = vipDB[u] || (await getDoc(doc(db, "users", u.toLowerCase()))).data();
        
        if (userData && userData.pass === p) {
            localStorage.setItem('keepMeLoggedIn', u);
            initializeUserSession(u);
        } else {
            document.getElementById('loginError').style.display = 'block';
            loginBtn.innerHTML = 'INITIALIZE <i class="fa-solid fa-bolt"></i>';
            showToast("Bhai, Galat Password hai!");
        }
    } catch(e) {
        // Fallback for poor connection
        if(vipDB[u] && vipDB[u].pass === p) {
            localStorage.setItem('keepMeLoggedIn', u);
            initializeUserSession(u);
        } else {
            showToast("System Link Failure!");
            loginBtn.innerHTML = 'RETRY';
        }
    }
};

async function initializeUserSession(u) {
    currentUser = u;
    
    // --- 🚀 FORCED UI JUMP ---
    splash.classList.add('hidden');
    login.classList.add('hidden');
    app.classList.remove('hidden');

    try {
        let userData = vipDB[currentUser] || (await getDoc(doc(db, "users", currentUser.toLowerCase()))).data();
        
        if(userData) {
            document.body.className = userData.theme || 'theme-default';
            document.getElementById('userName').innerText = currentUser;
            document.getElementById('userAvatar').src = userData.avatar;
            document.getElementById('sideProfAvatar').src = userData.avatar;
            document.getElementById('profName').innerText = currentUser;
        }

        // Feature Visibility
        if(currentUser.toLowerCase() === 'dark_eio') fmBroadcastBtn.classList.remove('hidden');
        else fmBroadcastBtn.classList.add('hidden');

        // Stats & Mix
        startStatsTracker();
        checkDailyMix();
        
        // Background System Init
        fetchMusic("Viral Hindi Hits");
        loadVibeChat();
        loadLoveCapsule();
        listenToGlobalFM();
        
    } catch (e) { console.log("Silent Boot: Connected with Local Identity."); }
}

// === 🎶 7. MUSIC ENGINE CORE ===
async function fetchMusic(q) {
    const heading = document.getElementById('listHeading');
    heading.innerText = "Scanning Galaxy...";
    
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${q}`);
        const data = await res.json();
        
        if(data.success) {
            currentQueue = data.data.results;
            renderLibrary();
            heading.innerText = `'${q}' Results`;
        }
    } catch (e) { showToast("Gana nahi mil raha, Bhai!"); }
}

function renderLibrary() {
    songsList.innerHTML = '';
    currentQueue.forEach((song, i) => {
        const div = document.createElement('div');
        div.className = 'song-card glass-widget';
        const isFav = myPlaylist.some(s => s.id === song.id);
        
        div.innerHTML = `
            <img src="${song.image[2].url}" onclick="playSong(${i})">
            <div class="song-info-v2" onclick="playSong(${i})">
                <h4>${song.name}</h4><p>${song.artists.primary[0].name}</p>
            </div>
            <button class="fav-btn ${isFav?'active':''}" onclick="toggleFav(event, ${i})">
                <i class="fa-solid fa-heart"></i>
            </button>`;
        songsList.appendChild(div);
    });
}

function playSong(i) {
    currentIndex = i;
    const song = currentQueue[i];
    
    document.getElementById('playerTitle').innerText = song.name;
    document.getElementById('playerArtist').innerText = song.artists.primary[0].name;
    document.getElementById('playerCover').src = song.image[1].url;
    
    audioEngine.src = song.downloadUrl[4].url;
    audioEngine.volume = 1;
    audioEngine.play().then(() => {
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        vinylDisk.classList.add('spin-vinyl');
    });
    
    updateLiveStatus(true, song);
    if(isBroadcastingFM) broadcastFM(song);
    if(currentUser !== "Muskan") checkLoveMatch(song);
}

// === 🎧 8. PLAYER & CROSSFADE LOGIC ===
playBtn.onclick = () => {
    if(audioEngine.paused) {
        audioEngine.play();
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        vinylDisk.classList.add('spin-vinyl');
    } else {
        audioEngine.pause();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        vinylDisk.classList.remove('spin-vinyl');
    }
};

audioEngine.onended = () => {
    if(isPlaylistView) {
        if (currentIndex < currentQueue.length - 1) playSong(currentIndex + 1);
        else playSong(0);
    } else {
        showToast("AI is cooking next vibe... 🤖✨");
        playRandomAI();
    }
};

async function playRandomAI() {
    const moods = ["Trending Hindi", "Midnight Lofi", "Arijit Singh Hits"];
    const mood = moods[Math.floor(Math.random() * moods.length)];
    const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${mood}`);
    const data = await res.json();
    if(data.success) {
        const s = data.data.results[Math.floor(Math.random() * 5)];
        currentQueue = [s, ...currentQueue]; currentIndex = 0; renderLibrary(); playSong(0);
    }
}

audioEngine.ontimeupdate = () => { 
    if(!isNaN(audioEngine.duration)) { 
        seekSlider.value = (audioEngine.currentTime/audioEngine.duration)*100; 
        document.getElementById('timeCurrent').innerText = fmtTime(audioEngine.currentTime); 
        document.getElementById('timeTotal').innerText = fmtTime(audioEngine.duration); 
        
        // --- Crossfade Transition ---
        let timeLeft = audioEngine.duration - audioEngine.currentTime;
        if (timeLeft < 4 && audioEngine.volume > 0.05) audioEngine.volume -= 0.02;
    } 
};

seekSlider.oninput = () => audioEngine.currentTime = (seekSlider.value/100)*audioEngine.duration;
function fmtTime(s) { let m = Math.floor(s/60); let sec = Math.floor(s%60); return `${m}:${sec<10?'0'+sec:sec}`; }

// === 📻 9. GLOBAL FM & LOVE CAPSULE ===
fmBroadcastBtn.onclick = () => {
    isBroadcastingFM = !isBroadcastingFM;
    fmBroadcastBtn.classList.toggle('fm-broadcasting', isBroadcastingFM);
    if(isBroadcastingFM) {
        showToast("📡 FM Broadcast: LIVE!");
        if(currentQueue[currentIndex]) broadcastFM(currentQueue[currentIndex]);
    } else {
        setDoc(doc(db, "fm", "globalRadio"), { isLive: false });
        showToast("📡 Signal Lost.");
    }
};

async function broadcastFM(song) {
    await setDoc(doc(db, "fm", "globalRadio"), {
        isLive: true, host: currentUser, songId: song.id, songName: song.name,
        cover: song.image[2].url, audio: song.downloadUrl[4].url, artist: song.artists.primary[0].name,
        timestamp: Date.now()
    });
}

function listenToGlobalFM() {
    onSnapshot(doc(db, "fm", "globalRadio"), (snap) => {
        const d = snap.data();
        if(d && d.isLive && d.host !== currentUser) {
            fmLiveTag.classList.remove('hidden');
            fmLiveTag.innerHTML = `<i class="fa-solid fa-tower-broadcast fade-blink"></i> ${d.host}'s Live Radio`;
            fmLiveTag.onclick = () => {
                const s = { id: d.songId, name: d.songName, artists: { primary: [{ name: d.artist }] }, image: [{},{},{url: d.cover}], downloadUrl: [{},{},{},{},{url: d.audio}] };
                currentQueue = [s]; playSong(0);
            };
        } else fmLiveTag.classList.add('hidden');
    });
}

async function checkLoveMatch(song) {
    const snap = await getDoc(doc(db, "liveStatus", "Muskan"));
    if(snap.exists() && snap.data().isPlaying && snap.data().songId === song.id) {
        await addDoc(collection(db, "loveCapsule"), {
            couple: [currentUser, "Muskan"], songName: song.name, date: new Date().toLocaleDateString(), timestamp: Date.now()
        });
        showToast("💞 Sync Match! Saved in Capsule.");
    }
}

function loadLoveCapsule() {
    const q = query(collection(db, "loveCapsule"), orderBy("timestamp", "desc"), limit(5));
    onSnapshot(q, (snap) => {
        const list = document.getElementById('capsuleList');
        list.innerHTML = '';
        snap.forEach(d => {
            if(d.data().couple.includes(currentUser)) {
                const item = document.createElement('div');
                item.className = 'capsule-item';
                item.innerHTML = `<strong>${d.data().songName}</strong> Saath suna gaya ❤️`;
                list.appendChild(item);
            }
        });
    });
}

// === 💬 10. VIBE CHAT (FORCED CLICK FIX) ===
if (openChatBtn) {
    const trigger = (e) => {
        e.preventDefault();
        e.stopPropagation();
        chatWidget.classList.add('show');
    };
    openChatBtn.addEventListener('click', trigger);
    openChatBtn.addEventListener('touchstart', trigger);
}

document.getElementById('closeChatBtn').onclick = () => chatWidget.classList.remove('show');

function loadVibeChat() {
    const q = query(collection(db, "globalChat"), orderBy("timestamp", "desc"), limit(50));
    onSnapshot(q, (snap) => {
        const area = document.getElementById('chatMessages');
        area.innerHTML = '';
        const msgs = [];
        snap.forEach(d => msgs.push(d.data()));
        msgs.reverse().forEach(m => {
            const d = document.createElement('div');
            d.className = `chat-msg ${m.sender === currentUser ? 'mine' : ''}`;
            d.innerHTML = `<span>${m.sender}</span>${m.text}`;
            area.appendChild(d);
        });
        area.scrollTop = area.scrollHeight;
    });
}

document.getElementById('sendChatBtn').onclick = async () => {
    const inp = document.getElementById('chatInput');
    if(!inp.value.trim()) return;
    await addDoc(collection(db, "globalChat"), { sender: currentUser, text: inp.value, timestamp: Date.now() });
    inp.value = '';
};

// === 🛠️ 11. UTILITIES & STATS ===
function startStatsTracker() {
    setInterval(() => {
        sessionSeconds++;
        if (sessionSeconds % 60 === 0) {
            updateDoc(doc(db, "stats", currentUser), { today: increment(1) }).catch(()=>{});
        }
    }, 1000);
}

function showToast(m) {
    const t = document.getElementById('toast');
    t.innerText = m; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3500);
}

function checkDailyMix() {
    dailyMixBanner.classList.remove('hidden');
    document.getElementById('playDailyMixBtn').onclick = () => {
        fetchMusic("Trending Viral Hindi");
        showToast("AI Mix Generated! 🎧✨");
    };
}

// Sidebar Controls
document.getElementById('profileBtn').onclick = () => { 
    document.getElementById('profileSidebar').classList.add('open'); 
    document.getElementById('sidebarOverlay').classList.add('show'); 
};
document.getElementById('closeProfileBtn').onclick = () => { 
    document.getElementById('profileSidebar').classList.remove('open'); 
    document.getElementById('sidebarOverlay').classList.remove('show'); 
};
document.getElementById('logoutBtn').onclick = () => { 
    localStorage.removeItem('keepMeLoggedIn'); 
    location.reload(); 
};

// Search Easter Eggs
document.getElementById('searchBtn').onclick = () => {
    const q = searchInput.value.toLowerCase().trim();
    if(q === 'bankai') { document.body.className = 'theme-bankai'; fetchMusic("Bleach Ost"); }
    else if(q === 'domain expansion') { document.body.className = 'theme-domain'; fetchMusic("JJK Hits"); }
    else fetchMusic(q);
};

console.log("Universe Status: ARSHAD SUPREME ONLINE.");
