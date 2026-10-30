"use client"

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
  SettingsIcon,
  CreditCardIcon,
  LogOutIcon,
} from "lucide-react"
import { useSignOut } from "@/modules/auth"

const user = {
  name: "Shaban Haider",
  email: "shaban@efferd.com",
  avatar: "https://github.com/shabanhr.png",
}

export function NavUser() {
  const { error, isSigningOut, signOut } = useSignOut()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Avatar className="size-8" />}>
        <AvatarImage src={user.avatar} />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="pointer-events-none flex items-center gap-2">
            <Avatar className="isolate size-8">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <span className="font-medium text-foreground">{user.name}</span>{" "}
              <br />
              <div className="max-w-full overflow-hidden text-xs text-ellipsis whitespace-nowrap text-muted-foreground">
                {user.email}
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <CreditCardIcon />
            Plan & Billing
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
            {isSigningOut ? "Signing out..." : "Log out"}
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
