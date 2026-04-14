// === 1. FIREBASE SETUP & MASTER IMPORTS ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, updateDoc, increment, addDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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

// === 2. MASTER DATABASE (VIPs) ===
const vipDB = { 
    "dark_eio": { pass: "moh0909", relation: "The Creator 👑", theme: "theme-default", avatar: "darkeio.jpg" },
    "Muskan": { pass: "Love", relation: "Wife ❤️", theme: "theme-muskan", avatar: "wife.jpg" },
    "Preeti": { pass: "bff", relation: "BFF 🤞", theme: "theme-preeti", avatar: "bff.jpg" }
};

// === 3. CORE UI ELEMENTS ===
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

// === 4. GLOBAL STATES ===
let currentUser = "";
let currentQueue = []; 
let myPlaylist = []; 
let currentIndex = 0;
let isPlaylistView = false;
let isBroadcastingFM = false;
let sleepTimeout = null;

// Essential Global Exports
window.playSong = playSong;
window.toggleFav = toggleFav;

// === 5. THE GREAT INITIALIZATION ===
window.onload = async () => {
    const savedUser = localStorage.getItem('keepMeLoggedIn');
    setTimeout(() => {
        splash.classList.add('hidden');
        if (savedUser) initializeUserSession(savedUser);
        else login.classList.remove('hidden');
    }, 3000);
};

// --- AUTH LOGIC (Expanded) ---
document.getElementById('toggleRegister').onclick = () => { 
    document.getElementById('loginMode').classList.add('hidden'); 
    document.getElementById('registerMode').classList.remove('hidden'); 
};
document.getElementById('toggleLogin').onclick = () => { 
    document.getElementById('registerMode').classList.add('hidden'); 
    document.getElementById('loginMode').classList.remove('hidden'); 
};

document.getElementById('registerBtn').onclick = async () => {
    const u = document.getElementById('regUsername').value.trim();
    const p = document.getElementById('regPassword').value.trim();
    if(!u || !p) return showToast("नाम और पासवर्ड भरें!");
    
    document.getElementById('registerBtn').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    try {
        const userRef = doc(db, "users", u.toLowerCase());
        const check = await getDoc(userRef);
        if(check.exists()) return showToast("ये नाम पहले से मौजूद है!");
        
        await setDoc(userRef, { pass: p, relation: "Music Soul 🎵", theme: "theme-guest", avatar: "guest.jpg" });
        showToast("अकाउंट बन गया! अब लॉग-इन करें।");
        document.getElementById('toggleLogin').click();
    } catch(e) { alert("Registration Error: " + e.message); }
    document.getElementById('registerBtn').innerHTML = 'REGISTER';
};

document.getElementById('loginBtn').onclick = async () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if(!u || !p) return;
    
    document.getElementById('loginBtn').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    let userData = vipDB[u] || (await getDoc(doc(db, "users", u.toLowerCase()))).data();
    
    if (userData && userData.pass === p) {
        localStorage.setItem('keepMeLoggedIn', u);
        initializeUserSession(u);
    } else {
        document.getElementById('loginError').style.display = 'block';
        document.getElementById('loginBtn').innerHTML = 'INITIALIZE';
    }
};

async function initializeUserSession(u) {
    currentUser = u;
    let userData = vipDB[currentUser] || (await getDoc(doc(db, "users", currentUser.toLowerCase()))).data();
    document.body.className = userData.theme;
    
    // Cloud Sync
    const vaultSnap = await getDoc(doc(db, "vaults", currentUser));
    myPlaylist = vaultSnap.exists() ? vaultSnap.data().songs : [];
    
    // UI Setup
    document.getElementById('userName').innerText = currentUser;
    document.getElementById('userAvatar').src = userData.avatar;
    document.getElementById('sideProfAvatar').src = userData.avatar;
    document.getElementById('profName').innerText = currentUser;
    document.getElementById('profSongCount').innerText = myPlaylist.length;
    
    // Feature: Admin Only FM
    if(currentUser.toLowerCase() === 'dark_eio') fmBroadcastBtn.classList.remove('hidden');
    else fmBroadcastBtn.classList.add('hidden');

    // Display Main
    login.classList.add('hidden');
    app.classList.remove('hidden');
    
    // Start Systems
    loadVibeChat();
    loadLoveCapsule();
    listenToGlobalFM();
    fetchMusic("Top Lofi Hindi");
    
    // Daily Mix Init
    document.getElementById('dailyMixBanner').classList.remove('hidden');
    document.getElementById('mixTitle').innerText = `${currentUser}'s Daily Vibe ✨`;
}

