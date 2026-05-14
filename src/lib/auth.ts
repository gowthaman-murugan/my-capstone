import type { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { prisma } from './db'

type GitHubProfile = {
  id: number | string
  login?: string
  email?: string | null
  name?: string | null
  avatar_url?: string | null
}

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_APP_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_APP_CLIENT_SECRET ?? '',
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const gh = profile as GitHubProfile
        const githubId = String(gh.id)
        const email = gh.email ?? `${githubId}@users.noreply.github.com`
        const name = gh.name ?? gh.login ?? 'GitHub User'

        const dbUser = await prisma.user.upsert({
          where: { githubId },
          update: { name, email, avatarUrl: gh.avatar_url ?? null },
          create: { githubId, email, name, avatarUrl: gh.avatar_url ?? null },
        })

        token.dbUserId = dbUser.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.dbUserId) {
        session.user.id = token.dbUserId
      }
      return session
    },
  },
}
