const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Verificar token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(403).json({ message: 'Token não fornecido!' });
    }

    // Expecting token to be in the format: "Bearer <token>"
    const token = authHeader.split(' ')[1];
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