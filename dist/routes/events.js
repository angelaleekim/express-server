"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEventRoutes = registerEventRoutes;
const mongodb_1 = require("mongodb");
const EventProvider_1 = require("../EventProvider");
function registerEventRoutes(app, mongoClient) {
    app.get("/api/events", async (req, res) => {
        try {
            const eventProvider = new EventProvider_1.EventProvider(mongoClient);
            const events = await eventProvider.getAllEvents();
            res.json(events.map((event) => ({
                id: event._id.toString(), // Map _id to id
                name: event.name,
                date: event.date,
                description: event.description,
                attendees: event.attendees,
                organizer: event.organizer,
            })));
        }
        catch (error) {
            res.status(500).send("Error retrieving events");
        }
    });
    app.post("/api/events", async (req, res) => {
        try {
            const { name, date, description } = req.body;
            if (!name || !date || !description) {
                res.status(400).send({
                    error: "Bad request",
                    message: "Missing name, date, or description",
                });
                return;
            }
            const eventProvider = new EventProvider_1.EventProvider(mongoClient);
            await eventProvider.createEvent({
                _id: new mongodb_1.ObjectId(), // Generate a new ObjectId
                name,
                date,
                description,
                attendees: 0,
                organizer: res.locals.token?.username || "", // Extract username from token or fallback to empty string
            });
            res.status(201).send({ message: "Event created successfully" });
        }
        catch (error) {
            res.status(500).send("Error creating event");
        }
    });
    app.get("/api/events/booked", async (req, res) => {
        try {
            const username = res.locals.token?.username;
            if (!username) {
                res
                    .status(401)
                    .send({ error: "Unauthorized", message: "User not authenticated" });
                return;
            }
            const eventProvider = new EventProvider_1.EventProvider(mongoClient);
            const bookedEvents = await eventProvider.getBookedEventsForUser(username);
            res.status(200).json(bookedEvents);
        }
        catch (error) {
            res.status(500).send("Error retrieving booked events");
        }
    });
    app.patch("/api/events/:eventId/book", async (req, res) => {
        try {
            const { eventId } = req.params;
            const username = res.locals.token?.username;
            if (!username) {
                res
                    .status(401)
                    .send({ error: "Unauthorized", message: "User not authenticated" });
                return;
            }
            const eventProvider = new EventProvider_1.EventProvider(mongoClient);
            const eventExists = await eventProvider.getEventById(eventId);
            if (!eventExists) {
                res
                    .status(404)
                    .send({ error: "Not Found", message: "Event not found" });
                return;
            }
            await eventProvider.bookEvent(eventId, username);
            res.status(200).send({ message: "Event booked successfully" });
        }
        catch (error) {
            res.status(500).send("Error booking event");
        }
    });
    app.patch("/api/events/:eventId/unbook", async (req, res) => {
        try {
            const { eventId } = req.params;
            const username = res.locals.token?.username;
            if (!username) {
                res
                    .status(401)
                    .send({ error: "Unauthorized", message: "User not authenticated" });
                return;
            }
            const eventProvider = new EventProvider_1.EventProvider(mongoClient);
            const eventExists = await eventProvider.getEventById(eventId);
            if (!eventExists) {
                res
                    .status(404)
                    .send({ error: "Not Found", message: "Event not found" });
                return;
            }
            await eventProvider.unbookEvent(eventId, username);
            res.status(200).send({ message: "Event unbooked successfully" });
        }
        catch (error) {
            res.status(500).send("Error unbooking event");
        }
    });
}
