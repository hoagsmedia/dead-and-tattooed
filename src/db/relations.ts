import { relations } from 'drizzle-orm/relations';
import { user, session, account, artwork } from './schema';

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}));

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	artworks: many(artwork)
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	})
}));

export const artworkRelations = relations(artwork, ({ one }) => ({
	user: one(user, {
		fields: [artwork.userId],
		references: [user.id]
	})
}));
