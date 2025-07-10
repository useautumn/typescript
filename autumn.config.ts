import {
  feature,
  product,
  auth,
  featureItem,
  pricedFeatureItem,
  ProductItemInterval,
  UsageModel,
  priceItem,
} from "./compose";

// Features
const messages = feature({
  id: "message",
  name: "Messages",
  type: "metered",
  display: {
    singular: "Message",
    plural: "Messages",
  },
});

const taskRuns = feature({
  id: "task_runs",
  name: "Task Runs",
  type: "metered",
  display: {
    singular: "Task Run",
    plural: "Task Runs",
  },
});

const canUseTokens = feature({
  id: "can_use_tokens",
  name: "Can Use Tokens",
  type: "boolean",
});

export const freePlan = product({
  id: "free",
  name: "Free",
  items: [
    featureItem({
      feature_id: messages.id,
      included_usage: 200,
      interval: ProductItemInterval.Month,
    }),
  ],
});

export const proPlan = product({
  id: "pro",
  name: "Pro",
  items: [
    featureItem({
      feature_id: messages.id,
      included_usage: 650,
      interval: ProductItemInterval.Year,
    }),
    featureItem({
      feature_id: taskRuns.id,
      included_usage: 650,
      interval: ProductItemInterval.Year,
    }),
    priceItem({
      price: 200,
      interval: ProductItemInterval.Year,
    }),
    pricedFeatureItem({
      feature_id: messages.id,
      price: 200,
      interval: ProductItemInterval.Month,
      included_usage: 30,
      billing_units: 100,
      usage_model: UsageModel.PayPerUse,
    }),
    pricedFeatureItem({
      feature_id: canUseTokens.id,
      price: 200,
      interval: ProductItemInterval.Month,
      included_usage: 1,
      billing_units: 1,
      usage_model: UsageModel.Prepaid,
    }),
  ],
});

export const ultraPlan = product({
  id: "ultra",
  name: "Ultra",
  items: [
    featureItem({
      feature_id: messages.id,
      included_usage: 900,
      interval: ProductItemInterval.Year,
    }),
    featureItem({
      feature_id: taskRuns.id,
      included_usage: 900,
      interval: ProductItemInterval.Year,
    }),
    priceItem({
      price: 300,
      interval: ProductItemInterval.Year,
    }),
    pricedFeatureItem({
      feature_id: messages.id,
      price: 200,
      interval: ProductItemInterval.Month,
      included_usage: 80,
      billing_units: 100,
      usage_model: UsageModel.PayPerUse,
    }),
  ],
});

export default {
  products: [freePlan, proPlan, ultraPlan],
  features: [messages, taskRuns, canUseTokens],
  auth: auth({
    keys: {
      prodKey: "am_sk_live_vGqdZ9OtrJPewwhOXKKBWvUXwA30GI3Fnsvu3iMint",
      sandboxKey: "am_sk_test_UwDTEeaakEsRr6eveTj9cyxNRMyQPQb3kFbKaDYkIg",
    },
  }),
};
