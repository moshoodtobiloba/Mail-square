import serverless from "serverless-http";
import { createApp } from "../server";

let serverlessApp: any;

export default async (req: any, res: any) => {
  try {
    if (!serverlessApp) {
      console.log("Initializing Express app for serverless...");
      const app = await createApp();
      serverlessApp = serverless(app);
    }
    return serverlessApp(req, res);
  } catch (error: any) {
    console.error("Vercel Function Error:", error);
    res.status(500).json({
      error: "SERVER_BOOT_ERROR",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
