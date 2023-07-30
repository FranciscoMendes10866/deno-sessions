import { MongoClient } from "mongodb";

export const client = new MongoClient();

const DB_NAME = "DEV";

await client.connect(
  `mongodb://root:root@localhost:27017/${DB_NAME}?authSource=admin`,
);

export const db = client.database(DB_NAME);
