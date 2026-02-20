/**
 * Ink → OpenTUI compatibility layer.
 * Re-exports OpenTUI React components with Ink-like APIs to minimize migration churn.
 */
import {
	createCliRenderer,
	TextAttributes,
	type CliRenderer,
	type KeyEvent,
} from "@opentui/core";
import {
	createRoot,
	useKeyboard,
	useRenderer,
	type Root,
} from "@opentui/react";
import React, {
	useState,
	useEffect,
	useCallback,
	useContext,
	createContext,
	type ReactNode,
	type CSSProperties,
} from "react";

// ============================================================================
// Box Component (Ink-compatible)
// ============================================================================

type InkBorderStyle =
	| "single"
	| "double"
	| "round"
	| "bold"
	| "singleDouble"
	| "doubleSingle"
	| "classic"
	| "arrow"
	| undefined;

interface BoxProps {
	children?: ReactNode;
	flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
	flexGrow?: number;
	flexShrink?: number;
	flexBasis?: number | string;
	flexWrap?: "wrap" | "nowrap" | "wrap-reverse";
	alignItems?: "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
	alignSelf?: "auto" | "flex-start" | "flex-end" | "center" | "stretch";
	justifyContent?:
		| "flex-start"
		| "flex-end"
		| "center"
		| "space-between"
		| "space-around"
		| "space-evenly";
	width?: number | string;
	height?: number | string;
	minWidth?: number | string;
	minHeight?: number | string;
	maxWidth?: number | string;
	maxHeight?: number | string;
	padding?: number;
	paddingX?: number;
	paddingY?: number;
	paddingTop?: number;
	paddingBottom?: number;
	paddingLeft?: number;
	paddingRight?: number;
	margin?: number;
	marginX?: number;
	marginY?: number;
	marginTop?: number;
	marginBottom?: number;
	marginLeft?: number;
	marginRight?: number;
	gap?: number;
	columnGap?: number;
	rowGap?: number;
	borderStyle?: InkBorderStyle;
	borderColor?: string;
	borderTop?: boolean;
	borderBottom?: boolean;
	borderLeft?: boolean;
	borderRight?: boolean;
	overflow?: "visible" | "hidden";
	overflowX?: "visible" | "hidden";
	overflowY?: "visible" | "hidden";
	display?: "flex" | "none";
}

export function Box(props: BoxProps) {
	const {
		children,
		borderStyle,
		borderColor,
		paddingX,
		paddingY,
		marginX,
		marginY,
		...rest
	} = props;

	// Build direct props for OpenTUI's <box>
	const boxProps: Record<string, any> = { ...rest };

	// Map Ink's paddingX/Y to individual paddings
	if (paddingX !== undefined) {
		boxProps.paddingLeft = paddingX;
		boxProps.paddingRight = paddingX;
	}
	if (paddingY !== undefined) {
		boxProps.paddingTop = paddingY;
		boxProps.paddingBottom = paddingY;
	}
	if (marginX !== undefined) {
		boxProps.marginLeft = marginX;
		boxProps.marginRight = marginX;
	}
	if (marginY !== undefined) {
		boxProps.marginTop = marginY;
		boxProps.marginBottom = marginY;
	}

	// Border handling - pass as direct props
	if (borderStyle !== undefined) {
		boxProps.border = true;
		switch (borderStyle) {
			case "round":
				boxProps.borderStyle = "round";
				break;
			case "single":
				boxProps.borderStyle = "single";
				break;
			case "double":
				boxProps.borderStyle = "double";
				break;
			case "bold":
				boxProps.borderStyle = "bold";
				break;
			default:
				boxProps.borderStyle = "single";
				break;
		}
		if (borderColor) {
			boxProps.borderColor = mapColor(borderColor);
		}
	}

	return <box {...boxProps}>{children}</box>;
}

// ============================================================================
// Text Component (Ink-compatible)
// ============================================================================

interface TextProps {
	children?: ReactNode;
	color?: string;
	backgroundColor?: string;
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
	strikethrough?: boolean;
	dimColor?: boolean;
	inverse?: boolean;
	wrap?: "wrap" | "truncate" | "truncate-start" | "truncate-middle" | "truncate-end";
}

/**
 * Recursively extract string content from React children.
 */
function extractText(children: ReactNode): string {
	if (children === null || children === undefined || typeof children === "boolean") {
		return "";
	}
	if (typeof children === "string" || typeof children === "number") {
		return String(children);
	}
	if (Array.isArray(children)) {
		return children.map(extractText).join("");
	}
	if (React.isValidElement(children)) {
		const props = children.props as { children?: ReactNode };
		if (props.children) {
			return extractText(props.children);
		}
	}
	return "";
}

