const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const audio = document.getElementById('audioElement');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const title = document.getElementById('songTitle');
const artist = document.getElementById('artistName');
const cover = document.getElementById('coverImage');
const imgContainer = document.getElementById('imgContainer');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');

let isPlaying = false;
let songList = [];
let currentSongIndex = 0;

// नया और फ़ास्ट YouTube (Piped) सर्वर 
const API_BASE = "https://pipedapi.smnz.de"; 
// अगर कभी ये भी डाउन हो, तो तू इसे बदलकर "https://api.piped.privacydev.net" कर सकता है।

async function fetchSongs(query) {
    try {
        title.innerText = "यूट्यूब खंगाल रहे हैं...";
        artist.innerText = "ज़रा इंतज़ार मेरे दोस्त...";
        imgContainer.classList.remove('play');
        
        const response = await fetch(`${API_BASE}/search?q=${query}&filter=all`);
        const data = await response.json();
        
        const videos = data.items.filter(item => item.type === 'stream');
        
        if(videos.length > 0) {
            songList = videos;
            currentSongIndex = 0;
            loadSong(songList[currentSongIndex]);
        } else {
            title.innerText = "कुछ नहीं मिला यार!";
            artist.innerText = "सही नाम लिखकर देख";
        }
    } catch (error) {
        console.error("API Error:", error);
        title.innerText = "यूट्यूब सर्वर से राब्ता टूट गया!";
        artist.innerText = "थोड़ी देर बाद कोशिश कर";
    }
}

async function loadSong(song) {
    title.innerText = "ऑडियो निकाला जा रहा है...";
    artist.innerText = song.uploaderName; 
    cover.src = song.thumbnail; 
    
    try {
        const videoId = song.url.split('v=')[1] || song.url.split('/').pop();
        
        const streamRes = await fetch(`${API_BASE}/streams/${videoId}`);
        const streamData = await streamRes.json();
        
        const audioStreams = streamData.audioStreams;
        
        if(audioStreams && audioStreams.length > 0) {
            audio.src = audioStreams[0].url;
            title.innerText = song.title; 
            
            audio.addEventListener('canplay', () => {
                playSong();
            }, { once: true });
        } else {
            title.innerText = "ऑडियो लिंक नहीं मिला!";
        }
    } catch(err) {
        console.error(err);
        title.innerText = "गाना लोड नहीं हुआ!";
    }
}

function playSong() {
    isPlaying = true;
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    imgContainer.classList.add('play'); 
    audio.play();
}

function pauseSong() {
    isPlaying = false;
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    imgContainer.classList.remove('play'); 
    audio.pause();
}

playBtn.addEventListener('click', () => {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});

function prevSong() {
    if(songList.length === 0) return;
    currentSongIndex--;
    if (currentSongIndex < 0) {
        currentSongIndex = songList.length - 1;
    }
    loadSong(songList[currentSongIndex]);
}

function nextSong() {
    if(songList.length === 0) return;
    currentSongIndex++;
    if (currentSongIndex > songList.length - 1) {
        currentSongIndex = 0;
    }
    loadSong(songList[currentSongIndex]);
}

prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);

searchBtn.addEventListener('click', () => {
    const query = searchInput.value;
    if (query.trim() !== "") {
        fetchSongs(query);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value;
        if (query.trim() !== "") {
            fetchSongs(query);
        }
    }
});

function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    if (isNaN(duration)) return;
    
    const progressPercent = (currentTime / duration) * 100;
    progressBar.style.width = `${progressPercent}%`;
    
    let currentMins = Math.floor(currentTime / 60);
    let currentSecs = Math.floor(currentTime % 60);
    if(currentSecs < 10) currentSecs = `0${currentSecs}`;
    currentTimeEl.innerText = `${currentMins}:${currentSecs}`;
    
    let durationMins = Math.floor(duration / 60);
    let durationSecs = Math.floor(duration % 60);
    if(durationSecs < 10) durationSecs = `0${durationSecs}`;
    durationEl.innerText = `${durationMins}:${durationSecs}`;
}

audio.addEventListener('timeupdate', updateProgress);

progressContainer.addEventListener('click', (e) => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    if (!isNaN(duration)) {
        audio.currentTime = (clickX / width) * duration;
    }
});

audio.addEventListener('ended', nextSong);
