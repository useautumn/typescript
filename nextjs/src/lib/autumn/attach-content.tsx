import { type CheckoutResult } from "autumn-js";

export const getAttachContent = (preview: CheckoutResult) => {
  const { scenario, product, current_product, next_cycle_at } = preview;

  const nextCycleAtStr = next_cycle_at
    ? new Date(next_cycle_at).toLocaleDateString()
    : undefined;

  const productName = product.name;
  const recurring = product.properties?.is_one_off === false;

  switch (scenario) {
    case "scheduled":
      return {
        title: <p>{productName} product already scheduled</p>,
        message: (
          <p>
            You are currently on product {current_product.name} and are
            scheduled to start {productName} on {nextCycleAtStr}.
          </p>
        ),
      };

    case "active":
      return {
        title: <p>Product already active</p>,
        message: <p>You are already subscribed to this product.</p>,
      };

    case "new":
      if (recurring) {
        return {
          title: <p>Subscribe to {productName}</p>,
          message: (
            <p>
              By clicking confirm, you will be subscribed to {productName} and
              your card will be charged immediately.
            </p>
          ),
        };
      } else {
        return {
          title: <p>Purchase {productName}</p>,
          message: (
            <p>
              By clicking confirm, you will purchase {productName} and your card
              will be charged immediately.
            </p>
          ),
        };
      }

    case "renew":
      return {
        title: <p>Renew</p>,
        message: (
          <p>
            By clicking confirm, you will renew your subscription to{" "}
            {productName}.
          </p>
        ),
      };

    case "upgrade":
      return {
        title: <p>Upgrade to {productName}</p>,
        message: (
          <p>
            By clicking confirm, you will upgrade to {productName} and your
            payment method will be charged immediately.
          </p>
        ),
      };

    case "downgrade":
      return {
        title: <p>Downgrade to {productName}</p>,
        message: (
          <p>
            By clicking confirm, your current subscription to{" "}
            {current_product.name} will be cancelled and a new subscription to{" "}
            {productName} will begin on {nextCycleAtStr}.
          </p>
        ),
      };

    case "cancel":
      return {
        title: <p>Cancel</p>,
        message: (
          <p>
            By clicking confirm, your subscription to {current_product.name}{" "}
            will end on {nextCycleAtStr}.
          </p>
        ),
      };

    default:
      return {
        title: <p>Change Subscription</p>,
        message: <p>You are about to change your subscription.</p>,
      };
  }
};
