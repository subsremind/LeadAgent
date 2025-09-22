import { z } from 'zod';


export const UserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    emailVerified: z.boolean(),
    image: z.string().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    username: z.string().nullable(),
    role: z.string().nullable(),
    banned: z.boolean().nullable(),
    banReason: z.string().nullable(),
    banExpires: z.coerce.date().nullable(),
    onboardingComplete: z.boolean(),
    paymentsCustomerId: z.string().nullable(),
    locale: z.string().nullable(),
    timezone: z.string().nullable(),
  })
  
  export type User = z.infer<typeof UserSchema>
  
  /////////////////////////////////////////
  // SESSION SCHEMA
  /////////////////////////////////////////
  
  export const SessionSchema = z.object({
    id: z.string(),
    expiresAt: z.coerce.date(),
    ipAddress: z.string().nullable(),
    userAgent: z.string().nullable(),
    userId: z.string(),
    impersonatedBy: z.string().nullable(),
    activeOrganizationId: z.string().nullable(),
    token: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  
  export type Session = z.infer<typeof SessionSchema>
  
  /////////////////////////////////////////
  // ACCOUNT SCHEMA
  /////////////////////////////////////////
  
  export const AccountSchema = z.object({
    id: z.string(),
    accountId: z.string(),
    providerId: z.string(),
    userId: z.string(),
    accessToken: z.string().nullable(),
    refreshToken: z.string().nullable(),
    idToken: z.string().nullable(),
    expiresAt: z.coerce.date().nullable(),
    password: z.string().nullable(),
    accessTokenExpiresAt: z.coerce.date().nullable(),
    refreshTokenExpiresAt: z.coerce.date().nullable(),
    scope: z.string().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  
  export type Account = z.infer<typeof AccountSchema>
  
  /////////////////////////////////////////
  // VERIFICATION SCHEMA
  /////////////////////////////////////////
  
  export const VerificationSchema = z.object({
    id: z.string(),
    identifier: z.string(),
    value: z.string(),
    expiresAt: z.coerce.date(),
    createdAt: z.coerce.date().nullable(),
    updatedAt: z.coerce.date().nullable(),
  })
  
  export type Verification = z.infer<typeof VerificationSchema>
  
  /////////////////////////////////////////
  // PASSKEY SCHEMA
  /////////////////////////////////////////
  
  export const PasskeySchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    publicKey: z.string(),
    userId: z.string(),
    credentialID: z.string(),
    counter: z.number().int(),
    deviceType: z.string(),
    backedUp: z.boolean(),
    transports: z.string().nullable(),
    createdAt: z.coerce.date().nullable(),
  })
  
  export type Passkey = z.infer<typeof PasskeySchema>
  
  /////////////////////////////////////////
  // ORGANIZATION SCHEMA
  /////////////////////////////////////////
  
  export const OrganizationSchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string().nullable(),
    logo: z.string().nullable(),
    createdAt: z.coerce.date(),
    metadata: z.string().nullable(),
    paymentsCustomerId: z.string().nullable(),
  })
  
  export type Organization = z.infer<typeof OrganizationSchema>
  
  /////////////////////////////////////////
  // MEMBER SCHEMA
  /////////////////////////////////////////
  
  export const MemberSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    userId: z.string(),
    role: z.string(),
    createdAt: z.coerce.date(),
  })
  
  export type Member = z.infer<typeof MemberSchema>
  
  /////////////////////////////////////////
  // INVITATION SCHEMA
  /////////////////////////////////////////
  
  export const InvitationSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    email: z.string(),
    role: z.string().nullable(),
    status: z.string(),
    expiresAt: z.coerce.date(),
    inviterId: z.string(),
  })
  
  export type Invitation = z.infer<typeof InvitationSchema>
  
  /////////////////////////////////////////
  // PURCHASE SCHEMA
  /////////////////////////////////////////

  export const PurchaseTypeSchema = z.enum(['SUBSCRIPTION','ONE_TIME']);

  export type PurchaseTypeType = `${z.infer<typeof PurchaseTypeSchema>}`

  
  export const PurchaseSchema = z.object({
    type: PurchaseTypeSchema,
    id: z.string().cuid(),
    organizationId: z.string().nullable(),
    userId: z.string().nullable(),
    customerId: z.string(),
    subscriptionId: z.string().nullable(),
    productId: z.string(),
    status: z.string().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  
  export type Purchase = z.infer<typeof PurchaseSchema>
  
  /////////////////////////////////////////
  // AI CHAT SCHEMA
  /////////////////////////////////////////
  type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue | undefined }
  | JsonValue[];

  export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.literal(null),
      z.record(z.lazy(() => JsonValueSchema.optional())),
      z.array(z.lazy(() => JsonValueSchema)),
    ])
  );
  
  export const AiChatSchema = z.object({
    id: z.string().cuid(),
    organizationId: z.string().nullable(),
    userId: z.string().nullable(),
    title: z.string().nullable(),
    /**
     * [AIChatMessages]
     */
    messages: JsonValueSchema.nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  
  export type AiChat = z.infer<typeof AiChatSchema>
  
  /////////////////////////////////////////
  // CATEGORY SCHEMA
  /////////////////////////////////////////
  
  export const CategorySchema = z.object({
    id: z.string().cuid(),
    name: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    organizationId: z.string().nullable(),
    userId: z.string().nullable(),
  })
  
  export type Category = z.infer<typeof CategorySchema>
