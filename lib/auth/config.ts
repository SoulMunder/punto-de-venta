import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/mongodb/config";
import { User } from "@/lib/mongodb/models/user";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            return null;
          }

          await connectToDatabase();

          const user = await User.findOne({ username: credentials.username }).exec();

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id, // Mongoose documents have an `id` getter
            username: user.username,
            role: user.role,
            name: user.name || "",
            assignedBranches: user.branches || null,
            defaultBranch: user.defaultBranch || null,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
    error: "/auth/login", // Error code passed in query string as ?error=
  },
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.username = user.username;
        token.assignedBranches = user.assignedBranches;
        token.defaultBranch = user.defaultBranch;
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      if (token && session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.assignedBranches = token.assignedBranches;
        session.user.defaultBranch = token.defaultBranch;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};