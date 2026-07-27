import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const handlers = toNextJsHandler(auth.handler);

export const GET = handlers.GET;
export const POST = handlers.POST;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
