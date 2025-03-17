import { Collection, MongoClient } from "mongodb";
import bcrypt from "bcrypt";

interface ICredentialsDocument {
  username: string;
  password: string;
}

export class CredentialsProvider {
  private readonly collection: Collection<ICredentialsDocument>;

  constructor(mongoClient: MongoClient) {
    const COLLECTION_NAME = process.env.CREDS_COLLECTION_NAME;
    if (!COLLECTION_NAME) {
      throw new Error("Missing CREDS_COLLECTION_NAME from env file");
    }
    this.collection = mongoClient
      .db()
      .collection<ICredentialsDocument>(COLLECTION_NAME);
  }

  async registerUser(username: string, plaintextPassword: string) {
    const existingUser = await this.collection.findOne({ username });
    if (existingUser) {
      return false; // User already exists
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plaintextPassword, salt);

    await this.collection.insertOne({ username, password: hashedPassword });
    return true; // Success
  }

  async verifyPassword(username: string, password: string): Promise<boolean> {
    const user = await this.collection.findOne({ username });
    if (!user) {
      return false;
    }

    const hashedDatabasePassword = user.password;
    return await bcrypt.compare(password, hashedDatabasePassword);
  }
}
