"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerImageRoutes = registerImageRoutes;
const mongodb_1 = require("mongodb");
const ImageProvider_1 = require("../ImageProvider");
const imageUploadMiddleware_1 = require("../imageUploadMiddleware");
const auth_1 = require("../routes/auth");
function registerImageRoutes(app, mongoClient) {
    app.get("/api/images", auth_1.verifyAuthToken, // Ensure token verification middleware is applied
    async (req, res) => {
        try {
            let userId = undefined;
            if (typeof req.query.createdBy === "string") {
                userId = req.query.createdBy;
            }
            // Ensure the token is properly decoded and available in res.locals
            const username = res.locals.token?.username;
            if (!username) {
                res.status(403).send({
                    error: "Forbidden",
                    message: "Invalid or missing token",
                });
                return;
            }
            const imageProvider = new ImageProvider_1.ImageProvider(mongoClient);
            const images = await imageProvider.getAllImages(userId);
            res.json(images.map((image) => ({
                id: image.id, // Ensure id is returned instead of _id
                src: image.src, // Map url to src
                name: image.name,
                author: image.author,
                likes: image.likes,
            })));
        }
        catch (error) {
            console.error("Error retrieving images:", error);
            res.status(500).send("Error retrieving images");
        }
    });
    app.patch("/api/images/:id", async (req, res) => {
        try {
            const id = req.params.id;
            const { name } = req.body;
            if (!name) {
                res.status(400).send({
                    error: "Bad request",
                    message: "Missing name property",
                });
            }
            const imageProvider = new ImageProvider_1.ImageProvider(mongoClient);
            const result = await imageProvider.updateImageName(id, name);
            if (result === 0) {
                res.status(404).send({
                    error: "Not found",
                    message: "Image does not exist",
                });
            }
            else {
                res.status(204).send();
            }
        }
        catch (error) {
            console.error("Error updating image:", error);
            res.status(500).send("Error updating image");
        }
    });
    app.post("/api/images", imageUploadMiddleware_1.imageMiddlewareFactory.single("image"), imageUploadMiddleware_1.handleImageFileErrors, async (req, res) => {
        try {
            const { name, description } = req.body;
            const file = req.file;
            if (!file || !name) {
                res.status(400).send({
                    error: "Bad request",
                    message: "Missing image file or name",
                });
                return;
            }
            const imageProvider = new ImageProvider_1.ImageProvider(mongoClient);
            const imageSrc = `/uploads/${file.filename}`;
            const author = res.locals.token?.username;
            if (!author) {
                res.status(500).send("Error processing image upload: Missing author");
                return;
            }
            const newImage = {
                src: imageSrc,
                name,
                description,
                author,
                likes: 0,
            };
            await imageProvider.createImage(newImage);
            res.status(201).send({
                id: new mongodb_1.ObjectId().toHexString(), // Generate id for response
                src: imageSrc,
                name,
                author,
                likes: 0,
            });
        }
        catch (error) {
            console.error("Error processing image upload:", error);
            res.status(500).send("Error processing image upload");
        }
    });
}