// === 6. THE MUSIC ENGINE (Super Expanded) ===
async function fetchMusic(q) {
    document.getElementById('listHeading').innerText = "Scanning Galaxy...";
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${q}`);
        const data = await res.json();
        if(data.success) {
            currentQueue = data.data.results;
            currentIndex = 0;
            renderLibrary();
            document.getElementById('listHeading').innerText = `'${q}' Results`;
        }
    } catch (e) { showToast("Connection Interrupted!"); }
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

async function toggleFav(e, i) {
    e.stopPropagation();
    const song = currentQueue[i];
    const btn = e.currentTarget;
    const idx = myPlaylist.findIndex(s => s.id === song.id);
    
    if(idx > -1) {
        myPlaylist.splice(idx, 1);
        btn.classList.remove('active');
        showToast("Removed from Vault ☁️");
    } else {
        myPlaylist.push(song);
        btn.classList.add('active');
        showToast("Saved to Vault ❤️");
    }
    await setDoc(doc(db, "vaults", currentUser), { songs: myPlaylist });
    document.getElementById('profSongCount').innerText = myPlaylist.length;
}

function playSong(i) {
    currentIndex = i;
    const song = currentQueue[i];
    
    document.getElementById('playerTitle').innerText = song.name;
    document.getElementById('playerArtist').innerText = song.artists.primary[0].name;
    document.getElementById('playerCover').src = song.image[1].url;
    
    audio.src = song.downloadUrl[4].url;
    audio.volume = 1; // Crossfade Reset
    audio.play();
    
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    vinylDisk.classList.add('spin-vinyl');
    
    // Trigger Features
    if(currentUser !== "Muskan") checkLoveCapsule(song);
    if(isBroadcastingFM) broadcastFM(song);
}

// === 7. ADVANCED PLAYER CONTROLS ===
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
    if(isPlaylistView && currentIndex < currentQueue.length - 1) {
        playSong(currentIndex + 1);
    } else {
        showToast("AI Selecting next vibe... 🤖");
        playRandomAI();
    }
};

async function playRandomAI() {
    const moods = ["Viral Hindi 2026", "Arijit Singh Remix", "Midnight Lofi", "Viral Slowed Reverb"];
    const mood = moods[Math.floor(Math.random() * moods.length)];
    const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${mood}`);
    const data = await res.json();
    if(data.success) {
        const song = data.data.results[Math.floor(Math.random() * 5)];
        currentQueue = [song, ...currentQueue];
        currentIndex = 0;
        renderLibrary();
        playSong(0);
    }
}

// === 8. FM RADIO BROADCAST (Feature 19) ===
fmBroadcastBtn.onclick = () => {
    isBroadcastingFM = !isBroadcastingFM;
    fmBroadcastBtn.classList.toggle('fm-broadcasting', isBroadcastingFM);
    if(isBroadcastingFM) {
        showToast("📡 FM Broadcast Active!");
        if(currentQueue[currentIndex]) broadcastFM(currentQueue[currentIndex]);
    } else {
        setDoc(doc(db, "fm", "globalRadio"), { isLive: false });
        showToast("📡 Broadcast Stopped.");
    }
};

async function broadcastFM(song) {
    await setDoc(doc(db, "fm", "globalRadio"), {
        isLive: true,
        host: currentUser,
        songId: song.id,
        songName: song.name,
        cover: song.image[2].url,
        audio: song.downloadUrl[4].url,
        artist: song.artists.primary[0].name,
        timestamp: Date.now()
    });
}

function listenToGlobalFM() {
    onSnapshot(doc(db, "fm", "globalRadio"), (snap) => {
        const data = snap.data();
        if(data && data.isLive && data.host !== currentUser) {
            fmLiveTag.classList.remove('hidden');
            fmLiveTag.innerHTML = `<i class="fa-solid fa-tower-broadcast fade-blink"></i> ${data.host}'s FM`;
            fmLiveTag.onclick = () => {
                const song = { id: data.songId, name: data.songName, artists: { primary: [{ name: data.artist }] }, image: [{},{},{url: data.cover}], downloadUrl: [{},{},{},{},{url: data.audio}] };
                currentQueue = [song]; playSong(0);
            };
        } else fmLiveTag.classList.add('hidden');
    });
}

