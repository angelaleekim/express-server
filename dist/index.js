"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
const events_1 = require("./routes/events");
const auth_1 = require("./routes/auth");
const cors_1 = __importDefault(require("cors")); // Add this import
dotenv_1.default.config();
const PORT = parseInt(process.env.PORT || "3000", 10);
const staticDir = process.env.STATIC_DIR || "public";
const uploadDir = process.env.IMAGE_UPLOAD_DIR || "uploads";
const { MONGO_USER, MONGO_PWD, MONGO_CLUSTER, DB_NAME } = process.env;
const connectionStringRedacted = `mongodb+srv://${MONGO_USER}:<password>@${MONGO_CLUSTER}/${DB_NAME}`;
const connectionString = `mongodb+srv://${MONGO_USER}:${MONGO_PWD}@${MONGO_CLUSTER}/${DB_NAME}`;
async function setUpServer() {
    const mongoClient = await mongodb_1.MongoClient.connect(connectionString);
    const collectionInfos = await mongoClient.db().listCollections().toArray();
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({ origin: "*" })); // Allow all origins for development
    app.use(express_1.default.static(staticDir));
    app.use("/uploads", express_1.default.static(uploadDir)); // Serve uploaded images
    app.use(express_1.default.json()); // Add this line to parse JSON request bodies
    app.get("/hello", (req, res) => {
        res.send("Hello, World");
    });
    (0, auth_1.registerAuthRoutes)(app, mongoClient);
    // Middleware to verify auth token, excluding OPTIONS requests
    app.use("/api/*", auth_1.verifyAuthToken);
    (0, events_1.registerEventRoutes)(app, mongoClient);
    // Fallback route to serve the frontend's index.html for SPA
    app.get("*", (req, res) => {
        res.sendFile(`${staticDir}/index.html`);
    });
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}
setUpServer().catch((error) => {
    // Removed log for setup failure
});
