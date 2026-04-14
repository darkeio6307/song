// === 1. FIREBASE SETUP & IMPORTS ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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

// === 2. VIP DATABASE (Admin access) ===
const vipDB = { 
    "dark_eio": { pass: "moh0909", relation: "The Creator 👑", theme: "theme-default", themeName: "Dark Neon", avatar: "darkeio.jpg" },
    "Muskan": { pass: "Love", relation: "Wife ❤️", theme: "theme-muskan", themeName: "Romantic Rose", avatar: "wife.jpg" },
    "Preeti": { pass: "bff", relation: "pure Best friend 🤞", theme: "theme-preeti", themeName: "BFF Vibes", avatar: "bff.jpg" }
};

// Elements
const splash = document.getElementById('splashScreen');
const login = document.getElementById('loginScreen');
const app = document.getElementById('mainApp');
const audio = document.getElementById('audioEngine');
const playBtn = document.getElementById('playBtn');
const seekSlider = document.getElementById('seekSlider');
const vinylDisk = document.getElementById('vinylDisk');
const visualizer = document.getElementById('eqBars');
const songsList = document.getElementById('songsList');
const searchInput = document.getElementById('searchInput');
const bgAura = document.getElementById('bgAura');
const notesContainer = document.getElementById('notesContainer');
const liveActivityArea = document.getElementById('liveActivityArea');
const liveStoriesContainer = document.getElementById('liveStoriesContainer');
const profileSidebar = document.getElementById('profileSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// Globals
let currentUser = "";
let currentQueue = []; 
let myPlaylist = []; 
let currentIndex = 0;
let isPlaylistView = false; 
let noteInterval;
let sessionSeconds = 0;
let statsInterval;

window.playSong = playSong;
window.toggleFav = toggleFav;

// === 🛑 AUTO-LOGIN & SAFETY VALVE ===
window.onload = async () => {
    const savedUser = localStorage.getItem('keepMeLoggedIn');
    
    // Safety Valve: Agar 5 sec tak kuch na ho, toh screen hatao
    const safetyValve = setTimeout(() => {
        if (splash && !splash.classList.contains('hidden')) {
            splash.classList.add('hidden');
            if (!savedUser) login.classList.remove('hidden');
        }
    }, 5000);

    if (savedUser) {
        showToast("Welcome Back, Master...");
        await initializeUserSession(savedUser);
        clearTimeout(safetyValve);
    } else {
        setTimeout(() => { 
            splash.classList.add('hidden'); 
            login.classList.remove('hidden'); 
            clearTimeout(safetyValve);
        }, 3000);
    }
};

// === 3. CORE LOGIN & REGISTER LOGIC ===
document.getElementById('toggleRegister').onclick = () => {
    document.getElementById('loginMode').classList.add('hidden');
    document.getElementById('registerMode').classList.remove('hidden');
    document.getElementById('loginTitle').innerText = 'NEW REGISTRATION';
};

document.getElementById('toggleLogin').onclick = () => {
    document.getElementById('registerMode').classList.add('hidden');
    document.getElementById('loginMode').classList.remove('hidden');
    document.getElementById('loginTitle').innerText = 'ELITE PORTAL';
};

// Registration
document.getElementById('registerBtn').onclick = async () => {
    const u = document.getElementById('regUsername').value.trim();
    const p = document.getElementById('regPassword').value.trim();
    if(!u || !p) { showToast("नाम और पासवर्ड भरें!"); return; }
    document.getElementById('registerBtn').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    try {
        const userRef = doc(db, "users", u.toLowerCase());
        const checkSnap = await getDoc(userRef);
        if(checkSnap.exists()) { showToast("नाम पहले से मौजूद है!"); } 
        else {
            await setDoc(userRef, { pass: p, relation: "Music Lover 🎵", theme: "theme-guest", themeName: "Minimal Green", avatar: "guest.jpg" });
            showToast("अकाउंट बन गया! अब लॉग-इन करें।");
            document.getElementById('toggleLogin').click();
        }
    } catch(e) { showToast("Error!"); }
    document.getElementById('registerBtn').innerHTML = 'REGISTER <i class="fa-solid fa-cloud-arrow-up"></i>';
};

// Login Trigger
document.getElementById('loginBtn').onclick = async () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if(!u || !p) return;
    document.getElementById('loginBtn').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    
    let userData = vipDB[u] || (await getDoc(doc(db, "users", u.toLowerCase()))).data();
    if (userData && userData.pass === p) {
        localStorage.setItem('keepMeLoggedIn', u); 
        await initializeUserSession(u);
    } else {
        document.getElementById('loginError').style.display = 'block';
        document.getElementById('loginBtn').innerHTML = 'INITIALIZE <i class="fa-solid fa-bolt"></i>';
    }
};

// Initialization function
async function initializeUserSession(u) {
    currentUser = u;
    try {
        let userData = vipDB[currentUser] || (await getDoc(doc(db, "users", currentUser.toLowerCase()))).data();
        document.body.className = userData.theme;
        
        // Vault Sync
        const vaultSnap = await getDoc(doc(db, "vaults", currentUser));
        myPlaylist = vaultSnap.exists() ? vaultSnap.data().songs : [];
        
        // Stats Sync
        const statsRef = doc(db, "stats", currentUser);
        const statsSnap = await getDoc(statsRef);
        if (!statsSnap.exists()) await setDoc(statsRef, { today: 0, week: 0, month: 0 });

        // UI Setup
        document.getElementById('userName').innerText = currentUser;
        document.getElementById('userAvatar').src = userData.avatar;
        document.getElementById('sideProfAvatar').src = userData.avatar;
        document.getElementById('profName').innerText = currentUser;
        document.getElementById('profRelation').innerText = userData.relation;
        document.getElementById('profThemeName').innerText = userData.themeName;
        document.getElementById('profSongCount').innerText = myPlaylist.length;

        // Smart Greeting Call
        updateTimeGreeting();

        splash.classList.add('hidden');
        login.classList.add('hidden');
        app.classList.remove('hidden');
        
        startCloudTimer(); listenToLiveActivity(); fetchMusic("Top Lofi Hindi");
    } catch (e) { console.error(e); }
}

// === 🕒 SMART GREETING LOGIC ===
function updateTimeGreeting() {
    const hours = new Date().getHours();
    let greeting = "";
    if (hours < 12) greeting = "Good Morning,";
    else if (hours < 17) greeting = "Good Afternoon,";
    else greeting = "Good Evening,";
    
    const greetElement = document.getElementById('timeGreeting');
    if(greetElement) greetElement.innerText = greeting;
}

// === 4. CLOUD STATS & LIVE ACTIVITY (Story Mode) ===
function startCloudTimer() {
    updateStatsUI();
    statsInterval = setInterval(async () => {
        sessionSeconds++;
        if (sessionSeconds % 60 === 0) {
            const statsRef = doc(db, "stats", currentUser);
            await updateDoc(statsRef, { today: increment(1), week: increment(1), month: increment(1) });
            updateStatsUI();
        }
    }, 1000);
}

async function updateStatsUI() {
    const statsSnap = await getDoc(doc(db, "stats",
