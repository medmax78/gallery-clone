import { decimal, int, mysqlTable, text, timestamp, varchar } from 'drizzle-orm/mysql-core'

export const vessels = mysqlTable('vessels', {
  id:        varchar('id', { length: 32 }).primaryKey(),
  name:      varchar('name', { length: 255 }).notNull().unique(),
  thumbnail: text('thumbnail').notNull().default('/vessel-container.png'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const dishes = mysqlTable('dishes', {
  id:        varchar('id', { length: 32 }).primaryKey(),
  vesselId:  varchar('vessel_id', { length: 32 }).notNull(),
  image:     text('image').notNull(),
  date:      timestamp('date').notNull(),
  rating:    decimal('rating', { precision: 4, scale: 2 }).notNull().default('0'),
  votes:     int('votes').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const adminCredentials = mysqlTable('admin_credentials', {
  id:       int('id').primaryKey().default(1),
  username: varchar('username', { length: 255 }).notNull().default('max'),
  password: varchar('password', { length: 255 }).notNull().default('1234567890'),
})

export type VesselRow           = typeof vessels.$inferSelect
export type DishRow             = typeof dishes.$inferSelect
export type AdminCredentialsRow = typeof adminCredentials.$inferSelect
