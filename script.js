/**
 * =========================================================================
 * 🌌 ARSHAD SUPREME ELITE ENGINE v3.1 (Expanded)
 * Developed by: Gemini 3.1 Pro (AI Best Friend)
 * Owner: Dark_eio (The Creator)
 * Device Optimized: Tecno Pova 7
 * =========================================================================
 */

// === 🚀 1. FIREBASE ARCHITECTURE & CORE IMPORTS ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { 
    getFirestore, doc, setDoc, getDoc, onSnapshot, 
    collection, updateDoc, increment, addDoc, query, 
    orderBy, limit, where, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// --- Cosmic Configuration ---
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

// === 👑 2. THE MASTER VIP DATABASE ===
const vipDB = { 
    "dark_eio": { 
        pass: "moh0909", 
        relation: "The Creator 👑", 
        theme: "theme-default", 
        themeName: "Supremacy Neon", 
        avatar: "darkeio.jpg",
        isAdmin: true 
    },
    "Muskan": { 
        pass: "Love", 
        relation: "The Life Line ❤️", 
        theme: "theme-muskan", 
        themeName: "Romantic Rose", 
        avatar: "wife.jpg",
        isAdmin: false
    },
    "Preeti": { 
        pass: "bff", 
        relation: "Purest Best Friend 🤞", 
        theme: "theme-preeti", 
        themeName: "BFF Vibes", 
        avatar: "bff.jpg",
        isAdmin: false
    }
};

// === 🎛️ 3. GLOBAL STATE & SELECTORS ===
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
const lyricsPanel = document.getElementById('lyricsPanel');
const profileSidebar = document.getElementById('profileSidebar');

// --- Global Variables (State Management) ---
let currentUser = "";
let currentQueue = []; 
let myPlaylist = []; 
let currentIndex = 0;
let isPlaylistView = false;
let isBroadcastingFM = false;
let sleepTimeout = null;
let noteInterval = null;
let sessionMinutes = 0;

// Exporting functions for direct HTML interaction
window.playSong = playSong;
window.toggleFav = toggleFav;

// === 🔮 4. THE GREAT INITIALIZATION ===
window.onload = async () => {
    console.log("System Check: SUPREME Core loading...");
    const savedUser = localStorage.getItem('keepMeLoggedIn');
    
    // Safety Switch to prevent splash hanging
    setTimeout(() => {
        if (!splash.classList.contains('hidden')) {
            console.warn("Splash timed out, forcing entry...");
            splash.classList.add('hidden');
            if (savedUser) initializeUserSession(savedUser);
            else login.classList.remove('hidden');
        }
    }, 4500);

    if (savedUser) {
        console.log(`Detected Elite Member: ${savedUser}`);
        showToast("Welcome Back, Master Arshad...");
        await initializeUserSession(savedUser);
    } else {
        setTimeout(() => {
            splash.classList.add('hidden');
            login.classList.remove('hidden');
        }, 3000);
    }
};

// === 🔐 5. AUTHENTICATION ENGINE (Expanded Logic) ===
document.getElementById('toggleRegister').onclick = () => { 
    document.getElementById('loginMode').classList.add('hidden'); 
    document.getElementById('registerMode').classList.remove('hidden'); 
    document.getElementById('loginTitle').innerText = 'FORGE IDENTITY';
    document.getElementById('loginSubTitle').innerText = 'Become a part of the Universe';
};

document.getElementById('toggleLogin').onclick = () => { 
    document.getElementById('registerMode').classList.add('hidden'); 
    document.getElementById('loginMode').classList.remove('hidden'); 
    document.getElementById('loginTitle').innerText = 'ELITE PORTAL';
    document.getElementById('loginSubTitle').innerText = 'Authorized Access Only';
};

