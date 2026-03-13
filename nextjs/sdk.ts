import { Autumn } from "autumn-js";
import "dotenv/config";

const main = async () => {
  const autumn = new Autumn({
    secretKey: process.env.AUTUMN_SECRET_KEY,
  });

  const messageId = `${Date.now()}`;

  const res = await autumn.check({
    customer_id: "john",
    feature_id: "chat_messages",
    required_balance: 4, // amount of credits to reserve
    lock: {
      lock_id: messageId, // unique ID for this lock
      enabled: true,
      expires_at: Date.now() + 60000,
    },
  });

  // console.log(JSON.stringify(res, null, 2));

  const res2 = await autumn.v2.balances.finalize({
    action: "release",
    lock_id: messageId,
    properties: {
      userId: "Test",
    },
  });

  // console.log("Res 2:", JSON.stringify(res2, null, 1));
};

main();
