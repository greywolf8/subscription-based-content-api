const Joi = require('joi');

const userRegistrationSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const contentSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  body: Joi.string().min(1).required(),
  is_premium: Joi.boolean().default(false)
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

module.exports = {
  userRegistrationSchema,
  userLoginSchema,
  contentSchema,
  validate
};
