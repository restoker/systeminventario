import {
    pgTable,
    uuid,
    timestamp,
    type AnyPgColumnBuilder,
    type PgTableWithColumns,
    type PgBuildColumns,
    type PgBuildExtraConfigColumns,
    type PgTableExtraConfigValue,
    type PgTableExtraConfig,
} from "drizzle-orm/pg-core";

/**
 * 1. Shield Columns Definitions
 * Standardized audit and identifier columns across the system.
 */
export const timestampsShield = {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
};

export const softDeleteShield = {
    deletedAt: timestamp("deleted_at"),
};

export const coreColumns = {
    id: uuid("id").primaryKey().defaultRandom(),
    ...timestampsShield,
};

export type CoreColumns = typeof coreColumns;

/**
 * 2. Type definitions for the Table Factory
 */
export type ColumnsMap = Record<string, AnyPgColumnBuilder>;

export type PgColumnBuilders = Parameters<
    Extract<Parameters<typeof pgTable>[1], (...args: any[]) => any>
>[0];

export type TableColumnsInput<TColumnsMap extends ColumnsMap> =
    | TColumnsMap
    | ((t: PgColumnBuilders) => TColumnsMap);

export type TableExtraConfigCallback<TMerged extends ColumnsMap> =
    | ((self: PgBuildExtraConfigColumns<TMerged>) => PgTableExtraConfigValue[])
    | ((self: PgBuildExtraConfigColumns<TMerged>) => PgTableExtraConfig);

/**
 * 3. The Table Factory Pattern Generator
 * Creates custom table builders that automatically inject a base column shield.
 * Supports table name prefixing, extraConfig (indexes/constraints), and both object/builder syntax.
 */
export function createTableFactory<TBaseColumns extends ColumnsMap>(
    baseColumns: TBaseColumns,
    options?: { prefix?: string }
) {
    return function customTable<
        TTableName extends string,
        TColumnsMap extends ColumnsMap
    >(
        name: TTableName,
        columns: TableColumnsInput<TColumnsMap>,
        extraConfig?: TableExtraConfigCallback<TColumnsMap & TBaseColumns>
    ): PgTableWithColumns<{
        name: TTableName;
        schema: undefined;
        columns: PgBuildColumns<TTableName, TColumnsMap & TBaseColumns>;
        dialect: "pg";
    }> {
        const tableName = (options?.prefix ? `${options.prefix}_${name}` : name) as TTableName;

        if (typeof columns === "function") {
            return pgTable(
                tableName,
                (t) => ({
                    ...baseColumns,
                    ...columns(t),
                }),
                extraConfig as any
            ) as any;
        }

        return pgTable(
            tableName,
            {
                ...baseColumns,
                ...columns,
            },
            extraConfig as any
        ) as any;
    };
}

/**
 * 4. Pre-configured Core Table Factory
 * Automatically injects `id`, `createdAt`, and `updatedAt` into every table.
 */
export const coreTable = createTableFactory(coreColumns);

/**
 * 5. Pre-configured Soft Delete Table Factory
 * Injects `id`, `createdAt`, `updatedAt`, and `deletedAt`.
 */
export const softDeleteTable = createTableFactory({
    ...coreColumns,
    ...softDeleteShield,
});

/**
 * 6. Aliases matching the file naming convention
 */
export const communityShieldTable = coreTable;
export const communityShieldColumns = coreColumns;
export const communityShieldSoftDeleteTable = softDeleteTable;