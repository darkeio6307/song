// === 🚀 ARSHAD MUSIC: ELITE VIP UNIVERSE (NO COMPRESSION) ===
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

// === 👑 VIP ACCESS REBORN ===
const vips = {
    "dark_eio": { pass: "moh0909", relation: "The Creator 👑", theme: "theme-default", avatar: "darkeio.jpg" },
    "Muskan": { pass: "Love", relation: "Wife ❤️", theme: "theme-muskan", avatar: "wife.jpg" },
    "Preeti": { pass: "bff", relation: "pure Best friend 🤞", theme: "theme-preeti", avatar: "bff.jpg" }
};

let currentUser = "";
let currentQueue = [];
let currentIndex = 0;
let isVIP = false;
let sessionMins = 0;
const audio = document.getElementById('audioEngine');

// --- 🛑 INITIALIZATION ---
window.onload = async () => {
    const saved = localStorage.getItem('keepMeLoggedIn');
    if (saved) {
        await startSession(saved);
    } else {
        setTimeout(() => {
            document.getElementById('splashScreen').classList.add('hidden');
            document.getElementById('loginScreen').classList.remove('hidden');
        }, 4000);
    }
};

async function startSession(u) {
    currentUser = u;
    isVIP = !!vips[u];
    
    // Get Data from VIP list or Firestore
    let userData = isVIP ? vips[u] : null;
    if(!userData) {
        const docRef = doc(db, "users", u.toLowerCase());
        const snap = await getDoc(docRef);
        if(snap.exists()) userData = snap.data();
    }

    if (userData) {
        // UI Application
        document.body.className = userData.theme || "theme-guest";
        document.getElementById('userName').innerText = u;
        document.getElementById('userAvatar').src = userData.avatar || "guest.jpg";
        document.getElementById('sideProfAvatar').src = userData.avatar || "guest.jpg";
        document.getElementById('profName').innerText = u;
        document.getElementById('profRelation').innerText = userData.relation;

        // Transitions
        document.getElementById('splashScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');

        localStorage.setItem('keepMeLoggedIn', u);
        
        // Load Core Features
        if (isVIP) initEliteTracking(); 
        initSoulChat();
        initMusicEngine("Top Hindi Songs");
        initStatsTracker();
        showToast(`Elite Protocol Sync: ${u} ⚡`);
    } else {
        localStorage.removeItem('keepMeLoggedIn');
        location.reload();
    }
}

// --- 💬 SOUL CHAT ENGINE ---
function initSoulChat() {
    const q = query(collection(db, "soulChat"), orderBy("timestamp", "asc"), limit(50));
    onSnapshot(q, (snap) => {
        const box = document.getElementById('chatMessages');
        box.innerHTML = '';
        snap.forEach(d => {
            const m = d.data();
            const div = document.createElement('div');
            const isV = !!vips[m.user];
            div.className = `msg ${isV ? 'msg-vip' : ''}`;
            div.innerHTML = `<b style="color:${isV?'#00f2ff':'#888'}">${m.user}:</b> ${m.text}`;
            box.appendChild(div);
        });
        box.scrollTop = box.scrollHeight;
    });
}

async function sendMessage() {
    const inp = document.getElementById('chatInput');
    if(!inp.value.trim()) return;
    await addDoc(collection(db, "soulChat"), {
        user: currentUser,
        text: inp.value,
        timestamp: serverTimestamp()
    });
    inp.value = '';
}

// --- 🕵️‍♂️ ELITE LIVE TRACKER (VIP ONLY) ---
function initEliteTracking() {
    onSnapshot(collection(db, "liveStatus"), (snap) => {
        const container = document.getElementById('liveStoriesContainer');
        container.innerHTML = '';
        let found = 0;
        snap.forEach(d => {
            const uName = d.id;
            const data = d.data();
            if (uName !== currentUser && vips[uName] && data.isPlaying) {
                found++;
                const story = document.createElement('div');
                story.className = 'story-item';
                story.innerHTML = `<div class="story-ring"><img src="${vips[uName].avatar}"></div><p>${uName}</p><span>LIVE</span>`;
                story.onclick = () => syncRoom(data);
                container.appendChild(story);
            }
        });
        document.getElementById('liveActivityArea').classList.toggle('hidden', found === 0);
    });
}

