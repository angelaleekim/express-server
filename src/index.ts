import express, { Request, Response } from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { ImageProvider } from "./ImageProvider"; // Assuming ImageProvider is in the same directory

dotenv.config(); // Read the .env file in the current working directory, and load values into process.env.
const PORT = process.env.PORT || 3000;
const staticDir = process.env.STATIC_DIR || "public";

const { MONGO_USER, MONGO_PWD, MONGO_CLUSTER, DB_NAME } = process.env;

const connectionStringRedacted = `mongodb+srv://${MONGO_USER}:<password>@${MONGO_CLUSTER}/${DB_NAME}`;
const connectionString = `mongodb+srv://${MONGO_USER}:${MONGO_PWD}@${MONGO_CLUSTER}/${DB_NAME}`;

async function setUpServer() {
  console.log("Attempting Mongo connection at " + connectionStringRedacted);

  const mongoClient = await MongoClient.connect(connectionString);
  const collectionInfos = await mongoClient.db().listCollections().toArray();
  console.log(collectionInfos.map((collectionInfo) => collectionInfo.name)); // For debug only

  const app = express();
  app.use(express.static(staticDir));

  app.get("/hello", (req: Request, res: Response) => {
    res.send("Hello, World");
  });

  app.get("/api/images", async (req: Request, res: Response) => {
    try {
      const imageProvider = new ImageProvider(mongoClient);
      const images = await imageProvider.getAllImages();
      res.json(images);
    } catch (error) {
      res.status(500).send("Error retrieving images");
    }
  });

  app.get("*", (req: Request, res: Response) => {
    console.log("none of the routes above me were matched");
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

setUpServer().catch((error) => {
  console.error("Failed to set up server:", error);
});
