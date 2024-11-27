import express, { type Express } from "express";

const router = express.Router( );

export default function registry(app: Express) {
  return app.use("/api/chat", router);
};