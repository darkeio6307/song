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
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');

let isPlaying = false;
let songList = [];
let currentSongIndex = 0;

// API से गाने खोजना (Search Function)
async function fetchSongs(query) {
    try {
        title.innerText = "खोज रहे हैं...";
        // Open Source Saavn API
        const response = await fetch(`https://saavn.dev/api/search/songs?query=${query}`);
        const data = await response.json();
        
        if(data.success && data.data.results.length > 0) {
            songList = data.data.results;
            currentSongIndex = 0;
            loadSong(songList[currentSongIndex]);
        } else {
            title.innerText = "गाना नहीं मिला!";
            artist.innerText = "कुछ और सर्च करो";
        }
    } catch (error) {
        console.error("API Error:", error);
        title.innerText = "सर्वर एरर!";
    }
}

// गाने को प्लेयर में लोड करना
function loadSong(song) {
    title.innerText = song.name;
    artist.innerText = song.artists.primary[0].name;
    // हाई-क्वालिटी पोस्टर
    cover.src = song.image[song.image.length - 1].url; 
    // सबसे बेहतरीन क्वालिटी का ऑडियो लिंक
    audio.src = song.downloadUrl[song.downloadUrl.length - 1].url; 
    
    playSong();
}

// Play और Pause के फंक्शन्स
function playSong() {
    isPlaying = true;
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    audio.play();
}

function pauseSong() {
    isPlaying = false;
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    audio.pause();
}

playBtn.addEventListener('click', () => {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});

// अगला और पिछला गाना
function prevSong() {
    currentSongIndex--;
    if (currentSongIndex < 0) {
        currentSongIndex = songList.length - 1;
    }
    loadSong(songList[currentSongIndex]);
}

function nextSong() {
    currentSongIndex++;
    if (currentSongIndex > songList.length - 1) {
        currentSongIndex = 0;
    }
    loadSong(songList[currentSongIndex]);
}

prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);

// सर्च बटन पर क्लिक करने पर
searchBtn.addEventListener('click', () => {
    const query = searchInput.value;
    if (query.trim() !== "") {
        fetchSongs(query);
    }
});

// कीबोर्ड से 'Enter' दबाने पर भी सर्च हो जाए
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value;
        if (query.trim() !== "") {
            fetchSongs(query);
        }
    }
});

// टाइम और प्रोग्रेस बार अपडेट करना
function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    
    // प्रोग्रेस बार की चौड़ाई बढ़ाना
    const progressPercent = (currentTime / duration) * 100;
    progressBar.style.width = `${progressPercent}%`;
    
    // टाइम दिखाना (मिनट और सेकंड में)
    let currentMins = Math.floor(currentTime / 60);
    let currentSecs = Math.floor(currentTime % 60);
    if(currentSecs < 10) currentSecs = `0${currentSecs}`;
    currentTimeEl.innerText = `${currentMins}:${currentSecs}`;
    
    if(duration) {
        let durationMins = Math.floor(duration / 60);
        let durationSecs = Math.floor(duration % 60);
        if(durationSecs < 10) durationSecs = `0${durationSecs}`;
        durationEl.innerText = `${durationMins}:${durationSecs}`;
    }
}

audio.addEventListener('timeupdate', updateProgress);

// प्रोग्रेस बार पर क्लिक करके गाने को आगे-पीछे करना
progressContainer.addEventListener('click', (e) => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
});

// गाना ख़त्म होने पर अपने-आप अगला गाना बजना
audio.addEventListener('ended', nextSong);
