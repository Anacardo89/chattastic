const cors = require('cors');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const auth = require('./auth');
const db = require('./db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
});

app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve the index.ejs template on the root route
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/chat', auth.verifyToken, (req, res) => {
    const userId  = req.userId;
    db.query('SELECT * FROM users WHERE id = ?', [userId], async (err, results) => {
        const is_admin = results[0].is_admin;
        res.render('chat', {is_admin});
    });
});

app.get('/admin', (req, res) => {
    res.render('admin');
  });

app.post('/api/register', async (req, res) => {
    const { user_name, password } = req.body;
    const hashedPassword = await auth.hashPassword(password);

    db.query('INSERT INTO users (username, password) VALUES (?, ?);', [user_name, hashedPassword], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Utilizador registrado com sucesso!' });
    });
});

app.post('/api/login', (req, res) => {
    const { user_name, password } = req.body;
    
    db.query('SELECT * FROM users WHERE username = ?', [user_name], async (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }

        if (!results.length || !await auth.comparePassword(password, results[0].password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate the token
        const token = auth.generateToken(results[0].id);
        console.log(`token: ${token}`);
        
        // Set the token as a cookie in the response
        res.cookie('token', token, {
            httpOnly: false,
            secure: false,
            maxAge: 60 * 60 * 1000,
            sameSite: 'Strict',
            path: '/'
        });
        res.redirect('/chat');
    });
});


app.use(auth.verifyToken);

app.get('/api/rooms', (req, res) => {
    db.query('SELECT * FROM rooms;', (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json(result);
    });
});

app.get('/api/rooms/active', (req, res) => {
    db.query('SELECT * FROM rooms WHERE is_active = 1', (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json(result);
    });
});

app.post('/api/rooms', (req, res) => {
    const roomName = req.body.room_name;
    db.query('INSERT INTO rooms (name, is_active) VALUES (?, 0);', [roomName], (err, result) => {
      if (err){
        return res.status(500).json({ error: err });
      } 
       return res.status(201).json({ message: 'Room added successfully' });
    });
});

app.put('/api/rooms/:roomname', (req, res) => {
    const roomName = req.body.room_name;
    const active = req.body.is_active;
    db.query('UPDATE rooms SET is_active = ? WHERE name = ?;', [active, roomName], (err, result) => {
      if (err){
        return res.status(500).json({ error: err });
      } 
       return res.status(201).json({ message: 'Room updated successfully' });
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

app.get('/api/censured', (req, res) => {
    const censuredWord = req.body.censured_word;
    db.query('SELECT * FROM censured;', (err, results) => {
      if (err){
        return res.status(500).json({ error: err });
      } 
      res.json(results);
    });
});

app.post('/api/censured', (req, res) => {
    const censuredWord = req.body.censured_word;
    db.query('INSERT INTO censured (name, is_active) VALUES (?, 0);', [censuredWord], (err, result) => {
      if (err){
        return res.status(500).json({ error: err });
      } 
       return res.status(201).json({ message: 'Censured word added successfully' });
    });
});

// Initialize Socket.IO connection
io.on('connection', (socket) => {
    const token = socket.handshake.query.token;
    if (!token) {
        console.error('No token provided');
        socket.disconnect();
        return;
    }
    console.log('a user connected');
    auth.verifyTokenWSock(token)
      .then(decoded => {
          console.log('Token decoded:', decoded);
          const userId = decoded.userId;

          db.query('SELECT username FROM users WHERE id = ?', [userId], (err, result) => {
              if (err || result.length === 0) {
                  console.log('User not found');
                  socket.disconnect();
                  return;
              }

              socket.user = {
                  id: userId,
                  username: result[0].username 
              };
              console.log('User authenticated:', socket.user.username);

              socket.on('joinRoom', (roomName) => {
                  socket.join(roomName);
                  console.log(`${socket.user.username} joined room: ${roomName}`);
              });

              socket.on('sendMessage', (messageData) => {
                  console.log('New message:', messageData);

                  io.to(messageData.roomName).emit('newMessage', {
                      username: socket.user.username,
                      content: messageData.msg,
                  });

                  console.log(`Message sent to room ${messageData.roomName}:`, messageData);
              });

              socket.on('disconnect', () => {
                  console.log(`${socket.user ? socket.user.username : 'A user'} disconnected`);
              });
          });
      })
      .catch(err => {
          console.error('Token verification failed:', err);
          console.log(err);
          socket.disconnect(); 
      });
});

// Start the server on port 3000
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
