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
  "/api/whatsapp(.*)",
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

  const signInUrl = new URL("/login", request.url)
  signInUrl.searchParams.set(
    "redirect_url",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  )
  await auth.protect({ unauthenticatedUrl: signInUrl.toString() })
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
