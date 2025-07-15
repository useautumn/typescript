import { product, feature, pricedFeatureItem } from "autumn-js/compose";

const messages = feature({
	id: "messages",
	name: "Messages",
	type: "metered"
})

const proPlan = product({
	id: "pro",
	name: "Pro",
	items: [
		pricedFeatureItem({
			feature_id: messages.id,
			included_usage: 10,
			price: 20,
			interval: "month"
		})
	]
})

export default {
	products: [proPlan],
	features: [messages]
}