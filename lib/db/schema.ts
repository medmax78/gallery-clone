import { numeric, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const vessels = pgTable('vessels', {
  id:        text('id').primaryKey(),
  name:      text('name').notNull().unique(),
  thumbnail: text('thumbnail').notNull().default('/vessel-container.png'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const dishes = pgTable('dishes', {
  id:        text('id').primaryKey(),
  vesselId:  text('vessel_id').notNull(),
  image:     text('image').notNull(),
  date:      timestamp('date').notNull(),
  rating:    numeric('rating', { precision: 4, scale: 2 }).notNull().default('3'),
  votes:     integer('votes').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type VesselRow = typeof vessels.$inferSelect
export type DishRow   = typeof dishes.$inferSelect
