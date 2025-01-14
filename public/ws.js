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
        url: '/api/rooms',  // Adjust to your API endpoint for rooms
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

    const roomName = $('#room-select option:selected').text() || $('#room-select option').first().text();  // Default to the first room if not selected
    const message = $('#message-input').val();
    const data = { 
        roomName: roomName, 
        msg: message
    };

    if (!roomName) {
        alert('Please select a room to send a message.');
        return;
    }

    $.ajax({
        url: '/api/rooms/' + roomName + '/messages',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(data),
        success: function() {
            socket.emit('sendMessage', data);  // Emit the message to the room
            $('#message-input').val('');  // Clear the message input
        },
        error: function(xhr) {
            alert('Error sending message');
        }
    });
}

function makeMsg(msg) {
    const container = $('#chat-container');
    const message = document.createElement('p');
    message.innerHTML = `<strong>${msg.username}</strong>: ${msg.content}`;
    container.append(message);
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
