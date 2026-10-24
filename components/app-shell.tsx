import { cn } from "@/lib/utils";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import type { SidebarNavGroup } from "@/components/app-shared";

export function AppShell({ children, navGroups }: { children: React.ReactNode; navGroups?: SidebarNavGroup[] }) {
	return (
		<SidebarProvider
			className={cn(
				"[--app-wrapper-max-width:80rem]",
				"[--app-header-height:3rem]"
			)}
		>
			<AppSidebar navGroups={navGroups} />
			<SidebarInset className="bg-muted dark:bg-background">
				<AppHeader navGroups={navGroups} />
				<div
					className={cn(
						"flex flex-1 flex-col p-4 md:p-6",
						"mx-auto w-full max-w-(--app-wrapper-max-width)"
					)}
				>
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
