/**
 * =========================================================================
 * 🌌 ARSHAD SUPREME ENGINE v12.0 (The Dock & Auto-Sync Update)
 * Optimized for: Tecno Pova 7
 * FIXED: GM/GN Greetings, Dock Chat UI, Host Auto-Sync FM, Custom Titles
 * =========================================================================
 */

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

const vipDB = { 
    "dark_eio": { pass: "moh0909", relation: "The Creator 👑", theme: "theme-default", avatar: "darkeio.jpg" },
    "Muskan": { pass: "Love", relation: "The Life Line ❤️", theme: "theme-muskan", avatar: "wife.jpg" },
    "Preeti": { pass: "bff", relation: "Purest Friend 🤞", theme: "theme-preeti", avatar: "bff.jpg" }
};

// Elements
const splash = document.getElementById('splashScreen');
const login = document.getElementById('loginScreen');
const app = document.getElementById('mainApp');
const audio = document.getElementById('audioEngine');
const playBtn = document.getElementById('playBtn');
const fmBroadcastBtn = document.getElementById('fmBroadcastBtn');
const fmLiveTag = document.getElementById('fmLiveTag');
const dailyMixBanner = document.getElementById('dailyMixBanner');

let currentUser = "";
let currentQueue = [];
let myPlaylist = [];
let currentIndex = 0;
let isPlaylistView = false;
let isBroadcastingFM = false;
let isListeningToFM = false; // FM Auto Sync tracker
let sleepTimeout = null;

window.playSong = playSong;
window.toggleFav = toggleFav;

// === 🔮 1. BOOTUP & ANTI-FREEZE ===
window.onload = () => {
    const savedUser = localStorage.getItem('keepMeLoggedIn');
    
    // Safety Force Enter if Firebase lags
    const forceEnter = setTimeout(() => {
        if (!splash.classList.contains('hidden')) {
            splash.classList.add('hidden');
            if (savedUser) bootSession(savedUser, false); // false = no toast on emergency boot
            else login.classList.remove('hidden');
        }
    }, 3500);

    if (savedUser) {
        bootSession(savedUser, true).then(() => clearTimeout(forceEnter)).catch(() => {});
    } else {
        setTimeout(() => {
            splash.classList.add('hidden');
            login.classList.remove('hidden');
            clearTimeout(forceEnter);
        }, 2000);
    }
};

// === 🔐 2. AUTHENTICATION ===
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
    if(!u || !p) return showToast("Details fill karo bhai!");
    
    const btn = document.getElementById('loginBtn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> LOADING...';
    
    let userData = vipDB[u];
    if(!userData) {
        try {
            const snap = await getDoc(doc(db, "users", u.toLowerCase()));
            if(snap.exists()) userData = snap.data();
        } catch(e) {}
    }
    
    if (userData && userData.pass === p) {
        localStorage.setItem('keepMeLoggedIn', u);
        bootSession(u, true);
    } else {
        document.getElementById('loginError').style.display = 'block';
        btn.innerHTML = 'INITIALIZE <i class="fa-solid fa-bolt"></i>';
        showToast("Galat Password!");
    }
};

