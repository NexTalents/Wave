"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { clearLapakSessionToken, getLapakSessionToken } from "@/modules/auth/lapak-session";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserIcon, SettingsIcon, LogOutIcon } from "lucide-react";

export function NavUser() {
	const router = useRouter();
	const { signOut } = useClerk();
	const { user: clerkUser } = useUser();

	const [lapakToken, setLapakToken] = useState<string | null>(null);
	useEffect(() => {
		setLapakToken(getLapakSessionToken());
	}, []);

	const lapakSession = useQuery(
		api.lapakAuth.currentLapakSession,
		lapakToken ? { sessionToken: lapakToken } : "skip"
	);
	const logoutLapak = useMutation(api.lapakAuth.logoutLapak);

	const isLapak = Boolean(lapakSession);

	const displayName = isLapak
		? (lapakSession?.name || lapakSession?.organizationName || "Mitra Lapak")
		: (clerkUser?.fullName || clerkUser?.firstName || "Agen WAVE");

	const displaySubtext = isLapak
		? `${lapakSession?.organizationName || "Lapak"} · ${lapakSession?.lapakCode}`
		: (clerkUser?.primaryEmailAddress?.emailAddress || "Agen Besar WAVE");

	const displayAvatar = isLapak ? undefined : clerkUser?.imageUrl;
	const avatarFallback = (displayName.charAt(0) || "W").toUpperCase();

	const handleLogout = async () => {
		if (lapakToken) {
			try {
				await logoutLapak({ sessionToken: lapakToken });
			} catch {
				// Ignore errors during token invalidation
			}
			clearLapakSessionToken();
			window.location.href = "/login";
			return;
		}

		await signOut({ redirectUrl: "/login" });
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<button
						aria-label="Buka menu pengguna"
						className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						type="button"
					/>
				}
			>
				<Avatar className="size-8">
					{displayAvatar && <AvatarImage src={displayAvatar} />}
					<AvatarFallback className={isLapak ? "bg-primary/20 text-primary font-bold" : ""}>
						{avatarFallback}
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-60">
				<DropdownMenuGroup>
					<DropdownMenuLabel className="pointer-events-none flex items-center gap-2">
						<Avatar className="isolate size-8">
							{displayAvatar && <AvatarImage src={displayAvatar} />}
							<AvatarFallback className={isLapak ? "bg-primary/20 text-primary font-bold" : ""}>
								{avatarFallback}
							</AvatarFallback>
						</Avatar>
						<div className="overflow-hidden">
							<span className="font-medium text-foreground block truncate">{displayName}</span>
							<div className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground text-xs font-mono">
								{displaySubtext}
							</div>
						</div>
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem onClick={() => router.push("/dashboard/business/partners")}>
						<UserIcon />
						{isLapak ? "Data Anggota Pemulung" : "Mitra & Pemasok"}
					</DropdownMenuItem>
					{!isLapak && (
						<DropdownMenuItem onClick={() => router.push("/dashboard/business")}>
							<SettingsIcon />
							Pengaturan Agen
						</DropdownMenuItem>
					)}
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem onClick={handleLogout} variant="destructive">
						<LogOutIcon />
						Keluar (Log out)
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
