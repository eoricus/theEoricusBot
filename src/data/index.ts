import "paint-console";

import mongoose from "mongoose";

import user, { IUser } from "./_user";
import chat, { IChat } from "./_chat";

mongoose
  .connect(process.env.DATABASE_URI || "mongodb://127.0.0.1:27017/default")
  .then(() => {
    console.info(
      `[scelper] MongoDB on ${process.env.DATABASE_URI} is available!`
    );
  })
  .catch((err) => {
    console.error(err);
  });

export default {
  user: user,
  chat: chat,
};
