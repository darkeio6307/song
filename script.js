/**
 * =========================================================================
 * 🌌 ARSHAD SUPREME ENGINE v18.0 (The Glassmorphism Zenith)
 * Optimized for: Tecno Pova 7
 * FIXED: Infinite Scroll Pagination, Glass Login UI, Anti-Freeze 
 * =========================================================================
 */

// === 🔥 STEP 0: KILL OLD CACHE ===
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) { registration.unregister(); }
    });
}

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

let db;
try {
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
} catch(e) { console.error("Firebase Connect Failed!"); }

const vipDB = { 
    "dark_eio": { pass: "moh0909", relation: "The Creator 👑", badge: "Universe Lord", theme: "theme-default", avatar: "darkeio.jpg" },
    "Muskan": { pass: "Love", relation: "The Life Line ❤️", badge: "Queen", theme: "theme-muskan", avatar: "wife.jpg" },
    "Preeti": { pass: "bff", relation: "Purest Friend 🤞", badge: "Angel", theme: "theme-preeti", avatar: "bff.jpg" }
};

// Selectors
const splash = document.getElementById('splashScreen');
const login = document.getElementById('loginScreen');
const app = document.getElementById('mainApp');
const audio = document.getElementById('audioEngine');
const playBtn = document.getElementById('playBtn');
const fmBroadcastBtn = document.getElementById('fmBroadcastBtn');
const fmLiveTag = document.getElementById('fmLiveTag');
const micBtn = document.getElementById('micBtn');

// Global States
let currentUser = "";
let currentQueue = [];
let myPlaylist = [];
let currentIndex = 0;
let isPlaylistView = false;
let isBroadcastingFM = false;
let isListeningToFM = false;
let currentFMSongId = null; 
let currentChatPartner = null;
let chatUnsub = null;

// Infinite Scroll Engine
let currentPage = 1;
let currentQuery = "Top Hindi Hits";
let isLoadingMore = false;
let hasMoreSongs = true;

// Helper: Haptics
function vibeClick() { if(navigator.vibrate) navigator.vibrate(40); }

window.playSong = playSong;
window.toggleFav = toggleFav;

// === 🔮 1. BOOTUP & ANTI-FREEZE ===
window.onload = () => {
    const savedUser = localStorage.getItem('keepMeLoggedIn');
    
    const emergencyForce = setTimeout(() => {
        if (!splash.classList.contains('hidden')) bypassBoot(savedUser);
    }, 3500);

    if (savedUser) {
        bootSession(savedUser, true).then(() => clearTimeout(emergencyForce)).catch(() => bypassBoot(savedUser));
    } else {
        setTimeout(() => { splash.classList.add('hidden'); login.classList.remove('hidden'); clearTimeout(emergencyForce); }, 2500);
    }
};

document.getElementById('forceEnterBtn').onclick = () => bypassBoot(localStorage.getItem('keepMeLoggedIn'));

function bypassBoot(u) {
    splash.classList.add('hidden');
    if(u) { currentUser = u; login.classList.add('hidden'); app.classList.remove('hidden'); fetchMusic("Trending Hits"); }
    else login.classList.remove('hidden');
}

// === 🔐 2. PURE GLASS AUTHENTICATION ===
document.getElementById('toggleRegister').onclick = () => { document.getElementById('loginMode').classList.add('hidden'); document.getElementById('registerMode').classList.remove('hidden'); };
document.getElementById('toggleLogin').onclick = () => { document.getElementById('registerMode').classList.add('hidden'); document.getElementById('loginMode').classList.remove('hidden'); };

document.getElementById('loginBtn').onclick = async () => {
    vibeClick();
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if(!u || !p) return showToast("Details toh bharo!");
    
    document.getElementById('loginBtn').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> LOADING...';
    
    let userData = vipDB[u];
    if(!userData) {
        try { const snap = await getDoc(doc(db, "users", u.toLowerCase())); if(snap.exists()) userData = snap.data(); } catch(e) {}
    }
    
    if (userData && userData.pass === p) {
        localStorage.setItem('keepMeLoggedIn', u); bootSession(u, true);
    } else {
        document.getElementById('loginError').style.display = 'block';
        document.getElementById('loginBtn').innerHTML = 'INITIALIZE'; showToast("Galat Password!");
    }
};

