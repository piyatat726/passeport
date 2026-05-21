import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { rateLimit } from "@/lib/rate-limit";

// Routes that require authentication
const PROTECTED_ROUTES = ["/create"];

export async function middleware(request: NextRequest) {
  // 1. Rate limiting check
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Refresh the Supabase session
  const response = await updateSession(request);

  // 3. Check if this is a protected route — redirect unauthenticated users
  const isProtected = PROTECTED_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtected) {
    const hasSession = request.cookies.getAll().some(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    );
    const hasDemo = request.cookies.get("passeport_demo_user");

    if (!hasSession && !hasDemo) {
      const loginUrl = new URL("/auth", request.nextUrl.origin);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
