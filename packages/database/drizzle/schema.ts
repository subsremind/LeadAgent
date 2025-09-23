import { pgTable, pgEnum, serial, text, integer, bigint, boolean, timestamp, jsonb, vector, unique, index, foreignKey } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { platform } from 'os';

// 1. 枚举
export const purchaseTypeEnum = pgEnum('purchase_type', ['SUBSCRIPTION', 'ONE_TIME']);

// 2. 用户表
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  username: text('username'),
  role: text('role'),
  banned: boolean('banned'),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires', { withTimezone: true }),
  onboardingComplete: boolean('onboarding_complete').default(false).notNull(),
  paymentsCustomerId: text('payments_customer_id'),
  locale: text('locale'),
  timezone: text('timezone'),
}, t => [
  unique('user_email_unique').on(t.email),
  unique('user_username_unique').on(t.username),
]);

// 3. Session
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull(),
  impersonatedBy: text('impersonated_by'),
  activeOrganizationId: text('active_organization_id'),
  token: text('token').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
}, t => [
  unique('session_token_unique').on(t.token),
  foreignKey({ columns: [t.userId], foreignColumns: [user.id], name: 'session_user_fk' })
    .onDelete('cascade'),
]);

// 4. Account
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  password: text('password'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
}, t => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id], name: 'account_user_fk' })
    .onDelete('cascade'),
]);

// 5. Verification
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// 6. Passkey
export const passkey = pgTable('passkey', {
  id: text('id').primaryKey(),
  name: text('name'),
  publicKey: text('public_key').notNull(),
  userId: text('user_id').notNull(),
  credentialID: text('credential_id').notNull(),
  counter: integer('counter').notNull(),
  deviceType: text('device_type').notNull(),
  backedUp: boolean('backed_up').notNull(),
  transports: text('transports'),
  createdAt: timestamp('created_at', { withTimezone: true }),
}, t => [
  foreignKey({ columns: [t.userId], foreignColumns: [user.id], name: 'passkey_user_fk' })
    .onDelete('cascade'),
]);

// 7. Organization
export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug'),
  logo: text('logo'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  metadata: text('metadata'),
  paymentsCustomerId: text('payments_customer_id'),
}, t => [
  unique('organization_slug_unique').on(t.slug),
]);

// 8. Member
export const member = pgTable('member', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  userId: text('user_id').notNull(),
  role: text('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
}, t => [
  unique('member_user_org_unique').on(t.userId, t.organizationId),
  foreignKey({ columns: [t.organizationId], foreignColumns: [organization.id], name: 'member_org_fk' })
    .onDelete('cascade'),
  foreignKey({ columns: [t.userId], foreignColumns: [user.id], name: 'member_user_fk' })
    .onDelete('cascade'),
]);

// 9. Invitation
export const invitation = pgTable('invitation', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  inviterId: text('inviter_id').notNull(),
}, t => [
  foreignKey({ columns: [t.organizationId], foreignColumns: [organization.id], name: 'invitation_org_fk' })
    .onDelete('cascade'),
  foreignKey({ columns: [t.inviterId], foreignColumns: [user.id], name: 'invitation_inviter_fk' })
    .onDelete('cascade'),
]);

// 10. Purchase
export const purchase = pgTable('purchase', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: text('organization_id'),
  userId: text('user_id'),
  type: purchaseTypeEnum('type').notNull(),
  customerId: text('customer_id').notNull(),
  subscriptionId: text('subscription_id'),
  productId: text('product_id').notNull(),
  status: text('status'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [
  unique('purchase_subscription_unique').on(t.subscriptionId),
  index('purchase_subscription_idx').on(t.subscriptionId),
  foreignKey({ columns: [t.organizationId], foreignColumns: [organization.id], name: 'purchase_org_fk' })
    .onDelete('cascade'),
  foreignKey({ columns: [t.userId], foreignColumns: [user.id], name: 'purchase_user_fk' })
    .onDelete('cascade'),
]);

// 11. AiChat
export const aiChat = pgTable('ai_chat', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: text('organization_id'),
  userId: text('user_id'),
  title: text('title'),
  messages: jsonb('messages').$type<Record<string, any> | null>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [
  foreignKey({ columns: [t.organizationId], foreignColumns: [organization.id], name: 'aichat_org_fk' })
    .onDelete('cascade'),
  foreignKey({ columns: [t.userId], foreignColumns: [user.id], name: 'aichat_user_fk' })
    .onDelete('cascade'),
]);

// 12. EditHistory
export const editHistory = pgTable('edit_history', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  tableName: text('table_name').notNull(),
  tableField: text('table_field').notNull(),
  tableId: text('table_id').notNull(),
  fromValue: text('from_value').notNull(),
  toValue: text('to_value').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 13. Category
export const category = pgTable('category', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  path: text('path').notNull(),
  platform: text('platform').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [
  index('category_platform_idx').on(t.platform),
]);

// 14. RedditPost（含 1536 维向量）
export const redditPost = pgTable('reddit_post', {
  id: serial('id').primaryKey(),
  categoryId: text('category_id'),
  redditId: text('reddit_id').notNull(),
  title: text('title').notNull(),
  selftext: text('selftext'),
  url: text('url'),
  permalink: text('permalink'),
  author: text('author'),
  subreddit: text('subreddit'),
  ups: integer('ups').default(0).notNull(),
  downs: integer('downs').default(0).notNull(),
  score: integer('score').default(0).notNull(),
  numComments: integer('num_comments').default(0).notNull(),
  createdUtc: bigint('created_utc', { mode: 'number' }),
  // 向量列
  embedding: vector('embedding', { dimensions: 3072 }).notNull(),
  recordCreatedAt: timestamp('record_created_at', { withTimezone: true }).defaultNow().notNull(),
  recordUpdatedAt: timestamp('record_updated_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [
  unique('reddit_post_reddit_id_unique').on(t.redditId),
  foreignKey({ columns: [t.categoryId], foreignColumns: [category.id], name: 'redditpost_category_fk' })
    .onDelete('set null'),
]);

/* -------------------------------------------------
 * Relations（可选，但强烈推荐，语法与 Prisma 类似）
 * ------------------------------------------------- */
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  passkeys: many(passkey),
  invitations: many(invitation),
  purchases: many(purchase),
  memberships: many(member),
  aiChats: many(aiChat),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const passkeyRelations = relations(passkey, ({ one }) => ({
  user: one(user, { fields: [passkey.userId], references: [user.id] }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  purchases: many(purchase),
  aiChats: many(aiChat),
}));

export const memberRelations = relations(member, ({ one }) => ({
  user: one(user, { fields: [member.userId], references: [user.id] }),
  org: one(organization, { fields: [member.organizationId], references: [organization.id] }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  org: one(organization, { fields: [invitation.organizationId], references: [organization.id] }),
  inviter: one(user, { fields: [invitation.inviterId], references: [user.id] }),
}));

export const purchaseRelations = relations(purchase, ({ one }) => ({
  org: one(organization, { fields: [purchase.organizationId], references: [organization.id] }),
  user: one(user, { fields: [purchase.userId], references: [user.id] }),
}));

export const aiChatRelations = relations(aiChat, ({ one }) => ({
  org: one(organization, { fields: [aiChat.organizationId], references: [organization.id] }),
  user: one(user, { fields: [aiChat.userId], references: [user.id] }),
}));

export const categoryRelations = relations(category, ({ many }) => ({
  redditPosts: many(redditPost),
}));

export const redditPostRelations = relations(redditPost, ({ one }) => ({
  category: one(category, { fields: [redditPost.categoryId], references: [category.id] }),
}));