// === 🌌 3. MASTER SESSION ===
async function bootSession(u, showWelcome = false) {
    currentUser = u;
    splash.classList.add('hidden'); login.classList.add('hidden'); app.classList.remove('hidden');

    try {
        let userData = vipDB[currentUser] || (await getDoc(doc(db, "users", currentUser.toLowerCase()))).data();
        if(userData) {
            document.body.className = userData.theme || "theme-default";
            document.getElementById('userAvatar').src = userData.avatar;
            document.getElementById('sideProfAvatar').src = userData.avatar;
            document.getElementById('profRelation').innerText = userData.relation || "Vibe Listener";
            document.getElementById('userBadge').innerText = userData.badge || "Pro Member";
        }
        
        document.getElementById('userName').innerText = currentUser;
        document.getElementById('profName').innerText = currentUser;

        const hrs = new Date().getHours();
        let greet = hrs < 12 ? "Good Morning," : hrs < 17 ? "Good Afternoon," : hrs < 21 ? "Good Evening," : "Good Night,";
        document.getElementById('timeGreeting').innerText = greet;

        if(showWelcome) {
            const lowerU = currentUser.toLowerCase();
            if(lowerU === "dark_eio") showToast("Welcome back Lord 👑");
            else if(lowerU === "muskan") showToast("Welcome back Sweetheart ❤️");
            else if(lowerU === "preeti") showToast("Welcome back Angel 🥀");
            else showToast("Welcome back Master 🎧");
        }

        if(currentUser.toLowerCase() === 'dark_eio') fmBroadcastBtn.classList.remove('hidden');
        
        const vSnap = await getDoc(doc(db, "vaults", currentUser));
        myPlaylist = vSnap.exists() ? vSnap.data().songs : [];
        document.getElementById('profSongCount').innerText = myPlaylist.length;

        trackAndLoadStats();
        fetchMusic(currentQuery); 
        listenToGlobalFM();
        loadLoveCapsule();
        
    } catch(e) { console.log("Booted offline."); }
}

function trackAndLoadStats() {
    setInterval(() => { updateDoc(doc(db, "stats", currentUser), { today: increment(1) }).catch(()=>{}); }, 60000);
    onSnapshot(doc(db, "stats", currentUser), (snap) => {
        if(snap.exists()) { document.getElementById('statToday').innerText = snap.data().today || 0; }
        else setDoc(doc(db, "stats", currentUser), { today: 0 });
    });
}

