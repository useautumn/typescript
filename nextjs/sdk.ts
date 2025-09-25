import "dotenv/config";
import { Autumn } from "autumn-js";

const main = async () => {
  const autumn = new Autumn({
    secretKey: process.env.AUTUMN_SECRET_KEY,
  });

  
};

main();
