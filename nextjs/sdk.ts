import "dotenv/config";
import { Autumn } from "autumn-js";

const main = async () => {
  // const autumn = new Autumn({
  //   secretKey: process.env.AUTUMN_SECRET_KEY,
  //   url: "http://localhost:8080/v1",
  // });

  const autumn = new Autumn();

  const res = await autumn.customers.updateBalances("123", {
    feature_id: "credits",
    balance: 10000,
  });

  console.log(res);

  // await autumn.entities.transfer("123", {
  //   from_entity_id: "2",
  //   to_entity_id: "1",
  //   product_id: "pro",
  // });
};

main();