// === 🎶 4. INFINITE SCROLL MUSIC ENGINE (Fixed) ===
async function fetchMusic(q, isLoadMore = false) {
    const heading = document.getElementById('listHeading');
    const loader = document.getElementById('infiniteLoader');
    
    if(!isLoadMore) {
        currentPage = 1;
        currentQuery = q;
        heading.innerText = "Scanning Galaxy...";
        hasMoreSongs = true;
        currentQueue = [];
    } else {
        loader.classList.remove('hidden');
    }
    
    isLoadingMore = true;
    
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${q}&page=${currentPage}&limit=50`);
        const data = await res.json();
        
        if(data.success && data.data.results.length > 0) {
            const startIndex = currentQueue.length;
            currentQueue = [...currentQueue, ...data.data.results];
            
            if(isLoadMore) {
                appendLibrary(data.data.results, startIndex);
            } else {
                renderLibrary();
                heading.innerText = `'${q}' - Infinite Vibes`;
            }
        } else {
            hasMoreSongs = false;
            if(!isLoadMore) showToast("No matches found.");
        }
    } catch(e) { if(!isLoadMore) showToast("Network Drop!"); }
    
    isLoadingMore = false;
    loader.classList.add('hidden');
}

function renderLibrary() {
    document.getElementById('songsList').innerHTML = '';
    appendLibrary(currentQueue, 0);
}

function appendLibrary(songs, startIndex) {
    const list = document.getElementById('songsList');
    songs.forEach((song, i) => {
        const globalIndex = startIndex + i;
        const div = document.createElement('div');
        div.className = 'song-card glass-widget';
        const isFav = myPlaylist.some(s => s.id === song.id);
        
        div.innerHTML = `<img src="${song.image[2].url}" onclick="playSong(${globalIndex})" loading="lazy">
            <div class="song-info-v2" onclick="playSong(${globalIndex})"><h4>${song.name}</h4><p>${song.artists.primary[0].name}</p></div>
            <button class="fav-btn" style="color:${isFav?'var(--neon-main)':'#555'}" onclick="toggleFav(event, ${globalIndex})"><i class="fa-solid fa-heart"></i></button>`;
        list.appendChild(div);
    });
}

// 🔥 Infinite Scroll Trigger
document.getElementById('musicLibraryContainer').addEventListener('scroll', function() {
    if(isPlaylistView || !hasMoreSongs || isLoadingMore) return; 
    
    // Check if scrolled to the bottom
    if (this.scrollTop + this.clientHeight >= this.scrollHeight - 100) {
        currentPage++;
        fetchMusic(currentQuery, true);
    }
});

async function toggleFav(e, globalIndex) {
    vibeClick(); e.stopPropagation();
    const song = currentQueue[globalIndex];
    const idx = myPlaylist.findIndex(s => s.id === song.id);
    if(idx > -1) { myPlaylist.splice(idx, 1); showToast("Removed from Vault ☁️"); } 
    else { myPlaylist.push(song); showToast("Saved to Vault ❤️"); }
    await setDoc(doc(db, "vaults", currentUser), { songs: myPlaylist });
    document.getElementById('profSongCount').innerText = myPlaylist.length;
    if(isPlaylistView) renderLibrary(); else e.currentTarget.style.color = (idx > -1) ? '#555' : 'var(--neon-main)';
}

function extractDominantColor(imgUrl) {
    bgAura.style.background = `url(${imgUrl})`;
    bgAura.style.backgroundSize = "cover";
}

function playSong(i) {
    currentIndex = i;
    const song = currentQueue[i];
    
    document.getElementById('playerTitle').innerText = song.name;
    document.getElementById('playerArtist').innerText = song.artists.primary[0].name;
    document.getElementById('playerCover').src = song.image[1].url;
    extractDominantColor(song.image[1].url); 
    
    audio.src = song.downloadUrl[4].url; audio.volume = 1; audio.play();
    
    document.getElementById('vinylDisk').classList.add('spin-vinyl');
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    document.getElementById('eqBars').classList.remove('hidden');

    if(currentUser !== "Muskan") checkLoveCapsule(song);
    if(isBroadcastingFM && currentUser.toLowerCase() === 'dark_eio') broadcastFM(song, true);

    updateLiveStatus(true, song);
}

// === 🎧 5. PLAYER CONTROLS ===
playBtn.onclick = () => {
    vibeClick();
    if(audio.paused) {
        audio.play(); playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        document.getElementById('vinylDisk').classList.add('spin-vinyl');
        if(isBroadcastingFM) broadcastFM(currentQueue[currentIndex], true);
        updateLiveStatus(true, currentQueue[currentIndex]);
    } else {
        audio.pause(); playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        document.getElementById('vinylDisk').classList.remove('spin-vinyl');
        if(isBroadcastingFM) broadcastFM(currentQueue[currentIndex], false);
        updateLiveStatus(false);
    }
};

document.getElementById('nextBtn').onclick = () => { vibeClick(); audio.onended(); };
document.getElementById('prevBtn').onclick = () => { vibeClick(); if(currentIndex > 0) playSong(currentIndex - 1); };

audio.onended = () => {
    if(isPlaylistView) { if(currentIndex < currentQueue.length - 1) playSong(currentIndex + 1); else playSong(0); } 
    else triggerAIDJ();
};

async function triggerAIDJ() {
    const moods = ["Lofi Hindi", "Arijit Singh Best", "Trending Viral 2026"];
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${moods[Math.floor(Math.random()*moods.length)]}&limit=50`);
        const data = await res.json();
        if(data.success) {
            const s = data.data.results[Math.floor(Math.random() * 20)];
            currentQueue = [s, ...currentQueue]; currentIndex = 0; renderLibrary(); playSong(0);
        }
    } catch(e){}
}

