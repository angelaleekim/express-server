import express, { Request, Response, NextFunction } from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { registerEventRoutes } from "./routes/events";
import { registerAuthRoutes, verifyAuthToken } from "./routes/auth";
import cors from "cors"; // Add this import

dotenv.config();
const PORT = parseInt(process.env.PORT || "3000", 10);
const staticDir = process.env.STATIC_DIR || "public";
const uploadDir = process.env.IMAGE_UPLOAD_DIR || "uploads";

const { MONGO_USER, MONGO_PWD, MONGO_CLUSTER, DB_NAME } = process.env;

const connectionStringRedacted = `mongodb+srv://${MONGO_USER}:<password>@${MONGO_CLUSTER}/${DB_NAME}`;
const connectionString = `mongodb+srv://${MONGO_USER}:${MONGO_PWD}@${MONGO_CLUSTER}/${DB_NAME}`;

async function setUpServer() {
  const mongoClient = await MongoClient.connect(connectionString);
  const collectionInfos = await mongoClient.db().listCollections().toArray();

  const app = express();
  app.use(cors({ origin: "*" })); // Allow all origins for development
  app.use(express.static(staticDir));
  app.use("/uploads", express.static(uploadDir)); // Serve uploaded images
  app.use(express.json()); // Add this line to parse JSON request bodies

  app.get("/hello", (req: Request, res: Response) => {
    res.send("Hello, World");
  });

  registerAuthRoutes(app, mongoClient);

  // Middleware to verify auth token, excluding OPTIONS requests
  app.use("/api/*", verifyAuthToken);
  registerEventRoutes(app, mongoClient);

  // Fallback route to serve the frontend's index.html for SPA
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(`${staticDir}/index.html`);
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

setUpServer().catch((error) => {
  // Removed log for setup failure
});