function syncRoom(data) {
    showToast(`Joining ${data.user}'s Frequency... 🔗`);
    audio.src = data.audio;
    audio.play();
    document.getElementById('playerTitle').innerText = data.songName;
    updateLiveStatus(true, {
        name: data.songName,
        artists: { primary: [{ name: data.artist }] },
        image: [{}, {}, { url: data.cover }],
        downloadUrl: [{}, {}, {}, {}, { url: data.audio }],
        id: data.songId
    });
}

// --- 🎵 MUSIC CORE ---
async function initMusicEngine(query) {
    document.getElementById('songsList').innerHTML = '<p style="text-align:center; padding:20px;">Scanning Universe...</p>';
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${query}`);
        const data = await res.json();
        if(data.success) {
            currentQueue = data.data.results;
            renderSongs();
        }
    } catch(e) { showToast("Quantum Network Error!"); }
}

function renderSongs() {
    const list = document.getElementById('songsList');
    list.innerHTML = '';
    currentQueue.forEach((s, i) => {
        const div = document.createElement('div');
        div.className = 'song-card glass-widget';
        div.innerHTML = `
            <img src="${s.image[2].url}" onclick="playSong(${i})">
            <div class="song-info" onclick="playSong(${i})">
                <h4>${s.name}</h4>
                <p>${s.artists.primary[0].name}</p>
            </div>
            <i class="fa-regular fa-heart fav-icon"></i>
        `;
        list.appendChild(div);
    });
}

function playSong(i) {
    currentIndex = i;
    const s = currentQueue[i];
    document.getElementById('playerTitle').innerText = s.name;
    document.getElementById('playerArtist').innerText = s.artists.primary[0].name;
    document.getElementById('playerCover').src = s.image[1].url;
    audio.src = s.downloadUrl[4].url;
    audio.play();
    updateLiveStatus(true, s);
}

async function updateLiveStatus(playing, s = null) {
    if(!isVIP) return;
    const ref = doc(db, "liveStatus", currentUser);
    if(playing) {
        await setDoc(ref, {
            isPlaying: true,
            songName: s.name,
            artist: s.artists.primary[0].name,
            cover: s.image[2].url,
            audio: s.downloadUrl[4].url,
            songId: s.id,
            user: currentUser,
            timestamp: serverTimestamp()
        });
    } else {
        await updateDoc(ref, { isPlaying: false });
    }
}

// --- 🛠️ HANDLERS ---
function initStatsTracker() {
    setInterval(async () => {
        sessionMins++;
        if(sessionMins % 60 === 0) {
            const ref = doc(db, "stats", currentUser);
            await updateDoc(ref, { today: increment(1) });
            const s = await getDoc(ref);
            if(s.exists()) document.getElementById('statToday').innerText = `${s.data().today}m`;
        }
    }, 1000);
}

document.getElementById('loginBtn').onclick = () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if(u && p) startSession(u);
};

document.getElementById('sendMsgBtn').onclick = sendMessage;
document.getElementById('openChatBtn').onclick = () => document.getElementById('chatSection').classList.toggle('hidden');
document.getElementById('closeChat').onclick = () => document.getElementById('chatSection').classList.add('hidden');
document.getElementById('searchBtn').onclick = () => initMusicEngine(document.getElementById('searchInput').value);
document.getElementById('profileBtn').onclick = () => document.getElementById('profileSidebar').classList.add('open');
document.getElementById('closeProfileBtn').onclick = () => document.getElementById('profileSidebar').classList.remove('open');
document.getElementById('logoutBtn').onclick = () => { localStorage.removeItem('keepMeLoggedIn'); location.reload(); };

function showToast(m) {
    const t = document.getElementById('toast');
    t.innerText = m; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// Player Updates
audio.onplay = () => document.getElementById('playBtn').innerHTML = '<i class="fa-solid fa-pause"></i>';
audio.onpause = () => document.getElementById('playBtn').innerHTML = '<i class="fa-solid fa-play"></i>';
audio.ontimeupdate = () => {
    if(!isNaN(audio.duration)) {
        document.getElementById('seekSlider').value = (audio.currentTime / audio.duration) * 100;
    }
};
document.getElementById('seekSlider').oninput = () => audio.currentTime = (document.getElementById('seekSlider').value / 100) * audio.duration;
