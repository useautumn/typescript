import { Loader2 } from "lucide-react";
import React, { createContext, useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { PricingCardData, PricingCardOverride } from "autumn-js/react";
import { CheckoutDialog, useCustomer, usePricingTable } from "autumn-js/react";
import { cn } from "@/lib/utils";
import { getPricingTableContent } from "@/registry/pricing-table/lib/pricing-table-content";

export default function PricingTable({
	overrides,
}: {
	overrides?: PricingCardOverride[];
}) {
	const [isAnnual, setIsAnnual] = useState(false);
	const { customer, checkout } = useCustomer({ errorOnNotFound: false });
	const { data, isLoading, error } = usePricingTable({ overrides });

	if (isLoading) {
		return (
			<div className="w-full h-full flex justify-center items-center min-h-[300px]">
				<Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
			</div>
		);
	}

	if (error) {
		return <div> Something went wrong...</div>;
	}

	const intervals = Array.from(
		new Set(data?.map((p) => p.plan?.price?.interval).filter((i) => !!i)),
	);

	const multiInterval = intervals.length > 1;

	const intervalFilter = (cardData: PricingCardData) => {
		const plan = cardData.plan;
		const interval = plan?.price?.interval;
		if (!interval) return true;

		if (multiInterval) {
			if (isAnnual) {
				return interval === "year";
			} else {
				return interval === "month";
			}
		}

		return true;
	};

	return (
		<div className={cn("root")}>
			{data && (
				<PricingTableContainer
					data={data}
					isAnnualToggle={isAnnual}
					setIsAnnualToggle={setIsAnnual}
					multiInterval={multiInterval}
				>
					{data.filter(intervalFilter).map((cardData, index) => {
						const { plan, override } = cardData;
						const scenario = plan?.customer_eligibility?.scenario;
						const disabled = scenario === "active" || scenario === "scheduled";

						return (
							<PricingCard
								key={cardData.plan?.id}
								data={cardData}
								buttonProps={{
									// TODO 1: Add disabled logic
									disabled: disabled,

									// TODO 2: Add onClick logic
									onClick: async () => {
										if (override.button?.onClick) {
											await override.button?.onClick?.();
										} else if (cardData.plan?.id && customer) {
											await checkout({
												productId: cardData.plan?.id,
												dialog: CheckoutDialog,
											});
										} else {
											console.error("No plan ID or onClick function provided");
										}
									},
								}}
							/>
						);
					})}
				</PricingTableContainer>
			)}
		</div>
	);
}

const PricingTableContext = createContext<{
	isAnnualToggle: boolean;
	setIsAnnualToggle: (isAnnual: boolean) => void;
	showFeatures: boolean;
}>({
	isAnnualToggle: false,
	setIsAnnualToggle: () => {},
	showFeatures: true,
});

export const usePricingTableContext = (componentName: string) => {
	const context = useContext(PricingTableContext);

	if (context === undefined) {
		throw new Error(`${componentName} must be used within <PricingTable />`);
	}

	return context;
};

export const PricingTableContainer = ({
	children,
	data,
	showFeatures = true,
	className,
	isAnnualToggle,
	setIsAnnualToggle,
	multiInterval,
}: {
	children?: React.ReactNode;
	data?: PricingCardData[];
	showFeatures?: boolean;
	className?: string;
	isAnnualToggle: boolean;
	setIsAnnualToggle: (isAnnual: boolean) => void;
	multiInterval: boolean;
}) => {
	if (!data) {
		throw new Error("data prop is empty in <PricingTable />");
	}

	if (data.length === 0) return;

	const hasRecommended = data?.some((p) => p.override.recommend_text);

	return (
		<PricingTableContext.Provider
			value={{ isAnnualToggle, setIsAnnualToggle, showFeatures }}
		>
			<div
				className={cn(
					"flex items-center flex-col",
					hasRecommended && "!py-10",
				)}
			>
				{multiInterval && (
					<div
						className={cn(
							data.some((cardData) => cardData.override.recommend_text) &&
								"mb-8",
						)}
					>
						<AnnualSwitch
							isAnnualToggle={isAnnualToggle}
							setIsAnnualToggle={setIsAnnualToggle}
						/>
					</div>
				)}
				<div
					className={cn(
						"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] w-full gap-2",
						className,
					)}
				>
					{children}
				</div>
			</div>
		</PricingTableContext.Provider>
	);
};

interface PricingCardProps {
	data: PricingCardData;
	showFeatures?: boolean;
	className?: string;
	onButtonClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	buttonProps?: React.ComponentProps<"button">;
}

export const PricingCard = ({
	data,
	className,
	buttonProps,
}: PricingCardProps) => {
	const { plan, override } = data;
	const { showFeatures } = usePricingTableContext("PricingCard");
	const { buttonText } = getPricingTableContent({ plan: plan });

	const isRecommended = Boolean(override.recommend_text);
	const mainPriceDisplay =
		plan?.price === null
			? {
					primary_text: "Free",
				}
			: (override.price?.display ?? plan?.price?.display);

	const description = override.description || plan?.description;

	const features =
		override.features ??
		plan?.features?.map((feature) => ({
			feature_id: feature.feature_id,
			display: feature.display,
		}));

	return (
		<div
			className={cn(
				" w-full h-full py-6 text-foreground border rounded-lg shadow-sm max-w-xl",
				isRecommended &&
					"lg:-translate-y-6 lg:shadow-lg dark:shadow-zinc-800/80 lg:h-[calc(100%+48px)] bg-secondary/40",
				className,
			)}
		>
			{override.recommend_text && (
				<RecommendedBadge recommended={override.recommend_text} />
			)}
			<div
				className={cn(
					"flex flex-col h-full flex-grow",
					isRecommended && "lg:translate-y-6",
				)}
			>
				<div className="h-full">
					<div className="flex flex-col">
						<div className="pb-4">
							<h2 className="text-2xl font-semibold px-6 truncate">
								{override?.name || plan?.name}
							</h2>
							{description && (
								<div className="text-sm text-muted-foreground px-6 h-8">
									<p className="line-clamp-2">{description}</p>
								</div>
							)}
						</div>
						<div className="mb-2">
							<h3 className="font-semibold h-16 flex px-6 items-center border-y mb-4 bg-secondary/40">
								<div className="line-clamp-2">
									{mainPriceDisplay?.primary_text}{" "}
									{mainPriceDisplay?.secondary_text && (
										<span className="font-normal text-muted-foreground mt-1">
											{mainPriceDisplay?.secondary_text}
										</span>
									)}
								</div>
							</h3>
						</div>
					</div>
					{showFeatures && features && features.length > 0 && (
						<div className="flex-grow px-6 mb-6">
							<PricingFeatureList
								features={features}
								everythingFrom={override.everything_from}
							/>
						</div>
					)}
				</div>
				<div
					className={cn(" px-6 ", isRecommended && "lg:-translate-y-12")}
				>
					<PricingCardButton recommended={isRecommended} {...buttonProps}>
						{override.button?.text ?? buttonText}
					</PricingCardButton>
				</div>
			</div>
		</div>
	);
};

// Pricing Feature List
export const PricingFeatureList = ({
	features,
	everythingFrom,
	className,
}: {
	features: {
		feature_id: string | null;
		display?: {
			primary_text?: string;
			secondary_text?: string;
		};
	}[];
	everythingFrom?: string;
	className?: string;
}) => {
	return (
		<div className={cn("flex-grow", className)}>
			{everythingFrom && (
				<p className="text-sm mb-4">
					Everything from {everythingFrom}, plus:
				</p>
			)}
			<div className="space-y-3">
				{features.map((feature, index) => (
					<div
						key={`${feature.feature_id}-${index}`}
						className="flex items-start gap-2 text-sm"
					>
						{/* {showIcon && (
              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            )} */}
						<div className="flex flex-col">
							<span>{feature.display?.primary_text}</span>
							{feature.display?.secondary_text && (
								<span className="text-sm text-muted-foreground">
									{feature.display?.secondary_text}
								</span>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

// Pricing Card Button
export interface PricingCardButtonProps extends React.ComponentProps<"button"> {
	recommended?: boolean;
	buttonUrl?: string;
}

export const PricingCardButton = React.forwardRef<
	HTMLButtonElement,
	PricingCardButtonProps
>(({ recommended, children, className, onClick, ...props }, ref) => {
	const [loading, setLoading] = useState(false);

	const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
		setLoading(true);
		try {
			await onClick?.(e);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Button
			className={cn(
				"w-full py-3 px-4 group overflow-hidden relative transition-all duration-300 hover:brightness-90 border rounded-lg",
				className,
			)}
			{...props}
			variant={recommended ? "default" : "secondary"}
			ref={ref}
			disabled={loading || props.disabled}
			onClick={handleClick}
		>
			{loading ? (
				<Loader2 className="h-4 w-4 animate-spin" />
			) : (
				<>
					<div className="flex items-center justify-between w-full transition-transform duration-300 group-hover:translate-y-[-130%]">
						<span>{children}</span>
						<span className="text-sm">→</span>
					</div>
					<div className="flex items-center justify-between w-full absolute px-4 translate-y-[130%] transition-transform duration-300 group-hover:translate-y-0 mt-2 group-hover:mt-0">
						<span>{children}</span>
						<span className="text-sm">→</span>
					</div>
				</>
			)}
		</Button>
	);
});
PricingCardButton.displayName = "PricingCardButton";

// Annual Switch
export const AnnualSwitch = ({
	isAnnualToggle,
	setIsAnnualToggle,
}: {
	isAnnualToggle: boolean;
	setIsAnnualToggle: (isAnnual: boolean) => void;
}) => {
	return (
		<div className="flex items-center space-x-2 mb-4">
			<span className="text-sm text-muted-foreground">Monthly</span>
			<Switch
				id="annual-billing"
				checked={isAnnualToggle}
				onCheckedChange={setIsAnnualToggle}
			/>
			<span className="text-sm text-muted-foreground">Annual</span>
		</div>
	);
};

export const RecommendedBadge = ({ recommended }: { recommended: string }) => {
	return (
		<div className="bg-secondary absolute border text-muted-foreground text-sm font-medium lg:rounded-full px-3 lg:py-0.5 lg:top-4 lg:right-4 top-[-1px] right-[-1px] rounded-bl-lg">
			{recommended}
		</div>
	);
};
