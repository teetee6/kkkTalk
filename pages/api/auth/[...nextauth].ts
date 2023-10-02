import NextAuth, { SessionOptions, User } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyPassword } from '../../../lib/auth';
import { connectToDatabase } from '../../../lib/db';

export const authOptions: NextAuthOptions = {
  session: {
    jwt: true,
  } as Partial<SessionOptions>,
  secret: 'dVa9x2UHgJVfuU3oHFqTHS5N0aydgAYtWmTwdI1/A3o=',
  providers: [
    CredentialsProvider({
      credentials: {
        username: { label: 'email', type: 'email' },
        password: { label: 'password', type: 'password' },
      },
      async authorize(credentials: Record<string, string> | undefined) {
        const client = await connectToDatabase();
        const usersCollection = client.db().collection('users');
        const user = await usersCollection.findOne({
          email: credentials!.email,
        });

        if (!user) {
          throw new Error('No user found!');
        }

        const isValid = await verifyPassword(
          credentials!.password,
          user.password
        );

        if (!isValid) {
          throw new Error('Could not log you in!');
        }

        return { email: user.email } as User;
      },
    }),
  ],
};

export default NextAuth(authOptions as NextAuthOptions);
