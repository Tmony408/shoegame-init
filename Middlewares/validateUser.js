const { body, param, validationResult } = require("express-validator");
const sanitizeHtml = require("sanitize-html");

// custom sanitizer for HTML inputs
const htmlSanitizer = (value) => {
  return sanitizeHtml(value, {
    allowedTags: [], // Disallow all HTML tags
    allowedAttributes: {} // Disallow all HTML attributes
  });
};

// const idParameterRules = [
//   param("id").isMongoId().withMessage("Invalid user ID")
// ];

const signUpRules = [

  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isString().withMessage('Full name must be a string')
    .customSanitizer(value => sanitizeHtml(value)),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .customSanitizer(value => sanitizeHtml(value)),

  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

  body('gender')
    .notEmpty().withMessage('Gender is required')
    .isIn(['Male', 'Female']).withMessage('Gender must be Male or Female'),

  body('phoneNumber')
    .optional()
    .trim()
    .isString().withMessage('Phone number must be a string')
    .customSanitizer(value => sanitizeHtml(value)),

  body('dob')
    .notEmpty().withMessage('Date of Birth is required')
    .isISO8601().withMessage('Invalid date format'),

  body('affiliatedInstitution')
    .notEmpty().withMessage('Affiliated Institution is required')
    .isString().withMessage('Affiliated Institution must be a string')
    .customSanitizer(value => sanitizeHtml(value)),

  body('category.name')
    .notEmpty().withMessage('Category name is required')
    .isIn(['Internal', 'External']).withMessage('Category must be Internal or External'),

  body('category.amount')
    .notEmpty().withMessage('Category amount is required')
    .isIn([40000, 70000]).withMessage('Category amount must be 40000 or 70000'),

  body('shirtSize')
    .notEmpty().withMessage('Shirt size is required')
    .isIn(['L', 'XL', 'XXL']).withMessage('Shirt size must be L, XL, or XXL'),

  body('additionalInfo')
    .optional()
    .isString().withMessage('Additional info must be a string')
    .customSanitizer(value => sanitizeHtml(value)),
  body('emailverified')
    .optional()
    .isBoolean().withMessage('Email verified must be a boolean'),

    // body('image')
    // .notEmpty().withMessage('image url is required')
    // .isString().withMessage('image url must be a string')
    // .customSanitizer(value => sanitizeHtml(value)),

  
];

const loginRules = [
  body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Invalid email format')
  .customSanitizer(value => sanitizeHtml(value)),

body('password')
  .trim()
  .notEmpty().withMessage('Password is required')
  .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];


// Validation middleware function
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

// Middleware to validate params
// const validateParams = (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res
//       .status(400)
//       .json({ success: false, message: errors.array()[0].msg });
//   }
//   next();
// };

module.exports = {
  signUpRules,
  loginRules,
//   idParameterRules,
  validate,
//   validateParams
};
