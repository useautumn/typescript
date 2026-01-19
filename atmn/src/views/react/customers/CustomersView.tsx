import { Box, Text, useApp, useInput } from "ink";
import open from "open";
import React, { useCallback, useEffect, useMemo } from "react";
import { AppEnv } from "../../../lib/env/detect.js";
import { useClipboard } from "../../../lib/hooks/useClipboard.js";
import { useCustomerExpanded } from "../../../lib/hooks/useCustomerExpanded.js";
import { useCustomerNavigation } from "../../../lib/hooks/useCustomerNavigation.js";
import { useCustomers } from "../../../lib/hooks/useCustomers.js";
import {
	CustomerSheet,
	CustomersTable,
	EmptyState,
	ErrorState,
	KeybindHints,
	LoadingState,
	SearchInput,
	TitleBar,
} from "./components/index.js";
import { calculateColumnWidths, getPaginationDisplay } from "./types.js";

const AUTUMN_DASHBOARD_URL = "https://app.useautumn.com";

const PAGE_SIZE = 50;

export interface CustomersViewProps {
	environment?: AppEnv;
	/** Called when user exits (q or ctrl+c) - use to clear terminal */
	onExit?: () => void;
}

/**
 * Main customers view orchestrator
 */
export function CustomersView({
	environment = AppEnv.Sandbox,
	onExit,
}: CustomersViewProps) {
	const { exit } = useApp();
	const { copy, showingFeedback } = useClipboard();

	const {
		state,
		moveUp,
		moveDown,
		nextPage,
		prevPage,
		openSheet,
		closeSheet,
		toggleFocus,
		selectCustomer,
		openSearch,
		closeSearch,
		setSearchQuery,
		clearSearch,
	} = useCustomerNavigation();

	const { data, isLoading, isError, error, refetch, isFetching } = useCustomers(
		{
			page: state.page,
			pageSize: PAGE_SIZE,
			environment,
			search: state.searchQuery,
		},
	);

	// Lazy load expanded customer data when sheet is open
	const {
		data: expandedCustomer,
		isLoading: isLoadingExpanded,
		error: expandedError,
	} = useCustomerExpanded({
		customerId: state.selectedCustomer?.id ?? null,
		environment,
		enabled: state.sheetOpen && !!state.selectedCustomer?.id,
	});

	const customers = data?.list ?? [];
	const hasMore = data?.has_more ?? false;
	const pagination = getPaginationDisplay(
		state.page,
		customers.length,
		PAGE_SIZE,
		hasMore,
	);

	// Handle keyboard input
	useInput(
		useCallback(
			(input, key) => {
				// Don't handle input when search dialog is open (it handles its own input)
				if (state.focusTarget === "search") {
					return;
				}

				// Quit
				if (input === "q") {
					if (onExit) {
						onExit();
					} else {
						exit();
					}
					return;
				}

				// Refresh
				if (input === "r") {
					refetch();
					return;
				}

				// Open search (/ or s)
				if (input === "/" || input === "s") {
					openSearch();
					return;
				}

				// Clear search (x when search is active)
				if (input === "x" && state.searchQuery) {
					clearSearch();
					return;
				}

				// Sheet-specific controls
				if (state.focusTarget === "sheet" && state.sheetOpen) {
					// Copy ID
					if (input === "c" && state.selectedCustomer) {
						copy(state.selectedCustomer.id);
						return;
					}

					// Open in Autumn dashboard
					if (input === "o" && state.selectedCustomer) {
						const env = state.selectedCustomer.env === "live" ? "" : "/sandbox";
						open(`${AUTUMN_DASHBOARD_URL}${env}/customers/${state.selectedCustomer.id}`);
						return;
					}

					// Close sheet
					if (key.escape) {
						closeSheet();
						return;
					}

					// Toggle focus to table
					if (key.tab) {
						toggleFocus();
						return;
					}

					return;
				}

				// Table-specific controls
				if (state.focusTarget === "table") {
					// Navigate up
					if (key.upArrow || input === "k") {
						moveUp();
						return;
					}

					// Navigate down
					if (key.downArrow || input === "j") {
						moveDown(customers.length - 1);
						return;
					}

					// Previous page
					if (key.leftArrow && pagination.canGoPrev) {
						prevPage();
						return;
					}

					// Next page
					if (key.rightArrow && pagination.canGoNext) {
						nextPage(pagination.canGoNext);
						return;
					}

					// Open sheet
					if (key.return && customers[state.selectedIndex]) {
						openSheet(customers[state.selectedIndex]);
						return;
					}

					// Toggle focus to sheet (if open)
					if (key.tab && state.sheetOpen) {
						toggleFocus();
						return;
					}
				}
			},
			[
				state,
				customers,
				pagination,
				exit,
				onExit,
				refetch,
				copy,
				closeSheet,
				toggleFocus,
				moveUp,
				moveDown,
				prevPage,
				nextPage,
				openSheet,
				openSearch,
				clearSearch,
			],
		),
	);

	// Calculate column widths based on actual customer data and terminal width
	const columnWidths = useMemo(
		() =>
			calculateColumnWidths(customers, process.stdout.columns, state.sheetOpen),
		[customers, state.sheetOpen],
	);

	// Sync selected customer when customers load
	useEffect(() => {
		if (customers.length > 0 && state.selectedIndex < customers.length) {
			selectCustomer(customers[state.selectedIndex], state.selectedIndex);
		}
	}, [customers, state.selectedIndex, selectCustomer]);

	// Loading state
	if (isLoading && !data) {
		return (
			<Box flexDirection="column" marginBottom={1}>
				<LoadingState environment={environment} />
			</Box>
		);
	}

	// Error state
	if (isError && error) {
		return (
			<Box flexDirection="column" marginBottom={1}>
				<ErrorState error={error} onRetry={refetch} />
			</Box>
		);
	}

	// Empty state
	if (!customers.length && !isFetching) {
		return (
			<Box flexDirection="column" width="100%">
				<TitleBar
					environment={environment}
					pagination={pagination}
					searchQuery={state.searchQuery}
				/>
				{state.searchOpen && (
					<Box marginTop={0} width="100%">
						<SearchInput
							initialValue={state.searchQuery}
							onSubmit={setSearchQuery}
							onCancel={closeSearch}
						/>
					</Box>
				)}
				<Box marginTop={1} width="100%">
					<EmptyState
						environment={environment}
						searchQuery={state.searchQuery}
					/>
				</Box>
				<Box marginTop={1} width="100%">
					<KeybindHints
						focusTarget={state.focusTarget}
						sheetOpen={state.sheetOpen}
						canGoPrev={pagination.canGoPrev}
						canGoNext={pagination.canGoNext}
					/>
				</Box>
			</Box>
		);
	}

	// Main view with table and optional sheet
	return (
		<Box flexDirection="column" width="100%">
			{/* Title bar */}
			<TitleBar
				environment={environment}
				pagination={pagination}
				searchQuery={state.searchQuery}
			/>

			{/* Inline search input */}
			{state.searchOpen && (
				<Box marginTop={1} width="100%">
					<SearchInput
						initialValue={state.searchQuery}
						onSubmit={setSearchQuery}
						onCancel={closeSearch}
					/>
				</Box>
			)}

			{/* Main content: Table + Sheet side by side */}
			<Box marginTop={1} flexDirection="row" width="100%" flexGrow={1}>
				{/* Table container - takes remaining space */}
				<Box
					flexDirection="column"
					borderStyle="round"
					borderColor={state.focusTarget === "table" ? "magenta" : "gray"}
					paddingX={1}
					flexGrow={1}
					flexShrink={1}
				>
					<CustomersTable
						customers={customers}
						selectedIndex={state.selectedIndex}
						onSelect={selectCustomer}
						isFocused={state.focusTarget === "table"}
						columnWidths={columnWidths}
					/>
					{isFetching && (
						<Box marginTop={1}>
							<Text color="yellow">Loading...</Text>
						</Box>
					)}
				</Box>

				{/* Sheet (when open) - fixed width, doesn't shrink */}
				{state.sheetOpen && state.selectedCustomer && (
					<Box marginLeft={1} flexShrink={0}>
						<CustomerSheet
							customer={state.selectedCustomer}
							isFocused={state.focusTarget === "sheet"}
							copiedFeedback={showingFeedback}
							onCopy={() => {
								if (state.selectedCustomer) {
									copy(state.selectedCustomer.id);
								}
							}}
							onOpenInBrowser={() => {
								if (state.selectedCustomer) {
									const env = state.selectedCustomer.env === "live" ? "" : "/sandbox";
									open(`${AUTUMN_DASHBOARD_URL}${env}/customers/${state.selectedCustomer.id}`);
								}
							}}
							expandedCustomer={expandedCustomer}
							isLoadingExpanded={isLoadingExpanded}
							expandedError={expandedError as Error | null}
						/>
					</Box>
				)}
			</Box>

			{/* Keybind hints */}
			<Box marginTop={1} width="100%">
				<KeybindHints
					focusTarget={state.focusTarget}
					sheetOpen={state.sheetOpen}
					canGoPrev={pagination.canGoPrev}
					canGoNext={pagination.canGoNext}
				/>
			</Box>
		</Box>
	);
}