// === 9. LOVE CAPSULE (Feature 23) ===
async function checkLoveCapsule(song) {
    const snap = await getDoc(doc(db, "liveStatus", "Muskan"));
    if(snap.exists() && snap.data().isPlaying && snap.data().songId === song.id) {
        await addDoc(collection(db, "loveCapsule"), {
            couple: [currentUser, "Muskan"],
            songName: song.name,
            date: new Date().toLocaleDateString(),
            timestamp: Date.now()
        });
        showToast("💞 Sync Match! Memory Saved.");
    }
}

function loadLoveCapsule() {
    onSnapshot(query(collection(db, "loveCapsule"), orderBy("timestamp", "desc"), limit(5)), (snap) => {
        const list = document.getElementById('capsuleList');
        list.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            if(data.couple.includes(currentUser)) {
                const item = document.createElement('div');
                item.className = 'capsule-item';
                item.innerHTML = `<strong>${data.songName}</strong> Saath suna gaya on ${data.date} ❤️`;
                list.appendChild(item);
            }
        });
    });
}

// === 10. VOICE & EASTER EGGS ===
document.getElementById('searchBtn').onclick = () => {
    isPlaylistView = false;
    const q = searchInput.value.trim().toLowerCase();
    if(q === 'bankai') { document.body.className = 'theme-bankai'; fetchMusic("Bleach Beats"); }
    else if(q === 'domain expansion') { document.body.className = 'theme-domain'; fetchMusic("Jujutsu Kaisen"); }
    else fetchMusic(q);
};

// Voice Command
if ('webkitSpeechRecognition' in window) {
    const rec = new webkitSpeechRecognition();
    micBtn.onclick = () => { rec.start(); micBtn.classList.add('mic-listening'); };
    rec.onresult = (e) => { 
        searchInput.value = e.results[0][0].transcript; 
        document.getElementById('searchBtn').click(); 
        micBtn.classList.remove('mic-listening');
    };
}

// === 11. CHAT LOGIC (100% Working) ===
openChatBtn.addEventListener('click', (e) => {
    e.preventDefault();
    chatWidget.classList.add('show');
});

document.getElementById('closeChatBtn').onclick = () => chatWidget.classList.remove('show');

function loadVibeChat() {
    onSnapshot(query(collection(db, "globalChat"), orderBy("timestamp", "desc"), limit(50)), (snap) => {
        const area = document.getElementById('chatMessages');
        area.innerHTML = '';
        const msgs = [];
        snap.forEach(d => msgs.push(d.data()));
        msgs.reverse().forEach(m => {
            const div = document.createElement('div');
            div.className = `chat-msg ${m.sender === currentUser ? 'mine' : ''}`;
            div.innerHTML = `<span>${m.sender}</span>${m.text}`;
            area.appendChild(div);
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

// === 12. SLEEP TIMER ===
sleepTimerBtn.onclick = () => {
    if(sleepTimeout) {
        clearTimeout(sleepTimeout); sleepTimeout = null;
        sleepTimerBtn.style.color = "#fff";
        showToast("Sleep Timer Cancelled ☀️");
    } else {
        sleepTimeout = setTimeout(() => { audio.pause(); showToast("App Slept 🌙"); }, 30 * 60000);
        sleepTimerBtn.style.color = "#ffd700";
        showToast("Set for 30 Mins 🌙");
    }
};

// Helper Tools
document.getElementById('profileBtn').onclick = () => { document.getElementById('profileSidebar').classList.add('open'); document.getElementById('sidebarOverlay').classList.add('show'); };
document.getElementById('closeProfileBtn').onclick = () => { document.getElementById('profileSidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('show'); };
document.getElementById('logoutBtn').onclick = () => { localStorage.removeItem('keepMeLoggedIn'); location.reload(); };

function showToast(m) {
    const t = document.getElementById('toast');
    t.innerText = m; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}
