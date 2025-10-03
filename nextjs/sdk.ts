import "dotenv/config";
// import { Autumn } from "autumn-js";
// import { Autumn } from "@useautumn/sdk";

// import { Autumn } from "autumn-js";
import { Autumn } from "@useautumn/sdk";

const main = async () => {

  const autumn = new Autumn({
    baseURL: "http://localhost:8080/v1",
    secretKey: process.env.AUTUMN_SECRET_KEY,
  })

  // const stripe = new Stripe("");

  // await stripe.customers.create({
  //   email: "john@doe.com",
  //   name: "John Doe",
  // })


  // const autumn = new Autumn({
  //   baseURL: "http://localhost:8080/v1",
  //   secretKey: process.env.AUTUMN_SECRET_KEY,
  // })  

  // await autumn.core.attach({
  //   customer_id: "123",
  //   free_trial: true,
  // });
};

main();
