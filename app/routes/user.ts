import { Context, Next, Router } from "oak";
import { z } from "zod";
import { compare, hash } from "bcrypt";

import User from "../models/User.ts";
import type { AppState } from "../server.ts";
import template from "../modules/template.ts";

export const userRouter = new Router<AppState>();

/**
 * Controllers
 */

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signupSchema = signInSchema.extend({
  username: z.string().min(3),
});

userRouter.post("/signup", async (ctx) => {
  const body = ctx.request.body({ type: "form" });
  const value = await body.value;

  try {
    const data = await signupSchema.parseAsync(Object.fromEntries(value));

    const found = await User.findOne({
      $or: [{ username: data.username }, { email: data.email }],
    });

    if (found) {
      ctx.state.session.flash(
        "message",
        "The username or email are no longer available.",
      );
      ctx.response.redirect("/");
      return;
    }

    const hashedPassword = await hash(data.password);

    const documentId = await User.insertOne({
      ...data,
      password: hashedPassword,
    });

    ctx.state.session.set("username", data.username);
    ctx.state.session.set("_id", documentId.toString());
    ctx.response.redirect("/protected");
  } catch (cause) {
    console.error(cause);
    ctx.state.session.flash(
      "message",
      "An error occurred during the account creation process.",
    );
    ctx.response.redirect("/");
  }
});

userRouter.post("/signin", async (ctx) => {
  const body = ctx.request.body({ type: "form" });
  const value = await body.value;

  try {
    const data = await signInSchema.parseAsync(Object.fromEntries(value));

    const found = await User.findOne({ email: data.email });

    if (!found) {
      ctx.state.session.flash(
        "message",
        "Account credentials do not exist, please try again.",
      );
      ctx.response.redirect("/login");
      return;
    }

    const isValid = await compare(data.password, found.password);
    if (!isValid) {
      ctx.state.session.flash(
        "message",
        "Double check that your credentials are correct.",
      );
      ctx.response.redirect("/login");
      return;
    }

    ctx.state.session.set("username", found.username);
    ctx.state.session.set("_id", found._id.toString());
    ctx.response.redirect("/protected");
  } catch (cause) {
    console.error(cause);
    ctx.state.session.flash(
      "message",
      "An error occurred during the login process.",
    );
    ctx.response.redirect("/login");
  }
});

userRouter.get("/signout", async (ctx) => {
  await ctx.state.session.deleteSession();

  ctx.response.redirect("/login");
});

/**
 * Middlewares
 */

const isLoggedIn = async (ctx: Context<AppState>, next: Next) => {
  const userId = await ctx.state.session.get("_id");
  if (userId) await next();
  else ctx.response.redirect("/login");
};

const isLoggedOut = async (ctx: Context<AppState>, next: Next) => {
  const userId = await ctx.state.session.get("_id");
  if (!userId) await next();
  else ctx.response.redirect("/protected");
};

/**
 * Views
 */

userRouter.get("/", isLoggedOut, async (ctx) => {
  const message = await ctx.state.session.get("message");

  const html = await template.render("index", { message });

  ctx.response.type = "text/html";
  ctx.response.body = html;
});

userRouter.get("/login", isLoggedOut, async (ctx) => {
  const message = await ctx.state.session.get("message");

  const html = await template.render("login", { message });

  ctx.response.type = "text/html";
  ctx.response.body = html;
});

userRouter.get("/protected", isLoggedIn, async (ctx) => {
  const username = await ctx.state.session.get("username");
  const message = await ctx.state.session.get("message");

  const html = await template.render("protected", { username, message });

  ctx.response.type = "text/html";
  ctx.response.body = html;
});
