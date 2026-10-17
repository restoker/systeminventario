import { real, boolean } from "drizzle-orm/pg-core";
import { coreTable } from "./communityShieldColumns";

export const igv = coreTable("igv", {
    value: real("value").notNull(),
    isActive: boolean("is_active").default(true),
});

export type Igv = typeof igv.$inferSelect;
export type NewIgv = typeof igv.$inferInsert;