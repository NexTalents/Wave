import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isProtectedPage = createRouteMatcher([
  "/dashboard",
  "/dashboard/business(.*)",
  "/dashboard/individual(.*)",
  "/dashboard/admin(.*)",
])
const isProtectedApi = createRouteMatcher([
  "/api/analyze-waste(.*)",
])

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedApi(request)) {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return
  }
  if (!isProtectedPage(request)) return

  const { pathname, search } = request.nextUrl
  const hasPickerSession = Boolean(request.cookies.get("wave_picker_session")?.value)
  const hasLapakSession = Boolean(request.cookies.get("wave_lapak_session")?.value)

  // Redirect /dashboard root based on active session cookies
  if (pathname === "/dashboard") {
    if (hasPickerSession) {
      return NextResponse.redirect(new URL("/dashboard/individual", request.url))
    }
    if (hasLapakSession) {
      return NextResponse.redirect(new URL("/dashboard/business", request.url))
    }
  }

  // Mitra Pemulung dashboard: authorized via picker session cookie
  if (pathname.startsWith("/dashboard/individual")) {
    if (hasPickerSession) {
      return
    }
    const signInUrl = new URL("/login", request.url)
    signInUrl.searchParams.set("redirect_url", `${pathname}${search}`)
    return NextResponse.redirect(signInUrl)
  }

  // Lapak Mitra dashboard: allow direct access if lapak session cookie is present
  if (pathname.startsWith("/dashboard/business")) {
    if (hasLapakSession) {
      return
    }
  }

  // Other protected routes (Admin, Clerk enterprise/agregator sessions)
  const signInUrl = new URL("/login", request.url)
  signInUrl.searchParams.set(
    "redirect_url",
    `${pathname}${search}`
  )
  await auth.protect({ unauthenticatedUrl: signInUrl.toString() })
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
