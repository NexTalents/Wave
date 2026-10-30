"use client"

import { useClerk, useUser } from "@clerk/nextjs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LoaderCircle,
  UserIcon,
  LogOutIcon,
} from "lucide-react"
import { useSignOut } from "@/modules/auth"

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "W"
}

export function NavUser() {
  const clerk = useClerk()
  const { isLoaded, user } = useUser()
  const { error, isSigningOut, signOut } = useSignOut()
  const name = user?.fullName || user?.firstName || "Pengguna WAVE"
  const email =
    user?.primaryEmailAddress?.emailAddress || "Email belum tersedia"
  const initials = getInitials(name)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Buka menu akun"
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        disabled={!isLoaded}
        nativeButton
        render={<button type="button" />}
      >
        <Avatar className="size-8">
          <AvatarImage alt={name} src={user?.imageUrl} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="pointer-events-none flex items-center gap-2">
            <Avatar className="isolate size-8">
              <AvatarImage alt={name} src={user?.imageUrl} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <span className="block truncate font-medium text-foreground">
                {name}
              </span>
              <div className="max-w-full overflow-hidden text-xs text-ellipsis whitespace-nowrap text-muted-foreground">
                {email}
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => clerk.openUserProfile()}>
            <UserIcon />
            Kelola akun
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            aria-busy={isSigningOut}
            disabled={isSigningOut}
            onClick={() => void signOut()}
            variant="destructive"
          >
            {isSigningOut ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <LogOutIcon />
            )}
            {isSigningOut ? "Keluar..." : "Keluar"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {error ? (
          <p className="px-1.5 py-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
