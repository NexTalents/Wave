import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedPage = createRouteMatcher(["/dashboard(.*)"])
const isProtectedApi = createRouteMatcher([
  "/api/analyze-waste(.*)",
  "/api/whatsapp(.*)",
])

export default clerkMiddleware(async (auth, request) => {
  if (!isProtectedPage(request) && !isProtectedApi(request)) return

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