export function Text(props: TextProps) {
	const { children, color, backgroundColor, bold, italic, underline, strikethrough, dimColor, inverse, wrap } = props;

	let attrs = 0;
	if (bold) attrs |= TextAttributes.BOLD;
	if (italic) attrs |= TextAttributes.ITALIC;
	if (underline) attrs |= TextAttributes.UNDERLINE;
	if (strikethrough) attrs |= TextAttributes.STRIKETHROUGH;
	if (inverse) attrs |= TextAttributes.INVERSE;

	let fg = color ? mapColor(color) : undefined;
	if (dimColor) {
		fg = fg || "#666666";
	}

	const bg = backgroundColor ? mapColor(backgroundColor) : undefined;

	const content = extractText(children);

	const style: Record<string, any> = {};
	if (fg) style.fg = fg;
	if (bg) style.backgroundColor = bg;
	if (attrs) style.attributes = attrs;

	// Pass content as prop and style for visual attributes
	return <text content={content} style={style} />;
}

// ============================================================================
// Color Mapping
// ============================================================================

const INK_COLORS: Record<string, string> = {
	black: "#000000",
	red: "#FF0000",
	green: "#00FF00",
	yellow: "#FFFF00",
	blue: "#0000FF",
	magenta: "#FF00FF",
	cyan: "#00FFFF",
	white: "#FFFFFF",
	gray: "#808080",
	grey: "#808080",
	redBright: "#FF5555",
	greenBright: "#55FF55",
	yellowBright: "#FFFF55",
	blueBright: "#5555FF",
	magentaBright: "#FF55FF",
	cyanBright: "#55FFFF",
	whiteBright: "#FFFFFF",
};

function mapColor(color: string): string {
	if (color.startsWith("#") || color.startsWith("rgb")) return color;
	return INK_COLORS[color] || color;
}

// ============================================================================
// Spinner Component
// ============================================================================

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

interface SpinnerProps {
	type?: string; // ignored — always uses dots
}

export function Spinner({ type }: SpinnerProps) {
	const [frame, setFrame] = useState(0);
	useEffect(() => {
		const id = setInterval(
			() => setFrame((p) => (p + 1) % SPINNER_FRAMES.length),
			80,
		);
		return () => clearInterval(id);
	}, []);
	return <text content={SPINNER_FRAMES[frame]!} style={{ fg: "#FF00FF" }} />;
}

// ============================================================================
// SelectInput Component (ink-select-input compatible)
// ============================================================================

interface SelectItem<V = any> {
	label: string;
	value: V;
	key?: string;
}

interface SelectInputProps<V = any> {
	items: SelectItem<V>[];
	onSelect?: (item: SelectItem<V>) => void;
	onHighlight?: (item: SelectItem<V>) => void;
	initialIndex?: number;
	isFocused?: boolean;
	indicatorComponent?: React.ComponentType<{ isSelected: boolean }>;
	itemComponent?: React.ComponentType<{
		isSelected: boolean;
		label: string;
	}>;
	limit?: number;
}

export function SelectInput<V = any>(props: SelectInputProps<V>) {
	const {
		items,
		onSelect,
		onHighlight,
		initialIndex = 0,
		isFocused = true,
	} = props;
	const [selectedIndex, setSelectedIndex] = useState(initialIndex);

	useKeyboard((key: KeyEvent) => {
		if (!isFocused) return;

		if (key.name === "up" || key.name === "k") {
			setSelectedIndex((prev) => {
				const next = Math.max(0, prev - 1);
				if (onHighlight && items[next]) onHighlight(items[next]!);
				return next;
			});
		} else if (key.name === "down" || key.name === "j") {
			setSelectedIndex((prev) => {
				const next = Math.min(items.length - 1, prev + 1);
				if (onHighlight && items[next]) onHighlight(items[next]!);
				return next;
			});
		} else if (key.name === "return" || key.name === "enter") {
			if (onSelect && items[selectedIndex]) {
				onSelect(items[selectedIndex]!);
			}
		}
	});

	return (
		<box flexDirection="column">
			{items.map((item, i) => {
				const isSelected = i === selectedIndex;
				const indicator = isSelected ? "❯ " : "  ";
				const fg = isSelected ? "#00FFFF" : "#FFFFFF";
				return (
					<text
						key={item.key || item.label}
						content={`${indicator}${item.label}`}
						style={{ fg }}
					/>
				);
			})}
		</box>
	);
}

