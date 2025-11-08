import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: string
      username: string
      name: string
      assignedBranches: Array<string> | null;
      defaultBranch: string | null;
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: string
    id: string
    username: string
    assignedBranches: Array<string> | null
    defaultBranch: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string
    id: string
    username: string
    assignedBranches: Array<string> | null
    defaultBranch: string | null
  }
}