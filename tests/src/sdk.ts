import { Autumn } from "autumn-js";
const autumn = new Autumn({
  secretKey: "am_sk_test_8bDtE5xZ3pLO4Pl1yQvpKc91fYAvdNTVZ2vOkR5jNe",
});

const cusId = "123";
const featureId = "chat-messages";
const freeProductId = "free-example";
const proProductId = "pro-example";

const createCustomer = async () => {
  let { data, error } = await autumn.customers.create({
    id: cusId,
    name: "John Doe",
    email: "john@doe.com",
  });

  if (error) {
    throw error;
  }

  return data;
};

const getCustomer = async () => {
  let { data, error } = await autumn.customers.get(cusId);

  if (error) {
    throw error;
  }

  return data;
};

const check = async ({
  featureId,
  productId,
}: {
  featureId?: string;
  productId?: string;
}) => {
  let { data, error } = await autumn.check({
    customer_id: cusId,
    feature_id: featureId,
    product_id: productId,
  });

  if (error) {
    throw error;
  }

  return data;
};

const event = async ({
  featureId,
  value,
}: {
  featureId?: string;
  value?: number;
}) => {
  let { data, error } = await autumn.event({
    customer_id: cusId,
    feature_id: featureId,
    value: value,
  });

  if (error) {
    throw error;
  }

  return data;
};

const attach = async ({ productId }: { productId: string }) => {
  let { data, error } = await autumn.attach({
    customer_id: cusId,
    product_id: productId,
  });

  if (error) {
    throw error;
  }

  return data;
};

const billingPortal = async () => {
  let { data, error } = await autumn.customers.billingPortal(cusId);

  if (error) {
    throw error;
  }

  return data;
};

const main = async () => {
  try {
    // const autumn = new Autumn({
    //   secretKey: "am_sk_test_8bDtE5xZ3pLO4Pl1yQvpKc91fYAvdNTVZ2vOkR5jNe",
    // });

    let { data, error } = await autumn.customers.get("123");

    // if (error) {
    //   throw new Error(`Customer not found: ${error}`);
    // }

    // console.log(data.id);

    // let customer = await createCustomer();

    // let getCustomerRes = await getCustomer();

    let checkData = await check({
      featureId: featureId,
      productId: freeProductId,
    });

    // console.log(checkData);

    // let trackData = await autumn.track({
    //   customer_id: cusId,
    //   feature_id: featureId,
    // });

    // let attachData = await attach({
    //   productId: proProductId,
    // });

    // let billingPortalData = await billingPortal();
  } catch (error) {
    console.log(error);
  }
};

main();