// ============================================================================
// TextInput Component (ink-text-input compatible)
// ============================================================================

interface TextInputProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit?: (value: string) => void;
	placeholder?: string;
	focus?: boolean;
	mask?: string;
	showCursor?: boolean;
}

export function TextInput(props: TextInputProps) {
	const {
		value,
		onChange,
		onSubmit,
		placeholder = "",
		focus = true,
	} = props;

	useKeyboard((key: KeyEvent) => {
		if (!focus) return;

		if (key.name === "return" || key.name === "enter") {
			onSubmit?.(value);
		} else if (key.name === "backspace") {
			onChange(value.slice(0, -1));
		} else if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
			onChange(value + key.sequence);
		}
	});

	const displayValue = value || placeholder;
	const fg = value ? "#FFFFFF" : "#666666";

	return <text content={displayValue + (focus ? "█" : "")} style={{ fg }} />;
}

// ============================================================================
// useInput Hook (Ink-compatible)
// ============================================================================

interface InkKey {
	upArrow: boolean;
	downArrow: boolean;
	leftArrow: boolean;
	rightArrow: boolean;
	pageDown: boolean;
	pageUp: boolean;
	return: boolean;
	escape: boolean;
	ctrl: boolean;
	shift: boolean;
	tab: boolean;
	backspace: boolean;
	delete: boolean;
	meta: boolean;
}

type InputHandler = (input: string, key: InkKey) => void;

export function useInput(handler: InputHandler, options?: { isActive?: boolean }) {
	const isActive = options?.isActive ?? true;

	useKeyboard((key: KeyEvent) => {
		if (!isActive) return;

		const inkKey: InkKey = {
			upArrow: key.name === "up",
			downArrow: key.name === "down",
			leftArrow: key.name === "left",
			rightArrow: key.name === "right",
			pageDown: key.name === "pagedown",
			pageUp: key.name === "pageup",
			return: key.name === "return" || key.name === "enter",
			escape: key.name === "escape",
			ctrl: key.ctrl ?? false,
			shift: key.shift ?? false,
			tab: key.name === "tab",
			backspace: key.name === "backspace",
			delete: key.name === "delete",
			meta: key.meta ?? false,
		};

		const input = key.sequence || "";
		handler(input, inkKey);
	});
}

// ============================================================================
// useApp Hook (Ink-compatible)
// ============================================================================

export function useApp() {
	const renderer = useRenderer();
	return {
		exit: (error?: Error) => {
			renderer.destroy();
			if (error) {
				console.error(error);
				process.exit(1);
			}
			process.exit(0);
		},
	};
}

// ============================================================================
// useStdout Hook (Ink-compatible)
// ============================================================================

export function useStdout() {
	const renderer = useRenderer();
	return {
		stdout: process.stdout,
		write: (data: string) => {
			process.stdout.write(data);
		},
	};
}

// ============================================================================
// render function (Ink-compatible)
// ============================================================================

let _activeRenderer: CliRenderer | null = null;
let _activeRoot: Root | null = null;

interface RenderResult {
	unmount: () => void;
	waitUntilExit: () => Promise<void>;
	rerender: (node: ReactNode) => void;
	clear: () => void;
	cleanup: () => void;
}

export async function render(node: ReactNode): Promise<RenderResult> {
	// Clean up previous render if any
	if (_activeRenderer) {
		_activeRenderer.destroy();
		_activeRenderer = null;
		_activeRoot = null;
	}

	const renderer = await createCliRenderer();
	_activeRenderer = renderer;

	const root = createRoot(renderer);
	_activeRoot = root;
	root.render(node);

	const waitUntilExit = () =>
		new Promise<void>((resolve) => {
			renderer.once("destroy", () => resolve());
		});

	return {
		unmount: () => {
			root.unmount();
			renderer.destroy();
		},
		waitUntilExit,
		rerender: (newNode: ReactNode) => {
			root.render(newNode);
		},
		clear: () => {},
		cleanup: () => {
			root.unmount();
			renderer.destroy();
		},
	};
}

// Synchronous render wrapper for the common pattern in cli.tsx
// Since createCliRenderer is async, we need this wrapper
export function renderSync(node: ReactNode): void {
	render(node).catch((err) => {
		console.error("Render error:", err);
		process.exit(1);
	});
}

// ============================================================================
// Re-export everything needed
// ============================================================================

export { createCliRenderer } from "@opentui/core";
export { createRoot, useKeyboard, useRenderer } from "@opentui/react";
