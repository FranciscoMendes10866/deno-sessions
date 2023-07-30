import type { ObjectId } from "mongodb";

import { db } from "../modules/db.ts";

export interface UserCollection {
  _id: ObjectId;
  username: string;
  email: string;
  password: string;
}

export default db.collection<UserCollection>("users");
