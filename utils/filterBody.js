const filterBody = (body, ...allowedFields) => {
  let newBody = {};

  Object.keys(body).forEach((key) => {
    if (allowedFields.includes(key)) {
      newBody[key] = body[key];
    }
  });

  return newBody;
};

export default filterBody;
