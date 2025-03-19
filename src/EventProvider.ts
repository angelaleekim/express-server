import { MongoClient, ObjectId } from "mongodb";

// Define the interface for the event documents
export interface EventDocument {
  _id: string | ObjectId; // Changed from _id to id
  name: string;
  date: string;
  description?: string;
  attendees: number;
  organizer: string;
}

// Define the interface for the user documents
export interface UserDocument {
  id: string; // Changed from _id to id
  username: string;
  email: string;
  bookedEvents: string[]; // Add this property to represent booked event IDs
}

export class EventProvider {
  constructor(private readonly mongoClient: MongoClient) {}

  async getAllEvents(): Promise<EventDocument[]> {
    const eventCollectionName = process.env.EVENTS_COLLECTION_NAME;
    if (!eventCollectionName) {
      throw new Error(
        "Missing EVENTS_COLLECTION_NAME from environment variables"
      );
    }

    const eventCollection = this.mongoClient
      .db()
      .collection<Omit<EventDocument, "id"> & { _id: ObjectId }>(
        eventCollectionName
      );

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

  async createEvent(event: Omit<EventDocument, "id">): Promise<void> {
    const eventCollectionName = process.env.EVENTS_COLLECTION_NAME;
    if (!eventCollectionName) {
      throw new Error(
        "Missing EVENTS_COLLECTION_NAME from environment variables"
      );
    }

    const eventCollection = this.mongoClient
      .db()
      .collection<Omit<EventDocument, "id"> & { _id: ObjectId }>(
        eventCollectionName
      );

    await eventCollection.insertOne({
      ...event,
      _id: new ObjectId(), // Generate a new unique id
    });
  }

  async bookEvent(eventId: string, username: string): Promise<void> {
    const eventCollectionName = process.env.EVENTS_COLLECTION_NAME;
    const userCollectionName = process.env.USERS_COLLECTION_NAME;

    if (!eventCollectionName || !userCollectionName) {
      throw new Error(
        "Missing EVENTS_COLLECTION_NAME or USERS_COLLECTION_NAME from environment variables"
      );
    }

    const eventCollection = this.mongoClient
      .db()
      .collection<Omit<EventDocument, "id"> & { _id: ObjectId }>(
        eventCollectionName
      );

    const userCollection = this.mongoClient
      .db()
      .collection<Omit<UserDocument, "id"> & { _id: ObjectId }>(
        userCollectionName
      );

    const event = await eventCollection.findOne({ _id: new ObjectId(eventId) });
    if (!event) {
      throw new Error("Event not found");
    }

    const user = await userCollection.findOne({ username });
    if (!user) {
      throw new Error("User not found");
    }

    // Add the event ID to the user's bookedEvents array
    await userCollection.updateOne(
      { _id: user._id },
      { $addToSet: { bookedEvents: eventId } }
    );

    // Increment the attendees count for the event
    await eventCollection.updateOne(
      { _id: new ObjectId(eventId) },
      { $inc: { attendees: 1 } }
    );
  }

  async unbookEvent(eventId: string, username: string): Promise<void> {
    const eventCollectionName = process.env.EVENTS_COLLECTION_NAME;
    const userCollectionName = process.env.USERS_COLLECTION_NAME;

    if (!eventCollectionName || !userCollectionName) {
      throw new Error(
        "Missing EVENTS_COLLECTION_NAME or USERS_COLLECTION_NAME from environment variables"
      );
    }

    const eventCollection = this.mongoClient
      .db()
      .collection<Omit<EventDocument, "id"> & { _id: ObjectId }>(
        eventCollectionName
      );

    const userCollection = this.mongoClient
      .db()
      .collection<Omit<UserDocument, "id"> & { _id: ObjectId }>(
        userCollectionName
      );

    const event = await eventCollection.findOne({ _id: new ObjectId(eventId) });
    if (!event) {
      throw new Error("Event not found");
    }

    const user = await userCollection.findOne({ username });
    if (!user) {
      throw new Error("User not found");
    }

    // Remove the event ID from the user's bookedEvents array
    await userCollection.updateOne(
      { _id: user._id },
      { $pull: { bookedEvents: eventId } }
    );

    // Decrement the attendees count for the event
    if (event.attendees > 0) {
      await eventCollection.updateOne(
        { _id: new ObjectId(eventId) },
        { $inc: { attendees: -1 } }
      );
    }
  }

  async registerUser(user: Omit<UserDocument, "id">): Promise<void> {
    const userCollectionName = process.env.USERS_COLLECTION_NAME;
    if (!userCollectionName) {
      throw new Error(
        "Missing USERS_COLLECTION_NAME from environment variables"
      );
    }

    const userCollection = this.mongoClient
      .db()
      .collection<Omit<UserDocument, "id"> & { _id: ObjectId }>(
        userCollectionName
      );

    await userCollection.insertOne({
      ...user,
      _id: new ObjectId(), // Generate a new unique id
    });
  }

  async getEventById(eventId: string): Promise<EventDocument | null> {
    const eventCollectionName = process.env.EVENTS_COLLECTION_NAME;
    if (!eventCollectionName) {
      throw new Error(
        "Missing EVENTS_COLLECTION_NAME from environment variables"
      );
    }

    const eventCollection = this.mongoClient
      .db()
      .collection<Omit<EventDocument, "id"> & { _id: ObjectId }>(
        eventCollectionName
      );

    return await eventCollection.findOne({ _id: new ObjectId(eventId) });
  }

  async getBookedEventsForUser(username: string): Promise<EventDocument[]> {
    const eventCollectionName = process.env.EVENTS_COLLECTION_NAME;
    const userCollectionName = process.env.USERS_COLLECTION_NAME;

    if (!eventCollectionName || !userCollectionName) {
      throw new Error(
        "Missing EVENTS_COLLECTION_NAME or USERS_COLLECTION_NAME from environment variables"
      );
    }

    const eventCollection = this.mongoClient
      .db()
      .collection<Omit<EventDocument, "id"> & { _id: ObjectId }>(
        eventCollectionName
      );

    const userCollection = this.mongoClient
      .db()
      .collection<Omit<UserDocument, "id"> & { _id: ObjectId }>(
        userCollectionName
      );

    const user = await userCollection.findOne({ username });
    if (!user || !user.bookedEvents) {
      return [];
    }

    const bookedEventIds = user.bookedEvents.map(
      (eventId: string) => new ObjectId(eventId)
    );

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
