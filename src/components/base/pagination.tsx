import { Link, type LinkProps } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type Ref, useMemo } from "react";
import type { FileRouteTypes } from "@/routeTree.gen";
import { button } from "./button";

interface UsePagesOptions {
	currentPage: number;
	totalPages: number;
	maxVisiblePages?: number;
	alwaysShowFirstLast?: boolean;
	showEllipsis?: boolean;
}

type PageItem = {
	type: "page" | "ellipsis";
	number: number;
	isCurrent: boolean;
};

function usePages({
	currentPage,
	totalPages,
	maxVisiblePages = 7,
	alwaysShowFirstLast = true,
	showEllipsis = true,
}: UsePagesOptions): PageItem[] {
	return useMemo(() => {
		// if (totalPages <= 1) return [];

		const pages: PageItem[] = [];
		const visiblePages = Math.min(maxVisiblePages, totalPages);

		// Always show first page if enabled
		if (alwaysShowFirstLast) {
			pages.push({
				type: "page",
				number: 1,
				isCurrent: currentPage === 1,
			});
		}

		// Calculate the range of pages to show
		let startPage = 2;
		let endPage = totalPages - 1;

		if (visiblePages > 2) {
			const half = Math.floor(
				(visiblePages - (alwaysShowFirstLast ? 2 : 0)) / 2,
			);
			startPage = Math.max(2, currentPage - half);
			endPage = startPage + (visiblePages - (alwaysShowFirstLast ? 2 : 0)) - 1;

			if (endPage >= totalPages - 1) {
				endPage = totalPages - 1;
				startPage = Math.max(
					2,
					endPage - (visiblePages - (alwaysShowFirstLast ? 2 : 0)) + 1,
				);
			}
		}

		// Add left ellipsis if needed
		if (showEllipsis && startPage > 2 && alwaysShowFirstLast) {
			pages.push({
				type: "ellipsis",
				number: startPage - 1,
				isCurrent: false,
			});
		} else if (startPage > 2 && !alwaysShowFirstLast) {
			pages.push({
				type: "page",
				number: startPage - 1,
				isCurrent: false,
			});
		}

		// Add middle pages
		for (let i = startPage; i <= endPage; i++) {
			pages.push({
				type: "page",
				number: i,
				isCurrent: i === currentPage,
			});
		}

		// Add right ellipsis if needed
		if (showEllipsis && endPage < totalPages - 1 && alwaysShowFirstLast) {
			pages.push({
				type: "ellipsis",
				number: endPage + 1,
				isCurrent: false,
			});
		} else if (endPage < totalPages - 1 && !alwaysShowFirstLast) {
			pages.push({
				type: "page",
				number: endPage + 1,
				isCurrent: false,
			});
		}

		// Always show last page if enabled
		if (alwaysShowFirstLast && totalPages > 1) {
			pages.push({
				type: "page",
				number: totalPages,
				isCurrent: currentPage === totalPages,
			});
		}

		return pages;
	}, [
		currentPage,
		totalPages,
		maxVisiblePages,
		alwaysShowFirstLast,
		showEllipsis,
	]);
}

// type PaginationProps = {
//   to: LinkProps["to"];
//   limit: number;
//   offset: number;
//   pageInfo: PageInfo;
// };

export type PageInfo = {
	totalItems: number;
	totalPages: number;
};

type PaginationProps<T extends FileRouteTypes["fullPaths"]> = {
	to: T;
	page: number;
	pageSize: number;
	pageInfo: PageInfo;
	scrollRef?: Ref<HTMLElement>;
} & Omit<LinkProps<T>, "to" | "search">;

export function Pagination<T extends FileRouteTypes["fullPaths"]>({
	to,
	page,
	pageSize,
	pageInfo,
	...props
}: PaginationProps<T>) {
	const hasNext = page < pageInfo.totalPages;

	const backLinkProps: LinkProps<T> = {
		to,
		search: (prev: any) => ({
			...prev,
			page: page - 1,
			pageSize,
		}),
		disabled: page === 1,
		...props,
	};

	const nextLinkProps: LinkProps<T> = {
		to,
		search: (prev: any) => ({
			...prev,
			page: page + 1,
			pageSize,
		}),
		disabled: !hasNext,
		...props,
	};

	const pages = usePages({
		currentPage: page,
		totalPages: pageInfo.totalPages,
		maxVisiblePages: 5,
		showEllipsis: true,
	});

	return (
		<div className="flex flex-row items-center justify-center">
			<div className="flex flex-row gap-2 justify-center">
				<Link
					{...backLinkProps}
					className={button({
						variant: "solid",
						color: "alternate",
					})}
				>
					<ChevronLeft />
				</Link>
				{pages
					.map((page) => {
						const linkProps: LinkProps<T> = {
							to,
							search: (prev: any) => ({
								...prev,
								page: page.number,
								pageSize,
							}),
							disabled: page.isCurrent,
							...props,
						};

						return {
							display: page.type === "page" ? page.number : "...",
							number: page.number,
							className: button({
								variant: "solid",
								color: page.isCurrent ? "secondary" : "alternate",
								isDisabled: page.isCurrent,
								className: page.isCurrent ? undefined : "hidden sm:inline-flex",
							}),
							linkProps,
						};
					})
					.map(({ display, number, className, linkProps }, i) => (
						<Link
							key={i}
							to={to}
							className={className}
							{...linkProps}
							title={`Go to page ${number}`}
						>
							{display}
						</Link>
					))}
				<Link
					{...nextLinkProps}
					className={button({
						variant: "solid",
						color: "alternate",
					})}
				>
					<ChevronRight />
				</Link>
			</div>
		</div>
	);
}
