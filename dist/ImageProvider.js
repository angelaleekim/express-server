"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageProvider = void 0;
class ImageProvider {
    mongoClient;
    constructor(mongoClient) {
        this.mongoClient = mongoClient;
    }
    async getAllImages() {
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
        const images = await imageCollection.find().toArray();
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
}
exports.ImageProvider = ImageProvider;
