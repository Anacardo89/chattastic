


function getToken() {
    const cookieName = 'token=';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(cookieName)) {
            return cookie.substring(cookieName.length);
        }
    }
    console.log("No token found in cookies");
    return null;
}

const clearToken = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    console.log("Token cleared from cookies");
};


$(document).ready(function() {
    $('#reg-button')?.on('click', register);
    $('#login-button')?.on('click', login);
    $('#logout-button')?.on('click', logout);
    $('#new-room-button')?.on('click', addRoom);
    $('#censured-word-button')?.on('click', addCensuredWord);
});

function logout() {
    clearToken();
    window.location.href = '/';
}

function addRoom() {
    const roomInput = document.getElementById('new-room-input');
    if (roomInput.value.trim() == '') {
        alert('Room must have name');
        return;
    }
    const roomName = roomInput.value;

    const data = {
        room_name: roomName,
    };

    $.ajax({
        url: '/api/rooms',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(xhr) {
            alert('room added with success, awaiting approval from admin');
        },
        error: function(xhr) {
            const errorMessage = xhr.responseText;
            alert(errorMessage);
        }
    });
}

function addCensuredWord() {
    const censuredInput = document.getElementById('censured-word-input');
    if (censuredInput.value == '') {
        alert('cannot censure empty word');
        return;
    }
    const censuredWord = censuredInput.value;

    const data = {
        censured_word: censuredWord,
    };

    $.ajax({
        url: '/api/censured',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(xhr) {
            alert('word added with success, awaiting approval from admin');
        },
        error: function(xhr) {
            const errorMessage = xhr.responseText;
            alert(errorMessage);
        }
    });
}


function register() {
    const username = $('#reg-user').val();
    const password = $('#reg-password').val();
    const data = {
        user_name: username,
        password: password,
    };

    $.ajax({
        url: '/api/register',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(xhr) {
            alert(xhr.message);
            window.location.href = '/';
        },
        error: function(xhr) {
            const errorMessage = xhr.responseText;
            alert(errorMessage);
        }
    });
}

function login(el) {
    el.preventDefault();
    const username = $('#login-user').val();
    const password = $('#login-password').val();
    const data = {
        user_name: username,
        password: password,
    };

    $.ajax({
        url: '/api/login',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(xhr) {
            console.log('Login successful');
            loadChatPage();
        },
        error: function(xhr) {
            const errorMessage = xhr.responseText;
            alert(errorMessage);
        }
    });
}

function loadChatPage() {
    $.ajax({
        url: '/chat',
        method: 'GET',
        xhrFields: {
            withCredentials: true 
        },
        success: function(response) {
            window.location.href = '/chat';
        },
        error: function(xhr) {
            const errorMessage = xhr.responseText;
            alert(errorMessage);
        }
    });
}

