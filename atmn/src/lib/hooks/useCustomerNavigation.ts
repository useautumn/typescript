import { useReducer, useCallback } from "react";
import type { ApiCustomer } from "../api/endpoints/customers.js";

export type FocusTarget = "table" | "sheet";

export interface NavigationState {
	page: number;
	selectedIndex: number;
	sheetOpen: boolean;
	focusTarget: FocusTarget;
	selectedCustomer: ApiCustomer | null;
	copiedFeedback: boolean;
}

export type NavigationAction =
	| { type: "MOVE_UP" }
	| { type: "MOVE_DOWN"; maxIndex: number }
	| { type: "NEXT_PAGE"; canNavigate: boolean }
	| { type: "PREV_PAGE" }
	| { type: "OPEN_SHEET"; customer: ApiCustomer }
	| { type: "CLOSE_SHEET" }
	| { type: "TOGGLE_FOCUS" }
	| { type: "COPY_ID" }
	| { type: "CLEAR_COPIED_FEEDBACK" }
	| { type: "SELECT_CUSTOMER"; customer: ApiCustomer; index: number };

const initialState: NavigationState = {
	page: 1,
	selectedIndex: 0,
	sheetOpen: false,
	focusTarget: "table",
	selectedCustomer: null,
	copiedFeedback: false,
};

function navigationReducer(
	state: NavigationState,
	action: NavigationAction,
): NavigationState {
	switch (action.type) {
		case "MOVE_UP":
			if (state.selectedIndex > 0) {
				return { ...state, selectedIndex: state.selectedIndex - 1 };
			}
			return state;

		case "MOVE_DOWN":
			if (state.selectedIndex < action.maxIndex) {
				return { ...state, selectedIndex: state.selectedIndex + 1 };
			}
			return state;

		case "NEXT_PAGE":
			if (action.canNavigate) {
				return { ...state, page: state.page + 1, selectedIndex: 0 };
			}
			return state;

		case "PREV_PAGE":
			if (state.page > 1) {
				return { ...state, page: state.page - 1, selectedIndex: 0 };
			}
			return state;

		case "OPEN_SHEET":
			return {
				...state,
				sheetOpen: true,
				focusTarget: "sheet",
				selectedCustomer: action.customer,
			};

		case "CLOSE_SHEET":
			return {
				...state,
				sheetOpen: false,
				focusTarget: "table",
			};

		case "TOGGLE_FOCUS":
			if (state.sheetOpen) {
				return {
					...state,
					focusTarget: state.focusTarget === "table" ? "sheet" : "table",
				};
			}
			return state;

		case "COPY_ID":
			return { ...state, copiedFeedback: true };

		case "CLEAR_COPIED_FEEDBACK":
			return { ...state, copiedFeedback: false };

		case "SELECT_CUSTOMER":
			return {
				...state,
				selectedIndex: action.index,
				selectedCustomer: action.customer,
			};

		default:
			return state;
	}
}

export function useCustomerNavigation() {
	const [state, dispatch] = useReducer(navigationReducer, initialState);

	const moveUp = useCallback(() => {
		dispatch({ type: "MOVE_UP" });
	}, []);

	const moveDown = useCallback((maxIndex: number) => {
		dispatch({ type: "MOVE_DOWN", maxIndex });
	}, []);

	const nextPage = useCallback((canNavigate: boolean) => {
		dispatch({ type: "NEXT_PAGE", canNavigate });
	}, []);

	const prevPage = useCallback(() => {
		dispatch({ type: "PREV_PAGE" });
	}, []);

	const openSheet = useCallback((customer: ApiCustomer) => {
		dispatch({ type: "OPEN_SHEET", customer });
	}, []);

	const closeSheet = useCallback(() => {
		dispatch({ type: "CLOSE_SHEET" });
	}, []);

	const toggleFocus = useCallback(() => {
		dispatch({ type: "TOGGLE_FOCUS" });
	}, []);

	const copyId = useCallback(() => {
		dispatch({ type: "COPY_ID" });
	}, []);

	const clearCopiedFeedback = useCallback(() => {
		dispatch({ type: "CLEAR_COPIED_FEEDBACK" });
	}, []);

	const selectCustomer = useCallback((customer: ApiCustomer, index: number) => {
		dispatch({ type: "SELECT_CUSTOMER", customer, index });
	}, []);

	return {
		state,
		dispatch,
		moveUp,
		moveDown,
		nextPage,
		prevPage,
		openSheet,
		closeSheet,
		toggleFocus,
		copyId,
		clearCopiedFeedback,
		selectCustomer,
	};
}
