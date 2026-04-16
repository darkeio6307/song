import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, updateDoc, increment, addDoc, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCnwHn6b2F8O8M-3Elk54tydzqldj78Cxg", authDomain: "arshad-music.firebaseapp.com",
  projectId: "arshad-music", storageBucket: "arshad-music.firebasestorage.app",
  messagingSenderId: "301555315508", appId: "1:301555315508:web:28340660dfbfe2429beb61"
};

let db = null;
try { const firebaseApp = initializeApp(firebaseConfig); db = getFirestore(firebaseApp); } catch(e) { console.error("Firebase Offline"); }

const vipDB = { 
    "dark_eio": { displayName: "Dark_eio", pass: "moh0909", relation: "The Creator 👑", badge: "Universe Lord", theme: "theme-default", avatar: "darkeio.jpg" },
    "muskan": { displayName: "Muskan", pass: "Love", relation: "The Life Line ❤️", badge: "Queen", theme: "theme-muskan", avatar: "wife.jpg" }
};

const app = document.getElementById('mainApp');
const audio = document.getElementById('audioEngine');
const playBtn = document.getElementById('playBtn');

let currentUser = ""; let currentDisplay = "";
let currentQueue = []; let myPlaylist = []; let currentIndex = 0;
let chatUnsub = null; let currentChatPartner = null; 

function getRoomID(user1, user2) { return [user1.toLowerCase(), user2.toLowerCase()].sort().join("_"); }
function vibeClick() { if(navigator.vibrate) navigator.vibrate(40); }
function showToast(m) { const t = document.getElementById('toast'); t.innerText = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500); }
function formatTime(ts) { if(!ts) return ""; return new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}); }
function fmtTime(s) { const m = Math.floor(s/60); const sc = Math.floor(s%60); return `${m}:${sc<10?'0':''}${sc}`; }

// 🔥 GLOBAL LIVE STATUS (Fixes 0 Souls Bug)
function startGlobalLiveStatus() {
    if(!db) return;
    onSnapshot(collection(db, "liveStatus"), (snap) => {
        const count = snap.size;
        const fmCountEl = document.getElementById('fmCount');
        const fmLiveTag = document.getElementById('fmLiveTag');
        if(fmCountEl) fmCountEl.innerText = `${count} souls`;
        if(fmLiveTag && count > 0) fmLiveTag.classList.remove('hidden');
    });
}

// 🌌 BOOT SESSION
function bootSession(rawName, showWelcome = false, userData) {
    currentUser = rawName.toLowerCase();
    currentDisplay = userData ? userData.displayName : rawName;
    document.getElementById('splashScreen').style.display = 'none'; 
    document.getElementById('loginScreen').classList.add('hidden'); 
    app.classList.remove('hidden');

    if(userData) {
        document.body.className = userData.theme || "theme-default";
        document.getElementById('userAvatar').src = userData.avatar || "guest.jpg";
    }
    document.getElementById('userName').innerText = currentDisplay; 
    
    if(showWelcome) showToast(`Welcome back, ${currentDisplay} 👑`);
    
    fetchMusic("Trending Hindi Hits"); // Default start
    startGlobalLiveStatus(); // Start Souls Counter
    listenToRooms();
    setInterval(() => { if(currentUser && db) updateLiveStatus(false); }, 15000);
}

