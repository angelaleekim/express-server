import express, { Request, Response, NextFunction } from "express";
import { MongoClient } from "mongodb";
import { CredentialsProvider } from "../CredentialsProvider";
import jwt from "jsonwebtoken";

require("dotenv/config");

// Process JWT_SECRET
const signatureKey = process.env.JWT_SECRET;
if (!signatureKey) {
  throw new Error("Missing JWT_SECRET from env file");
}

// Middleware to verify JWT token
export function verifyAuthToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.get("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).end();
  } else {
    jwt.verify(token, signatureKey as string, (error, decoded) => {
      if (decoded) {
        next();
      } else {
        res.status(403).end();
      }
    });
  }
}

// Generate JWT token for a given username
function generateAuthToken(username: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(
      { username: username },
      signatureKey as string,
      { expiresIn: "1d" },
      (error, token) => {
        if (error) reject(error);
        else resolve(token as string);
      }
    );
  });
}

export function registerAuthRoutes(
  app: express.Express,
  mongoClient: MongoClient
) {
  // Middleware to parse JSON request bodies
  app.post(
    "/auth/register",
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { username, password } = req.body;
        if (!username || !password) {
          res.status(400).send({
            error: "Bad request",
            message: "Missing username or password",
          });
          return;
        }
        const credsProvider = new CredentialsProvider(mongoClient);
        const registrationSuccess = await credsProvider.registerUser(
          username,
          password
        );
        if (!registrationSuccess) {
          res.status(400).send({
            error: "Bad request",
            message: "Username already taken",
          });
          return;
        }
        const token = await generateAuthToken(username);
        res.status(201).send({ token });
      } catch (error) {
        res.status(500).send("Error processing registration");
      }
    }
  );
  // Login route
  app.post(
    "/auth/login",
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { username, password } = req.body;
        if (!username || !password) {
          res.status(400).send({
            error: "Bad request",
            message: "Missing username or password",
          });
          return;
        }

        const credsProvider = new CredentialsProvider(mongoClient);
        const isPasswordValid = await credsProvider.verifyPassword(
          username,
          password
        );

        if (isPasswordValid) {
          const token = await generateAuthToken(username);
          res.status(200).send({ token });
        } else {
          res.status(401).send({
            error: "Unauthorized",
            message: "Incorrect username or password",
          });
        }
      } catch (error) {
        res.status(500).send("Error processing login");
      }
    }
  );
}
