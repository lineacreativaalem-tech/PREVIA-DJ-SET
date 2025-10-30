document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('audio-player');
    const mainPlayButton = document.getElementById('main-play-button');
    const selectedTrackInfo = document.getElementById('selected-track-info');
    const trackListElement = document.getElementById('track-list');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeSpan = document.getElementById('current-time');
    const durationSpan = document.getElementById('duration');
    const shuffleButton = document.getElementById('shuffle-button');
    const repeatButton = document.getElementById('repeat-button');
    const volumeSlider = document.getElementById('volume-slider');
    const statusMessage = document.getElementById('status-message');

    let tracks = [];
    let currentTrackIndex = -1;
    let isPlaying = false;
    let isShuffling = false;
    let isRepeating = false; // 0: no repeat, 1: repeat current, 2: repeat all

    // Función para formatear el tiempo
    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    // Cargar pistas desde JSON
    async function loadTracks() {
        try {
            const response = await fetch('temas.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            tracks = await response.json();
            displayTracks();
            showStatusMessage(`Se cargaron ${tracks.length} pistas.`, 'success');
        } catch (error) {
            console.error('Error al cargar las pistas:', error);
            showStatusMessage('Error al cargar las pistas.', 'error');
        }
    }

    // Mostrar mensaje de estado
    function showStatusMessage(message, type = 'info') {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.style.display = 'block';
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 3000); // Ocultar después de 3 segundos
    }

    // Renderizar la lista de pistas
    function displayTracks() {
        trackListElement.innerHTML = '';
        tracks.forEach((track, index) => {
            const listItem = document.createElement('li');
            listItem.classList.add('track-item');
            listItem.dataset.index = index;
            listItem.innerHTML = `
                <div class="track-item-info">
                    <i class="fas fa-play"></i>
                    <span>${track.nombre}</span>
                </div>
                <a href="${track.url_descarga}" download="${track.nombre}.mp3" class="download-button">
                    <i class="fas fa-download"></i>
                </a>
            `;
            trackListElement.appendChild(listItem);
        });
    }

    // Reproducir una pista específica
    function playTrack(index) {
        if (index < 0 || index >= tracks.length) {
            console.error('Índice de pista inválido:', index);
            return;
        }

        currentTrackIndex = index;
        const track = tracks[currentTrackIndex];
        audioPlayer.src = track.url_reproduccion;
        selectedTrackInfo.textContent = track.nombre;
        audioPlayer.play();
        isPlaying = true;
        updatePlayButtonIcon();
        highlightCurrentTrack();
    }

    // Alternar reproducción/pausa
    function togglePlayPause() {
        if (audioPlayer.src) { // Asegúrate de que hay una pista cargada
            if (isPlaying) {
                audioPlayer.pause();
                isPlaying = false;
            } else {
                audioPlayer.play();
                isPlaying = true;
            }
            updatePlayButtonIcon();
        } else if (tracks.length > 0) { // Si no hay pista cargada pero hay pistas en la lista, reproduce la primera
            playTrack(0);
        }
    }

    // Actualizar icono del botón de reproducción principal
    function updatePlayButtonIcon() {
        mainPlayButton.className = isPlaying ? 'fas fa-pause play-button' : 'fas fa-play play-button';
        
        // Actualizar iconos en la lista de temas
        document.querySelectorAll('.track-item').forEach((item, index) => {
            const playIcon = item.querySelector('.fa-play');
            if (playIcon) {
                if (index === currentTrackIndex && isPlaying) {
                    playIcon.classList.remove('fa-play');
                    playIcon.classList.add('fa-pause');
                } else {
                    playIcon.classList.remove('fa-pause');
                    playIcon.classList.add('fa-play');
                }
            }
        });
    }

    // Resaltar la pista actual en la lista
    function highlightCurrentTrack() {
        document.querySelectorAll('.track-item').forEach((item, index) => {
            item.classList.remove('active');
            if (index === currentTrackIndex) {
                item.classList.add('active');
            }
        });
    }

    // Manejar el final de la pista
    audioPlayer.addEventListener('ended', () => {
        if (isRepeating) {
            audioPlayer.currentTime = 0;
            audioPlayer.play();
        } else {
            playNextTrack();
        }
    });

    // Reproducir la siguiente pista
    function playNextTrack() {
        if (isShuffling) {
            playRandomTrack();
        } else {
            let nextIndex = currentTrackIndex + 1;
            if (nextIndex >= tracks.length) {
                nextIndex = 0; // Vuelve al inicio si llega al final
            }
            playTrack(nextIndex);
        }
    }

    // Reproducir pista anterior
    function playPreviousTrack() {
        if (isShuffling) {
            playRandomTrack();
        } else {
            let prevIndex = currentTrackIndex - 1;
            if (prevIndex < 0) {
                prevIndex = tracks.length - 1; // Va al final si llega al inicio
            }
            playTrack(prevIndex);
        }
    }

    // Reproducir pista aleatoria
    function playRandomTrack() {
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * tracks.length);
        } while (randomIndex === currentTrackIndex && tracks.length > 1); // Evitar la misma pista si hay más de una
        playTrack(randomIndex);
    }

    // Event listeners
    mainPlayButton.addEventListener('click', togglePlayPause);

    trackListElement.addEventListener('click', (event) => {
        const listItem = event.target.closest('.track-item');
        if (listItem) {
            const index = parseInt(listItem.dataset.index);
            
            if (event.target.closest('.download-button')) {
                // Si el clic fue en el botón de descarga, deja que el navegador maneje el enlace.
                return; 
            }

            if (index === currentTrackIndex) {
                togglePlayPause(); // Si es la pista actual, pausar/reanudar
            } else {
                playTrack(index); // Si es una pista diferente, reproducirla
            }
        }
    });

    audioPlayer.addEventListener('timeupdate', () => {
        if (!isNaN(audioPlayer.duration)) {
            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressBar.value = progress;
            currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
            durationSpan.textContent = formatTime(audioPlayer.duration);
        }
    });

    progressBar.addEventListener('input', () => {
        const time = (progressBar.value / 100) * audioPlayer.duration;
        audioPlayer.currentTime = time;
    });

    audioPlayer.addEventListener('loadedmetadata', () => {
        durationSpan.textContent = formatTime(audioPlayer.duration);
        progressBar.value = 0; // Reinicia la barra al cargar nueva metadata
        currentTimeSpan.textContent = "00:00";
    });

    shuffleButton.addEventListener('click', () => {
        isShuffling = !isShuffling;
        shuffleButton.classList.toggle('active', isShuffling);
        shuffleButton.style.backgroundColor = isShuffling ? '#CC0000' : '#666';
        showStatusMessage(isShuffling ? 'Modo aleatorio activado.' : 'Modo aleatorio desactivado.');
    });

    repeatButton.addEventListener('click', () => {
        isRepeating = !isRepeating;
        repeatButton.classList.toggle('active', isRepeating);
        repeatButton.style.backgroundColor = isRepeating ? '#CC0000' : '#666';
        showStatusMessage(isRepeating ? 'Repetir pista actual activado.' : 'Repetir pista actual desactivado.');
    });

    volumeSlider.addEventListener('input', () => {
        audioPlayer.volume = volumeSlider.value;
    });

    // Cargar pistas al inicio
    loadTracks();

    // Establecer volumen inicial del slider
    audioPlayer.volume = volumeSlider.value;
});
