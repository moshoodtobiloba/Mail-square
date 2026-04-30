import serverless from "serverless-http";
import { createApp } from "../../server";

let serverlessApp: any;

export const handler = async (event: any, context: any) => {
  if (!serverlessApp) {
    const app = await createApp();
    serverlessApp = serverless(app);
  }
  return serverlessApp(event, context);
};
