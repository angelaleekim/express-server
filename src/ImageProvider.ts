import { MongoClient, ObjectId } from "mongodb";

// Define the interface for the image documents
interface ImageDocument {
  id: string; // Changed from _id to id
  src: string;
  description?: string;
  name: string;
  author: string;
  likes: number;
}

// Define the interface for the user documents
interface UserDocument {
  id: string; // Changed from _id to id
  username: string;
  email: string;
}

export class ImageProvider {
  constructor(private readonly mongoClient: MongoClient) {}

  async getAllImages(id?: string): Promise<ImageDocument[]> {
    const imageCollectionName = process.env.IMAGES_COLLECTION_NAME;
    if (!imageCollectionName) {
      throw new Error(
        "Missing IMAGES_COLLECTION_NAME from environment variables"
      );
    }

    const imageCollection = this.mongoClient
      .db()
      .collection<Omit<ImageDocument, "id"> & { id: string }>(
        imageCollectionName
      );

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

  async updateImageName(imageId: string, newName: string): Promise<number> {
    if (!imageId) {
      throw new Error("Image ID must be provided");
    }

    const imageCollectionName = process.env.IMAGES_COLLECTION_NAME;
    if (!imageCollectionName) {
      throw new Error(
        "Missing IMAGES_COLLECTION_NAME from environment variables"
      );
    }

    const imageCollection = this.mongoClient
      .db()
      .collection<Omit<ImageDocument, "id"> & { id: ObjectId }>(
        imageCollectionName
      );

    const result = await imageCollection.updateOne(
      { id: new ObjectId(imageId) },
      { $set: { name: newName } }
    );

    return result.matchedCount;
  }

  async addImage(image: Omit<ImageDocument, "id">): Promise<void> {
    const imageCollectionName = process.env.IMAGES_COLLECTION_NAME;
    if (!imageCollectionName) {
      throw new Error(
        "Missing IMAGES_COLLECTION_NAME from environment variables"
      );
    }

    const imageCollection = this.mongoClient
      .db()
      .collection<Omit<ImageDocument, "id"> & { id: ObjectId }>(
        imageCollectionName
      );

    await imageCollection.insertOne({
      ...image,
      id: new ObjectId(), // Use ObjectId for MongoDB
    });
  }

  async createImage(image: Omit<ImageDocument, "id">): Promise<void> {
    const imageCollectionName = process.env.IMAGES_COLLECTION_NAME;
    if (!imageCollectionName) {
      throw new Error(
        "Missing IMAGES_COLLECTION_NAME from environment variables"
      );
    }

    const imageCollection = this.mongoClient
      .db()
      .collection<Omit<ImageDocument, "id"> & { id: ObjectId }>(
        imageCollectionName
      );

    await imageCollection.insertOne({
      ...image,
      id: new ObjectId(), // Generate a new unique id
    });
  }
}
