import { ErrorResponse } from "@utils/ErrorResponse";

// export const toBackendRes = ({ res }: { res: Result<any, ErrorResponse> }) => {
//   let statusCode = res.statusCode ? res.statusCode : res.error ? 500 : 200;

//   return {
//     body: res.data ? res.data : res.error,
//     statusCode,
//   };
// };

export const toBackendError = ({
  path,
  message,
  code,
  statusCode = 500,
}: {
  path: string;
  message: string;
  code?: string;
  statusCode?: number;
}) => {
  return {
    statusCode,
    body: new ErrorResponse({
      message: message || "Internal server error",
      code: code || "internal_server_error",
    }),
  };
};
