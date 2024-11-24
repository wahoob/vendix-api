class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    let queryObj = { ...this.queryString };
    const excludedFields = ["page", "limit", "sort", "fields", "search"];

    // Specify fields to exclude from the query
    excludedFields.forEach((el) => delete queryObj[el]);

    // Apply advanced query syntax for comparison operators (gt, gte, lt, lte)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
    queryObj = JSON.parse(queryStr);

    // Build the final query object with $and conditions, using $or for keys with comma-separated values
    const andConditions = [];
    Object.keys(queryObj).forEach((key) => {
      if (typeof queryObj[key] === "string" && queryObj[key].includes(",")) {
        let values = queryObj[key].split(",");
        values = values.map((value) => ({ [key]: value }));
        andConditions.push({ $or: values });
      } else {
        andConditions.push({ [key]: queryObj[key] });
      }
      delete queryObj[key];
    });
    const finalQuery = andConditions.length > 0 ? { $and: andConditions } : {};

    // Find the data
    this.query = this.query.find(finalQuery);

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  search() {
    if (this.queryString.search) {
      this.query = this.query.find({
        $text: { $search: this.queryString.search },
      });
    }

    return this;
  }
}

export default ApiFeatures;
