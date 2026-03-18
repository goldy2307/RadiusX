const { body, validationResult } = require("express-validator");

// Middleware: run after validation chains, return 422 if errors found
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

// -- Auth ------------------------------------------------------
const registerRules = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("mobile")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Valid 10-digit Indian mobile required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("pincode")
    .matches(/^\d{6}$/)
    .withMessage("Valid 6-digit pincode required"),
  body("address").trim().isLength({ min: 6 }).withMessage("Address required"),
];

const loginRules = [
  body("identifier").trim().notEmpty().withMessage("Email or mobile required"),
  body("password").notEmpty().withMessage("Password required"),
];

// -- Seller application ----------------------------------------
const sellerApplyRules = [
  body("ownerName").trim().isLength({ min: 2 }).withMessage("Owner name required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("mobile").matches(/^[6-9]\d{9}$/).withMessage("Valid mobile required"),
  body("bizType")
    .isIn(["individual", "partnership", "pvt_ltd", "llp", "trust"])
    .withMessage("Valid business type required"),
  body("bizName").trim().isLength({ min: 3 }).withMessage("Business name required"),
  body("pan")
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage("Valid PAN required (e.g. ABCDE1234F)"),
  body("gst")
    .optional({ checkFalsy: true })
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage("Invalid GST number"),
  body("storeName").trim().isLength({ min: 3 }).withMessage("Store name required"),
  body("storeDesc").trim().isLength({ min: 10 }).withMessage("Store description required (min 10 chars)"),
  body("category")
    .isIn(["electronics","fashion","home","food","health","sports","books","toys","auto","other"])
    .withMessage("Valid category required"),
  body("pincode").matches(/^\d{6}$/).withMessage("Valid 6-digit pincode required"),
  body("storeAddr").trim().isLength({ min: 8 }).withMessage("Store address required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("accName").trim().isLength({ min: 2 }).withMessage("Account holder name required"),
  body("bankName").trim().isLength({ min: 2 }).withMessage("Bank name required"),
  body("accNo").trim().isLength({ min: 9 }).withMessage("Valid account number required"),
  body("ifsc")
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage("Valid IFSC required (e.g. SBIN0001234)"),
];

// -- Product ----------------------------------------------------
const productRules = [
  body("name").trim().isLength({ min: 2 }).withMessage("Product name required"),
  body("description").trim().isLength({ min: 10 }).withMessage("Description required (min 10 chars)"),
  body("category")
    .isIn(["electronics","fashion","home","food","health","sports","books","toys","auto","other"])
    .withMessage("Valid category required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("originalPrice").isFloat({ min: 0 }).withMessage("Original price must be a positive number"),
  body("stock").isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
  body("pincode").matches(/^\d{6}$/).withMessage("Valid 6-digit pincode required"),
];

// -- Admin actions ---------------------------------------------
const approveRejectRules = [
  body("status")
    .isIn(["approved", "rejected"])
    .withMessage("Status must be approved or rejected"),
  body("adminNote")
    .if(body("status").equals("rejected"))
    .trim()
    .isLength({ min: 5 })
    .withMessage("Rejection reason required (min 5 chars)"),
];

module.exports = {
  handleValidation,
  registerRules,
  loginRules,
  sellerApplyRules,
  productRules,
  approveRejectRules,
};