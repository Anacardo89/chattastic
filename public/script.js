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
});

function logout() {
    clearToken();
    window.location.href = '/';
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
            console.log('Successfully loaded chat page');
        },
        error: function(xhr) {
            const errorMessage = xhr.responseText;
            alert(errorMessage);
        }
    });
}