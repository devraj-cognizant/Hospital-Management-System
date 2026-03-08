const { getUser } = require("../services/auth");
const Blacklist = require("../models/blacklist");

// 1. Checks if the user is logged in at all
async function restrictToLoggedInUserOnly(req, res, next) {
    try {
        const token = req.cookies?.uid || req.headers?.authorization?.split(" ")[1];
        console.log("--- AUTH DEBUG ---");
        console.log("Token received:", token ? "YES" : "NO");

        if (!token) return res.status(401).json({ message: "Please login first" });

        const user = getUser(token);
        console.log("Decoded User from Token:", user); // Check if 'id' and 'role' are here

        if (!user) return res.status(401).json({ message: "Invalid Session" });

        req.user = user;
        next();
    } catch (error) {
        console.log("Middleware Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// 2. NEW: Checks if the logged-in user has the correct role
function restrictToRoles(roles = []) {
    return function (req, res, next) {
        // Fallback in case req.user wasn't set properly
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: "Unauthorized: Role not found" });
        }

        // Check if the user's role is in the list of allowed roles
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Unauthorized: You do not have permission to access this route" });
        }

        next(); // User has the right role, let them through!
    };
}

// Export both middlewares
module.exports = { restrictToLoggedInUserOnly, restrictToRoles };