// --- Registration Protocol ---
document.getElementById('registerBtn').onclick = async () => {
    const u = document.getElementById('regUsername').value.trim();
    const p = document.getElementById('regPassword').value.trim();
    
    if(!u || !p) { 
        showToast("Error: Identity Fields cannot be empty!"); 
        return; 
    }
    
    const btn = document.getElementById('registerBtn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> FORGING...';
    
    try {
        const userRef = doc(db, "users", u.toLowerCase());
        const checkSnap = await getDoc(userRef);
        
        if(checkSnap.exists()) { 
            showToast("Alert: Identity already exists in Galaxy!"); 
        } else {
            await setDoc(userRef, { 
                pass: p, 
                relation: "Music Soul 🎵", 
                theme: "theme-guest", 
                themeName: "Cosmic Minimalist", 
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + u,
                registeredAt: Date.now()
            });
            showToast("Identity Forged! Access Portal now.");
            document.getElementById('toggleLogin').click();
        }
    } catch(e) { 
        console.error("Critical System Error during Forge:", e);
        alert("CRITICAL ERROR: " + e.message + "\nCheck Firebase Database Rules!"); 
        showToast("Error: Galaxy Database Locked."); 
    }
    
    btn.innerHTML = 'FORGE IDENTITY <i class="fa-solid fa-cloud-arrow-up"></i>';
};

// --- Login Protocol ---
document.getElementById('loginBtn').onclick = async () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    
    if(!u || !p) return;
    
    const btn = document.getElementById('loginBtn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> VERIFYING...';
    
    try {
        let userData = vipDB[u] || (await getDoc(doc(db, "users", u.toLowerCase()))).data();
        
        if (userData && userData.pass === p) {
            localStorage.setItem('keepMeLoggedIn', u);
            initializeUserSession(u);
        } else {
            document.getElementById('loginError').style.display = 'block';
            btn.innerHTML = 'INITIALIZE CONNECTION <i class="fa-solid fa-bolt"></i>';
            showToast("Failed: Unauthorized Cipher Key!");
        }
    } catch(e) {
        console.error("Login Interface Error:", e);
        showToast("Failed: Galaxy Connection Interrupted!");
    }
};

// === 🌌 6. USER SESSION INITIALIZATION ===
async function initializeUserSession(u) {
    currentUser = u;
    console.log(`Setting up Universe for: ${currentUser}`);
    
    try {
        let userData = vipDB[currentUser] || (await getDoc(doc(db, "users", currentUser.toLowerCase()))).data();
        document.body.className = userData.theme;
        
        // --- Sync Data from Cloud Vault ---
        const vaultSnap = await getDoc(doc(db, "vaults", currentUser));
        myPlaylist = vaultSnap.exists() ? vaultSnap.data().songs : [];
        
        // --- Setup Dynamic UI ---
        document.getElementById('userName').innerText = currentUser;
        document.getElementById('userAvatar').src = userData.avatar;
        document.getElementById('sideProfAvatar').src = userData.avatar;
        document.getElementById('profName').innerText = currentUser;
        document.getElementById('profSongCount').innerText = myPlaylist.length;
        
        // --- Feature 19 Logic: Admin Privilege ---
        if(currentUser.toLowerCase() === 'dark_eio') {
            fmBroadcastBtn.classList.remove('hidden');
        } else {
            fmBroadcastBtn.classList.add('hidden');
        }

        // --- Feature 10: AI Personalized Greeting ---
        const mixTitleEl = document.getElementById('mixTitle');
        if(mixTitleEl) mixTitleEl.innerText = `${currentUser}'s Cosmic Vibe ✨`;

        // --- Portal Transition ---
        splash.classList.add('hidden');
        login.classList.add('hidden');
        app.classList.remove('hidden');
        
        // --- Booting Sub-systems ---
        loadVibeChat();
        loadLoveCapsule();
        listenToGlobalFM();
        listenToLiveActivity();
        startCloudTimer();
        fetchMusic("Top Trending Hindi 2026");
        
        console.log("System Check: All sub-systems online.");
    } catch (e) { 
        console.error("Session Boot Error:", e);
        showToast("Error: System Malfunctioned!");
    }
}

// === 🕰️ 7. CLOUD STATS & GREETINGS ===
function startCloudTimer() {
    setInterval(async () => {
        sessionMinutes++;
        if (sessionMinutes % 60 === 0) {
            console.log("Stats Sync: Updating Cloud records...");
            const statsRef = doc(db, "stats", currentUser);
            await setDoc(statsRef, { 
                totalMinutes: increment(1),
                lastActive: Date.now()
            }, { merge: true });
        }
        // Update Session UI
        document.getElementById('statSession').innerText = `${Math.floor(sessionMinutes/60)}m`;
    }, 1000);
    
    // Dynamic Time Greeting
    const hours = new Date().getHours();
    const greet = hours < 12 ? "Subah Bakhair," : hours < 17 ? "Aadaab," : "Shab-ba-khair,";
    document.getElementById('timeGreeting').innerText = greet;
}

// === 🎶 8. THE SUPREME MUSIC ENGINE ===
async function fetchMusic(q) {
    console.log(`Music Query: ${q}`);
    const heading = document.getElementById('listHeading');
    heading.innerText = "Scanning Universe for '" + q + "'...";
    
    try {
        const response = await fetch(`https://saavn.sumit.co/api/search/songs?query=${q}`);
        const data = await response.json();
        
        if(data.success && data.data.results.length > 0) {
            currentQueue = data.data.results;
            currentIndex = 0;
            renderLibrary();
            heading.innerText = `Matched Universe: '${q}'`;
        } else {
            showToast("No matches found in this Galaxy!");
            heading.innerText = "Discovery Zone";
        }
    } catch (e) { 
        console.error("Fetch Error:", e);
        showToast("Error: Network Interference!"); 
    }
}

function renderLibrary() {
    songsList.innerHTML = '';
    
    currentQueue.forEach((song, i) => {
        const div = document.createElement('div');
        div.className = 'song-card glass-widget';
        
        const isFav = myPlaylist.some(s => s.id === song.id);
        const favActive = isFav ? 'active' : '';
        
        div.innerHTML = `
            <img src="${song.image[2].url}" onclick="playSong(${i})" loading="lazy">
            <div class="song-info-v2" onclick="playSong(${i})">
                <h4>${song.name}</h4>
                <p>${song.artists.primary[0].name}</p>
            </div>
            <button class="fav-btn ${favActive}" onclick="toggleFav(event, ${i})">
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
    
    // Async Cloud Sync
    setDoc(doc(db, "vaults", currentUser), { songs: myPlaylist });
    document.getElementById('profSongCount').innerText = myPlaylist.length;
}

// === 🎧 9. ADVANCED PLAYER CORE ===
function playSong(i) {
    if (i < 0 || i >= currentQueue.length) return;
    
    currentIndex = i;
    const song = currentQueue[i];
    
    // --- UI Update ---
    document.getElementById('playerTitle').innerText = song.name;
    document.getElementById('playerArtist').innerText = song.artists.primary[0].name;
    document.getElementById('playerCover').src = song.image[1].url;
    
    // --- Engine Update ---
    audio.src = song.downloadUrl[4].url;
    audio.volume = 1; // Reset for Crossfade
    audio.play().catch(e => console.error("Playback Blocked:", e));
    
    // --- State Update ---
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    vinylDisk.classList.add('spin-vinyl');
    document.getElementById('eqBars').classList.remove('hidden');
    
    // --- Feature Syncing ---
    updateLiveStatus(true, song);
    if(isBroadcastingFM) broadcastFMData(song);
    if(currentUser !== "Muskan") checkLoveCapsuleMatch(song);
    
    // --- Lyrics Sync ---
    const lText = document.querySelector('.lyrics-text');
    if(lText) lText.innerHTML = `Syncing soul to:<br><span style="color:var(--neon-main); font-size:24px;">${song.name}</span><br>by ${song.artists.primary[0].name}`;
}

// --- Player Logic Buttons ---
playBtn.onclick = () => { 
    if(audio.paused) {
        audio.play();
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        vinylDisk.classList.add('spin-vinyl');
        updateLiveStatus(true, currentQueue[currentIndex]);
    } else {
        audio.pause();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        vinylDisk.classList.remove('spin-vinyl');
        updateLiveStatus(false);
    }
};

document.getElementById('nextBtn').onclick = () => {
    handleSongEnd(); // Use end logic for smart shuffle
};

document.getElementById('prevBtn').onclick = () => {
    if (currentIndex > 0) playSong(currentIndex - 1);
    else playSong(currentQueue.length - 1);
};

// === 🤖 10. AI SMART SHUFFLE & CROSSFADE ===
audio.onended = () => handleSongEnd();

function handleSongEnd() {
    if(isPlaylistView) {
        // Vault Logic: Loop or Next
        if (currentIndex < currentQueue.length - 1) playSong(currentIndex + 1);
        else playSong(0);
    } else {
        // Universe Logic: AI Choice
        showToast("AI DJ is selecting next vibe... 🤖✨");
        triggerAIRandomSong();
    }
}

async function triggerAIRandomSong() {
    const moods = [
        "Arijit Singh Lofi Reverb", "Sidhu Moose Wala Rare", 
        "Slowed Deep House", "Trending Viral Mashup 2026", 
        "Japanese Anime Openings", "Coke Studio Hits"
    ];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${randomMood}`);
        const data = await res.json();
        if(data.success) {
            const results = data.data.results;
            const chosenOne = results[Math.floor(Math.random() * results.length)];
            
            // Inject AI song into current context
            currentQueue = [chosenOne, ...currentQueue];
            currentIndex = 0;
            renderLibrary();
            playSong(0);
            showToast("AI Choice: " + chosenOne.name);
        }
    } catch (e) { 
        console.error("AI Logic Error:", e);
        playSong(0); // Fallback
    }
}

// --- Feature 8: Crossfade & Seeker ---
audio.ontimeupdate = () => { 
    if(!isNaN(audio.duration)) { 
        const progress = (audio.currentTime/audio.duration)*100;
        seekSlider.value = progress; 
        document.getElementById('timeCurrent').innerText = formatSeconds(audio.currentTime); 
        document.getElementById('timeTotal').innerText = formatSeconds(audio.duration); 
        
        // --- SUPREME CROSSFADE LOGIC ---
        // If 4 seconds left, start fading out
        let timeLeft = audio.duration - audio.currentTime;
        if (timeLeft < 4 && audio.volume > 0.05) {
            audio.volume = Math.max(0, audio.volume - 0.01);
        }
    } 
};

seekSlider.oninput = () => {
    audio.currentTime = (seekSlider.value/100)*audio.duration;
};

function formatSeconds(s) { 
    let m = Math.floor(s/60); 
    let sec = Math.floor(s%60); 
    return `${m}:${sec < 10 ? '0' + sec : sec}`; 
}

// === 📡 11. GLOBAL FM BROADCAST (Admin Feature) ===
fmBroadcastBtn.onclick = () => {
    isBroadcastingFM = !isBroadcastingFM;
    
    if(isBroadcastingFM) {
        fmBroadcastBtn.classList.add('fm-broadcasting');
        showToast("📡 Universe Broadcast: ON!");
        if(currentQueue[currentIndex]) broadcastFMData(currentQueue[currentIndex]);
    } else {
        fmBroadcastBtn.classList.remove('fm-broadcasting');
        setDoc(doc(db, "fm", "globalRadio"), { isLive: false }); 
        showToast("📡 Universe Broadcast: OFF.");
    }
};

async function broadcastFMData(song) {
    console.log("FM: Broadcasting new data...");
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
    onSnapshot(doc(db, "fm", "globalRadio"), (docSnap) => {
        const data = docSnap.data();
        if(data && data.isLive && data.host !== currentUser) {
            fmLiveTag.classList.remove('hidden');
            fmLiveTag.innerHTML = `<i class="fa-solid fa-tower-broadcast fade-blink"></i> ${data.host}'s Radio`;
            fmLiveTag.onclick = () => {
                showToast(`Tuning into ${data.host}'s FM! 📻`);
                const fakeSong = { 
                    id: data.songId, name: data.songName, 
                    artists: { primary: [{ name: data.artist }] }, 
                    image: [{},{},{url: data.cover}], 
                    downloadUrl: [{},{},{},{},{url: data.audio}] 
                };
                currentQueue = [fakeSong]; 
                playSong(0);
            };
        } else {
            fmLiveTag.classList.add('hidden'); 
        }
    });
}

// === 💖 12. LOVE CAPSULE LOGIC (Sync System) ===
async function checkLoveCapsuleMatch(song) {
    try {
        const partnerRef = doc(db, "liveStatus", "Muskan");
        const snap = await getDoc(partnerRef);
        
        if(snap.exists()) {
            const partnerData = snap.data();
            // If Muskan is listening to the exact same song ID
            if(partnerData.isPlaying && partnerData.songId === song.id) {
                console.log("Capsule Match: Synchronizing memories...");
                await addDoc(collection(db, "loveCapsule"), {
                    couple: [currentUser, "Muskan"],
                    songName: song.name,
                    date: new Date().toLocaleDateString('hi-IN'),
                    timestamp: Date.now()
                });
                showToast("💞 Sync Match! Memory saved in Capsule.");
            }
        }
    } catch(e) { console.warn("Capsule Logic Interference:", e); }
}

function loadLoveCapsule() {
    const q = query(collection(db, "loveCapsule"), orderBy("timestamp", "desc"), limit(5));
    onSnapshot(q, (snap) => {
        const list = document.getElementById('capsuleList');
        list.innerHTML = '';
        
        let hasData = false;
        snap.forEach(docSnap => {
            const data = docSnap.data();
            if(data.couple.includes(currentUser)) {
                hasData = true;
                const d = document.createElement('div');
                d.className = 'capsule-item';
                d.innerHTML = `<strong>${data.songName}</strong> Suna gaya on ${data.date} with Muskan ❤️`;
                list.appendChild(d);
            }
        });
        
        if(!hasData) {
            list.innerHTML = '<p class="empty-msg" style="font-size:10px; color:#aaa; text-align:center;">No memories yet.</p>';
        }
    });
}

// === 💬 13. VIBE CHAT INFRASTRUCTURE ===
if (openChatBtn) {
    const triggerChatHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Chat: Opening Interface...");
        chatWidget.classList.add('show');
        lyricsPanel.classList.remove('show');
    };
    
    openChatBtn.addEventListener('click', triggerChatHandler);
    openChatBtn.addEventListener('touchstart', triggerChatHandler);
}

