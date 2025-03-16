"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuthToken = verifyAuthToken;
exports.registerAuthRoutes = registerAuthRoutes;
const CredentialsProvider_1 = require("../CredentialsProvider");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const signatureKey = process.env.JWT_SECRET;
if (!signatureKey) {
    throw new Error("Missing JWT_SECRET from env file");
}
function verifyAuthToken(req, res, next // Call next() to run the next middleware or request handler
) {
    const authHeader = req.get("Authorization");
    // The header should say "Bearer <token string>".  Discard the Bearer part.
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        res.status(401).end();
    }
    else { // signatureKey already declared as a module-level variable
        jsonwebtoken_1.default.verify(token, signatureKey, (error, decoded) => {
            if (decoded) {
                next();
            }
            else {
                res.status(403).end();
            }
        });
    }
}
function generateAuthToken(username) {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.sign({ username: username }, signatureKey, { expiresIn: "1d" }, (error, token) => {
            if (error)
                reject(error);
            else
                resolve(token);
        });
    });
}
function registerAuthRoutes(app, mongoClient) {
    app.post('/auth/register', async (req, res) => {
        try {
            const { username, password } = req.body;
            // Validate input
            if (!username || !password) {
                res.status(400).send({
                    error: "Bad request",
                    message: "Missing username or password"
                });
                return;
            }
            const credsProvider = new CredentialsProvider_1.CredentialsProvider(mongoClient);
            // Check if the username already exists
            const registrationSuccess = await credsProvider.registerUser(username, password);
            if (!registrationSuccess) {
                res.status(400).send({
                    error: "Bad request",
                    message: "Username already taken"
                });
                return;
            }
            // Use the registerUser function from CredentialsProvider
            await credsProvider.registerUser(username, password);
            res.status(201).send();
        }
        catch (error) {
            res.status(500).send('Error processing registration');
        }
    });
    app.post('/auth/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            // Validate input
            if (!username || !password) {
                res.status(400).send({
                    error: "Bad request",
                    message: "Missing username or password"
                });
                return;
            }
            // Use the verifyPassword function from CredentialsProvider
            const credsProvider = new CredentialsProvider_1.CredentialsProvider(mongoClient);
            const isPasswordValid = await credsProvider.verifyPassword(username, password);
            // If the password is valid, generate a token
            if (isPasswordValid) {
                const token = await generateAuthToken(username);
                res.status(200).send({ token });
            }
            else {
                res.status(401).send({
                    error: "Unauthorized",
                    message: "Incorrect username or password"
                });
            }
        }
        catch (error) {
            res.status(500).send('Error processing login');
        }
    });
}
