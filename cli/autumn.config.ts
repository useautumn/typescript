

import {
    feature,
    product,
    featureItem,
    pricedFeatureItem,
    priceItem,
} from 'autumn-js/compose';


// Features
const canUseTokens = feature({
    id: 'can_use_tokens',
    name: 'Can Use Tokens',
    type: 'boolean',
})

const message = feature({
    id: 'message',
    name: 'Messages',
    type: 'metered',
})

const taskRuns = feature({
    id: 'task_runs',
    name: 'Task Runs',
    type: 'metered',
})

// Products

const freePlan = product({
    id: 'free',
    name: 'Free',
    items: [

        featureItem({
            feature_id: message.id,
            included_usage: 200,
            interval: 'month',
        }),

    ]
})


const ultraPlan = product({
    id: 'ultra',
    name: 'Ultra',
    items: [
        priceItem({
            price: 300,
            interval: 'year',
        }),

        pricedFeatureItem({
            feature_id: message.id,
            price: 200,
            interval: 'month',
            included_usage: 80,
            billing_units: 100,
            usage_model: 'pay_per_use',
        }),

        featureItem({
            feature_id: message.id,
            included_usage: 900,
            interval: 'year',
        }),

        featureItem({
            feature_id: taskRuns.id,
            included_usage: 900,
            interval: 'year',
        }),

    ]
})


const proPlan = product({
    id: 'pro',
    name: 'Pro',
    items: [

        priceItem({
            price: 200,
            interval: 'year',
        }),

        pricedFeatureItem({
            feature_id: canUseTokens.id,
            price: 200,
            interval: 'month',
            included_usage: 1,
            billing_units: 1,
            usage_model: 'prepaid',
        }),

        pricedFeatureItem({
            feature_id: message.id,
            price: 200,
            interval: 'month',
            included_usage: 30,
            billing_units: 100,
            usage_model: 'pay_per_use',
        }),

        featureItem({
            feature_id: message.id,
            included_usage: 650,
            interval: 'year',
        }),

        featureItem({
            feature_id: taskRuns.id,
            included_usage: 650,
            interval: 'year',
        }),

    ]
})

// Remember to update this when you make changes!

export default {
    products: [freePlan, ultraPlan, proPlan],
    features: [canUseTokens, message, taskRuns]
}

