import "dotenv/config";
import { Autumn } from "autumn-js";

const main = async () => {
  const autumn = new Autumn({
    secretKey: "am_sk_live_dx7Ctm004QSgsOSCborwYJa52h4QFqq5kmUfDCVAwn",
  });

  const concurrencyLineCheck = await autumn.check({
    customer_id: "9bafd636-0c52-46b3-8ecd-1708d6faa373",
    feature_id: "concurrency_line",
    required_balance: 1,
  });
  const callLimitCheck = await autumn.check({
    customer_id: "9bafd636-0c52-46b3-8ecd-1708d6faa373",
    feature_id: "call_limit",
    required_balance: 1,
  });

  console.log(concurrencyLineCheck);
  console.log(callLimitCheck);

  // if (concurrencyLineCheck.data?.allowed === false) {
  //   return {
  //     allowed: false,
  //     message: "You have reached the maximum number of concurrent lines",
  //   };
  // }
};

main();
