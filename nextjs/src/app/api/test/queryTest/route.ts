"use server";
import { NextRequest, NextResponse } from "next/server";
import { Autumn } from "autumn-js";
const client = new Autumn({
  secretKey: process.env.AUTUMN_SECRET_KEY,
  url: "http://localhost:8080/v1",
});

export async function GET(req: NextRequest) {
	console.log("HTTP GET request received");
  const res = await client.events.aggregate({
    customer_id: "1234",
    feature_id: ["invoice_bug", "hello"],
    range: "7d",
	group_by: "properties.random_word_key",
  });

  console.log("Res: ", res);

  return NextResponse.json(res);
}

export async function PATCH(req: NextRequest) {
	// eclare const LogParamsSchema: z.ZodObject<{
	// 	starting_after: z.ZodOptional<z.ZodString>;
	// 	limit: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
	// 	customer_id: z.ZodString;
	// 	feature_id: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString>]>;
	// 	time_range: z.ZodOptional<z.ZodObject<{
	// 		start: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
	// 		end: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
	// 	}, z.core.$strip>>;
	// }, z.core.$strip>;
	console.log("HTTP PATCH request received");
  const res = await client.events.list({
    customer_id: "1234",
    feature_id: ["tasks", "tasks2"],
    time_range: {
      start: Date.now() - 1000 * 60 * 60 * 24 * 7,
      end: Date.now(),
    },
  });

  console.log("Res: ", res);

  return NextResponse.json(res);
}