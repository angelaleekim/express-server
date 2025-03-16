import express, { Request, Response } from "express";
import { MongoClient } from "mongodb";
import { ImageProvider } from "../ImageProvider";

export function registerImageRoutes(
  app: express.Application,
  mongoClient: MongoClient
) {
  app.get("/api/images", async (req: Request, res: Response) => {
    try {
      let userId: string | undefined = undefined;
      if (typeof req.query.createdBy === "string") {
        userId = req.query.createdBy;
      }
      console.log("userId", userId);
      const imageProvider = new ImageProvider(mongoClient);
      const images = await imageProvider.getAllImages(userId);
      res.json(images);
    } catch (error) {
      res.status(500).send("Error retrieving images");
    }
  });

  app.patch("/api/images/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const { name } = req.body;
      if (!name) {
        res.status(400).send({
          error: "Bad request",
          message: "Missing name property"
      });
      }
      console.log("Updating image with ID:", id, "to name:", name);
      const imageProvider = new ImageProvider(mongoClient);
      const result = await imageProvider.updateImageName(id, name);
      if (result === 0) {
        res.status(404).send({
          error: "Not found",
          message: "Image does not exist"
        });
      } else {
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).send("Error updating image");
    }
  });
}
