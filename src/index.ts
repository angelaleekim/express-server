import express, { Request, Response, NextFunction } from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { registerImageRoutes } from "./routes/images";
import { registerAuthRoutes, verifyAuthToken } from "./routes/auth";
import {
  imageMiddlewareFactory,
  handleImageFileErrors,
} from "./imageUploadMiddleware";

dotenv.config();
const PORT = process.env.PORT || 3000;
const staticDir = process.env.STATIC_DIR || "public";
const uploadDir = process.env.IMAGE_UPLOAD_DIR || "uploads";

const { MONGO_USER, MONGO_PWD, MONGO_CLUSTER, DB_NAME } = process.env;

const connectionStringRedacted = `mongodb+srv://${MONGO_USER}:<password>@${MONGO_CLUSTER}/${DB_NAME}`;
const connectionString = `mongodb+srv://${MONGO_USER}:${MONGO_PWD}@${MONGO_CLUSTER}/${DB_NAME}`;

async function setUpServer() {
  console.log("Attempting Mongo connection at " + connectionStringRedacted);

  const mongoClient = await MongoClient.connect(connectionString);
  const collectionInfos = await mongoClient.db().listCollections().toArray();
  // Removed debug log

  const app = express();
  app.use(express.static(staticDir));
  app.use("/uploads", express.static(uploadDir)); // Serve uploaded images
  app.use(express.json()); // Add this line to parse JSON request bodies

  app.get("/hello", (req: Request, res: Response) => {
    res.send("Hello, World");
  });

  registerAuthRoutes(app, mongoClient);
  // Middleware to verify auth token
  app.use("/api/*", verifyAuthToken);
  registerImageRoutes(app, mongoClient);

  app.post(
    "/api/images",
    imageMiddlewareFactory.single("image"),
    handleImageFileErrors,
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (!req.file) {
          res.status(400).send("No image file uploaded");
          return;
        }

        const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
          req.file.filename
        }`;
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
      } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).send("Internal server error");
      }
    }
  );

  app.get("*", (req: Request, res: Response) => {
    // Removed unnecessary log
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

setUpServer().catch((error) => {
  console.error("Failed to set up server:", error);
});
