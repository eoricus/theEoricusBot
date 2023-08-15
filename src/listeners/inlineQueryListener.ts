import { InlineQueryContext, InlineKeyboard } from "puregram";
import data from "../data";

export default async (context: InlineQueryContext) => {
  console.log(context);
  let posts = await data.post.find({ $text: { $search: context.query } });

  // TODO:
  // [-] Разобраться с отображением html контента
  // [-] Разобраться с отправкой фото
  return context.answerInlineQuery(
    posts.map((post) => {
      return {
        id: post.id,
        type: "article",
        title: post.title,
        description: post.content,
        reply_markup: InlineKeyboard.keyboard([
          InlineKeyboard.urlButton({
            text: "Перейти",
            url: post.url,
            payload: {},
          }),
        ]),
        input_message_content: {
          message_text: post.content,
          parse_mode: "HTML",
          url: post.url,
        },
      };
    })
  );
};
