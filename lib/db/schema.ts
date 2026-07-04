import { mysqlTable, varchar, int, decimal, datetime } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const vessels = mysqlTable('vessels', {
  id:        varchar('id', { length: 36 }).primaryKey(),
  name:      varchar('name', { length: 255 }).notNull().unique(),
  thumbnail: varchar('thumbnail', { length: 500 }).notNull().default('/vessel-container.png'),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const dishes = mysqlTable('dishes', {
  id:        varchar('id', { length: 36 }).primaryKey(),
  vesselId:  varchar('vessel_id', { length: 36 }).notNull(),
  image:     varchar('image', { length: 500 }).notNull(),
  date:      datetime('date').notNull(),
  rating:    decimal('rating', { precision: 4, scale: 2 }).notNull().default('0'),
  votes:     int('votes').notNull().default(0),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const adminCredentials = mysqlTable('admin_credentials', {
  id:       int('id').primaryKey().default(1),
  username: varchar('username', { length: 100 }).notNull().default('max'),
  password: varchar('password', { length: 255 }).notNull().default('1234567890'),
})

export type VesselRow           = typeof vessels.$inferSelect
export type DishRow             = typeof dishes.$inferSelect
export type AdminCredentialsRow = typeof adminCredentials.$inferSelect
