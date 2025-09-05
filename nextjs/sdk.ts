import "dotenv/config";
import { Autumn } from "autumn-js";

const main = async () => {
  const autumn = new Autumn({
    // url: "http://localhost:8080/v1",
    secretKey: process.env.AUTUMN_SECRET_KEY,
  });

  const res = await autumn.track({
    customer_id: "123",
    feature_id: "tokens",
    properties: {
      hello: "world",
    },
  });

  console.log(res);

  // if (concurrencyLineCheck.data?.allowed === false) {
  //   return {
  //     allowed: false,
  //     message: "You have reached the maximum number of concurrent lines",
  //   };
  // }
};

main();
