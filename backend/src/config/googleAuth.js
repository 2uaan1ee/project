// backend/src/config/googleAuth.js
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

        // 🔥 Quan trọng: cho phép Passport truyền profile vào routes callback
        passReqToCallback: true,
      },

      // 🔥 Callback CHUẨN phải có 5 tham số
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const avatar = profile.photos?.[0]?.value;

          console.log("===== GOOGLE PROFILE =====");
          console.log("Email:", email);
          console.log("Avatar:", avatar);
          console.log("==========================");

          if (!email) {
            return done(null, false, { message: "No email returned from Google" });
          }

          // Domain whitelist
          const allowed = (process.env.ALLOWED_EMAIL_DOMAINS || "")
            .toLowerCase().split(",").map(s => s.trim()).filter(Boolean);

          if (allowed.length) {
            const ok = allowed.some(d => email.toLowerCase().endsWith("@" + d));
            if (!ok) {
              return done(null, false, {
                message: `Email phải thuộc domain: ${allowed.join(", ")}`,
                code: "domain_not_allowed",
              });
            }
          }

          // Tìm user trong DB
          let user = await User.findOne({ email });

          if (!user) {
            user = await User.create({
              email,
              name: profile.displayName,
              googleId: profile.id,
              passwordHash: "",
            });
          }

          // 🔥 Đính kèm profile vào user để route callback đọc được
          user._googleProfile = profile;

          return done(null, user);

        } catch (err) {
          return done(err);
        }
      }
    )
  );

  console.log("Google callbackURL:", `${serverURL}/api/auth/google/callback`);
}
