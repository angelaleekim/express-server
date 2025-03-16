"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageProvider = void 0;
class ImageProvider {
    mongoClient;
    constructor(mongoClient) {
        this.mongoClient = mongoClient;
    }
    async getAllImages(id) {
        const imageCollectionName = process.env.IMAGES_COLLECTION_NAME;
        const userCollectionName = process.env.USERS_COLLECTION_NAME;
        if (!imageCollectionName || !userCollectionName) {
            throw new Error("Missing IMAGES_COLLECTION_NAME or USERS_COLLECTION_NAME from environment variables");
        }
        const imageCollection = this.mongoClient
            .db()
            .collection(imageCollectionName);
        const userCollection = this.mongoClient
            .db()
            .collection(userCollectionName);
        const images = await imageCollection
            .find(id ? { author: id } : {})
            .toArray();
        const authorIds = images.map((image) => image.author);
        const authors = await userCollection
            .find({ _id: { $in: authorIds } })
            .toArray();
        const authorMap = new Map(authors.map((author) => [author._id, author]));
        return images.map((image) => ({
            ...image,
            user: authorMap.get(image.author),
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
        const result = await imageCollection.updateOne({ _id: imageId }, { $set: { name: newName } });
        return result.matchedCount;
    }
}
exports.ImageProvider = ImageProvider;
