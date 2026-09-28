import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { Pool } from "pg";

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  plugins: [bearer()], // mobile: Authorization: Bearer <session-token>
  databaseHooks: {
    user: {
      create: {
        // Every signup is a parent. App profile row auto-created here so
        // /api routes can resolve parent by session. Display name is unused:
        // the app addresses people by child nickname (minimal data, PRD §11).
        after: async (user) => {
          await pool.query(
            "INSERT INTO parents (auth_user_id, email) VALUES ($1, $2) ON CONFLICT (auth_user_id) DO NOTHING",
            [user.id, user.email]
          );
        },
      },
    },
  },
});
