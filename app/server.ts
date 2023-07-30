import { Application } from "oak";
import { Session } from "sessions";

import { userRouter } from "./routes/user.ts";

export type AppState = {
  session: Session;
};

const app = new Application<AppState>({ logErrors: true });

app.use(Session.initMiddleware());

app.use(userRouter.routes());
app.use(userRouter.allowedMethods());

app.listen({ port: 3333 });
