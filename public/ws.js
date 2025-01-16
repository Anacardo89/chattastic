$(document).ready(function() {
    const token = getToken();  // Fetch token from local storage or cookie
    if (!token) return alert('Please log in first.');

    const socket = io({
        query: { token: token },  // Pass token as a query parameter to the server
        transports: ['websocket'],
    });

    // Listen for successful connection
    socket.on('connect', () => {
        console.log('Socket connected');
        // Populate the room select dropdown and automatically join the first room
        populateSelect(socket);  // Ensure socket is passed into this function
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });
    
    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
    });

    // Handle room selection change
    $('#room-select').on('change', function () {
        const roomName = $('#room-select option:selected').text();
        socket.emit('leaveRoom');  // Leave the current room if changing
        socket.emit('joinRoom', roomName);  // Emit to join the selected room
        populateChat(roomName);  // Populate chat with messages from the new room
    });

    // Listen for new messages
    socket.on('newMessage', (message) => {
        makeMsg(message);
    });

    // Send message on click
    $('#send-message').on('click', function(event) {
        sendMessage(event, socket);
    });
});

// Populate room select dropdown
function populateSelect(socket) {
    const token = getToken();
    if (!token) {
        return alert('Please log in first.');
    }
    console.log('Token:', token);

    const select = $('#room-select');
    $.ajax({
        url: '/api/rooms/active',  // Adjust to your API endpoint for rooms
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function(rooms) {
            select.empty();
            rooms.forEach(function(room) {
                const option = $('<option></option>')
                    .val(room.id)
                    .text(room.name);
                select.append(option);
            });

            // Ensure the first room is joined after options are populated
            const firstRoomName = $('#room-select option').first().text();  // Get the first room's name
            if (firstRoomName) {
                joinFirstRoom(firstRoomName, socket);  // Join the first room
                populateChat(firstRoomName);  // Populate the chat for the first room
            }
        },
        error: function(error) {
            console.error('Error fetching rooms:', error);
        }
    });
}

function joinFirstRoom(firstRoomName, socket) {
    // Join the first room automatically and populate the chat
    socket.emit('joinRoom', firstRoomName);  
}

function sendMessage(event, socket) {
    event.preventDefault();
    const token = getToken();
    if (!token) return alert('Please log in first.');

    const roomName = $('#room-select option:selected').text() || $('#room-select option').first().text();
    const message = $('#message-input').val();

    censureMsg(message, function(censured_msg) {
        const data = { 
            roomName: roomName, 
            msg: censured_msg 
        };

        $.ajax({
            url: '/api/rooms/' + roomName + '/messages',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data),
            success: function() {
                socket.emit('sendMessage', data);
                $('#message-input').val('');
            },
            error: function(xhr) {
                alert('Error sending message');
            }
        });
    });
}

function makeMsg(msg) {
    const container = $('#chat-container');
    const message = document.createElement('p');
    message.innerHTML = `<strong>${msg.username}</strong>: ${msg.content}`;
    container.append(message);
    scrollToBottom();
}

function populateChat(roomName) {
    const token = getToken();
    if (!token) return alert('Please log in first.');

    $.ajax({
        url: '/api/rooms/' + roomName + '/messages',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        success: function(messages) {
            $('#chat-container').empty();
            messages.forEach(function(message) {
                makeMsg(message);
            });
        },
        error: function(xhr) {
            const errorMessage = xhr.error;
            alert(errorMessage);
        }
    });
}

function censureMsg(message, callback) {
    const token = getToken();
    let splitMsg = message.split(' ');
    $.ajax({
        url: '/api/censured/active',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        success: function(words) {
            const censuredMsg = splitMsg.map(word => {
                const isCensured = words.some(censuredWord => censuredWord.word === word);
                return isCensured ? '****' : word;
            }).join(' ');

            callback(censuredMsg);
        },
        error: function(xhr) {
            callback(message);
        }
    });
}

function scrollToBottom() {
    const chatWindow = document.getElementById('chat-container');
    chatWindow.scrollTop = chatWindow.scrollHeight; 
}