import express, { Request, Response } from "express";

interface CustomRequest extends Request {
  user?: {
    username: string;
  };
}
import { MongoClient, ObjectId } from "mongodb";
import { EventProvider, EventDocument } from "../EventProvider";

export function registerEventRoutes(
  app: express.Application,
  mongoClient: MongoClient
) {
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const eventProvider = new EventProvider(mongoClient);
      const events = await eventProvider.getAllEvents();
      res.json(
        events.map((event) => ({
          id: event._id.toString(), // Map _id to id
          name: event.name,
          date: event.date,
          description: event.description,
          attendees: event.attendees,
          organizer: event.organizer,
        }))
      );
    } catch (error) {
      res.status(500).send("Error retrieving events");
    }
  });

  app.post("/api/events", async (req: Request, res: Response) => {
    try {
      const { name, date, description } = req.body;

      if (!name || !date || !description) {
        res.status(400).send({
          error: "Bad request",
          message: "Missing name, date, or description",
        });
        return;
      }

      const eventProvider = new EventProvider(mongoClient);
      await eventProvider.createEvent({
        _id: new ObjectId(), // Generate a new ObjectId
        name,
        date,
        description,
        attendees: 0,
        organizer: res.locals.token?.username || "", // Extract username from token or fallback to empty string
      });

      res.status(201).send({ message: "Event created successfully" });
    } catch (error) {
      res.status(500).send("Error creating event");
    }
  });

  app.get("/api/events/booked", async (req: Request, res: Response) => {
    try {
      const username = res.locals.token?.username;

      if (!username) {
        res
          .status(401)
          .send({ error: "Unauthorized", message: "User not authenticated" });
        return;
      }

      const eventProvider = new EventProvider(mongoClient);
      const bookedEvents = await eventProvider.getBookedEventsForUser(username);

      res.status(200).json(bookedEvents);
    } catch (error) {
      res.status(500).send("Error retrieving booked events");
    }
  });

  app.patch(
    "/api/events/:eventId/book",
    async (req: Request, res: Response) => {
      try {
        const { eventId } = req.params;
        const username = res.locals.token?.username;

        if (!username) {
          res
            .status(401)
            .send({ error: "Unauthorized", message: "User not authenticated" });
          return;
        }

        const eventProvider = new EventProvider(mongoClient);
        const eventExists = await eventProvider.getEventById(eventId);

        if (!eventExists) {
          res
            .status(404)
            .send({ error: "Not Found", message: "Event not found" });
          return;
        }

        await eventProvider.bookEvent(eventId, username);

        res.status(200).send({ message: "Event booked successfully" });
      } catch (error) {
        res.status(500).send("Error booking event");
      }
    }
  );

  app.patch(
    "/api/events/:eventId/unbook",
    async (req: Request, res: Response) => {
      try {
        const { eventId } = req.params;
        const username = res.locals.token?.username;

        if (!username) {
          res
            .status(401)
            .send({ error: "Unauthorized", message: "User not authenticated" });
          return;
        }

        const eventProvider = new EventProvider(mongoClient);
        const eventExists = await eventProvider.getEventById(eventId);

        if (!eventExists) {
          res
            .status(404)
            .send({ error: "Not Found", message: "Event not found" });
          return;
        }

        await eventProvider.unbookEvent(eventId, username);

        res.status(200).send({ message: "Event unbooked successfully" });
      } catch (error) {
        res.status(500).send("Error unbooking event");
      }
    }
  );
}
