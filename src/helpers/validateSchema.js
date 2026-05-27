export const validateSchema = (schema, data) => {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      error: result.error.format(),
    };
  }

  return {
    data: result.data,
  };
};
