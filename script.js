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

const vips = {
    "dark_eio": { pass: "moh0909", relation: "The Creator 👑", theme: "theme-default", avatar: "darkeio.jpg" },
    "Muskan": { pass: "Love", relation: "Wife ❤️", theme: "theme-muskan", avatar: "wife.jpg" },
    "Preeti": { pass: "bff", relation: "pure Best friend 🤞", theme: "theme-preeti", avatar: "bff.jpg" }
};

let currentUser = "";
let currentQueue = [];
let isVIP = false;
let sessionMins = 0;
const audio = document.getElementById('audioEngine');

// === 🛑 SESSION MANAGER ===
window.onload = async () => {
    const saved = localStorage.getItem('keepMeLoggedIn');
    if (saved) await initElite(saved);
    else setTimeout(() => { document.getElementById('splashScreen').classList.add('hidden'); document.getElementById('loginScreen').classList.remove('hidden'); }, 3000);
};

async function initElite(u) {
    currentUser = u; isVIP = !!vips[u];
    let data = isVIP ? vips[u] : (await getDoc(doc(db, "users", u.toLowerCase()))).data();
    if (data) {
        document.body.className = data.theme || "theme-guest";
        document.getElementById('userName').innerText = u;
        document.getElementById('userAvatar').src = data.avatar;
        document.getElementById('sideProfAvatar').src = data.avatar;
        document.getElementById('profName').innerText = u;
        document.getElementById('profRelation').innerText = data.relation;
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('splashScreen').classList.add('hidden');
        localStorage.setItem('keepMeLoggedIn', u);
        if (isVIP) listenElite();
        listenChat(); startStats(); fetchMusic("Top Hindi Trending");
    }
}

// === 💬 SOUL CHAT LOGIC ===
function listenChat() {
    const q = query(collection(db, "soulChat"), orderBy("timestamp", "asc"), limit(100));
    onSnapshot(q, (snap) => {
        const box = document.getElementById('chatMessages'); box.innerHTML = '';
        snap.forEach(d => {
            const m = d.data(); const div = document.createElement('div');
            const vip = !!vips[m.user]; div.className = `msg ${vip ? 'msg-vip' : ''}`;
            div.innerHTML = `<b style="color:${vip?'#00f2ff':'#888'}">${m.user}:</b> ${m.text}`;
            box.appendChild(div);
        });
        box.scrollTop = box.scrollHeight;
    });
}

document.getElementById('sendMsgBtn').onclick = async () => {
    const inp = document.getElementById('chatInput'); if(!inp.value) return;
    await addDoc(collection(db, "soulChat"), { user: currentUser, text: inp.value, timestamp: serverTimestamp() });
    inp.value = '';
};

// === 🕵️‍♂️ ELITE LIVE & SYNC ROOM ===
function listenElite() {
    onSnapshot(collection(db, "liveStatus"), (snap) => {
        const cont = document.getElementById('liveStoriesContainer'); cont.innerHTML = '';
        let found = 0;
        snap.forEach(d => {
            const user = d.id; const data = d.data();
            if (user !== currentUser && vips[user] && data.isPlaying) {
                found++; const item = document.createElement('div'); item.className = 'story-item';
                item.innerHTML = `<div class="story-ring"><img src="${vips[user].avatar}"></div><p>${user}</p>`;
                item.onclick = () => syncWithVIP(data); cont.appendChild(item);
            }
        });
        document.getElementById('liveActivityArea').classList.toggle('hidden', found === 0);
    });
}

function syncWithVIP(data) {
    audio.src = data.audio; audio.play();
    document.getElementById('playerTitle').innerText = data.songName;
    showToast(`Syncing with ${data.user}'s soul... 🔗`);
}

// === 🎵 MUSIC ENGINE ===
async function fetchMusic(q) {
    const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${q}`);
    const d = await res.json();
    if(d.success) { currentQueue = d.data.results; render(); }
}

function render() {
    const list = document.getElementById('songsList'); list.innerHTML = '';
    currentQueue.forEach((s, i) => {
        const card = document.createElement('div'); card.className = 'song-card glass-widget';
        card.innerHTML = `<img src="${s.image[2].url}" onclick="playSong(${i})"><div><h4>${s.name}</h4><p>${s.artists.primary[0].name}</p></div>`;
        list.appendChild(card);
    });
}

function playSong(i) {
    const s = currentQueue[i]; audio.src = s.downloadUrl[4].url; audio.play();
    document.getElementById('playerTitle').innerText = s.name;
    document.getElementById('playerCover').src = s.image[1].url;
    updateLive(true, s);
}

async function updateLive(playing, s = null) {
    if (!isVIP) return;
    const ref = doc(db, "liveStatus", currentUser);
    if(playing) await setDoc(ref, { isPlaying:true, songName:s.name, artist:s.artists.primary[0].name, audio:s.downloadUrl[4].url, cover:s.image[2].url, songId:s.id, user:currentUser });
    else await updateDoc(ref, { isPlaying: false });
}

// === 🛠️ HELPERS ===
function startStats() { setInterval(async () => { sessionMins++; if(sessionMins % 60 === 0) await updateDoc(doc(db, "stats", currentUser), { today: increment(1) }); }, 1000); }
document.getElementById('loginBtn').onclick = () => initElite(document.getElementById('username').value);
document.getElementById('openChatBtn').onclick = () => document.getElementById('chatSection').classList.toggle('hidden');
document.getElementById('closeChat').onclick = () => document.getElementById('chatSection').classList.add('hidden');
document.getElementById('profileBtn').onclick = () => document.getElementById('profileSidebar').classList.add('open');
document.getElementById('closeProfileBtn').onclick = () => document.getElementById('profileSidebar').classList.remove('open');
document.getElementById('logoutBtn').onclick = () => { localStorage.removeItem('keepMeLoggedIn'); location.reload(); };
function showToast(m) { const t = document.getElementById('toast'); t.innerText = m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 3000); }
