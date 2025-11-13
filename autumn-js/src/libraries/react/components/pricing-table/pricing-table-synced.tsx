import { Loader2 } from "lucide-react";
import React, { createContext, useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { PricingCardData, PricingCardOverride } from "@/index";
import { CheckoutDialog, useCustomer, usePricingTable } from "@/index";
import { cn } from "@/lib/utils";
import { loadingStyles, spinnerStyles } from "@/utils/inject-styles";
import { getPricingTableContent } from "./lib/pricing-table-content";

export default function PricingTable({
	overrides,
}: {
	overrides?: PricingCardOverride[];
}) {
	const [isAnnual, setIsAnnual] = useState(false);

	const { data: customer, checkout } = useCustomer({ errorOnNotFound: false });
	const { data, isLoading, error } = usePricingTable({ overrides });

	if (isLoading) {
		return (
			<div style={loadingStyles}>
				<Loader2 style={spinnerStyles} />
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
		<div className={cn("au-root")}>
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
					"au-flex au-items-center au-flex-col",
					hasRecommended && "!au-py-10",
				)}
			>
				{multiInterval && (
					<div
						className={cn(
							data.some((cardData) => cardData.override.recommend_text) &&
								"au-mb-8",
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
						"au-grid au-grid-cols-1 sm:au-grid-cols-2 lg:au-grid-cols-[repeat(auto-fit,minmax(200px,1fr))] au-w-full au-gap-2",
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
				" au-w-full au-h-full au-py-6 au-text-foreground au-border au-rounded-lg au-shadow-sm au-max-w-xl",
				isRecommended &&
					"lg:au--translate-y-6 lg:au-shadow-lg dark:au-shadow-zinc-800/80 lg:au-h-[calc(100%+48px)] au-bg-secondary/40",
				className,
			)}
		>
			{override.recommend_text && (
				<RecommendedBadge recommended={override.recommend_text} />
			)}
			<div
				className={cn(
					"au-flex au-flex-col au-h-full au-flex-grow",
					isRecommended && "lg:au-translate-y-6",
				)}
			>
				<div className="au-h-full">
					<div className="au-flex au-flex-col">
						<div className="au-pb-4">
							<h2 className="au-text-2xl au-font-semibold au-px-6 au-truncate">
								{override?.name || plan?.name}
							</h2>
							{description && (
								<div className="au-text-sm au-text-muted-foreground au-px-6 au-h-8">
									<p className="au-line-clamp-2">{description}</p>
								</div>
							)}
						</div>
						<div className="au-mb-2">
							<h3 className="au-font-semibold au-h-16 au-flex au-px-6 au-items-center au-border-y au-mb-4 au-bg-secondary/40">
								<div className="au-line-clamp-2">
									{mainPriceDisplay?.primary_text}{" "}
									{mainPriceDisplay?.secondary_text && (
										<span className="au-font-normal au-text-muted-foreground au-mt-1">
											{mainPriceDisplay?.secondary_text}
										</span>
									)}
								</div>
							</h3>
						</div>
					</div>
					{showFeatures && features && features.length > 0 && (
						<div className="au-flex-grow au-px-6 au-mb-6">
							<PricingFeatureList
								features={features}
								everythingFrom={override.everything_from}
							/>
						</div>
					)}
				</div>
				<div
					className={cn(" au-px-6 ", isRecommended && "lg:au--translate-y-12")}
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
		<div className={cn("au-flex-grow", className)}>
			{everythingFrom && (
				<p className="au-text-sm au-mb-4">
					Everything from {everythingFrom}, plus:
				</p>
			)}
			<div className="au-space-y-3">
				{features.map((feature, index) => (
					<div
						key={`${feature.feature_id}-${index}`}
						className="au-flex au-items-start au-gap-2 au-text-sm"
					>
						{/* {showIcon && (
              <Check className="au-h-4 au-w-4 au-text-primary au-flex-shrink-0 au-mt-0.5" />
            )} */}
						<div className="au-flex au-flex-col">
							<span>{feature.display?.primary_text}</span>
							{feature.display?.secondary_text && (
								<span className="au-text-sm au-text-muted-foreground">
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
				"au-w-full au-py-3 au-px-4 au-group au-overflow-hidden au-relative au-transition-all au-duration-300 hover:au-brightness-90 au-border au-rounded-lg",
				className,
			)}
			{...props}
			variant={recommended ? "default" : "secondary"}
			ref={ref}
			disabled={loading || props.disabled}
			onClick={handleClick}
		>
			{loading ? (
				<Loader2 className="au-h-4 au-w-4 au-animate-spin" />
			) : (
				<>
					<div className="au-flex au-items-center au-justify-between au-w-full au-transition-transform au-duration-300 group-hover:au-translate-y-[-130%]">
						<span>{children}</span>
						<span className="au-text-sm">→</span>
					</div>
					<div className="au-flex au-items-center au-justify-between au-w-full au-absolute au-px-4 au-translate-y-[130%] au-transition-transform au-duration-300 group-hover:au-translate-y-0 au-mt-2 group-hover:au-mt-0">
						<span>{children}</span>
						<span className="au-text-sm">→</span>
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
		<div className="au-flex au-items-center au-space-x-2 au-mb-4">
			<span className="au-text-sm au-text-muted-foreground">Monthly</span>
			<Switch
				id="annual-billing"
				checked={isAnnualToggle}
				onCheckedChange={setIsAnnualToggle}
			/>
			<span className="au-text-sm au-text-muted-foreground">Annual</span>
		</div>
	);
};

export const RecommendedBadge = ({ recommended }: { recommended: string }) => {
	return (
		<div className="au-bg-secondary au-absolute au-border au-text-muted-foreground au-text-sm au-font-medium lg:au-rounded-full au-px-3 lg:au-py-0.5 lg:au-top-4 lg:au-right-4 au-top-[-1px] au-right-[-1px] au-rounded-bl-lg">
			{recommended}
		</div>
	);
};
