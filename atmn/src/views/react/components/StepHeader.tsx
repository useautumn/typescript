interface StepHeaderProps {
	step: number;
	totalSteps: number;
	title: string;
}

export function StepHeader({ step, totalSteps, title }: StepHeaderProps) {
	return (
		<box flexDirection="column" marginBottom={0}>
			<text>
				<b>
					<span fg="#FF00FF">{`Step ${step}/${totalSteps}:`}</span>
				</b>{" "}
				<b>{title}</b>
			</text>
			<text
				content={"─".repeat(`Step ${step}/${totalSteps}:`.length)}
				style={{ fg: "#FF55FF" }}
			/>
		</box>
	);
}
