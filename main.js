const APP_ID = "b4a970ea94144c968de841759f6d2f2e";
const TOKEN = "007eJxTYJBffnVXufy37bOVjZrmLmQQcpVbMXPK/Us9u26tSuTe83irAkOSSaKluUFqoqWJoYlJsqWZRUqqhYmhuallmlmKUZpRavAZvfSGQEaG/G3MjIwMEAjiszDkJmbmMTAAAIpzH+M=";
const CHANNEL = "main";

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

let localTracks = [];
let remoteUsers = {};
let joinTimeout;

// // Función para solicitar permisos de micrófono y cámara
// async function requestPermissions() {
//     try {
//         localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
//         return true; // Permisos concedidos
//     } catch (error) {
//         showPermissionAlert(); // Mostrar alerta de permisos
//         return false; // Permisos no concedidos
//     }
// }

// Mostrar alerta de permisos
function showPermissionAlert() {
    alert("Se necesitan permisos de micrófono y cámara para continuar. La página se recargará para intentar obtener permisos nuevamente.");
    location.reload(); // Recargar la página para intentar obtener permisos nuevamente
}

// Función para unirse y mostrar el stream local
let joinAndDisplayLocalStream = async () => {
    client.on('user-published', handleUserJoined);
    client.on('user-left', handleUserLeft);

    let UID = await client.join(APP_ID, CHANNEL, TOKEN, null);

    if (await requestPermissions()) {
        let player = `<div class="video-container" id="user-container-${UID}">
                            <div class="video-player" id="user-${UID}"></div>
                      </div>`;
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);
        
        localTracks[1].play(`user-${UID}`);
        await client.publish([localTracks[0], localTracks[1]]);
    }
};

// Función para unirse al stream
let joinStream = async () => {
    clearJoinTimeout(); // Limpiar el temporizador si se hace clic
    await joinAndDisplayLocalStream();
    document.getElementById('join-btn').style.display = 'none';
    document.getElementById('stream-controls').style.display = 'flex';
};

// Manejar la unión de usuarios remotos
let handleUserJoined = async (user, mediaType) => {
    remoteUsers[user.uid] = user;
    await client.subscribe(user, mediaType);

    if (mediaType === 'video') {
        let player = document.getElementById(`user-container-${user.uid}`);
        if (player != null) {
            player.remove();
        }

        player = `<div class="video-container" id="user-container-${user.uid}">
                        <div class="video-player" id="user-${user.uid}"></div>
                 </div>`;
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);
        user.videoTrack.play(`user-${user.uid}`);
    }

    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
};

// Manejar la salida de usuarios remotos
let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid];
    document.getElementById(`user-container-${user.uid}`).remove();
};

// Dejar el stream y limpiar
let leaveAndRemoveLocalStream = async () => {
    for (let i = 0; localTracks.length > i; i++) {
        localTracks[i].stop();
        localTracks[i].close();
    }

    await client.leave();
    document.getElementById('join-btn').style.display = 'block';
    document.getElementById('stream-controls').style.display = 'none';
    document.getElementById('video-streams').innerHTML = '';
};

// Alternar micrófono
let toggleMic = async (e) => {
    if (localTracks[0].muted) {
        await localTracks[0].setMuted(false);
        e.target.innerText = 'Mic on';
        e.target.style.backgroundColor = 'cadetblue';
    } else {
        await localTracks[0].setMuted(true);
        e.target.innerText = 'Mic off';
        e.target.style.backgroundColor = '#EE4B2B';
    }
};

// Alternar cámara
let toggleCamera = async (e) => {
    if (localTracks[1].muted) {
        await localTracks[1].setMuted(false);
        e.target.innerText = 'Camera on';
        e.target.style.backgroundColor = 'cadetblue';
    } else {
        await localTracks[1].setMuted(true);
        e.target.innerText = 'Camera off';
        e.target.style.backgroundColor = '#EE4B2B';
    }
};

// Función para limpiar el temporizador
function clearJoinTimeout() {
    if (joinTimeout) {
        clearTimeout(joinTimeout);
    }
}

// Establecer temporizador para pedir permisos automáticamente cada 8 segundos
function startPermissionCheck() {
    joinTimeout = setInterval(async () => {
        const permissionsGranted = await requestPermissions();
        if (permissionsGranted) {
            clearInterval(joinTimeout); // Detener el temporizador si se conceden permisos
            joinStream(); // Iniciar conexión
        }
    }, 8000);
}

// Añadir event listeners
document.getElementById('join-btn').addEventListener('click', joinStream);
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream);
document.getElementById('mic-btn').addEventListener('click', toggleMic);
document.getElementById('camera-btn').addEventListener('click', toggleCamera);

// Iniciar chequeo de permisos al cargar la página
document.addEventListener('DOMContentLoaded', startPermissionCheck);
