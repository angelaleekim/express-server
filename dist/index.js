"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
const images_1 = require("./routes/images");
const auth_1 = require("./routes/auth");
const imageUploadMiddleware_1 = require("./imageUploadMiddleware");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const staticDir = process.env.STATIC_DIR || "public";
const uploadDir = process.env.IMAGE_UPLOAD_DIR || "uploads";
const { MONGO_USER, MONGO_PWD, MONGO_CLUSTER, DB_NAME } = process.env;
const connectionStringRedacted = `mongodb+srv://${MONGO_USER}:<password>@${MONGO_CLUSTER}/${DB_NAME}`;
const connectionString = `mongodb+srv://${MONGO_USER}:${MONGO_PWD}@${MONGO_CLUSTER}/${DB_NAME}`;
async function setUpServer() {
    console.log("Attempting Mongo connection at " + connectionStringRedacted);
    const mongoClient = await mongodb_1.MongoClient.connect(connectionString);
    const collectionInfos = await mongoClient.db().listCollections().toArray();
    // Removed debug log
    const app = (0, express_1.default)();
    app.use(express_1.default.static(staticDir));
    app.use("/uploads", express_1.default.static(uploadDir)); // Serve uploaded images
    app.use(express_1.default.json()); // Add this line to parse JSON request bodies
    app.get("/hello", (req, res) => {
        res.send("Hello, World");
    });
    (0, auth_1.registerAuthRoutes)(app, mongoClient);
    // Middleware to verify auth token
    app.use("/api/*", auth_1.verifyAuthToken);
    (0, images_1.registerImageRoutes)(app, mongoClient);
    app.post("/api/images", imageUploadMiddleware_1.imageMiddlewareFactory.single("image"), imageUploadMiddleware_1.handleImageFileErrors, async (req, res) => {
        try {
            if (!req.file) {
                res.status(400).send("No image file uploaded");
                return;
            }
            const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
            const imagesCollection = mongoClient.db(DB_NAME).collection("images");
            const result = await imagesCollection.insertOne({
                filename: req.file.filename,
                url: imageUrl,
                createdAt: new Date(),
            });
            res.status(201).json({
                message: "Image uploaded successfully",
                imageUrl,
                imageId: result.insertedId,
            });
        }
        catch (error) {
            console.error("Error uploading image:", error);
            res.status(500).send("Internal server error");
        }
    });
    app.get("*", (req, res) => {
        // Removed unnecessary log
    });
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}
setUpServer().catch((error) => {
    console.error("Failed to set up server:", error);
});
