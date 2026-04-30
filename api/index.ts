import serverless from "serverless-http";
import { createApp } from "../server";

let serverlessApp: any;

export default async (req: any, res: any) => {
  if (!serverlessApp) {
    const app = await createApp();
    serverlessApp = serverless(app);
  }
  return serverlessApp(req, res);
};
