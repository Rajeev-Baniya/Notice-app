const express = require("express");
const router = new express.Router();
const User = require("../models/users");
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");
const { sendWelcomeEmail } = require("../emails/account");

//register user
router.post(
  "/user",
  [
    check("name").notEmpty().withMessage("Username cannot be empty"),
    check("email")
      .notEmpty()
      .withMessage("Email shouldnot be empty")
      .isEmail()
      .withMessage("Invalid Email address")
      .custom(async (inputEmail) => {
        const user = await User.findOne({ email: inputEmail }).exec();
        if (user) {
          throw new Error("Email already exists");
        }
      }),
    check("password")
      .notEmpty()
      .withMessage("Password cannot be empty")
      .isLength({ min: 6 })
      .withMessage("password should have atleast 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      var allErrors = {};
      errors.errors.forEach(function (err) {
        allErrors[err.param] = err.msg;
      });
      return res.json({
        status: "fail",
        data: allErrors,
      });

      //return res.status(400).json({ status: "Fail", errors: errors.array() });
    }
    const user = new User(req.body);
    try {
      await user.save();
      sendWelcomeEmail(user.email, user.name);
      const token = await user.generateAuthToken();
      res.status(201).json({
        status: "success",
        data: { id: user._id, email: user.email },
        token,
      });
    } catch (error) {
      res.status(400).json({ status: "error", message: "server error" });
    }
  }
);

//get logged user only
router.get("/user/me", auth, async (req, res) => {
  res.send({ status: "Success", data: { posts: req.user } }); //req.user
});

//login user
router.post(
  "/user/login",
  [
    check("email")
      .isEmail()
      .withMessage("Invalid email")
      .exists()
      .withMessage("Email must exist"),
    // .custom(async (inputEmail) => {
    //   const user = await User.findOne({ email: inputEmail }).exec();
    //   if (!user) {
    //     throw new Error("User with this email doesnot exist");
    //   }
    // })
    check("password")
      .exists()
      .withMessage("Password should exist")
      .custom(async (inputPassword, { req: req }) => {
        req.currentUser = await User.findByCredentials(
          req.body.email,
          inputPassword
        );
        // if (!req.currentUser) {
        //   throw new Error("Email and password donot match");
        // }
        req.token = await req.currentUser.generateAuthToken();
      }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      var allErrors = {};
      errors.errors.forEach(function (err) {
        allErrors[err.param] = err.msg;
      });
      return res.json({
        status: "Fail",
        data: allErrors,
      });
    }

    res.json({
      status: "success",
      data: {
        id: req.currentUser._id,
        email: req.currentUser.email,
      },
      token: req.token,
    });
    // try {
    //   const user = await User.findByCredentials(
    //     req.body.email,
    //     req.body.password
    //   );
    //   const token = await user.generateAuthToken();
    //   res.send({ user, token }); //user, token
    // } catch (error) {
    //   res.status(400).send(error);
    // }
  }
);

//log out user
router.post("/user/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.json({
      status: "success",
      data: { posts: "User logged out successfully" },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
});

//log out deleteing all tokens
router.post("/user/logoutall", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.json({
      status: "success",
      data: { posts: "User logged out successfully" },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Server Error" });
  }
});

//update user
router.patch("/user/update", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "password", "email"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(404).send({ error: "Invalid updates" });
  }
  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.json({ status: "success", data: { post: req.user } }); //req.user
  } catch (error) {
    res
      .status(404)
      .json({ status: "error", message: "error occured please try again" });
  }
});

//delete user
router.delete("/user/delete", auth, async (req, res) => {
  try {
    req.user.remove();
    res.json({ status: "success", data: null }); //req.user
  } catch (error) {
    res
      .status(500)
      .json({ status: "Error", message: "Error occured please try again" });
  }
});
module.exports = router;