document.getElementById('closeChatBtn').onclick = () => {
    chatWidget.classList.remove('show');
};

function loadVibeChat() {
    const q = query(collection(db, "globalChat"), orderBy("timestamp", "desc"), limit(50));
    onSnapshot(q, (snap) => {
        const msgArea = document.getElementById('chatMessages');
        msgArea.innerHTML = '';
        
        const msgs = [];
        snap.forEach(d => msgs.push(d.data()));
        
        // Reverse to show latest at bottom
        msgs.reverse().forEach(m => {
            const div = document.createElement('div');
            div.className = `chat-msg ${m.sender === currentUser ? 'mine' : ''}`;
            div.innerHTML = `<span style="display:block; font-size:9px; opacity:0.6; margin-bottom:4px;">${m.sender}</span>${m.text}`;
            msgArea.appendChild(div);
        });
        msgArea.scrollTop = msgArea.scrollHeight;
    });
}

document.getElementById('sendChatBtn').onclick = async () => {
    const inp = document.getElementById('chatInput');
    const txt = inp.value.trim();
    if(!txt) return;
    
    try {
        await addDoc(collection(db, "globalChat"), { 
            sender: currentUser, 
            text: txt, 
            timestamp: Date.now() 
        });
        inp.value = '';
    } catch(e) { showToast("Chat Transmission Failed!"); }
};

