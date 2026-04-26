import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { OAuth2Client } from "google-auth-library";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import cookieParser from "cookie-parser";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let firestoreDatabaseId = "(default)";
const firebaseConfigPath = path.join(__dirname, "firebase-applet-config.json");
if (fs.existsSync(firebaseConfigPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
  // Normalize "default" to "(default)" to avoid Firestore 5 NOT_FOUND errors
  const rawId = firebaseConfig.firestoreDatabaseId;
  firestoreDatabaseId = (rawId === "default" || !rawId) ? "(default)" : rawId;
  
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
}

const getDb = () => {
  return getFirestore();
};

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.APP_URL || "http://localhost:3000";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  app.get("/api/health", async (req, res) => {
    try {
      const response = await fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email", {
        headers: { "Metadata-Flavor": "Google" }
      });
      const email = await response.text();
      res.json({ status: "ok", identity: email });
    } catch (e) {
      res.json({ status: "ok", identity: "local-or-unknown" });
    }
  });

  const getOAuthClient = () => {
    return new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      `${APP_URL}/api/auth/callback`
    );
  };

  // Auth Middleware
  const verifyUser = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = decodedToken;
      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // 1. Get OAuth URL
  app.get("/api/auth/url", verifyUser, (req: any, res) => {
    const client = getOAuthClient();
    const url = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      state: req.user.uid, // Pass UID in state to correlate on callback
    });
    res.json({ url });
  });

  // 2. OAuth Callback
  app.get("/api/auth/callback", async (req, res) => {
    const { code, state: uid } = req.query;
    if (!code || !uid) return res.status(400).send("Missing code or state");

    try {
      const client = getOAuthClient();
      const { tokens } = await client.getToken(code as string);
      
      client.setCredentials(tokens);
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const email = payload?.email?.toLowerCase();

      if (!email) throw new Error("Could not get email from Google");

      // Store tokens in Firestore
      try {
        await getDb().collection("users").doc(uid as string).collection("gmail_tokens").doc(email).set({
          ...tokens,
          email,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (firestoreErr: any) {
        console.error("Firestore Save Error (Fatal):", firestoreErr.message);
        return res.status(500).send(`
          <html>
            <body style="font-family: sans-serif; padding: 40px; text-align: center;">
              <h2 style="color: #d32f2f;">Sync Authorization Pending</h2>
              <p>There is a configuration issue with the database relay. Please check the developer logs.</p>
              <p style="color: #666; font-size: 12px;">Error Code: ${firestoreErr.code || 'UNKNOWN'}</p>
            </body>
          </html>
        `);
      }

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GMAIL_AUTH_SUCCESS', email: '${email}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Gmail connected successfully! You can close this window.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("OAuth Callback Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // 3. Gmail Proxy (with auto-refresh)
  app.all("/api/gmail-proxy/*", verifyUser, async (req: any, res) => {
    const targetPath = req.params[0] || "";
    const email = req.headers["x-gmail-account"] as string;

    console.log(`[GmailProxy] ${req.method} ${targetPath} for ${email}`);

    if (!email) {
      console.warn("[GmailProxy] Missing x-gmail-account header");
      return res.status(400).json({ error: "Missing x-gmail-account header" });
    }

    try {
      // Get tokens from Firestore
      const db = getDb();
      const userUid = req.user.uid;
      const tokenDoc = await db.collection("users").doc(userUid).collection("gmail_tokens").doc(email.toLowerCase()).get();
      
      if (!tokenDoc.exists) {
        console.warn(`[GmailProxy] Account not connected: ${email}`);
        return res.status(404).json({ error: "ACCOUNT_NOT_CONNECTED", message: "Gmail account not connected to relay." });
      }

      const tokens = tokenDoc.data()!;
      const client = getOAuthClient();
      client.setCredentials(tokens);

      const response = await client.request({
        url: `https://gmail.googleapis.com/${targetPath.replace(/^gmail\//, "")}`,
        method: req.method,
        data: (req.method === "GET" || req.method === "HEAD") ? undefined : req.body,
        params: req.query,
      });

      // If tokens changed (refreshed), update Firestore
      const currentTokens = client.credentials;
      if (currentTokens.access_token !== tokens.access_token) {
        console.log(`[GmailProxy] Token refreshed for ${email}`);
        await tokenDoc.ref.update({
          ...currentTokens,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(`[GmailProxy] Error ${targetPath}:`, error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        res.status(401).json({ error: "Session expired. Please reconnect your Gmail account." });
      } else {
        const status = error.response?.status || 500;
        const msg = error.response?.data?.error?.message || error.message || "Communication error";
        res.status(status).json({ error: msg });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Callback URL should be: ${APP_URL}/api/auth/callback`);
  });
}

startServer();
