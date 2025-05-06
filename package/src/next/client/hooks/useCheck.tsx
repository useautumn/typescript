import { useState } from "react";
import { useAutumnContext } from "../AutumnContext";
import { useAutumn } from "../hooks/useAutumn";
import { CheckResult } from "src/sdk/general/genTypes";

// export const useCheck = ({ featureId }: { featureId: string }) => {
//   const { customer } = useAutumnContext();

//   const [result, setResult] = useState<CheckResult | null>(null);
//   const [isLoading, setIsLoading] = useState(false);

//   // const check = async () => {
//   //   setIsLoading(true);
//   //   const result = await checkFeature(featureId);
//   //   setResult(result);
//   //   setIsLoading(false);
//   // };

//   return { check, result, isLoading };
// };