// === 🌌 3. THE MASTER SESSION ===
async function bootSession(u, showWelcomeToast = false) {
    currentUser = u;
    
    splash.classList.add('hidden');
    login.classList.add('hidden');
    app.classList.remove('hidden');

    try {
        let userData = vipDB[currentUser] || (await getDoc(doc(db, "users", currentUser.toLowerCase()))).data();
        if(userData) {
            document.body.className = userData.theme || "theme-default";
            document.getElementById('userAvatar').src = userData.avatar;
            document.getElementById('sideProfAvatar').src = userData.avatar;
        }
        
        document.getElementById('userName').innerText = currentUser;
        document.getElementById('profName').innerText = currentUser;

        // === Feature: GM/GA/GE/GN Time Greeting ===
        const hrs = new Date().getHours();
        let timeGreet = "Good Morning,";
        if(hrs >= 12 && hrs < 17) timeGreet = "Good Afternoon,";
        else if(hrs >= 17 && hrs < 21) timeGreet = "Good Evening,";
        else if(hrs >= 21 || hrs < 4) timeGreet = "Good Night,";
        document.getElementById('timeGreeting').innerText = timeGreet;

        // === Feature: Custom Welcomes ===
        if(showWelcomeToast) {
            let welcomeMsg = "";
            const lowerU = currentUser.toLowerCase();
            if(lowerU === "dark_eio") welcomeMsg = "Welcome back Lord 👑";
            else if(lowerU === "muskan") welcomeMsg = "Welcome back Sweetheart ❤️";
            else if(lowerU === "preeti") welcomeMsg = "Welcome back Angel 🥀";
            else welcomeMsg = "Welcome back Master 🎧";
            showToast(welcomeMsg);
        }

        // FM Permission (Feature 1)
        if(currentUser.toLowerCase() === 'dark_eio') fmBroadcastBtn.classList.remove('hidden');
        else fmBroadcastBtn.classList.add('hidden');

        // Dynamic Daily Mix (Name removed, static AI title)
        document.getElementById('mixTitle').innerText = `Daily Vibe ✨`;
        dailyMixBanner.classList.remove('hidden');

        // Load Vault
        const vSnap = await getDoc(doc(db, "vaults", currentUser));
        myPlaylist = vSnap.exists() ? vSnap.data().songs : [];
        document.getElementById('profSongCount').innerText = myPlaylist.length;

        // Init Background Systems
        fetchMusic("Top Lofi Hindi");
        listenToGlobalFM();
        loadLoveCapsule();
        loadVibeChat();
        
    } catch(e) { console.log("Booted locally."); }
}

