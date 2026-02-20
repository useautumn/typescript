import { useState, useEffect } from "react";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function Spinner({ color = "#FF00FF" }: { color?: string }) {
	const [frame, setFrame] = useState(0);
	useEffect(() => {
		const id = setInterval(
			() => setFrame((p) => (p + 1) % SPINNER_FRAMES.length),
			80,
		);
		return () => clearInterval(id);
	}, []);
	return <text content={SPINNER_FRAMES[frame]} style={{ fg: color }} />;
}
