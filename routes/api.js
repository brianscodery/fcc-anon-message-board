/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");
const mongoose = require("mongoose");
const expect = require("chai").expect;
const Thread = require("../models/threadModel");
const Reply = require("../models/replyModel");
module.exports = app => {
  const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    dbName: "fccAdvancedNode",
    useFindAndModify: false
  };
  const connection = mongoose.connect(process.env.DB, options, err => {
    if (err) {
      console.error(err);
    } else {
      console.log("DB connected swell-like");
    }
  });

  const asyncMiddleware = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  app
    .route("/api/threads/:board")
    .post(
      asyncMiddleware(async (req, res, next) => {
        const { board } = req.params;
        const { text, delete_password } = req.body;
        const thread = await new Thread({
          board,
          text,
          delete_password
        }).save();
        res.redirect(`/b/${board}`);
      })
    )

    .get(
      asyncMiddleware(async (req, res, next) => {
        const { board } = req.params;
        const result = await Thread.aggregate([
          { $match: { board } },
          {
            $project: {
              replycount: { $size: "$replies" },
              bumped_on: 1,
              created_on: 1,
              replies: { $slice: ["$replies", -3] },
              text: 1,
              created_on: 1
            }
          }
        ])
          .sort({ bumped_on: "descending" })
          .limit(10)
          .exec();
        res.send(result);
      })
    )

    .delete(
      asyncMiddleware(async (req, res, next) => {
        const { board } = req.params;
        const { thread_id: _id, delete_password } = req.body;
        if (!_id || !delete_password) {
          res.status(400).send("thread_id and delete_password are required");
        }
        let thread;
        try {
          thread = await Thread.findById(_id);
        } catch (err) {
          res.status(400).send("incorrect thread_id");
          return;
        }
        if (!thread) {
          res.status(400).send("incorrect thread_id");
          return;
        } else {
          if (thread.delete_password === delete_password) {
            const deleted = await thread.remove();
            res.status(200).send("success");
            return;
          } else {
            res.status(400).send("incorrect delete_password");
            return;
          }
        }
      })
    )

    .put(
      asyncMiddleware(async (req, res, next) => {
        const { board } = req.params;
        const _id = req.body.thread_id;
        const thread = await Thread.findOneAndUpdate(
          { _id, board },
          { reported: true }
        );
        if (!thread) {
          res.status(400).send("thread not found");
          return;
        } else {
          res.status(200).send("success");
          return;
        }
      })
    );

  app
    .route("/api/replies/:board")
    .post(
      asyncMiddleware(async (req, res, next) => {
        const { board } = req.params;
        const { text, delete_password, thread_id } = req.body;
        if (!text || !delete_password || !thread_id) {
          res
            .status(400)
            .send(
              "thread_id, text, and delete_password are all required fields"
            );
          return;
        }

        const reply = new Reply({ text, delete_password });
        const thread = await Thread.findByIdAndUpdate(
          thread_id,
          { $push: { replies: reply }, bumped_on: reply.created_on },
          { new: true }
        );
        if (!thread) {
          res.status(400).send("invalid thread_id");
          return;
        }
        res.redirect(`/b/${board}/${thread_id}`);
      })
    )

    .get(
      asyncMiddleware(async (req, res, next) => {
        const { board } = req.params;
        const query = req.query;
        if (!query) {
          res.status(400).send("invalid thread_id");
          return;
        }
        const { thread_id } = query;
        const thread = await Thread.findById(
          thread_id,
          "-delete_password -reported -replies.reported -replies.delete_password"
        );
        if (!thread) {
          res.status(400).send("invalid thread_id");
          return;
        }
        thread.replies = [...thread.replies.reverse()];
        res.status(200).send(thread);
      })
    )

    .delete(
      asyncMiddleware(async (req, res, next) => {
        const { board } = req.params;
        const { thread_id, reply_id, delete_password } = req.body;
        if (!thread_id || !reply_id || !delete_password) {
          res
            .status(400)
            .send("thread_id, reply_id, and delete_password are all required");
          return;
        }
        let thread, reply;
        try {
          thread = await Thread.findById(thread_id);
        } catch (err) {
          res.status(400).send("invalid thread_id");
          return;
        }
        if (!thread) {
          res.status(400).send("invalid thread_id");
          return;
        }
        try {
          reply = thread.replies.id(reply_id);
        } catch (err) {
          res.status(400).send("invalid reply_id");
          return;
        }
        if (!reply) {
          res.status(400).send("invalid reply_id");
          return;
        }
        if (reply.delete_password !== delete_password) {
          res.status(400).send("incorrect delete_password");
          return;
        } else {
          reply.text = "[deleted]";
          const update = await thread.save();
          res.status(200).send("success");
          return;
        }
      })
    )

    .put(
      asyncMiddleware(async (req, res, next) => {
        const { board } = req.params;
        const { thread_id, reply_id } = req.body;
        if (!thread_id || !reply_id) {
          res.status(400).send("thread_id and reply_id are both required");
        }
        const thread = await Thread.findOneAndUpdate(
          { _id: thread_id, "replies._id": reply_id },
          { $set: { "replies.$.reported": true } }
        );
        if (!thread) {
          res.status(400).send("incorrect thread_id or reply_id");
          return;
        } else {
          res.status(200).send("success");
          return;
        }
      })
    );

  const sortRepliesByMostRecent = (a, b) => {
    return a.created_on.getTime() - b.created_on.getTime();
  };
};
