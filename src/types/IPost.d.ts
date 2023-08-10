import { Document } from "mongoose";

export type IPostFields = {
  id: number;
  url: string;
  title: string;
  content: string;
  abridged: string;
  wasCreatedAt: Date;
};

export type IPost = Document & IPostFields;
