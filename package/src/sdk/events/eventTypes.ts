import { z } from "zod/v4";

export const QueryRangeEnum = z.enum(["24h", "7d", "30d", "90d", "last_cycle"]);

export const BinSizeEnum = z.enum(["day", "hour"]);

export const QueryParamsSchema = z.object({
  customer_id: z.string(),
  feature_id: z.string().or(z.array(z.string())),
  range: QueryRangeEnum.optional(),
  group_by: z.string().startsWith("properties.").optional(),
  bin_size: BinSizeEnum.optional(),
  custom_range: z
    .object({
      start: z.number(),
      end: z.number(),
    }).optional()
});

export type QueryParams = z.infer<typeof QueryParamsSchema>;

export type QueryResult = {
  list: Array<
    {
      period: number;
    } & {
      [key: string]: number | Record<string, number>;
    }
  >;
};