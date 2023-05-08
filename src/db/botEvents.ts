// @ts-ignore
import { db } from "./firebase";

interface BotEvent {
  message: string;
  eventAddress: string;
  createdAt: string;
  id: string;
  team1: string;
  team2: string;
}

export async function createBotEvent(
  message: string,
  team1: string,
  team2: string,
  eventAddress: string
) {
  try {
    const botEventsCollection = db.collection("botEvents");
    const newEvent = {
      message: message,
      createdAt: new Date().toISOString(),
      team1: team1,
      team2: team2,
      eventAddress: eventAddress,
    };
    const docRef = await botEventsCollection.add(newEvent);
    console.log(`Bot event created with ID: ${docRef.id}`);
    return { ...newEvent, id: docRef.id };
  } catch (er) {
    console.log("Error creating a betEvent", er);
  }
}

export async function findAllBotEvents() {
  try {
    const botEventsCollection = db.collection("botEvents");
    const querySnapshot = await botEventsCollection.get();
    const botEvents: BotEvent[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      botEvents.push({
        message: data.message,
        eventAddress: data.eventAddress,
        createdAt: data.createdAt,
        team1: data.team1,
        team2: data.team2,
        id: doc.id,
      });
    });
    return botEvents;
  } catch (er) {
    console.log("Error finding all bot events", er);
  }
}
