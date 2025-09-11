import "dotenv/config";
import { Autumn } from "autumn-js";

const main = async () => {
  const autumn = new Autumn({
    url: "http://localhost:8080/v1",
    secretKey: process.env.AUTUMN_SECRET_KEY,
  });

  const { data } = await autumn.products.delete("credits-top-up");

  console.log("Product:", data);
};

main();
