

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
const auth = require('./auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await auth.hashPassword(password);

  db.query('INSERT INTO users (username, password) VALUES (?, ?);', [username, hashedPassword], (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'Utilizador registrado com sucesso!' });
  });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  db.query('SELECT * FROM users WHERE username = ?;', [username], async (err, results) => {
      if (err || results.length === 0) return res.status(401).json({ message: 'Utilizador ou senha inválidos!' });
      const user = results[0];
      const match = await auth.comparePassword(password, user.password);
      if (!match) return res.status(401).json({ message: 'Utilizador ou senha inválidos!' });
      const token = auth.generateToken(user.id);
      res.json({ token });
  });
});

app.use(auth.verifyToken);

app.get('/api/room/:roomName/messages', (req, res) => {
  const roomName = req.params.roomName;

  db.query('SELECT * FROM rooms WHERE name = ?', [roomName], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.length === 0) return res.status(404).json({ error: 'Room not found' });
    const room = result[0];

    db.query('SELECT * FROM messages WHERE room_id = ? ORDER BY created_at DESC;', [room.id], (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    });
  });
});

app.post('/api/room/:roomName/messages', (req, res) => {
  const newMsg = req.body.msg;

  db.query('SELECT * FROM rooms WHERE name = ?', [roomName], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.length === 0) return res.status(404).json({ error: 'Room not found' });
    const room = result[0];

    db.query('INSERT INTO messages (room_id, sender_id, content) VALUES (?, ?, ?);', [ room.id, req.userId, newMsg], (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ id: results.insertId, room_id: results.room_id, sender_id: results.sender_id, content: results.content });
    });
  });
});