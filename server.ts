import express from "express";
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
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
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
  if (!admin.apps.length) {
    throw new Error("Firebase Admin not initialized. Is firebase-applet-config.json missing or invalid?");
  }
  return getFirestore();
};

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// In AI Studio, the APP_URL should match the shared app URL for OAuth callbacks to work.
// We default to the provided env var, or attempt to derive it from the request headers if available.
let APP_URL = process.env.APP_URL || "http://localhost:3000";

export async function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  // Dynamic APP_URL detection to support Shared Views without manual config overhead
  app.use((req, res, next) => {
    if (!process.env.APP_URL) {
      const host = req.headers['host'];
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      if (host) {
        APP_URL = `${protocol}://${host}`;
      }
    }
    next();
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      environment: process.env.VERCEL ? "vercel" : process.env.NETLIFY ? "netlify" : "local",
      identity: "relay-node-active"
    });
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
        const db = getDb();
        const userRef = db.collection("users").doc(uid as string);
        
        // 1. Store secure tokens
        await userRef.collection("gmail_tokens").doc(email).set({
          ...tokens,
          email,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 2. Store UI metadata for visibility in all tabs
        await userRef.collection("connected_inboxes").doc(email).set({
          email,
          name: payload?.name || email.split('@')[0],
          photoURL: payload?.picture || "",
          status: 'Strong',
          health: 100,
          userId: uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

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

  // Sync Inboxes (Internal utility for migration/sync)
  app.get("/api/inboxes/sync", verifyUser, async (req: any, res) => {
    const uid = req.user.uid;
    const db = getDb();
    const userRef = db.collection("users").doc(uid);

    try {
      const tokensSnap = await userRef.collection("gmail_tokens").get();
      const inboxesSnap = await userRef.collection("connected_inboxes").get();
      
      const existingEmails = new Set(inboxesSnap.docs.map(d => d.id));
      const tokens = tokensSnap.docs.map(d => d.id);
      
      let syncCount = 0;
      for (const email of tokens) {
        if (!existingEmails.has(email)) {
          await userRef.collection("connected_inboxes").doc(email).set({
            email,
            name: email.split('@')[0],
            status: 'Strong',
            health: 95,
            userId: uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          syncCount++;
        }
      }
      
      res.json({ success: true, synced: syncCount, total: tokens.length });
    } catch (e: any) {
      console.error("Sync Error:", e);
      res.status(500).json({ error: e.message });
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
        url: `https://www.googleapis.com/gmail/${targetPath.replace(/^gmail\//, "")}`,
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
        res.status(status).json({ status, error: msg });
      }
    }
  });

  // Autonomous Email Processor (Runs in background)
  async function processQueuedEmails() {
    console.log("[BackgroundProcessor] Checking for work...");
    try {
      const db = getDb();
      const usersSnap = await db.collection("users").listDocuments();
      
      for (const userDoc of usersSnap) {
        const uid = userDoc.id;
        
        // 1. Process Manual Scheduled Emails
        const scheduledSnap = await userDoc.collection("scheduled_emails")
          .where("status", "==", "Scheduled")
          .where("scheduledAt", "<=", Date.now())
          .get();

        for (const emailDoc of scheduledSnap.docs) {
          const email = emailDoc.data();
          await sendEmail(uid, emailDoc, email, userDoc);
        }

        // 2. Process Auto-Send Sequence (Outreach)
        const autoSendDoc = await userDoc.collection("preferences").doc("auto_send").get();
        if (autoSendDoc.exists && autoSendDoc.data()?.isActive) {
          const config = autoSendDoc.data()!;
          const campaignId = config.activeCampaignId;
          
          if (campaignId) {
            console.log(`[BackgroundProcessor] Auto-Send is ACTIVE for ${uid} on campaign ${campaignId}`);
            
            // Get the first campaign step
            const campaignStepDoc = await userDoc.collection("campaign_steps").doc(campaignId).get();
            if (campaignStepDoc.exists) {
              const step = campaignStepDoc.data()!;
              
              // Find untracked leads (status 'new' or missing)
              const leadsSnap = await userDoc.collection("leads")
                .where("status", "in", ["new", ""] )
                .limit(5) // Process in small batches
                .get();

              for (const leadDoc of leadsSnap.docs) {
                const lead = leadDoc.data();
                
                // Get tokens for a connected inbox (fallback to first available)
                const tokensSnap = await userDoc.collection("gmail_tokens").limit(1).get();
                if (tokensSnap.empty) continue;
                
                const tokens = tokensSnap.docs[0].data();
                const emailAccount = tokens.email;

                const personalizedSubject = step.subject.replace(/{FirstName}/g, lead.firstName || '').replace(/{LastName}/g, lead.lastName || '').replace(/{Company}/g, lead.company || 'your company');
                const personalizedBody = step.content.replace(/{FirstName}/g, lead.firstName || '').replace(/{LastName}/g, lead.lastName || '').replace(/{Company}/g, lead.company || 'your company');

                const success = await dispatchEmail(uid, emailAccount, lead.email, personalizedSubject, personalizedBody, tokens);
                if (success) {
                  await leadDoc.ref.update({ status: 'contacted', contactedAt: admin.firestore.FieldValue.serverTimestamp() });
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("[BackgroundProcessor] Loop error:", err);
    }
  }

  async function sendEmail(uid: string, emailDoc: any, email: any, userDoc: any) {
    try {
      console.log(`[BackgroundProcessor] Dispatching manual email for ${uid}: ${email.to}`);
      const tokenDoc = await userDoc.collection("gmail_tokens").doc(email.account.toLowerCase()).get();
      if (!tokenDoc.exists) {
        await emailDoc.ref.update({ status: 'Failed' });
        return;
      }
      const success = await dispatchEmail(uid, email.account, email.to, email.subject, email.body, tokenDoc.data()!);
      if (success) {
        await emailDoc.ref.delete();
      } else {
        await emailDoc.ref.update({ status: 'Failed' });
      }
    } catch (err) {
      console.error(`[BackgroundProcessor] Manual Send Error:`, err);
    }
  }

  async function dispatchEmail(uid: string, account: string, to: string, subject: string, body: string, tokens: any) {
    try {
      const client = getOAuthClient();
      client.setCredentials(tokens);

      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const rawMessage = [
        `To: ${to}`,
        `Subject: ${utf8Subject}`,
        'Content-Type: text/html; charset="UTF-8"',
        'MIME-Version: 1.0',
        '',
        body.replace(/\n/g, '<br/>')
      ].join('\r\n');

      const encodedMessage = Buffer.from(rawMessage).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await client.request({
        url: `https://www.googleapis.com/gmail/v1/users/me/messages/send`,
        method: 'POST',
        data: { raw: encodedMessage }
      });
      return true;
    } catch (err: any) {
      console.error(`[BackgroundProcessor] Dispatch failed for ${to}:`, err.message);
      return false;
    }
  }

  // Run every 60s - Disabled in serverless environments
  if (!process.env.VERCEL && !process.env.NETLIFY) {
    setInterval(processQueuedEmails, 60000);
    console.log("[BackgroundProcessor] Initialized.");
  } else {
    console.log("[BackgroundProcessor] Skipped (Serverless environment)");
  }

  return app;
}

async function startServer() {
  const app = await createApp();
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.NETLIFY && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
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

// We only call startServer if this file is run directly (not as a module)
// or if we are in the AI Studio development environment.
const isMain = process.argv[1] && (
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
  process.argv[1].endsWith('server.ts') ||
  process.argv[1].endsWith('server')
);

if (isMain || process.env.AI_STUDIO) {
  startServer();
}
