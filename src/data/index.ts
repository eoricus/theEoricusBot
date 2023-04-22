import "paint-console";

import mongoose from "mongoose";

import user from "./_user";
import chat from "./_chat";
import conv from "./_conv";

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
  conv: conv,
};
