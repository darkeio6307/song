const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const songsGrid = document.getElementById('songsGrid');
const statusText = document.getElementById('statusText');

const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const audio = document.getElementById('audioElement');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');

const title = document.getElementById('songTitle');
const artist = document.getElementById('artistName');
const cover = document.getElementById('coverImage');
const imgContainer = document.getElementById('imgContainer');

let isPlaying = false;
let songList = [];
let currentSongIndex = 0;

// API Base URL (Saavn)
const API_URL = "https://saavn.sumit.co/api/search/songs?query=";

async function searchSongs(query) {
    try {
        statusText.innerText = "तलाश जारी है...";
        songsGrid.innerHTML = ''; 
        
        const response = await fetch(`${API_URL}${query}`);
        const data = await response.json();
        
        if(data.success && data.data.results.length > 0) {
            songList = data.data.results;
            statusText.innerText = `'${query}' के लिए बेहतरीन रिज़ल्ट्स`;
            renderSongsGrid(songList);
        } else {
            statusText.innerText = "कुछ नहीं मिला यार! कोई और नाम ट्राई कर।";
        }
    } catch (error) {
        console.error("API Error:", error);
        statusText.innerText = "सर्वर एरर! इंटरनेट चेक कर ले।";
    }
}

// गानों के कार्ड्स बनाना
function renderSongsGrid(songs) {
    songsGrid.innerHTML = '';
    songs.forEach((song, index) => {
        const card = document.createElement('div');
        card.classList.add('song-card');
        
        const imgUrl = song.image[song.image.length - 1].url;
        const songName = song.name;
        const artistName = song.artists.primary[0].name || "अज्ञात आर्टिस्ट";

        card.innerHTML = `
            <img src="${imgUrl}" alt="cover">
            <h4>${songName}</h4>
            <p>${artistName}</p>
        `;
        
        // कार्ड पर क्लिक करते ही गाना प्ले हो जाए
        card.addEventListener('click', () => {
            currentSongIndex = index;
            loadSong(songList[currentSongIndex]);
        });

        songsGrid.appendChild(card);
    });
}

function loadSong(song) {
    title.innerText = song.name;
    artist.innerText = song.artists.primary[0].name || "अज्ञात आर्टिस्ट";
    
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
    playBtn.innerHTML = '<i class="fa-solid fa-circle-pause"></i>';
    imgContainer.classList.add('play'); 
    audio.play();
}

function pauseSong() {
    isPlaying = false;
    playBtn.innerHTML = '<i class="fa-solid fa-circle-play"></i>';
    imgContainer.classList.remove('play'); 
    audio.pause();
}

playBtn.addEventListener('click', () => {
    if (isPlaying) {
        pauseSong();
    } else {
        if(songList.length > 0) playSong();
    }
});

function prevSong() {
    if(songList.length === 0) return;
    currentSongIndex--;
    if (currentSongIndex < 0) currentSongIndex = songList.length - 1;
    loadSong(songList[currentSongIndex]);
}

function nextSong() {
    if(songList.length === 0) return;
    currentSongIndex++;
    if (currentSongIndex > songList.length - 1) currentSongIndex = 0;
    loadSong(songList[currentSongIndex]);
}

prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);

searchBtn.addEventListener('click', () => {
    const query = searchInput.value;
    if (query.trim() !== "") searchSongs(query);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value;
        if (query.trim() !== "") searchSongs(query);
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

// पेज खुलते ही डिफ़ॉल्ट गानों की लिस्ट आ जाए
window.onload = () => {
    searchSongs("Trending Hindi");
};
