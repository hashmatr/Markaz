const jwt = require('jsonwebtoken');
const secretKey = process.env.Secret_jwt_token;

class JwtProvider {
    constructor(secretKey) {
        this.secretKey = secretKey;
    }

    generateToken(payload) {
        return jwt.sign(payload, this.secretKey, { expiresIn: "24h" });
    }

    getemailfromjwttoken(token) {
        try {
            // Directly verify and decode the token
            const decoded = jwt.verify(token, this.secretKey);
            return decoded.email;
        } catch (error) {
            console.error("Invalid token:", error.message);
            return null;
        }
    }
}

module.exports = new JwtProvider(secretKey);