// === 🎶 4. MUSIC ENGINE ===
async function fetchMusic(q) {
    document.getElementById('listHeading').innerText = "Scanning Galaxy...";
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${q}`);
        const data = await res.json();
        if(data.success) {
            currentQueue = data.data.results;
            renderLibrary();
            document.getElementById('listHeading').innerText = `'${q}' Results`;
        }
    } catch(e) {}
}

function renderLibrary() {
    const list = document.getElementById('songsList');
    list.innerHTML = '';
    currentQueue.forEach((song, i) => {
        const div = document.createElement('div');
        div.className = 'song-card glass-widget';
        const isFav = myPlaylist.some(s => s.id === song.id);
        const heartColor = isFav ? 'var(--neon-main)' : '#555';
        
        div.innerHTML = `<img src="${song.image[2].url}" onclick="playSong(${i})">
            <div class="song-info-v2" onclick="playSong(${i})"><h4>${song.name}</h4><p>${song.artists.primary[0].name}</p></div>
            <button class="fav-btn" style="color:${heartColor}" onclick="toggleFav(event, ${i})"><i class="fa-solid fa-heart"></i></button>`;
        list.appendChild(div);
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
    if(isPlaylistView) renderLibrary();
    else e.currentTarget.style.color = (idx > -1) ? '#555' : 'var(--neon-main)';
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
    
    document.getElementById('vinylDisk').classList.add('spin-vinyl');
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    document.getElementById('eqBars').classList.remove('hidden');

    if(currentUser !== "Muskan") checkLoveCapsule(song);
    
    // === FEATURE 2: AUTO-SYNC BROADCAST ===
    if(isBroadcastingFM && currentUser.toLowerCase() === 'dark_eio') {
        broadcastFM(song); // Will trigger listener's phones automatically
    }

    document.querySelector('.lyrics-text').innerHTML = `Vibing to:<br><span style="color:var(--neon-main)">${song.name}</span>`;
}

// === 🎧 5. PLAYER CONTROLS ===
playBtn.onclick = () => {
    if(audio.paused) {
        audio.play();
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        document.getElementById('vinylDisk').classList.add('spin-vinyl');
    } else {
        audio.pause();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        document.getElementById('vinylDisk').classList.remove('spin-vinyl');
    }
};

document.getElementById('nextBtn').onclick = () => audio.onended();
document.getElementById('prevBtn').onclick = () => { if(currentIndex > 0) playSong(currentIndex - 1); };

audio.onended = () => {
    if(isPlaylistView) {
        if (currentIndex < currentQueue.length - 1) playSong(currentIndex + 1);
        else playSong(0);
    } else {
        triggerAIDJ();
    }
};

async function triggerAIDJ() {
    showToast("AI fetching next vibe... 🤖");
    const moods = ["Aesthetic Lofi Hindi", "Arijit Singh Best", "Viral Hip Hop India", "Slowed Reverb Hits"];
    const mood = moods[Math.floor(Math.random() * moods.length)];
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${mood}`);
        const data = await res.json();
        if(data.success) {
            const s = data.data.results[Math.floor(Math.random() * 5)];
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

// === 📡 6. THE AUTO-SYNC FM RADIO (Feature 2) ===
fmBroadcastBtn.onclick = () => {
    isBroadcastingFM = !isBroadcastingFM;
    fmBroadcastBtn.style.color = isBroadcastingFM ? "#00ff88" : "#fff";
    if(isBroadcastingFM) {
        showToast("📡 FM Broadcast: LIVE!");
        if(currentQueue[currentIndex]) broadcastFM(currentQueue[currentIndex]);
    } else {
        setDoc(doc(db, "fm", "globalRadio"), { isLive: false });
        showToast("📡 Broadcast Stopped.");
    }
};

async function broadcastFM(song) {
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
            fmLiveTag.innerHTML = `<i class="fa-solid fa-tower-broadcast fade-blink"></i> ${d.host}'s Live Radio`;
            
            // --- Auto Sync Logic ---
            // Agar pehle se sun raha hai, aur database me gana change hua, to bina button dabaye automatic badal do!
            if (isListeningToFM) {
                if (audio.src !== d.audio) { // Check if new song is different
                    showToast(`Host changed track! 📻`);
                    const newSong = { id: d.songId, name: d.songName, artists: { primary: [{ name: d.artist }] }, image: [{},{},{url: d.cover}], downloadUrl: [{},{},{},{},{url: d.audio}] };
                    currentQueue = [newSong];
                    playSong(0); // This plays the new song immediately
                }
            }

            // Pehli baar Tune In karne ke liye
            fmLiveTag.onclick = () => {
                if(!isListeningToFM) {
                    isListeningToFM = true;
                    fmLiveTag.style.color = "#00ff88"; // Green tag to show tuned in
                    showToast(`Tuning in... Auto-Sync Enabled! 📻`);
                    const s = { id: d.songId, name: d.songName, artists: { primary: [{ name: d.artist }] }, image: [{},{},{url: d.cover}], downloadUrl: [{},{},{},{},{url: d.audio}] };
                    currentQueue = [s]; playSong(0);
                } else {
                    isListeningToFM = false; // Disconnect
                    fmLiveTag.style.color = "#ff3366";
                    showToast(`Disconnected from Radio.`);
                    audio.pause();
                }
            };

        } else {
            fmLiveTag.classList.add('hidden');
            if(isListeningToFM) {
                isListeningToFM = false;
                audio.pause();
                playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                showToast("Radio Broadcast Ended.");
            }
        }
    });
}

// === 💖 7. LOVE CAPSULE ===
async function checkLoveCapsule(song) {
    const snap = await getDoc(doc(db, "liveStatus", "Muskan"));
    if(snap.exists() && snap.data().isPlaying && snap.data().songId === song.id) {
        await addDoc(collection(db, "loveCapsule"), {
            couple: [currentUser, "Muskan"], songName: song.name, date: new Date().toLocaleDateString(), timestamp: Date.now()
        });
        showToast("💞 Sync Match! Saved in Capsule.");
    }
}

function loadLoveCapsule() {
    onSnapshot(query(collection(db, "loveCapsule"), orderBy("timestamp", "desc"), limit(5)), (snap) => {
        const list = document.getElementById('capsuleList');
        list.innerHTML = '';
        snap.forEach(d => {
            if(d.data().couple.includes(currentUser)) {
                const div = document.createElement('div');
                div.className = 'capsule-item';
                div.innerHTML = `<strong>${d.data().songName}</strong> Saath suna gaya ❤️`;
                list.appendChild(div);
            }
        });
    });
}

