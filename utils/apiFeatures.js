class APIFeatures {
  constructor(query, reqQuery) {
    this.query = query;
    this.reqQuery = reqQuery;
  }
  filter() {
    let queryObject = { ...this.reqQuery };
    const excluded = ['page', 'limit', 'sort', 'fields'];
    excluded.forEach((e) => delete queryObject[e]);
    const queryString = JSON.stringify(queryObject).replace(
      /\b(lte|lt|gte|gt)\b/gi,
      (e) => `$${e}`
    );
    queryObject = JSON.parse(queryString);
    // console.log(queryObject);
    this.query.find(queryObject);
    return this;
  }
  sort() {
    if (this.reqQuery.sort) {
      this.query.sort(this.reqQuery.sort.replace(/,/g, ' '));
    } else {
      this.query.sort('createdAt');
    }
    return this;
  }
  selectFields() {
    if (this.reqQuery.fields) {
      this.query.select(this.reqQuery.fields.split(','));
    } else {
      this.query.select('-__v');
    }
    return this;
  }
  pagination() {
    const { page = 1, limit = 10 } = this.reqQuery;
    this.query.skip(limit * (page - 1)).limit(+limit);
    return this;
  }
}

module.exports = APIFeatures;