// 🎶 MUSIC LOGIC
async function fetchMusic(q) {
    document.getElementById('listHeading').innerText = "Scanning Galaxy..."; 
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${q}&page=1&limit=20`);
        const data = await res.json();
        if(data.success && data.data.results.length > 0) {
            currentQueue = data.data.results;
            appendLibrary(currentQueue);
            document.getElementById('listHeading').innerText = `'${q}' Vibes`;
        }
    } catch(e) { showToast("Network Drop!"); }
}

function appendLibrary(songs) {
    const list = document.getElementById('songsList'); list.innerHTML = '';
    const frag = document.createDocumentFragment(); 
    songs.forEach((song, i) => {
        const div = document.createElement('div'); div.className = 'song-card glass-widget';
        div.innerHTML = `<img src="${song.image[2].url}" onclick="playSong(${i})" loading="lazy">
            <div class="song-info-v2" onclick="playSong(${i})"><h4>${song.name}</h4><p>${song.artists.primary[0].name}</p></div>`;
        frag.appendChild(div);
    });
    list.appendChild(frag);
}

window.playSong = function(i) {
    currentIndex = i; const song = currentQueue[i];
    document.getElementById('playerTitle').innerText = song.name; 
    document.getElementById('playerArtist').innerText = song.artists.primary[0].name; 
    document.getElementById('playerCover').src = song.image[1].url;
    document.getElementById('bgAura').style.background = `url(${song.image[1].url})`; 
    document.getElementById('bgAura').style.backgroundSize = "cover";
    
    audio.src = song.downloadUrl[4].url; 
    audio.play().catch(e=>{});
    
    document.getElementById('vinylDisk').classList.add('spin-vinyl'); 
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'; 
    if(db) updateLiveStatus(true, song);
};

playBtn.addEventListener('click', () => {
    vibeClick();
    if(audio.paused) {
        audio.play().catch(e=>{}); 
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'; 
        document.getElementById('vinylDisk').classList.add('spin-vinyl');
    } else {
        audio.pause(); 
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>'; 
        document.getElementById('vinylDisk').classList.remove('spin-vinyl');
    }
});

audio.ontimeupdate = () => { 
    if(!isNaN(audio.duration)) { 
        document.getElementById('seekSlider').value = (audio.currentTime/audio.duration)*100; 
        document.getElementById('timeCurrent').innerText = fmtTime(audio.currentTime); 
        document.getElementById('timeTotal').innerText = fmtTime(audio.duration); 
    } 
};
document.getElementById('seekSlider').oninput = (e) => audio.currentTime = (e.target.value/100)*audio.duration;

async function updateLiveStatus(isPlaying, song = null) {
    if(!db) return; const ref = doc(db, "liveStatus", currentUser);
    if(isPlaying && song) { await setDoc(ref, { isPlaying: true, songName: song.name, lastSeen: Date.now() }, {merge: true}); } 
    else { await updateDoc(ref, { isPlaying: false, lastSeen: Date.now() }); }
}

// 🏠 ROOM TOGGLE FIX
document.getElementById('btnRoomToggle').addEventListener('click', () => { 
    vibeClick(); 
    document.getElementById('chatWidget').classList.remove('show'); 
    document.getElementById('musicLibraryContainer').classList.add('hidden'); // Hide main content
    document.getElementById('roomWidget').classList.add('show'); 
    document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active')); 
    document.getElementById('btnRoomToggle').classList.add('active'); 
});

document.getElementById('closeRoomBtn').addEventListener('click', () => { 
    vibeClick(); 
    document.getElementById('roomWidget').classList.remove('show'); 
    document.getElementById('musicLibraryContainer').classList.remove('hidden'); // Show back
    document.getElementById('btnRoomToggle').classList.remove('active'); 
    document.getElementById('btnHome').classList.add('active'); 
});

function listenToRooms() {
    onSnapshot(collection(db, "rooms"), (snap) => {
        const list = document.getElementById('activeRoomsList'); list.innerHTML = '';
        snap.forEach(docSnap => {
            const data = docSnap.data();
            if(data.active) {
                const div = document.createElement('div'); div.className = 'contact-item';
                div.innerHTML = `<div style="flex:1;"><h4>Room #${docSnap.id}</h4><p class="fm-listener-badge live">Host: ${data.hostName}</p></div>`;
                div.onclick = () => showToast(`Joined Room #${docSnap.id}`);
                list.appendChild(div);
            }
        });
    });
}

document.getElementById('createRoomBtn').addEventListener('click', async () => { 
    vibeClick(); 
    if(!db) return;
    const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
    await setDoc(doc(db, "rooms", roomCode), { host: currentUser, hostName: currentDisplay, active: true, createdAt: Date.now() });
    showToast(`Room #${roomCode} Created!`);
});

// 💬 CHAT LOGIC (Fixed Order & Double Send)
document.getElementById('btnChatToggle').addEventListener('click', () => {
    vibeClick(); 
    document.getElementById('roomWidget').classList.remove('show'); 
    document.getElementById('musicLibraryContainer').classList.add('hidden');
    document.getElementById('chatWidget').classList.remove('hidden'); 
    document.getElementById('chatWidget').classList.add('show'); 
    document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active')); 
    document.getElementById('btnChatToggle').classList.add('active');
    
    if(db && !currentChatPartner) {
        onSnapshot(collection(db, "liveStatus"), (snap) => {
            const list = document.getElementById('onlineUsersList'); list.innerHTML = ''; 
            snap.forEach(docSnap => {
                if(docSnap.id !== currentUser) {
                    const data = docSnap.data();
                    const item = document.createElement('div'); item.className = 'contact-item is-online'; 
                    item.innerHTML = `<img src="${data.avatar || 'guest.jpg'}"><div style="flex:1;"><h4>${data.displayName || docSnap.id}</h4></div>`;
                    item.onclick = () => openPrivateChat(docSnap.id, data.displayName || docSnap.id, data.avatar);
                    list.appendChild(item);
                }
            });
        });
    }
});

