

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
const auth = require('./auth');
require('dotenv').config();

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/api/register', async (req, res) => {
  const { user_name, password } = req.body;
  const hashedPassword = await auth.hashPassword(password);

  db.query('INSERT INTO users (username, password) VALUES (?, ?);', [user_name, hashedPassword], (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'Utilizador registrado com sucesso!' });
  });
});

app.post('/api/login', async (req, res) => {
  const { user_name, password } = req.body;
  
  db.query('SELECT * FROM users WHERE username = ?', [user_name], async (err, results) => {
      if (err || results.length === 0) return res.status(401).json({ message: 'Utilizador ou senha inválidos!' });
      const user = results[0];
      const match = await auth.comparePassword(password, user.password);
      if (!match) return res.status(401).json({ message: 'Utilizador ou senha inválidos!' });
      const token = auth.generateToken(user.id);
      res.json({ token });
  });
});

app.use(auth.verifyToken);

app.get('/api/rooms', (req, res) => {
  db.query('SELECT * FROM rooms', (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
});

app.get('/api/rooms/:roomName/messages', (req, res) => {
  const { roomName } = req.params;

  db.query('SELECT * FROM rooms WHERE name = ?', [roomName], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.length === 0) return res.status(404).json({ error: 'Room not found' });
    const room = result[0];

    db.query('SELECT messages.*, users.username FROM messages JOIN users ON messages.sender_id = users.id WHERE room_id = ? ORDER BY created_at ASC;', [room.id], (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    });
  });
});

app.post('/api/rooms/:roomName/messages', (req, res) => {
  const { roomName } = req.params; 
  const { msg } = req.body;

  db.query('SELECT * FROM rooms WHERE name = ?', [roomName], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.length === 0) return res.status(404).json({ error: 'Room not found' });
    const room = result[0];

    db.query('INSERT INTO messages (room_id, sender_id, content) VALUES (?, ?, ?)', 
      [room.id, req.userId, msg], 
      (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ id: results.insertId, room_id: room.id, sender_id: req.userId, content: msg });
    });
  });
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Extract the token from the query string
  const token = socket.handshake.query.token;
  
  if (!token) {
      console.log('No token provided');
      socket.disconnect();
      return;
  }

  // Verify the token using the verifyToken function from auth.js
  auth.verifyTokenWSock(token)
      .then(decoded => {
          // The decoded object will contain the user ID from the token
          const userId = decoded.userId;  // Assuming 'id' is returned by your JWT

          // Query the database to get the user's username
          db.query('SELECT username FROM users WHERE id = ?', [userId], (err, result) => {
              if (err || result.length === 0) {
                  console.log('User not found');
                  socket.disconnect();
                  return;
              }

              // Attach the username to the socket object
              socket.user = {
                  id: userId,
                  username: result[0].username  // Assume the username is in the first result
              };
              console.log('User authenticated:', socket.user.username);

              // Handle the join room event
              socket.on('joinRoom', (roomName) => {
                  socket.join(roomName);
                  console.log(`${socket.user.username} joined room: ${roomName}`);
              });

              // Handle sending messages
              socket.on('sendMessage', (messageData) => {
                  console.log('New message:', messageData);

                  // Emit the message to the room with the user's username
                  io.to(messageData.roomName).emit('newMessage', {
                      username: socket.user.username, // Access the username from the decoded token
                      content: messageData.msg,
                  });

                  console.log(`Message sent to room ${messageData.roomName}:`, messageData);
              });

              // Handle disconnection
              socket.on('disconnect', () => {
                  console.log(`${socket.user ? socket.user.username : 'A user'} disconnected`);
              });
          });
      })
      .catch(err => {
          console.log(err); // If token verification fails, log the error
          socket.disconnect(); // Disconnect the socket if the token is invalid
      });
});

http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});