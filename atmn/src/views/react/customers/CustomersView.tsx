import { Box, Text, useApp, useInput } from "ink";
import React, { useEffect, useCallback, useMemo } from "react";
import { AppEnv } from "../../../lib/env/detect.js";
import { useCustomers } from "../../../lib/hooks/useCustomers.js";
import { useCustomerExpanded } from "../../../lib/hooks/useCustomerExpanded.js";
import { useCustomerNavigation } from "../../../lib/hooks/useCustomerNavigation.js";
import { useClipboard } from "../../../lib/hooks/useClipboard.js";
import type { ApiCustomer } from "../../../lib/api/endpoints/customers.js";
import {
	TitleBar,
	CustomersTable,
	CustomerSheet,
	KeybindHints,
	EmptyState,
	ErrorState,
	LoadingState,
} from "./components/index.js";
import { getPaginationDisplay, calculateColumnWidths } from "./types.js";

const PAGE_SIZE = 50;

export interface CustomersViewProps {
	environment?: AppEnv;
}

/**
 * Main customers view orchestrator
 */
export function CustomersView({
	environment = AppEnv.Sandbox,
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
	} = useCustomerNavigation();

	const {
		data,
		isLoading,
		isError,
		error,
		refetch,
		isFetching,
	} = useCustomers({
		page: state.page,
		pageSize: PAGE_SIZE,
		environment,
	});

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
				// Quit
				if (input === "q") {
					exit();
					return;
				}

				// Refresh
				if (input === "r") {
					refetch();
					return;
				}

				// Sheet-specific controls
				if (state.focusTarget === "sheet" && state.sheetOpen) {
					// Copy ID
					if (input === "c" && state.selectedCustomer) {
						copy(state.selectedCustomer.id);
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
				refetch,
				copy,
				closeSheet,
				toggleFocus,
				moveUp,
				moveDown,
				prevPage,
				nextPage,
				openSheet,
			],
		),
	);

	// Calculate column widths based on actual customer data and terminal width
	const columnWidths = useMemo(
		() => calculateColumnWidths(customers, process.stdout.columns, state.sheetOpen),
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
				<TitleBar environment={environment} pagination={pagination} />
				<Box marginTop={1} width="100%">
					<EmptyState environment={environment} />
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
			<TitleBar environment={environment} pagination={pagination} />

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