audio.ontimeupdate = () => { 
    if(!isNaN(audio.duration)) { 
        seekSlider.value = (audio.currentTime/audio.duration)*100; 
        document.getElementById('timeCurrent').innerText = fmtTime(audio.currentTime); 
        document.getElementById('timeTotal').innerText = fmtTime(audio.duration); 
        if (audio.duration - audio.currentTime < 4 && audio.volume > 0.05) audio.volume -= 0.02; 
    } 
};
seekSlider.oninput = () => audio.currentTime = (seekSlider.value/100)*audio.duration;
function fmtTime(s) { let m = Math.floor(s/60); let sec = Math.floor(s%60); return `${m}:${sec<10?'0'+sec:sec}`; }

// === 🚘 6. DRIVE / FOCUS MODE ===
document.getElementById('driveModeBtn').onclick = () => {
    vibeClick();
    const player = document.getElementById('proPlayerArea');
    const dock = document.getElementById('bottomDock');
    player.classList.toggle('drive-mode-active');
    
    if(player.classList.contains('drive-mode-active')) {
        dock.classList.add('hidden'); showToast("🚘 Focus Mode Enabled");
    } else {
        dock.classList.remove('hidden'); showToast("Focus Mode Disabled");
    }
};

// === 🎙️ 7. MIC VOICE DJ ===
if ('webkitSpeechRecognition' in window) {
    const rec = new webkitSpeechRecognition();
    rec.lang = 'hi-IN';
    micBtn.onclick = () => { vibeClick(); rec.start(); micBtn.classList.add('mic-listening'); };
    rec.onresult = (e) => { 
        searchInput.value = e.results[0][0].transcript; 
        document.getElementById('searchBtn').click(); 
        micBtn.classList.remove('mic-listening');
    };
    rec.onerror = () => micBtn.classList.remove('mic-listening');
}

// === 📡 8. FM KILL SWITCH & SYNC ===
fmBroadcastBtn.onclick = () => {
    vibeClick();
    isBroadcastingFM = !isBroadcastingFM;
    fmBroadcastBtn.style.color = isBroadcastingFM ? "#00ff88" : "#fff";
    if(isBroadcastingFM) {
        showToast("📡 FM Broadcast: LIVE!");
        if(currentQueue[currentIndex]) broadcastFM(currentQueue[currentIndex], !audio.paused);
    } else {
        setDoc(doc(db, "fm", "globalRadio"), { isLive: false });
        showToast("📡 Broadcast Ended.");
    }
};

async function broadcastFM(song, isPlayingStatus) {
    await setDoc(doc(db, "fm", "globalRadio"), {
        isLive: true, host: currentUser, songId: song.id, songName: song.name,
        cover: song.image[2].url, audio: song.downloadUrl[4].url, artist: song.artists.primary[0].name, isPlaying: isPlayingStatus, timestamp: Date.now()
    });
}

