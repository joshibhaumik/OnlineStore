const express = require("express");
const bodyParser = require("body-parser");
const Items = require("../../models/Items");
const Store = require("../../models/Stores");
const Reviews = require("../../models/Reviews");
const auth = require("../../authenticate");
const Users = require("../../models/Users");

const router = express.Router();
router.use(bodyParser.json());

/*
  @route /api/items/
  @desc CRUD operations for all the items
*/
router
  .route("/")
  .get(auth.verifyUser, async (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    try {
      let items = await Items.find({});
      res.status(200).json({ status: true, payload: items, error: "" });
    } catch (error) {
      res.status(500).json({ status: false, payload: {}, error: error });
    }
  })
  .post(auth.verifyUser, async (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const user = await Users.findById(req.user._id);
      if (user.store === undefined) {
        res.status(501).json({
          status: false,
          payload: [],
          error: "You don't have a store to add item."
        });
      } else {
        const store = await Store.findById(user.store);
        const body = req.body;
        body["store"] = store._id;
        const item = await Items.create(body);
        store.items.push(item._id);
        await store.save();
        res.status(201).json({
          status: true,
          payload: item,
          error: ""
        });
      }
    } catch (error) {
      res.status(500).json({ status: false, payload: {}, error: error });
    }
  })
  .put(auth.verifyUser, (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 501;
    res.json({
      status: false,
      payload: {},
      error: "PUT operation not allowed"
    });
  })
  .delete(auth.verifyUser, auth.validateAdmin, async (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const items = await Items.remove({});
      const reviews = await Reviews.remove({});
      const stores = await Store.find({});
      const users = await Users.find({});
      for (let store of stores) {
        store.items = [];
      }
      for (let user of users) {
        user.notifications = [];
        user.cart = [];
      }
      res.status(200).json({ status: true, payload: items, error: "" });
    } catch (error) {
      res.status(500).json({ status: false, payload: {}, error: error });
    }
  });

/*
  @route /api/items/itemId
  @desc CRUD operations for an Item
*/
router
  .route("/:itemId")
  .get(async (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    try {
      let item = await Items.findById(req.params.itemId).populate("reviews");
      if (item === null) {
        res
          .status(404)
          .json({ status: false, payload: [], error: "Item does not exists" });
      } else {
        res.status(200).json({ status: true, payload: item, error: "" });
      }
    } catch (error) {
      res.status(500).json({ status: false, payload: {}, error: error });
    }
  })
  .post(auth.verifyUser, (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 501;
    res.json({
      status: false,
      payload: {},
      error: "POST operation not allowed"
    });
  })
  .put(auth.verifyUser, async (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    try {
      if (String(req.user.store) === String(req.body.store)) {
        let item = await Items.findByIdAndUpdate(
          req.params.itemId,
          { $set: req.body },
          { new: true }
        );
        if (item === null) {
          res.status(404).json({
            status: false,
            payload: [],
            error: "Item does not exists"
          });
        } else {
          res.status(204).json({ status: true, payload: item, error: "" });
        }
      } else {
        res.status(403).json({
          status: false,
          payload: [],
          error: "You cannot modify somebody's item"
        });
      }
    } catch (error) {
      res.status(500).json({ status: false, payload: {}, error: error });
    }
  })
  .delete(auth.verifyUser, async (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    try {
      if (req.user.store === undefined) {
        res.status(404).json({
          status: false,
          payload: [],
          error: "You don't have a store."
        });
      } else {
        const store = await Store.findById(req.user.store);
        if (store.items.includes(req.params.itemId)) {
          const item = await Items.findByIdAndRemove(req.params.itemId);
          if (item === null) {
            res.status(404).json({
              status: false,
              payload: [],
              error: "Item does not exists"
            });
          } else {
            const reviews = await Reviews.remove({ item: item._id });
            store.items.pull(item._id);
            const succ = await store.save();
            res.status(200).json({ status: true, payload: item, error: "" });
          }
        } else {
          res.status(403).json({
            status: false,
            payload: [],
            error: "You cannot delete somebody's item"
          });
        }
      }
    } catch (error) {
      res.status(500).json({ status: false, payload: {}, error: error });
    }
  });

module.exports = router;