document.getElementById('closeChatBtn').addEventListener('click', () => { 
    vibeClick(); 
    document.getElementById('chatWidget').classList.remove('show'); 
    document.getElementById('musicLibraryContainer').classList.remove('hidden');
    document.getElementById('btnChatToggle').classList.remove('active'); 
    document.getElementById('btnHome').classList.add('active'); 
});

document.getElementById('backToContactsBtn').addEventListener('click', () => { 
    vibeClick(); 
    document.getElementById('chatRoomView').style.display = 'none'; 
    document.getElementById('chatContactsView').style.display = 'block'; 
    currentChatPartner = null; 
    if(chatUnsub) chatUnsub(); 
});

function openPrivateChat(partnerId, partnerName, avatar) {
    currentChatPartner = partnerId;
    document.getElementById('chatContactsView').style.display = 'none'; 
    document.getElementById('chatRoomView').style.display = 'flex'; 
    document.getElementById('chatRoomView').classList.remove('hidden');
    document.getElementById('chatPartnerName').innerText = partnerName; 
    document.getElementById('chatPartnerAvatar').src = avatar || 'guest.jpg';
    
    const roomID = getRoomID(currentUser, partnerId);
    const area = document.getElementById('directMessages');
    area.innerHTML = ''; 
    
    if(chatUnsub) chatUnsub();
    
    if (db) {
        let isInitialLoad = true;
        // Ascending order keeps oldest at top, newest at bottom
        chatUnsub = onSnapshot(query(collection(db, `privateChats/${roomID}/messages`), orderBy("timestamp", "asc")), (snap) => {
            if(isInitialLoad) {
                area.innerHTML = ''; 
                snap.forEach(d => appendMessageToUI(d.data(), area));
                isInitialLoad = false;
            } else {
                snap.docChanges().forEach(change => {
                    if(change.type === 'added') appendMessageToUI(change.doc.data(), area);
                });
            }
            area.scrollTop = area.scrollHeight; // Auto scroll to bottom
        });
    }
}

function appendMessageToUI(m, area) {
    const div = document.createElement('div'); 
    div.className = `chat-msg ${m.sender === currentUser ? 'mine' : 'them'}`; 
    div.innerHTML = `${m.text} <span class="msg-time">${formatTime(m.timestamp)}</span>`;
    area.appendChild(div);
}

// 🔥 DOUBLE SEND BUG FIX
let isSendingMessage = false;
document.getElementById('sendDirectChatBtn').addEventListener('click', async () => {
    if(isSendingMessage) return; // Locked
    const inp = document.getElementById('directChatInput'); 
    const txt = inp.value.trim();
    if(!txt || !currentChatPartner || !db) return; 
    
    isSendingMessage = true; // Apply Lock
    const roomID = getRoomID(currentUser, currentChatPartner); 
    const ts = Date.now();
    
    inp.value = ''; // Just clear input, Firestore will append it automatically to UI
    try { 
        await addDoc(collection(db, `privateChats/${roomID}/messages`), { sender: currentUser, text: txt, timestamp: ts }); 
    } catch(e){}
    
    setTimeout(() => { isSendingMessage = false; }, 500); // Release Lock
});

// LOGIN SYSTEM
document.getElementById('loginBtn').addEventListener('click', async () => {
    vibeClick(); const rawUser = document.getElementById('username').value.trim(); const p = document.getElementById('password').value.trim();
    const u = rawUser.toLowerCase(); 
    let userData = vipDB[u];
    if (userData && userData.pass === p) { localStorage.setItem('keepMeLoggedIn', rawUser); bootSession(rawUser, true, userData); } 
    else { showToast("Galat Password!"); }
});

document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('keepMeLoggedIn');
    if (savedUser && vipDB[savedUser.toLowerCase()]) { bootSession(savedUser, false, vipDB[savedUser.toLowerCase()]); } 
    else { setTimeout(() => { document.getElementById('splashScreen').style.display = 'none'; document.getElementById('loginScreen').classList.remove('hidden'); }, 3500); }
});

document.getElementById('emergencyRescueBtn').addEventListener('click', () => { document.getElementById('splashScreen').style.display = 'none'; document.getElementById('loginScreen').classList.remove('hidden'); });
