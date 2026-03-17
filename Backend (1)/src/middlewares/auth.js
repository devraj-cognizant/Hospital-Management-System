

const { getUser } = require("../services/auth");

async function restrictToLoggedInUserOnly(req, res, next) {
    try {
        // Look for Bearer token in headers
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        console.log("--- AUTH DEBUG ---");
        console.log("Token received:", token ? "YES" : "NO");

        if (!token) {
            console.log("❌ Bouncer: No token found in headers!");
            return res.status(401).json({ message: "Please login first" });
        }

        const user = getUser(token);
        if (!user) {
            console.log("❌ Bouncer: Invalid or Expired Token");
            return res.status(401).json({ message: "Invalid Session" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.log("Middleware Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

function restrictToRoles(roles = []) {
    return function (req, res, next) {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Unauthorized: Insufficient permissions" });
        }
        next();
    };
}

module.exports = { restrictToLoggedInUserOnly, restrictToRoles };