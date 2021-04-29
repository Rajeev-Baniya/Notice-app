const express = require("express");
const router = new express.Router();
const Notice = require("../models/notice");
const User = require("../models/users");
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");

//create notice
router.post(
  "/notice",
  [
    check("title").notEmpty().withMessage("Notice must have a title"),
    check("description")
      .notEmpty()
      .withMessage("Notice must have a description"),
  ],
  auth,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      var allErrors = {};
      errors.errors.forEach(function (err) {
        allErrors[err.params] = err.msg;
      });
      return res.json({
        status: "fail",
        data: allErrors,
      });
    }
    // const notice = new Notice(req.body);
    const notice = new Notice({
      ...req.body,
      author: req.user._id,
    });
    try {
      await notice.save();
      res.status(201).json({ status: "success", data: { posts: notice } }); //notice
    } catch (error) {
      res
        .status(400)
        .send({ status: "error", message: "error occured please try again" });
    }
  }
);

//update task by id
router.patch("/notice/:id", auth, async (req, res) => {
  // const updates = Object.keys(req.body);
  // const allowedUpdates = ["title", "description"];
  // const isValidOperation = updates.every((update) =>
  //   allowedUpdates.includes(update)
  // );
  // if (!isValidOperation) {
  //   return res.status(400).send({ error: "invalid updates" });
  // }

  try {
    // const notice = await Notice.findOne({
    //   _id: req.params.id,
    //   author: req.user._id,
    // });
    // updates.forEach((update) => (notice[update] = req.body[update]));
    // await notice.save();
    // if (!notice) {
    //   return res.response(404).send();
    // }
    // res.send(notice);
    if (req.user.role === "admin") {
      const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      return res.json({
        status: "success",
        data: { posts: notice },
        message: "updated by Admin",
      });
      //return res.send({ notice, role: "Updated By admin" });
    } else if (req.user.role === "basic") {
      const notice = await Notice.findOneAndUpdate(
        {
          _id: req.params.id,
          author: req.user._id,
        },
        req.body,
        { new: true, runValidators: true }
      );
      if (!notice) {
        return res.status(404).json({
          status: "fail",
          data: {
            posts:
              "Could not find the Notice with this id or Unauthorized user",
          },
        });
      }
      return res.json({
        status: "success",
        data: { posts: notice },
        message: "updated successfully by Author",
      });
      //return res.send({ notice, role: "Updated by author" });
    }
  } catch (error) {
    res.status(400).json({ status: "error", message: "Server Error" });
  }
});

//delete notice by id
router.delete("/notice/:id", auth, async (req, res) => {
  try {
    // const notice = await Notice.findOneAndDelete({
    //   _id: req.params.id,
    //   author: req.user._id ,
    // });

    if (req.user.role === "admin") {
      await Notice.findByIdAndDelete({ _id: req.params.id });
      return res.json({
        status: "success",
        data: null,
        message: "successfully deleted by admin",
      });
      // return res.send("Successfully deleted by admin");
    } else if (req.user.role === "basic") {
      const notice = await Notice.findOneAndDelete({
        _id: req.params.id,
        author: req.user._id,
      });
      if (!notice) {
        return res.json({
          status: "fail",
          data: {
            posts: "Couldnot find Notice with this ID or Unauthorized user",
          },
        });
        //return res.send("Could not be deleted");
      }
      return res.json({
        status: "success",
        data: null,
        message: "successfullly deleted by author",
      });
    }

    // if (!notice) {
    //   return res.status(400).send();
    // }
    // res.send(notice);
  } catch (error) {
    res.status(400).json({ status: "error", message: "Server Error" });
  }
});

//get notice created by the logged in user only
router.get("/notice/me", auth, async (req, res) => {
  try {
    //const notice = await Notice.find({ author: req.user._id });
    await req.user.populate("notices").execPopulate();
    res.json({ status: "success", data: { posts: req.user.notices } });
    //res.send(req.user.notices);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
});

//get notice created by all the user
router.get("/notice", async (req, res) => {
  try {
    const notice = await Notice.find({});
    res.json({ stauts: "success", data: { posts: notice } });
    //res.send(notice);
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: "Server Error",
    });
  }
});

module.exports = router;
