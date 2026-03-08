const jwt = require("jsonwebtoken");
const secret = "MediCare_Secret_123"; // In production, move this to .env

function setUser(payload) {
    // Simply sign the exact payload passed from the login controller
    return jwt.sign(payload, secret, { expiresIn: "24h" });
}

function getUser(token) {
    if (!token) return null;
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        return null;
    }
}

module.exports = { setUser, getUser };