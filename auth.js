const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

// Hashing de senhas
const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

// Comparar senhas
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// Gerar token
const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined. Please set it in your environment variables.");
    }

    // Generate and return the JWT token
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Verificar token
const verifyToken = (req, res, next) => {
    const cookies = cookie.parse(req.headers.cookie || ''); 
    const token = cookies.token;

    if (!token) {
        return res.status(403).json({ message: 'Token não fornecido!' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token inválido!' });
        }
        req.userId = decoded.userId;
        next();
    });
};

function verifyTokenWSock(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return reject('Invalid token');
            }
            resolve(decoded);  // The decoded JWT payload (user info)
        });
    });
}

module.exports = { hashPassword, comparePassword, generateToken, verifyToken, verifyTokenWSock };