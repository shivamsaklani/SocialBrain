"use strict";

import mongoose, { Schema, Types, model } from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Connect to MongoDB using environment variable
mongoose.connect(process.env.MoongoDB as string).catch((err) => {
    console.error("MongoDB connection error:", err);
});

// Enum for content types
const contentData = ["Linkedin", "Youtube", "Article", "Twitter"] as const;
type ContentType = (typeof contentData)[number];

// Schema for Content
const contentSchema = new Schema({
    link: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: contentData, required: true },
    title: { type: String, required: true },
    tags: [{ type: Types.ObjectId, ref: "tag" }],
    userId: { type: Types.ObjectId, ref: "user", required: true },
});

// Schema for User
const userSchema = new Schema({
    email: { type: String, required: true, unique: true },
    user: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

// Schema for Tags
const tagsSchema = new Schema({
    title: { type: String, required: true },
});

// Schema for Link
const linkSchema = new Schema({
    hash: { type: String, required: true },
    userId: { type: Types.ObjectId, ref: "user", required: true, unique: true },
});

// Models
export const TagsModel = model("tag", tagsSchema);
export const LinkModel = model("link", linkSchema);
export const UserModel = model("user", userSchema);
export const ContentModel = model("content", contentSchema);

// Export types for models
export type ContentDocument = mongoose.Document & {
    link: string;
    description?: string;
    type: ContentType;
    title: string;
    tags: Types.ObjectId[];
    userId: Types.ObjectId;
};

export type UserDocument = mongoose.Document & {
    email: string;
    user: string;
    password: string;
};

export type TagDocument = mongoose.Document & {
    title: string;
};

export type LinkDocument = mongoose.Document & {
    hash: string;
    userId: Types.ObjectId;
};
