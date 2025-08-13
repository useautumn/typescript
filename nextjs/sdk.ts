import "dotenv/config";
import { Autumn } from "autumn-js";

const main = async () => {
  const autumn = new Autumn({
    secretKey: process.env.AUTUMN_SECRET_KEY,
    url: "http://localhost:8080/v1",
  });

  // const autumn = new Autumn();

  const cancelRes = await autumn.cancel({
    customer_id: "123",
    product_id: "pro",
    cancel_immediately: true,
  });

  console.log("Cancel res:", cancelRes);

  const attachRes = await autumn.attach({
    customer_id: "123",
    product_id: "pro",
    reward: "ferndesk",
  });

  console.log("Attach res:", attachRes);
  // const res = await autumn.checkout({
  //   customer_id: "test",
  //   product_id: "pro",
  //   customer_data: {
  //     email: "test@test.com",
  //   },
  // });

  // console.log(res);

  // await autumn.entities.transfer("123", {
  //   from_entity_id: "2",
  //   to_entity_id: "1",
  //   product_id: "pro",
  // });
};

main();
