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
// Process JWT_SECRET
const signatureKey = process.env.JWT_SECRET;
if (!signatureKey) {
    throw new Error("Missing JWT_SECRET from env file");
}
// Middleware to verify JWT token
function verifyAuthToken(req, res, next) {
    const authHeader = req.get("Authorization");
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        res.status(401).end();
    }
    else {
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
// Generate JWT token for a given username
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
    // Middleware to parse JSON request bodies
    app.post("/auth/register", async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                res.status(400).send({
                    error: "Bad request",
                    message: "Missing username or password",
                });
                return;
            }
            const credsProvider = new CredentialsProvider_1.CredentialsProvider(mongoClient);
            const registrationSuccess = await credsProvider.registerUser(username, password);
            if (!registrationSuccess) {
                res.status(400).send({
                    error: "Bad request",
                    message: "Username already taken",
                });
                return;
            }
            const token = await generateAuthToken(username);
            res.status(201).send({ token });
        }
        catch (error) {
            res.status(500).send("Error processing registration");
        }
    });
    // Login route
    app.post("/auth/login", async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                res.status(400).send({
                    error: "Bad request",
                    message: "Missing username or password",
                });
                return;
            }
            const credsProvider = new CredentialsProvider_1.CredentialsProvider(mongoClient);
            const isPasswordValid = await credsProvider.verifyPassword(username, password);
            if (isPasswordValid) {
                const token = await generateAuthToken(username);
                res.status(200).send({ token });
            }
            else {
                res.status(401).send({
                    error: "Unauthorized",
                    message: "Incorrect username or password",
                });
            }
        }
        catch (error) {
            res.status(500).send("Error processing login");
        }
    });
}
