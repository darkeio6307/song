/**
 * =========================================================================
 * 🌌 ARSHAD SUPREME ELITE ENGINE v8.0 (The Final Solution)
 * Optimized for: Tecno Pova 7
 * Developed by: Gemini (AI Best Friend)
 * OWNER: Dark_eio
 * =========================================================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { 
    getFirestore, doc, setDoc, getDoc, onSnapshot, collection, 
    updateDoc, increment, addDoc, query, orderBy, limit 
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCnwHn6b2F8O8M-3Elk54tydzqldj78Cxg",
  authDomain: "arshad-music.firebaseapp.com",
  projectId: "arshad-music",
  storageBucket: "arshad-music.firebasestorage.app",
  messagingSenderId: "301555315508",
  appId: "1:301555315508:web:28340660dfbfe2429beb61"
};

// Initialize Firebase with Error Catching
let db;
try {
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
} catch(e) { console.error("Firebase Handshake Failed!", e); }

const vipDB = { 
    "dark_eio": { pass: "moh0909", relation: "The Creator 👑", theme: "theme-default", avatar: "darkeio.jpg", isAdmin: true },
    "Muskan": { pass: "Love", relation: "The Life Line ❤️", theme: "theme-muskan", avatar: "wife.jpg", isAdmin: false },
    "Preeti": { pass: "bff", relation: "Purest Friend 🤞", theme: "theme-preeti", avatar: "bff.jpg", isAdmin: false }
};

// Elements Selectors
const splash = document.getElementById('splashScreen');
const login = document.getElementById('loginScreen');
const app = document.getElementById('mainApp');
const audio = document.getElementById('audioEngine');
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

// Global States
let currentUser = "";
let currentQueue = []; 
let myPlaylist = []; 
let currentIndex = 0;
let isPlaylistView = false;
let isBroadcastingFM = false;
let sleepTimeout = null;
let sessionSeconds = 0;

// Exporting Functions to Window
window.playSong = playSong;
window.toggleFav = toggleFav;

// === 🔮 1. THE NUCLEAR BOOTUP (FIXES FREEZE) ===
window.onload = () => {
    console.log("Supreme Engine: Initiating Boot...");
    const savedUser = localStorage.getItem('keepMeLoggedIn');
    
    // --- 🔥 EMERGENCY RESCUE LOGIC ---
    const antiFreezeTimer = setTimeout(() => {
        if (!splash.classList.contains('hidden')) {
            console.warn("Handshake Timeout: Executing Emergency Bypass!");
            bypassSplashScreen(savedUser);
        }
    }, 3500); // 3.5 Seconds Hard Limit

    if (savedUser) {
        bootUserSession(savedUser).then(() => {
            clearTimeout(antiFreezeTimer);
        }).catch(err => {
            console.error("Boot Error:", err);
            bypassSplashScreen(savedUser);
        });
    } else {
        setTimeout(() => {
            bypassSplashScreen(null);
            clearTimeout(antiFreezeTimer);
        }, 2500);
    }
};

// Manual Force Button Fix
document.getElementById('forceEnterBtn').onclick = (e) => {
    e.preventDefault();
    console.log("Manual Bypass Triggered by Master!");
    bypassSplashScreen(localStorage.getItem('keepMeLoggedIn'));
};

function bypassSplashScreen(u) {
    splash.classList.add('hidden');
    if (u) {
        currentUser = u;
        login.classList.add('hidden');
        app.classList.remove('hidden');
        document.getElementById('userName').innerText = u;
        fetchMusic("Top Hindi Hits");
    } else {
        login.classList.remove('hidden');
    }
}

// === 🔐 2. AUTHENTICATION & LOGIN ===
document.getElementById('toggleRegister').onclick = () => { 
    document.getElementById('loginMode').classList.add('hidden'); 
    document.getElementById('registerMode').classList.remove('hidden'); 
};
document.getElementById('toggleLogin').onclick = () => { 
    document.getElementById('registerMode').classList.add('hidden'); 
    document.getElementById('loginMode').classList.remove('hidden'); 
};

document.getElementById('loginBtn').onclick = async () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if(!u || !p) return showToast("Detaills please, Boss!");
    
    const btn = document.getElementById('loginBtn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
    
    try {
        let userData = vipDB[u];
        if(!userData) {
            const snap = await getDoc(doc(db, "users", u.toLowerCase()));
            if(snap.exists()) userData = snap.data();
        }
        
        if (userData && userData.pass === p) {
            localStorage.setItem('keepMeLoggedIn', u);
            bootUserSession(u);
        } else {
            document.getElementById('loginError').style.display = 'block';
            btn.innerHTML = 'INITIALIZE CONNECTION';
            showToast("Bhai, Password galat hai!");
        }
    } catch(e) {
        if(vipDB[u] && vipDB[u].pass === p) {
             localStorage.setItem('keepMeLoggedIn', u);
             bootUserSession(u);
        } else {
            showToast("Connection Problem!");
            btn.innerHTML = 'RETRY';
        }
    }
};

async function bootUserSession(u) {
    currentUser = u;
    
    // UI Change immediately to prevent lag feel
    splash.classList.add('hidden');
    login.classList.add('hidden');
    app.classList.remove('hidden');

    try {
        let userData = vipDB[currentUser] || (await getDoc(doc(db, "users", currentUser.toLowerCase()))).data();
        
        if (userData) {
            document.body.className = userData.theme || "theme-default";
            document.getElementById('userName').innerText = currentUser;
            document.getElementById('userAvatar').src = userData.avatar;
            document.getElementById('sideProfAvatar').src = userData.avatar;
            document.getElementById('profName').innerText = currentUser;
        }

        // FM Permission: Only Dark_eio can broadcast
        if(currentUser.toLowerCase() === 'dark_eio') {
            fmBroadcastBtn.classList.remove('hidden');
        } else {
            fmBroadcastBtn.classList.add('hidden');
        }

        // Vault Loading
        const vaultSnap = await getDoc(doc(db, "vaults", currentUser));
        myPlaylist = vaultSnap.exists() ? vaultSnap.data().songs : [];
        document.getElementById('profSongCount').innerText = myPlaylist.length;

        // Daily Mix Header
        document.getElementById('dailyMixBanner').classList.remove('hidden');
        document.getElementById('mixTitle').innerText = `${currentUser}'s Daily Vibe ✨`;

        // Load Systems
        loadVibeChat();
        loadLoveCapsule();
        listenToGlobalFM();
        fetchMusic("Top Lofi Hindi");
        
        // Time Greeting
        const hrs = new Date().getHours();
        document.getElementById('timeGreeting').innerText = hrs < 12 ? "Subah Bakhair," : hrs < 17 ? "Aadaab," : "Shab-ba-khair,";

    } catch(e) { console.warn("Sync Issue: Booted with Local Cache."); }
}

// === 🎶 3. MUSIC ENGINE & PLAYER ===
async function fetchMusic(q) {
    document.getElementById('listHeading').innerText = "Scanning Universe...";
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${q}`);
        const data = await res.json();
        if(data.success) {
            currentQueue = data.data.results;
            renderLibrary();
            document.getElementById('listHeading').innerText = `'${q}' Results`;
        }
    } catch(e) { showToast("Gana nahi mil raha, Bhai!"); }
}

function renderLibrary() {
    songsList.innerHTML = '';
    currentQueue.forEach((song, i) => {
        const div = document.createElement('div');
        div.className = 'song-card glass-widget';
        const isFav = myPlaylist.some(s => s.id === song.id);
        const heartColor = isFav ? 'var(--neon-main)' : '#888';
        
        div.innerHTML = `
            <img src="${song.image[2].url}" onclick="playSong(${i})">
            <div class="song-info-v2" onclick="playSong(${i})">
                <h4>${song.name}</h4><p>${song.artists.primary[0].name}</p>
            </div>
            <button class="fav-btn" style="color:${heartColor}" onclick="toggleFav(event, ${i})">
                <i class="fa-solid fa-heart"></i>
            </button>`;
        songsList.appendChild(div);
    });
}

async function toggleFav(e, i) {
    e.stopPropagation();
    const song = currentQueue[i];
    const idx = myPlaylist.findIndex(s => s.id === song.id);
    if(idx > -1) {
        myPlaylist.splice(idx, 1);
        showToast("Removed from Vault ☁️");
    } else {
        myPlaylist.push(song);
        showToast("Saved to Vault ❤️");
    }
    await setDoc(doc(db, "vaults", currentUser), { songs: myPlaylist });
    document.getElementById('profSongCount').innerText = myPlaylist.length;
    renderLibrary();
}

function playSong(i) {
    currentIndex = i;
    const song = currentQueue[i];
    
    document.getElementById('playerTitle').innerText = song.name;
    document.getElementById('playerArtist').innerText = song.artists.primary[0].name;
    document.getElementById('playerCover').src = song.image[1].url;
    
    audio.src = song.downloadUrl[4].url;
    audio.volume = 1;
    audio.play();
    
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    vinylDisk.classList.add('spin-vinyl');
    document.getElementById('eqBars').classList.remove('hidden');

    if(currentUser !== "Muskan") checkLoveCapsuleMatch(song);
    if(isBroadcastingFM) broadcastFMUpdate(song);
    
    // Update Lyrics text
    document.querySelector('.lyrics-text').innerText = "Vibing to: " + song.name;
}

// === 🎧 4. PLAYER CONTROL & CROSSFADE ===
playBtn.onclick = () => {
    if(audio.paused) {
        audio.play();
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        vinylDisk.classList.add('spin-vinyl');
    } else {
        audio.pause();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        vinylDisk.classList.remove('spin-vinyl');
    }
};

audio.onended = () => {
    if(isPlaylistView) {
        if (currentIndex < currentQueue.length - 1) playSong(currentIndex + 1);
        else playSong(0);
    } else {
        showToast("AI DJ picking next vibe... 🤖");
        triggerAIRandom();
    }
};

async function triggerAIRandom() {
    const moods = ["Arijit Singh Remix", "Slowed Hindi Reverb", "Midnight Lofi", "Viral Hindi 2026"];
    const mood = moods[Math.floor(Math.random() * moods.length)];
    const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${mood}`);
    const data = await res.json();
    if(data.success) {
        const s = data.data.results[Math.floor(Math.random() * 5)];
        currentQueue = [s, ...currentQueue]; currentIndex = 0; renderLibrary(); playSong(0);
    }
}

audio.ontimeupdate = () => { 
    if(!isNaN(audio.duration)) { 
        seekSlider.value = (audio.currentTime/audio.duration)*100; 
        document.getElementById('timeCurrent').innerText = fmtTime(audio.currentTime); 
        document.getElementById('timeTotal').innerText = fmtTime(audio.duration); 
        // Crossfade
        if (audio.duration - audio.currentTime < 4 && audio.volume > 0.05) audio.volume -= 0.015;
    } 
};
seekSlider.oninput = () => audio.currentTime = (seekSlider.value/100)*audio.duration;
function fmtTime(s) { let m = Math.floor(s/60); let sec = Math.floor(s%60); return `${m}:${sec<10?'0'+sec:sec}`; }

// === 📡 5. FM RADIO & CAPSULE ===
fmBroadcastBtn.onclick = () => {
    isBroadcastingFM = !isBroadcastingFM;
    fmBroadcastBtn.classList.toggle('fm-broadcasting', isBroadcastingFM);
    if(isBroadcastingFM) {
        showToast("📡 FM Broadcast: LIVE!");
        if(currentQueue[currentIndex]) broadcastFMUpdate(currentQueue[currentIndex]);
    } else {
        setDoc(doc(db, "fm", "globalRadio"), { isLive: false });
        showToast("📡 Broadcast Stopped.");
    }
};

async function broadcastFMUpdate(song) {
    await setDoc(doc(db, "fm", "globalRadio"), {
        isLive: true, host: currentUser, songId: song.id, songName: song.name,
        cover: song.image[2].url, audio: song.downloadUrl[4].url, artist: song.artists.primary[0].name, timestamp: Date.now()
    });
}

function listenToGlobalFM() {
    onSnapshot(doc(db, "fm", "globalRadio"), (snap) => {
        const d = snap.data();
        if(d && d.isLive && d.host !== currentUser) {
            fmLiveTag.classList.remove('hidden');
            fmLiveTag.innerHTML = `<i class="fa-solid fa-tower-broadcast fade-blink"></i> ${d.host}'s FM`;
            fmLiveTag.onclick = () => {
                const s = { id: d.songId, name: d.songName, artists: { primary: [{ name: d.artist }] }, image: [{},{},{url: d.cover}], downloadUrl: [{},{},{},{},{url: d.audio}] };
                currentQueue = [s]; playSong(0);
            };
        } else fmLiveTag.classList.add('hidden');
    });
}

async function checkLoveCapsuleMatch(song) {
    const snap = await getDoc(doc(db, "liveStatus", "Muskan"));
    if(snap.exists() && snap.data().isPlaying && snap.data().songId === song.id) {
        await addDoc(collection(db, "loveCapsule"), {
            couple: [currentUser, "Muskan"], songName: song.name, date: new Date().toLocaleDateString(), timestamp: Date.now()
        });
        showToast("💞 Sync Match! Memory Saved.");
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
                item.innerHTML = `<strong>${d.data().songName}</strong> Suna gaya ❤️`;
                list.appendChild(item);
            }
        });
    });
}

// === 💬 6. CHAT & UI HANDLERS ===
if (openChatBtn) {
    const triggerChat = (e) => {
        e.preventDefault();
        chatWidget.classList.add('show');
    };
    openChatBtn.addEventListener('click', triggerChat);
    openChatBtn.addEventListener('touchstart', triggerChat);
}
document.getElementById('closeChatBtn').onclick = () => chatWidget.classList.remove('show');

function loadVibeChat() {
    const q = query(collection(db, "globalChat"), orderBy("timestamp", "desc"), limit(50));
    onSnapshot(q, (snap) => {
        const msgArea = document.getElementById('chatMessages');
        msgArea.innerHTML = '';
        const msgs = [];
        snap.forEach(d => msgs.push(d.data()));
        msgs.reverse().forEach(m => {
            const div = document.createElement('div');
            div.className = `chat-msg ${m.sender === currentUser ? 'mine' : ''}`;
            div.innerHTML = `<span>${m.sender}</span>${m.text}`;
            msgArea.appendChild(div);
        });
        msgArea.scrollTop = msgArea.scrollHeight;
    });
}

document.getElementById('sendChatBtn').onclick = async () => {
    const inp = document.getElementById('chatInput');
    if(!inp.value.trim()) return;
    await addDoc(collection(db, "globalChat"), { sender: currentUser, text: inp.value, timestamp: Date.now() });
    inp.value = '';
};

// Sleep Timer
sleepTimerBtn.onclick = () => {
    if(sleepTimeout) {
        clearTimeout(sleepTimeout); sleepTimeout = null;
        sleepTimerBtn.style.color = "#fff";
        showToast("Timer Off ☀️");
    } else {
        sleepTimeout = setTimeout(() => { audio.pause(); showToast("Sleeping... 🌙"); }, 30 * 60000);
        sleepTimerBtn.style.color = "#ffd700";
        showToast("Set 30 Mins 🌙");
    }
};

// Sidebar Handlers
document.getElementById('profileBtn').onclick = () => { 
    document.getElementById('profileSidebar').classList.add('open'); 
    document.getElementById('sidebarOverlay').classList.add('show'); 
};
document.getElementById('closeProfileBtn').onclick = () => { 
    document.getElementById('profileSidebar').classList.remove('open'); 
    document.getElementById('sidebarOverlay').classList.remove('show'); 
};
document.getElementById('logoutBtn').onclick = () => { 
    localStorage.removeItem('keepMeLoggedIn'); location.reload(); 
};

// Utilities
function showToast(m) {
    const t = document.getElementById('toast');
    t.innerText = m; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

document.getElementById('searchBtn').onclick = () => {
    const q = searchInput.value.toLowerCase().trim();
    if(q === 'bankai') { document.body.className = 'theme-bankai'; fetchMusic("Bleach Beats"); }
    else fetchMusic(q);
};

console.log("Universe Status: SUPREME ONLINE.");