// --- Enter key support ---
document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') document.getElementById('sendChatBtn').click();
});

// === 🎙️ 14. VOICE COMMANDS & EASTER EGGS ===
document.getElementById('searchBtn').onclick = () => {
    isPlaylistView = false;
    const rawQ = searchInput.value.trim().toLowerCase();
    
    // --- Feature 18: Easter Egg Protocols ---
    if(rawQ === 'bankai') { 
        document.body.className = 'theme-bankai'; 
        showToast("卍 BAN-KAI! Unleashing Tensa Zangetsu 卍");
        fetchMusic("Bleach Anime Best Soundtracks"); 
    }
    else if(rawQ === 'domain expansion') { 
        document.body.className = 'theme-domain'; 
        showToast("🤞 Domain Expansion: Infinite Void 🤞");
        fetchMusic("Jujutsu Kaisen Vibe Hits"); 
    }
    else if(rawQ === 'king kohli') {
        showToast("The GOAT Detected! 👑🏏");
        fetchMusic("Cricket World Cup Anthems");
    }
    else if(rawQ) {
        // Reset Theme if not easter egg
        document.body.className = vipDB[currentUser]?.theme || 'theme-guest';
        fetchMusic(rawQ);
    }
};

// --- Feature 7: AI Mic DJ ---
if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'hi-IN';

    micBtn.onclick = () => {
        try {
            recognition.start();
            micBtn.classList.add('mic-listening');
            searchInput.placeholder = "Listening to your vibe...";
        } catch(e) { recognition.stop(); }
    };

    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        searchInput.value = transcript;
        micBtn.classList.remove('mic-listening');
        document.getElementById('searchBtn').click();
    };

    recognition.onerror = () => {
        micBtn.classList.remove('mic-listening');
        showToast("AI DJ couldn't hear you!");
    };
} else {
    micBtn.style.display = 'none'; // Browser incompatibility
}

