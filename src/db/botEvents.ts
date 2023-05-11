// @ts-ignore
import { db } from "./firebase";

interface BotEvent {
  message: string;
  createdAt: string;
  id: string;
  team1: string;
  team2: string;
  tgUserId: string
}

export async function createBotEvent(
  message: string,
  team1: string,
  team2: string,
  tgUserId: string
) {
  try {
    const botEventsCollection = db.collection("botEvents");
    const newEvent = {
      message: message,
      createdAt: new Date().toISOString(),
      team1: team1,
      team2: team2,
      tgUserId: tgUserId || "-1"
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
        createdAt: data.createdAt,
        team1: data.team1,
        team2: data.team2,
        id: doc.id,
        tgUserId: data.tgUserId
      });
    });
    return botEvents;
  } catch (er) {
    console.log("Error finding all bot events", er);
  }
}

