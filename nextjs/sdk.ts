import "dotenv/config";
import { Autumn } from "autumn-js";

const main = async () => {
  const autumn = new Autumn({
    url: "http://localhost:8080/v1",
    secretKey: process.env.AUTUMN_SECRET_KEY,
  });

  // const { data: attachResult } = await autumn.attach({
  //   customer_id: "john",
  //   product_id: "pro_monthly",
  // });

  // console.log("Attach response:", attachResult);

  const { data: customer } = await autumn.customers.get("john");

  console.log("Customer products:", customer?.products);

  // if (concurrencyLineCheck.data?.allowed === false) {
  //   return {
  //     allowed: false,
  //     message: "You have reached the maximum number of concurrent lines",
  //   };
  // }
};

main();
