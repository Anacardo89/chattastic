const tokenKey = 'authToken';

const setToken = (token) => {
    localStorage.setItem(tokenKey, token);
};

const getToken = () => {
    return localStorage.getItem(tokenKey);
};

const clearToken = () => {
    return localStorage.removeItem(tokenKey);
}


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
    }
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
    }
    $.ajax({
        url: '/api/login',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(xhr) {
            setToken(xhr.token);
            alert('Login bem-sucedido!');
            window.location.href = '/chat';
        },
        error: function(xhr) {
            const errorMessage = xhr.responseText;
            alert(errorMessage);
        }
    });
}