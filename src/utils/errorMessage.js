export const errorMessage = (error) =>
  typeof error?.response?.data === "string"
    ? error.response.data
    : error?.response?.data?.message ||
      "Something went wrong. Please try again.";
