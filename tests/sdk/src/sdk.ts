import { Autumn } from "autumn-js";

const autumn = new Autumn({
  secretKey: "am_sk_test_H1GsNOVqMJY6ODUoGHo5xN1HQT0JU2wrytepwVhHAN",
});

const cusId = "123";

const main = async () => {
  try {
    const { data, error } = await autumn.entities.create(cusId, {
      id: "3",
      name: "John Doe",
      feature_id: "website",
      customer_data: {
        name: "John Doe",
        email: "john@doe.com",
      },
    });

    console.log(data, error);
  } catch (error) {
    console.log(error);
  }
};

main();
