"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageProvider = void 0;
const mongodb_1 = require("mongodb");
class ImageProvider {
    mongoClient;
    constructor(mongoClient) {
        this.mongoClient = mongoClient;
    }
    async getAllImages(id) {
        const imageCollectionName = process.env.IMAGES_COLLECTION_NAME;
        if (!imageCollectionName) {
            throw new Error("Missing IMAGES_COLLECTION_NAME from environment variables");
        }
        const imageCollection = this.mongoClient
            .db()
            .collection(imageCollectionName);
        const images = await imageCollection
            .find(id ? { author: id } : {})
            .toArray();
        return images.map((image) => ({
            id: image.id, // Use id directly as a string
            src: image.src,
            description: image.description,
            name: image.name,
            author: image.author,
            likes: image.likes,
        }));
    }
    async updateImageName(imageId, newName) {
        if (!imageId) {
            throw new Error("Image ID must be provided");
        }
        const imageCollectionName = process.env.IMAGES_COLLECTION_NAME;
        if (!imageCollectionName) {
            throw new Error("Missing IMAGES_COLLECTION_NAME from environment variables");
        }
        const imageCollection = this.mongoClient
            .db()
            .collection(imageCollectionName);
        const result = await imageCollection.updateOne({ id: new mongodb_1.ObjectId(imageId) }, { $set: { name: newName } });
        return result.matchedCount;
    }
    async addImage(image) {
        const imageCollectionName = process.env.IMAGES_COLLECTION_NAME;
        if (!imageCollectionName) {
            throw new Error("Missing IMAGES_COLLECTION_NAME from environment variables");
        }
        const imageCollection = this.mongoClient
            .db()
            .collection(imageCollectionName);
        await imageCollection.insertOne({
            ...image,
            id: new mongodb_1.ObjectId(), // Use ObjectId for MongoDB
        });
    }
    async createImage(image) {
        const imageCollectionName = process.env.IMAGES_COLLECTION_NAME;
        if (!imageCollectionName) {
            throw new Error("Missing IMAGES_COLLECTION_NAME from environment variables");
        }
        const imageCollection = this.mongoClient
            .db()
            .collection(imageCollectionName);
        await imageCollection.insertOne({
            ...image,
            id: new mongodb_1.ObjectId(), // Generate a new unique id
        });
    }
}
exports.ImageProvider = ImageProvider;