function listenToGlobalFM() {
    onSnapshot(doc(db, "fm", "globalRadio"), (snap) => {
        const d = snap.data();
        if(d && d.isLive && d.host !== currentUser) {
            fmLiveTag.classList.remove('hidden');
            fmLiveTag.innerHTML = `<i class="fa-solid fa-tower-broadcast fade-blink"></i> ${d.host}'s Live FM`;
            currentFMSongId = d.songId; 
            
            if (isListeningToFM) {
                if (audio.src !== d.audio) {
                    showToast(`Host changed track! 📻`);
                    const s = { id: d.songId, name: d.songName, artists: { primary: [{ name: d.artist }] }, image: [{},{},{url: d.cover}], downloadUrl: [{},{},{},{},{url: d.audio}] };
                    currentQueue = [s]; playSong(0); 
                }
                if(d.isPlaying === false && !audio.paused) { audio.pause(); playBtn.innerHTML = '<i class="fa-solid fa-play"></i>'; document.getElementById('vinylDisk').classList.remove('spin-vinyl'); } 
                else if(d.isPlaying === true && audio.paused) { audio.play(); playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'; document.getElementById('vinylDisk').classList.add('spin-vinyl'); }
            }

            fmLiveTag.onclick = () => {
                if(!isListeningToFM) {
                    isListeningToFM = true; fmLiveTag.style.color = "#00ff88"; 
                    const s = { id: d.songId, name: d.songName, artists: { primary: [{ name: d.artist }] }, image: [{},{},{url: d.cover}], downloadUrl: [{},{},{},{},{url: d.audio}] };
                    currentQueue = [s]; playSong(0);
                    if(!d.isPlaying) setTimeout(()=>{ audio.pause(); }, 500);
                } else {
                    isListeningToFM = false; fmLiveTag.style.color = "#ff3366"; audio.pause();
                }
            };
        } else {
            fmLiveTag.classList.add('hidden');
            currentFMSongId = null;
            if(isListeningToFM) {
                isListeningToFM = false; audio.pause(); playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                showToast("Host ended the broadcast.");
            }
        }
    });
}

window.addEventListener('beforeunload', () => {
    if(isBroadcastingFM && currentUser.toLowerCase() === 'dark_eio') setDoc(doc(db, "fm", "globalRadio"), { isLive: false });
    updateLiveStatus(false);
});

// === 💬 9. WHATSAPP CHAT & LISTENERS ===
document.getElementById('btnChatToggle').onclick = () => {
    vibeClick();
    document.getElementById('chatWidget').classList.add('show');
    document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active'));
    document.getElementById('btnChatToggle').classList.add('active');
    
    onSnapshot(collection(db, "liveStatus"), (snap) => {
        if(currentChatPartner) return; 
        const list = document.getElementById('onlineUsersList'); list.innerHTML = '';
        let count = 0;
        
        snap.forEach(docSnap => {
            const data = docSnap.data();
            if(docSnap.id !== currentUser && data.lastSeen > (Date.now() - 60000)) {
                count++;
                const isListener = (data.songId === currentFMSongId && currentFMSongId != null);
                const badge = isListener ? `<span class="fm-listener-badge">🎧 Listening</span>` : `<span style="font-size:10px; color:#00ff88;">🟢 Online</span>`;
                
                const item = document.createElement('div');
                item.className = 'contact-item';
                item.innerHTML = `<img src="${data.avatar || 'guest.jpg'}">
                                  <div style="flex:1;"><h4>${docSnap.id}</h4><p>${badge}</p></div>`;
                item.onclick = () => openPrivateChat(docSnap.id, data.avatar);
                list.appendChild(item);
            }
        });
        if(count === 0) list.innerHTML = '<p class="empty-msg" style="text-align:center;">No one online 🏜️</p>';
    });
};

document.getElementById('closeChatBtn').onclick = () => {
    vibeClick();
    document.getElementById('chatWidget').classList.remove('show');
    document.getElementById('btnChatToggle').classList.remove('active');
    document.getElementById(isPlaylistView ? 'btnPlaylist' : 'btnHome').classList.add('active');
};

document.getElementById('backToContactsBtn').onclick = () => {
    vibeClick();
    document.getElementById('chatRoomView').classList.add('hidden');
    document.getElementById('chatContactsView').classList.remove('hidden');
    currentChatPartner = null; if(chatUnsub) chatUnsub();
};

function openPrivateChat(partner, avatar) {
    currentChatPartner = partner;
    document.getElementById('chatContactsView').classList.add('hidden');
    document.getElementById('chatRoomView').classList.remove('hidden');
    document.getElementById('chatPartnerName').innerText = partner;
    document.getElementById('chatPartnerAvatar').src = avatar || 'guest.jpg';
    
    const roomID = [currentUser, partner].sort().join("_");
    if(chatUnsub) chatUnsub();
    
    chatUnsub = onSnapshot(query(collection(db, `privateChats/${roomID}/messages`), orderBy("timestamp", "asc")), (snap) => {
        const area = document.getElementById('directMessages'); area.innerHTML = '';
        snap.forEach(d => {
            const m = d.data();
            const div = document.createElement('div');
            div.className = `chat-msg ${m.sender === currentUser ? 'mine' : 'them'}`;
            div.innerHTML = m.text; area.appendChild(div);
        });
        area.scrollTop = area.scrollHeight;
    });
}

document.getElementById('sendDirectChatBtn').onclick = async () => {
    const inp = document.getElementById('directChatInput');
    if(!inp.value.trim() || !currentChatPartner) return;
    const roomID = [currentUser, currentChatPartner].sort().join("_");
    await addDoc(collection(db, `privateChats/${roomID}/messages`), { sender: currentUser, text: inp.value.trim(), timestamp: Date.now() });
    inp.value = '';
};

// === 🧠 10. AI MOOD ENGINE ===
document.querySelectorAll('.mood-chip').forEach(btn => {
    btn.onclick = () => {
        vibeClick(); isPlaylistView = false;
        const mood = btn.getAttribute('data-mood');
        fetchMusic(mood); showToast(`AI generating ${btn.innerText} vibes... 🎧`);
    };
});

document.getElementById('searchBtn').onclick = () => {
    vibeClick(); isPlaylistView = false;
    const q = searchInput.value.toLowerCase().trim();
    if(q === 'bankai') { document.body.className = 'theme-bankai'; fetchMusic("Bleach 50 Songs"); }
    else fetchMusic(q);
};

// Nav & Misc Helpers
document.getElementById('btnHome').onclick = () => { 
    vibeClick(); isPlaylistView = false; document.getElementById('searchSection').style.display = 'block'; 
    document.getElementById('moodMatrix').style.display = 'flex';
    document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active')); document.getElementById('btnHome').classList.add('active');
    fetchMusic("Trending Hit Songs"); 
};
document.getElementById('btnPlaylist').onclick = () => { 
    vibeClick(); isPlaylistView = true; document.getElementById('searchSection').style.display = 'none'; 
    document.getElementById('moodMatrix').style.display = 'none';
    currentQueue = myPlaylist; renderLibrary(); document.getElementById('listHeading').innerText = "Personal Cloud Vault";
    document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active')); document.getElementById('btnPlaylist').classList.add('active');
};

async function updateLiveStatus(isPlaying, song = null) {
    if(isBroadcastingFM) return; 
    const ref = doc(db, "liveStatus", currentUser);
    if(isPlaying && song) { await setDoc(ref, { isPlaying: true, songName: song.name, songId: song.id, avatar: vipDB[currentUser]?.avatar || "guest.jpg", lastSeen: Date.now() }); } 
    else { await updateDoc(ref, { isPlaying: false, lastSeen: Date.now() }); }
}

setInterval(() => { if(currentUser) updateLiveStatus(false); }, 15000);

function loadLoveCapsule() {
    onSnapshot(query(collection(db, "loveCapsule"), orderBy("timestamp", "desc"), limit(5)), (snap) => {
        const list = document.getElementById('capsuleList'); list.innerHTML = '';
        snap.forEach(d => {
            if(d.data().couple.includes(currentUser)) {
                const div = document.createElement('div'); div.className = 'capsule-item';
                div.innerHTML = `<strong>${d.data().songName}</strong> Saath suna gaya ❤️`; list.appendChild(div);
            }
        });
    });
}
async function checkLoveCapsule(song) {
    const snap = await getDoc(doc(db, "liveStatus", "Muskan"));
    if(snap.exists() && snap.data().isPlaying && snap.data().songId === song.id) {
        await addDoc(collection(db, "loveCapsule"), { couple: [currentUser, "Muskan"], songName: song.name, date: new Date().toLocaleDateString(), timestamp: Date.now() });
    }
}

document.getElementById('logoutBtn').onclick = () => { localStorage.clear(); updateLiveStatus(false); location.reload(); };
function showToast(m) { const t = document.getElementById('toast'); t.innerText = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500); }

console.log("Zenith Engine: All Bugs Fixed & Infinite Scroll is LIVE!");