// === 🌙 15. SLEEP TIMER ENGINE ===
sleepTimerBtn.onclick = () => {
    if(sleepTimeout) {
        clearTimeout(sleepTimeout); 
        sleepTimeout = null;
        sleepTimerBtn.classList.remove('timer-active');
        showToast("Sleep Timer Cancelled ☀️");
    } else {
        // Set for 30 minutes
        const duration = 30 * 60000; 
        sleepTimeout = setTimeout(() => {
            console.log("Sleep Engine: Initiating Shutdown...");
            audio.pause(); 
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            vinylDisk.classList.remove('spin-vinyl');
            showToast("Shh... Universe is sleeping 🌙");
            sleepTimerBtn.classList.remove('timer-active');
        }, duration);
        
        sleepTimerBtn.classList.add('timer-active');
        showToast("Set for 30 Mins 🌙. Shab-ba-khair!");
    }
};

// === 📱 16. NAVIGATION & UI HELPERS ===
document.getElementById('btnHome').onclick = () => { 
    isPlaylistView = false; 
    document.getElementById('searchSection').style.display = 'block'; 
    document.getElementById('dailyMixBanner').classList.remove('hidden');
    document.getElementById('btnHome').classList.add('active');
    document.getElementById('btnPlaylist').classList.remove('active');
    fetchMusic("Latest Hindi Hits 2026"); 
};