// === 💬 8. DOCK CHAT & UI ===
document.getElementById('btnChatToggle').onclick = () => {
    document.getElementById('chatWidget').classList.add('show');
    document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active'));
    document.getElementById('btnChatToggle').classList.add('active');
};
document.getElementById('closeChatBtn').onclick = () => {
    document.getElementById('chatWidget').classList.remove('show');
    document.getElementById('btnChatToggle').classList.remove('active');
    document.getElementById(isPlaylistView ? 'btnPlaylist' : 'btnHome').classList.add('active');
};

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

// === 🛠️ 9. GENERAL UI & AI DAILY MIX ===
document.getElementById('playDailyMixBtn').onclick = () => {
    isPlaylistView = false;
    const genericMoods = ["Trending English Beats", "Aesthetic Lofi", "Global Top 50", "Romantic Hits", "Coke Studio Best", "Electronic Dance Chill"];
    const randomVibe = genericMoods[Math.floor(Math.random() * genericMoods.length)];
    fetchMusic(randomVibe);
    showToast(`AI fetching: ${randomVibe} 🎧✨`);
};

document.getElementById('searchBtn').onclick = () => {
    isPlaylistView = false;
    const q = searchInput.value.toLowerCase().trim();
    if(q === 'bankai') { document.body.className = 'theme-bankai'; fetchMusic("Bleach Ost"); }
    else if(q === 'domain expansion') { document.body.className = 'theme-domain'; fetchMusic("JJK Hits"); }
    else fetchMusic(q);
};

document.getElementById('micBtn').onclick = () => showToast("Voice AI coming soon!");

document.getElementById('openLyricsArea').onclick = (e) => {
    if(e.target.closest('.playback-controls') || e.target.closest('.seek-wrapper')) return;
    document.getElementById('lyricsPanel').classList.add('show');
};
document.getElementById('closeLyricsBtn').onclick = () => document.getElementById('lyricsPanel').classList.remove('show');

document.getElementById('profileBtn').onclick = () => { document.getElementById('profileSidebar').classList.add('open'); document.getElementById('sidebarOverlay').classList.add('show'); };
document.getElementById('closeProfileBtn').onclick = () => { document.getElementById('profileSidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('show'); };
document.getElementById('sidebarOverlay').onclick = () => document.getElementById('closeProfileBtn').click();

// Tab Navigation
document.getElementById('btnHome').onclick = () => { 
    isPlaylistView = false; 
    document.getElementById('searchSection').style.display = 'block'; 
    dailyMixBanner.classList.remove('hidden'); 
    fetchMusic("Top Trending Hits"); 
    document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active'));
    document.getElementById('btnHome').classList.add('active');
};
document.getElementById('btnPlaylist').onclick = () => { 
    isPlaylistView = true; 
    document.getElementById('searchSection').style.display = 'none'; 
    dailyMixBanner.classList.add('hidden'); 
    currentQueue = myPlaylist; 
    renderLibrary(); 
    document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active'));
    document.getElementById('btnPlaylist').classList.add('active');
    document.getElementById('listHeading').innerText = "Personal Cloud Vault";
};

// Sleep Timer
sleepTimerBtn.onclick = () => {
    if(sleepTimeout) {
        clearTimeout(sleepTimeout); sleepTimeout = null;
        sleepTimerBtn.style.color = "#fff";
        showToast("Sleep Timer Off ☀️");
    } else {
        sleepTimeout = setTimeout(() => { audio.pause(); showToast("App Slept 🌙"); }, 30 * 60000);
        sleepTimerBtn.style.color = "#ffd700";
        showToast("Sleep mode: 30 Mins 🌙");
    }
};

document.getElementById('logoutBtn').onclick = () => { localStorage.clear(); location.reload(); };

function showToast(m) {
    const t = document.getElementById('toast');
    t.innerText = m; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3500);
}
