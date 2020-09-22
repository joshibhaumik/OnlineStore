const express = require("express");
const bodyParser = require("body-parser");
const User = require("../models/Users");
const Items = require("../models/Items");
const Store = require("../models/Stores");
const Comments = require("../models/Comments");
const auth = require("../authenticate");

const router = express.Router();
router.use(bodyParser.json());

/*
  @route /api/current_user/
  @desc Get the current logged in user
*/
router.get("/current_user", auth.verifyUser, (req, res, next) => {
  res.json({
    status:true,
    payload: req.user,
    error:""
  });
})

/*
  @route /api/users/
  @desc CRUD operations for all the users
*/
router
  .route("/")
  .get(auth.verifyUser, auth.validateAdmin, async (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    try {
      let users = await User.find({});
      res.json({ status: true, payload: users, error: "" });
    } catch (error) {
      res.json({ status: false, payload: {}, error: error });
      next(error);
    }
  })
  .post((req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    res.json({
      status: false,
      payload: [],
      error:
        "You cannot create the user. Please signin with your Google account."
    });
  })
  .put((req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    res.json({
      status: false,
      payload: {},
      error: "PUT operation not allowed"
    });
  })
  .delete(auth.verifyUser, auth.validateAdmin, async (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    try {
      let users = await User.remove({});
      let stores = await Store.remove({});
      let items = await Items.remove({});
      let comments = await Comments.remove({});
      res.json({ status: true, payload: users, error: "" });
    } catch (error) {
      res.json({ status: false, payload: {}, error: error });
      next(error);
    }
  });

/*
  @route /api/users/userId
  @desc CRUD operation for a user
*/
router
  .route("/:userId")
  .get(auth.verifyUser, async (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    try {
      let user = await User.findById(req.params.userId);
      if (user === null) {
        res.json({ status: false, payload: [], error: "User does not exists" });
      } else {
        res.json({ status: true, payload: user, error: "" });
      }
    } catch (error) {
      res.json({ status: false, payload: {}, error: error });
      next(error);
    }
  })
  .post(auth.verifyUser, (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    res.json({
      status: false,
      payload: {},
      error: "POST operation not allowed"
    });
  })
  .put(auth.verifyUser, (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    res.json({
      status: false,
      payload: {},
      error: "PUT operation not allowed for Google OAuth"
    });
  })
  .delete(auth.verifyUser, async (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    try {
      if (String(req.params.userId) === String(req.user._id)) {
        const user = await User.findByIdAndRemove(req.params.userId);
        if (user === null) {
          res.json({
            status: false,
            payload: [],
            error: "User does not exists"
          });
        } else {
          const store = await Store.findByIdAndRemove(user.store);
          if (store !== null) {
            const items_ = await Items.find({ store: store._id });
            if (items_.length !== 0) {
              for (let item of items_) {
                const comments = await Comments.remove({ item: item._id });
              }
              const items = await Items.remove({ store: store._id });
            }
          }
          res.json({ status: true, payload: user, error: "" });
        }
      } else {
        res.json({
          status: false,
          payload: [],
          error: "You cannot delete another person's account"
        });
      }
    } catch (error) {
      res.json({ status: false, payload: {}, error: error });
      next(error);
    }
  });

/*
  @route /api/users/cart/userId
  @desc add and remove an item from the user cart
*/
router
  .route("/:userId/cart/:itemId")
  .post(auth.verifyUser, async (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    try {
      if (String(req.user._id) === String(req.params.userId)) {
        const user = await User.findById(req.params.userId);
        const item = await Items.findById(req.params.itemId);
        if (user === null) {
          res.json({
            status: false,
            payload: [],
            error: "User does not exists"
          });
        } else if (item === null) {
          res.json({
            status: false,
            payload: [],
            error: "Item you are trying to add does not exists"
          });
        } else {
          user.cart.push(item);
          const succ = await user.save();
          res.json({
            status: true,
            payload: item,
            error: ""
          });
        }
      } else {
        res.json({
          status: false,
          payload: [],
          error: "You cannot add items to other people's cart."
        });
      }
    } catch (error) {
      res.json({
        status: false,
        payload: [],
        error: error
      });
    }
  })
  .delete(auth.verifyUser, async (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    try {
      if (String(req.user._id) === String(req.params.userId)) {
        const user = await User.findById(req.params.userId);
        const item = await Items.findById(req.params.itemId);
        if (user === null) {
          res.json({
            status: false,
            payload: [],
            error: "User does not exists"
          });
        } else if (item === null) {
          res.json({
            status: false,
            payload: [],
            error: "Item you are trying to delete does not exists in the cart"
          });
        } else {
          user.cart.pull(item._id);
          const succ = await user.save();
          res.json({
            status: true,
            payload: item,
            error: ""
          });
        }
      } else {
        res.json({
          status: false,
          payload: [],
          error: "You cannot delete items from other people's cart"
        });
      }
    } catch (error) {
      res.json({
        status: false,
        payload: [],
        error: error
      });
    }
  });

module.exports = router;
