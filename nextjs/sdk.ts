import "dotenv/config";
// import { Autumn } from "autumn-js";
// import { Autumn } from "@useautumn/sdk";

// import { Autumn } from "autumn-js";
import { Autumn } from "@useautumn/sdk";
import { Knock } from "@knocklabs/node";

const main = async () => {

  const autumn = new Autumn({
    baseURL: "http://localhost:8080/v1",
    secretKey: process.env.AUTUMN_SECRET_KEY,
  })

  const knock = new Knock({
    apiKey: process.env.KNOCK_API_KEY,
  })

  await knock.channels.bulk.updateMessageStatus("123", "seen", {
    recipient_ids: ["123"],
  })

  
  await autumn.attach({
    customer_id: "123",
    product_id: "pro",
  })
};

main();
