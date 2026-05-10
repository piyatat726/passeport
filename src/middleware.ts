import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// Routes that require authentication
const PROTECTED_ROUTES = ["/create"];

export async function middleware(request: NextRequest) {
  // Refresh the Supabase session
  const response = await updateSession(request);

  // Check if this is a protected route
  const isProtected = PROTECTED_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtected) {
    // Check for Supabase session cookie OR demo user
    const hasSession = request.cookies.getAll().some(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    );
    const hasDemo = request.cookies.get("passeport_demo_user");

    // Note: Demo mode uses localStorage, not cookies, so we can't check
    // it in middleware. We'll handle this client-side in the create page.
    // Only redirect if there's definitely no Supabase session.
    if (!hasSession && !hasDemo) {
      // Don't redirect — let client-side auth context handle it
      // This avoids blocking demo users
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
