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

// 1. Splash Screen Logic (ऐप की तरह 2 सेकंड की लोडिंग)
setTimeout(() => {
    splashScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
}, 2000);

// 2. VIP Login Logic
loginBtn.addEventListener('click', () => {
    const u = usernameInput.value.trim();
    const p = passwordInput.value.trim();

    if (u === 'Dark_eio' && p === 'moh0909') {
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        // लॉगिन होते ही गाने लोड करो
        searchSpotify("Top Hits"); 
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

// 4. Music Player Logic (Spotify API - Token Update Required Every Hour)
const SPOTIFY_TOKEN = 'BQAUbDbaHUhgDlArf4dlwBX8d-ftZxi4yl7tLsVsWEA0lOGftTdmdTUVIpboHXbe64aorZVYSPwsXZzXXx2WOClTM_cVIR3BMCIwZmQM1v-Ycc-USQCQb-WK33L4jg7MLp4a5eOW04xgtjhVMfwnR0SwSpNmZcBUpanlKW4CNyB7MVQrHBWQfvUilAW3ng2NMvTvx3vMGMFPtFVbnh73yKOeivczcoWz7OtRpujK_epv-LvW-K3gyrfkZqXAzMj2O9-yXyOGEi_7csfEmEdc_4tEDruk4JVH7e6V9VbccxXGxquTP-aOmQz0q7yH-PX1aN7j_g';

let isPlaying = false;
let songList = [];
let currentSongIndex = 0;

async function searchSpotify(query) {
    try {
        statusText.innerText = "ढूंढ रहे हैं...";
        songsGrid.innerHTML = ''; 
        
        const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`, {
            headers: { 'Authorization': `Bearer ${SPOTIFY_TOKEN}` }
        });
        
        if (!response.ok) throw new Error("Token Expired!");

        const data = await response.json();
        const playableTracks = data.tracks.items.filter(track => track.preview_url !== null);
        
        if(playableTracks.length > 0) {
            songList = playableTracks;
            statusText.innerText = 'Trending Vibes';
            renderGrid(songList);
        } else {
            statusText.innerText = "कोई ऑडियो नहीं मिला!";
        }
    } catch (error) {
        statusText.innerText = "Token एक्सपायर! कोड में नया टोकन डालें।";
    }
}

function renderGrid(songs) {
    songsGrid.innerHTML = '';
    songs.forEach((song, index) => {
        const card = document.createElement('div');
        card.classList.add('song-card');
        card.innerHTML = `
            <img src="${song.album.images[0].url}" alt="cover">
            <h4>${song.name}</h4>
            <p>${song.artists[0].name}</p>
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
    artist.innerText = song.artists[0].name;
    cover.src = song.album.images[0].url;
    audio.src = song.preview_url;
    
    audio.addEventListener('canplay', () => { playSong(); }, { once: true });
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
    if (searchInput.value.trim() !== "") searchSpotify(searchInput.value);
});

audio.addEventListener('timeupdate', (e) => {
    const { duration, currentTime } = e.srcElement;
    if (isNaN(duration)) return;
    progressBar.style.width = `${(currentTime / duration) * 100}%`;
});

audio.addEventListener('ended', () => { nextBtn.click(); });
