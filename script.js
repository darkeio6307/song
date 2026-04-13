// --- Screen Management ---
const splashScreen = document.getElementById('splashScreen');
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');

// --- Login Elements ---
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

// --- Music Elements ---
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const songsGrid = document.getElementById('songsGrid');
const statusText = document.getElementById('statusText');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const audio = document.getElementById('audioElement');
const cover = document.getElementById('coverImage');
const title = document.getElementById('songTitle');
const artist = document.getElementById('artistName');
const progressBar = document.getElementById('progressBar');
const vipActionBtn = document.getElementById('vipActionBtn');
const vipToast = document.getElementById('vipToast');

// 1. Splash Screen Logic
setTimeout(() => {
    splashScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
}, 2000);

// === VIP Users Database (यहाँ तू और भी नाम जोड़ सकता है) ===
const vipUsers = {
    "Dark_eio": "moh0909",
    "Muskan": "love2026",
    "Sanskar": "yaar123",
    "Harsh": "dost123"
};

// 2. VIP Login Logic
loginBtn.addEventListener('click', () => {
    const u = usernameInput.value.trim();
    const p = passwordInput.value.trim();

    // चेक करो कि यूज़र हमारे डेटाबेस में है या नहीं
    if (vipUsers[u] && vipUsers[u] === p) {
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        
        // जो लॉगिन करेगा, ऐप के ऊपर उसी का नाम चमकेगा!
        document.querySelector('.user-profile').innerHTML = `<i class="fa-solid fa-crown"></i> ${u}`;
        
        // लॉगिन होते ही बिना एरर के गाने लोड करो
        searchSaavn("Trending Bollywood"); 
    } else {
        loginError.style.display = 'block';
        setTimeout(() => loginError.style.display = 'none', 3000);
    }
});

// 3. VIP / Premium Button Toast Alert
vipActionBtn.addEventListener('click', () => {
    vipToast.classList.add('show');
    setTimeout(() => {
        vipToast.classList.remove('show');
    }, 2500);
});

// === 4. Music Player Logic (Saavn API - No Token, Full Songs!) ===
const API_URL = "https://saavn.sumit.co/api/search/songs?query=";

let isPlaying = false;
let songList = [];
let currentSongIndex = 0;

async function searchSaavn(query) {
    try {
        statusText.innerText = "तलाश जारी है...";
        songsGrid.innerHTML = ''; 
        
        const response = await fetch(`${API_URL}${query}`);
        const data = await response.json();
        
        if(data.success && data.data.results.length > 0) {
            songList = data.data.results;
            statusText.innerText = 'Trending Vibes';
            renderGrid(songList);
        } else {
            statusText.innerText = "कुछ नहीं मिला यार!";
        }
    } catch (error) {
        console.error("API Error:", error);
        statusText.innerText = "सर्वर एरर! इंटरनेट चेक कर।";
    }
}

function renderGrid(songs) {
    songsGrid.innerHTML = '';
    songs.forEach((song, index) => {
        const card = document.createElement('div');
        card.classList.add('song-card');
        
        const imgUrl = song.image[song.image.length - 1].url;
        const songName = song.name;
        const artistName = song.artists.primary[0].name || "अज्ञात";

        card.innerHTML = `
            <img src="${imgUrl}" alt="cover">
            <h4>${songName}</h4>
            <p>${artistName}</p>
        `;
        card.addEventListener('click', () => {
            currentSongIndex = index;
            loadSong(songList[currentSongIndex]);
        });
        songsGrid.appendChild(card);
    });
}

function loadSong(song) {
    title.innerText = song.name;
    artist.innerText = song.artists.primary[0].name || "अज्ञात";
    
    if(song.image && song.image.length > 0) {
        cover.src = song.image[song.image.length - 1].url;
    }
    
    if(song.downloadUrl && song.downloadUrl.length > 0) {
        audio.src = song.downloadUrl[song.downloadUrl.length - 1].url;
        audio.addEventListener('canplay', () => { 
            playSong(); 
        }, { once: true });
    }
}

function playSong() {
    isPlaying = true;
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    cover.classList.add('play'); 
    audio.play();
}

function pauseSong() {
    isPlaying = false;
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    cover.classList.remove('play'); 
    audio.pause();
}

playBtn.addEventListener('click', () => {
    if (isPlaying) pauseSong();
    else if(songList.length > 0) playSong();
});

prevBtn.addEventListener('click', () => {
    if(songList.length === 0) return;
    currentSongIndex = currentSongIndex - 1 < 0 ? songList.length - 1 : currentSongIndex - 1;
    loadSong(songList[currentSongIndex]);
});

nextBtn.addEventListener('click', () => {
    if(songList.length === 0) return;
    currentSongIndex = currentSongIndex + 1 > songList.length - 1 ? 0 : currentSongIndex + 1;
    loadSong(songList[currentSongIndex]);
});

searchBtn.addEventListener('click', () => {
    if (searchInput.value.trim() !== "") searchSaavn(searchInput.value);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim() !== "") {
        searchSaavn(searchInput.value);
    }
});

audio.addEventListener('timeupdate', (e) => {
    const { duration, currentTime } = e.srcElement;
    if (isNaN(duration)) return;
    progressBar.style.width = `${(currentTime / duration) * 100}%`;
});

audio.addEventListener('ended', () => { nextBtn.click(); });