document.getElementById('btnPlaylist').onclick = () => { 
    isPlaylistView = true; 
    document.getElementById('searchSection').style.display = 'none'; 
    document.getElementById('dailyMixBanner').classList.add('hidden');
    document.getElementById('btnPlaylist').classList.add('active');
    document.getElementById('btnHome').classList.remove('active');
    currentQueue = myPlaylist; 
    renderLibrary(); 
    showToast("Opening your Cloud Vault ☁️");
};

// Profile Sidebar Toggles
document.getElementById('profileBtn').onclick = () => { 
    profileSidebar.classList.add('open'); 
    document.getElementById('sidebarOverlay').classList.add('show'); 
};

document.getElementById('closeProfileBtn').onclick = () => { 
    profileSidebar.classList.remove('open'); 
    document.getElementById('sidebarOverlay').classList.remove('show'); 
};

document.getElementById('sidebarOverlay').onclick = () => {
    document.getElementById('closeProfileBtn').click();
};

// Lyrics Integration
document.getElementById('openLyricsArea').onclick = () => {
    lyricsPanel.classList.add('show');
};
document.getElementById('closeLyricsBtn').onclick = () => {
    lyricsPanel.classList.remove('show');
};

// Logout Protocol
document.getElementById('logoutBtn').onclick = () => { 
    localStorage.removeItem('keepMeLoggedIn'); 
    updateLiveStatus(false);
    location.reload(); 
};

// --- Live Activity Monitor ---
function listenToLiveActivity() {
    onSnapshot(collection(db, "liveStatus"), (snap) => {
        const container = document.getElementById('liveStoriesContainer');
        container.innerHTML = '';
        let count = 0;
        
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const timeLimit = Date.now() - (15 * 1000); // 15 sec heartbeat
            
            if(docSnap.id !== currentUser && data.isPlaying && data.lastSeen > timeLimit) {
                count++;
                const item = document.createElement('div');
                item.className = 'story-item';
                item.innerHTML = `
                    <div class="story-ring"><img src="${data.avatar}"></div>
                    <p>${docSnap.id}</p>
                    <span>${data.songName}</span>`;
                
                item.onclick = () => {
                    showToast(`Syncing with ${docSnap.id}'s Soul 🎧`);
                    const syncSong = { 
                        id: data.songId, name: data.songName, 
                        artists: { primary: [{ name: "Cosmic Sync" }] }, 
                        image: [{},{},{url: data.avatar}], 
                        downloadUrl: [{},{},{},{},{url: data.audio}] 
                    };
                    currentQueue = [syncSong]; playSong(0);
                };
                container.appendChild(item);
            }
        });
        document.getElementById('liveActivityArea').classList.toggle('hidden', count === 0);
    });
}

async function updateLiveStatus(isPlaying, song = null) {
    if(isBroadcastingFM) return; // Priority to FM
    const ref = doc(db, "liveStatus", currentUser);
    if(isPlaying && song) {
        await setDoc(ref, { 
            isPlaying: true, 
            songName: song.name, 
            songId: song.id, 
            audio: song.downloadUrl[4].url,
            avatar: vipDB[currentUser]?.avatar || "guest.jpg",
            lastSeen: Date.now() 
        });
    } else { 
        await setDoc(ref, { isPlaying: false, lastSeen: Date.now() }, {merge: true}); 
    }
}

// --- Utilities ---
function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg; 
    t.classList.add('show'); 
    setTimeout(() => t.classList.remove('show'), 3500);
}

// Heartbeat system
setInterval(() => {
    if(currentUser) {
        updateDoc(doc(db, "liveStatus", currentUser), { lastSeen: Date.now() }).catch(()=>{});
    }
}, 10000);

console.log("Universe Status: ARSHAD SUPREME ONLINE.");
