const adminRooms = document.getElementById('admin-rooms');

$(document).ready(function() {
    populateAdminRooms();
});

function populateAdminRooms() {
    $.ajax({
        url: '/api/rooms',
        method: 'GET',
        contentType: 'application/json',
        success: function(xhr) {
            xhr.forEach(room => {
                createAdminRoom(room.name, room.is_active);
            });
        },
        error: function(xhr) {
            const errorMessage = xhr.responseText;
            alert(errorMessage);
        }
    });

}

function createAdminRoom(name, active) {
    const roomContainer = document.createElement('div');
    roomContainer.classList.add('room-container');

    const inactiveId = `inactive-${name}`;
    const activeId = `active-${name}`;
    const radioName = `chat-room-${name}`;

    roomContainer.innerHTML = `
    <p>${name}</p>
    <label>
        <input type="radio" name="${radioName}" value="0" id="${inactiveId}">
        Not Active
    </label>
    <label>
        <input type="radio" name="${radioName}" value="1" id="${activeId}">
        Active
    </label>
    `;

    // Set the checked property based on the 'active' status
    if (active === 0) {
        roomContainer.querySelector(`#${inactiveId}`).checked = true;
    } else {
        roomContainer.querySelector(`#${activeId}`).checked = true;
    }

    roomContainer.querySelector(`#${inactiveId}`).addEventListener('change', function() {
        updateRoomStatus(name, 0);
    });

    roomContainer.querySelector(`#${activeId}`).addEventListener('change', function() {
        updateRoomStatus(name, 1);
    });

    adminRooms.appendChild(roomContainer);
}

function updateAdminRoom() {

}

function updateRoomStatus(roomName, isActive) {
    $.ajax({
        url: `/api/rooms/${roomName}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
            room_name: roomName,
            is_active: isActive
        }),
        success: function(response) {
            console.log('Room updated successfully:', response);
        },
        error: function(xhr) {
            const errorMessage = xhr.responseText;
            alert('Error updating room: ' + errorMessage);
        }
    });
}