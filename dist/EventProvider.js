"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventProvider = void 0;
const mongodb_1 = require("mongodb");
class EventProvider {
    mongoClient;
    constructor(mongoClient) {
        this.mongoClient = mongoClient;
    }
    async getAllEvents() {
        const eventCollectionName = process.env.EVENTS_COLLECTION_NAME;
        if (!eventCollectionName) {
            throw new Error("Missing EVENTS_COLLECTION_NAME from environment variables");
        }
        const eventCollection = this.mongoClient
            .db()
            .collection(eventCollectionName);
        const events = await eventCollection.find({}).toArray();
        return events.map((event) => ({
            _id: event._id.toHexString(), // Convert ObjectId to string
            name: event.name,
            date: event.date,
            description: event.description,
            attendees: event.attendees,
            organizer: event.organizer,
        }));
    }
    async createEvent(event) {
        const eventCollectionName = process.env.EVENTS_COLLECTION_NAME;
        if (!eventCollectionName) {
            throw new Error("Missing EVENTS_COLLECTION_NAME from environment variables");
        }
        const eventCollection = this.mongoClient
            .db()
            .collection(eventCollectionName);
        await eventCollection.insertOne({
            ...event,
            _id: new mongodb_1.ObjectId(), // Generate a new unique id
        });
    }
    async bookEvent(eventId, username) {
        const eventCollectionName = process.env.EVENTS_COLLECTION_NAME;
        const userCollectionName = process.env.USERS_COLLECTION_NAME;
        if (!eventCollectionName || !userCollectionName) {
            throw new Error("Missing EVENTS_COLLECTION_NAME or USERS_COLLECTION_NAME from environment variables");
        }
        const eventCollection = this.mongoClient
            .db()
            .collection(eventCollectionName);
        const userCollection = this.mongoClient
            .db()
            .collection(userCollectionName);
        const event = await eventCollection.findOne({ _id: new mongodb_1.ObjectId(eventId) });
        if (!event) {
            throw new Error("Event not found");
        }
        const user = await userCollection.findOne({ username });
        if (!user) {
            throw new Error("User not found");
        }
        // Add the event ID to the user's bookedEvents array
        await userCollection.updateOne({ _id: user._id }, { $addToSet: { bookedEvents: eventId } });
        // Increment the attendees count for the event
        await eventCollection.updateOne({ _id: new mongodb_1.ObjectId(eventId) }, { $inc: { attendees: 1 } });
    }
    async unbookEvent(eventId, username) {
        const eventCollectionName = process.env.EVENTS_COLLECTION_NAME;
        const userCollectionName = process.env.USERS_COLLECTION_NAME;
        if (!eventCollectionName || !userCollectionName) {
            throw new Error("Missing EVENTS_COLLECTION_NAME or USERS_COLLECTION_NAME from environment variables");
        }
        const eventCollection = this.mongoClient
            .db()
            .collection(eventCollectionName);
        const userCollection = this.mongoClient
            .db()
            .collection(userCollectionName);
        const event = await eventCollection.findOne({ _id: new mongodb_1.ObjectId(eventId) });
        if (!event) {
            throw new Error("Event not found");
        }
        const user = await userCollection.findOne({ username });
        if (!user) {
            throw new Error("User not found");
        }
        // Remove the event ID from the user's bookedEvents array
        await userCollection.updateOne({ _id: user._id }, { $pull: { bookedEvents: eventId } });
        // Decrement the attendees count for the event
        if (event.attendees > 0) {
            await eventCollection.updateOne({ _id: new mongodb_1.ObjectId(eventId) }, { $inc: { attendees: -1 } });
        }
    }
    async registerUser(user) {
        const userCollectionName = process.env.USERS_COLLECTION_NAME;
        if (!userCollectionName) {
            throw new Error("Missing USERS_COLLECTION_NAME from environment variables");
        }
        const userCollection = this.mongoClient
            .db()
            .collection(userCollectionName);
        await userCollection.insertOne({
            ...user,
            _id: new mongodb_1.ObjectId(), // Generate a new unique id
        });
    }
    async getEventById(eventId) {
        const eventCollectionName = process.env.EVENTS_COLLECTION_NAME;
        if (!eventCollectionName) {
            throw new Error("Missing EVENTS_COLLECTION_NAME from environment variables");
        }
        const eventCollection = this.mongoClient
            .db()
            .collection(eventCollectionName);
        return await eventCollection.findOne({ _id: new mongodb_1.ObjectId(eventId) });
    }
    async getBookedEventsForUser(username) {
        const eventCollectionName = process.env.EVENTS_COLLECTION_NAME;
        const userCollectionName = process.env.USERS_COLLECTION_NAME;
        if (!eventCollectionName || !userCollectionName) {
            throw new Error("Missing EVENTS_COLLECTION_NAME or USERS_COLLECTION_NAME from environment variables");
        }
        const eventCollection = this.mongoClient
            .db()
            .collection(eventCollectionName);
        const userCollection = this.mongoClient
            .db()
            .collection(userCollectionName);
        const user = await userCollection.findOne({ username });
        if (!user || !user.bookedEvents) {
            return [];
        }
        const bookedEventIds = user.bookedEvents.map((eventId) => new mongodb_1.ObjectId(eventId));
        const bookedEvents = await eventCollection
            .find({ _id: { $in: bookedEventIds } })
            .toArray();
        return bookedEvents.map((event) => ({
            _id: event._id.toHexString(),
            name: event.name,
            date: event.date,
            description: event.description,
            attendees: event.attendees,
            organizer: event.organizer,
        }));
    }
}
exports.EventProvider = EventProvider;
