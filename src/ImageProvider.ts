import { MongoClient } from "mongodb";

// Define the interface for the image documents
interface ImageDocument {
  _id: string;
  url: string;
  description?: string;
  name: string;
  author: string;
  likes: number;
}

// Define the interface for the user documents
interface UserDocument {
  _id: string;
  username: string;
  email: string;
}

export class ImageProvider {
  constructor(private readonly mongoClient: MongoClient) {}

  async getAllImages(): Promise<(ImageDocument & { user: UserDocument })[]> {
    const imageCollectionName = process.env.IMAGES_COLLECTION_NAME;
    const userCollectionName = process.env.USERS_COLLECTION_NAME;
    if (!imageCollectionName || !userCollectionName) {
      throw new Error(
        "Missing IMAGES_COLLECTION_NAME or USERS_COLLECTION_NAME from environment variables"
      );
    }

    const imageCollection = this.mongoClient
      .db()
      .collection<ImageDocument>(imageCollectionName);
    const userCollection = this.mongoClient
      .db()
      .collection<UserDocument>(userCollectionName);

    const images = await imageCollection.find().toArray();

    const authorIds = images.map((image) => image.author);
    const authors = await userCollection
      .find({ _id: { $in: authorIds } })
      .toArray();

    const authorMap = new Map(authors.map((author) => [author._id, author]));

    return images.map((image) => ({
      ...image,
      user: authorMap.get(image.author) as UserDocument,
    }));
  }
}
