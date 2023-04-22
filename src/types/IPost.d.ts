import { Document } from "mongoose";

export type IPostFields = {
  id: number;
  content: string;
};

export type IPost = Document & IPostFields;
