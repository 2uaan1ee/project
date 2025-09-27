// src/config/googleAuth.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";



export function initGoogleAuth() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const serverURL = process.env.SERVER_URL || "http://localhost:5000";

  if (!clientID || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET");
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: `${serverURL}/api/auth/google/callback`,
      },
      async (_at, _rt, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(null, false, { message: "No email from Google" });

          // ✅ Cho phép nhiều domain qua ENV (ví dụ: "uit.edu.vn,gm.uit.edu.vn")
          const allowed = (process.env.ALLOWED_EMAIL_DOMAINS || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean);

          if (allowed.length) {
            const e = email.toLowerCase();
            const ok = allowed.some(d => e.endsWith(`@${d}`));
            if (!ok) {
              return done(null, false, {
                message: `Email chỉ được phép thuộc: ${allowed.join(", ")}`,
                code: "domain_not_allowed",
              });
            }
          }

          let user = await User.findOne({ email });
          if (!user) {
            user = await User.create({
              email,
              name: profile.displayName,
              googleId: profile.id,
              passwordHash: "",
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
  console.log("Google callbackURL:", `${process.env.SERVER_URL}/api/auth/google/callback`);
  console.log("Google clientID (prefix):", (process.env.GOOGLE_CLIENT_ID || '').slice(0, 12) + '…');
  
}
