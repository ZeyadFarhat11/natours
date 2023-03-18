const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model, { related = false, relatedField = 'user' } = {}) => {
  return catchAsync(async (req, res) => {
    const { id } = req.params;
    const filter = { _id: id };
    if (related && req.user.role !== 'admin') {
      filter[relatedField] = req.user._id;
    }
    const doc = await Model.findOneAndDelete(filter);
    if (!doc) throw new AppError('Invalid document ID!', 404);
    res.status(200).json({ status: 'success', data: null });
  });
};

exports.updateOne = (
  Model,
  { name = 'data', disallowedFields = [], related = false, relatedField = 'user' }
) => {
  return catchAsync(async (req, res) => {
    const { id } = req.params;
    disallowedFields.forEach((field) => delete req.body[field]);
    const filter = { _id: id };
    if (related && req.user.role !== 'admin') {
      filter[relatedField] = req.user._id;
    }
    const doc = await Model.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
    if (!doc) throw new AppError('Invalid document ID!', 404);
    res.status(200).json({ status: 'success', data: { [name]: doc } });
  });
};

exports.createOne = (Model, { name = 'data', disallowedFields = [] }) => {
  return catchAsync(async (req, res) => {
    disallowedFields.forEach((field) => delete req.body[field]);

    const doc = await Model.create(req.body);

    res.status(200).json({ status: 'success', data: { [name]: doc } });
  });
};

exports.getOne = (Model, { name = 'data', populate }) => {
  return catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const query = Model.findById(id);
    if (populate) {
      query.populate(populate);
    }
    const doc = await query;

    if (!doc) return next(new AppError('Invalid document ID!', 404));

    res.status(200).json({ status: 'success', data: { [name]: doc } });
  });
};

exports.getAll = (Model, { name = 'data', getFilterObject = () => ({}), populate }) => {
  return catchAsync(async (req, res) => {
    const filter = getFilterObject(req);
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .selectFields()
      .pagination();

    if (populate) {
      features.query.populate(populate);
    }

    const docs = await features.query;
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: { [name]: docs },
    });
  });
};
