/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

const chai = require("chai");
chai.use(require("chai-http"));
chai.use(require("chai-sorted"));
chai.use(require("chai-date-string"));
chai.use(require("chai-asserttype"));

const expect = chai.expect;
const assert = chai.assert;

const server = require("../server");
const mongoose = require("mongoose");
const Thread = require("../models/threadModel.js");
const Reply = require("../models/replyModel.js");

const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  dbName: "fccAdvancedNode"
};
const connection = mongoose.createConnection(process.env.DB, options);

suite("Functional Tests", () => {
  suite("API ROUTING FOR /api/threads/:board", () => {
    suite("POST", () => {
      test("board post all required info", done => {
        const board = "general2";
        const redirectRegex = new RegExp(`^.*\\/b\\/${board}`);
        const text = "some thread text";
        const delete_password = "some delete password";
        chai
          .request(server)
          .post(`/api/threads/${board}/`)
          .send({ text, delete_password })
          .end((err, res) => {
            assert.ok(true, "the test runner expeccts assert to be used");
            expect(res).to.redirectTo(redirectRegex);
            done();
          });
      });
    });
  });

  //       test("board post new board", done => {});
  //       test("board post incomplete data", done => {});
  //

  suite("GET", () => {
    test("existing board", done => {
      const board = "general";
      chai
        .request(server)
        .get(`/api/threads/${board}`)
        .end((err, res) => {
          const data = res.body;
          assert.ok(true, "test runner expects the use of assert");

          expect(data).to.be.array();
          expect(data).to.be.descendingBy("bumped_on");
          expect(data.length).to.be.at.most(10);
          data.forEach(thread => {
            expect(thread).to.not.have.property("reported");
            expect(thread).to.not.have.property("delete_password");
            expect(thread.created_on).to.be.a.dateString();
            expect(thread.bumped_on).to.be.a.dateString();
            expect(thread.replies).to.be.array();
            expect(thread.replies).to.be.descendingBy("created_on");
            expect(thread.replies.length).to.be.at.most(3);
            expect(thread.replycount).to.be.at.most(3);
            expect(thread.replies.length).to.equal(thread.replycount);
            thread.replies.forEach(reply => {
              expect(reply).to.not.have.property("delete_password");
              expect(reply).to.not.have.property("reported");
            });
            expect(thread.text).to.be.a("string");
          });
          done();
        });
    });
  });

  suite("DELETE", () => {
    test("correct info", done => {
      const board = "general5";
      const text = "this text is what we'll use";
      const delete_password = "this delete password5";
      connection.dropCollection("threads", (err, results) => {
        new Thread({
          board,
          text,
          delete_password
        }).save((err, newThread) => {
          const thread_id = newThread._id;
          chai
            .request(server)
            .delete(`/api/threads/${board}`)
            .send({ thread_id, delete_password })
            .end((err, res) => {
              assert.ok(true, "test runner expects the use of assert");
              expect(res).to.have.status(200);
              expect(res.text).to.equal("success");
              Thread.findById(thread_id, (err, retrievedThread) => {
                expect(retrievedThread).to.be.null;
                done();
              });
            });
        });
      });
    });

    test("incorrect thread_id", done => {
      const board = "general5";
      const text = "this text is what we'll use";
      const delete_password = "this delete password5";
      const incorrectString = "incorrect";
      const incorrectId = mongoose.Types.ObjectId();
      connection.dropCollection("threads", (err, results) => {
        new Thread({
          board,
          text,
          delete_password
        }).save((err, newThread) => {
          const thread_id = newThread._id;
          chai
            .request(server)
            .delete(`/api/threads/${board}`)
            .send({ thread_id: incorrectId, delete_password })
            .end((err, res) => {
              assert.ok(true, "test runner expects the use of assert");
              expect(res).to.have.status(400);
              expect(res.text).to.equal("incorrect thread_id");
              chai
                .request(server)
                .delete(`/api/threads/${board}`)
                .send({ thread_id: incorrectString, delete_password })
                .end((err, res) => {
                  assert.ok(true, "test runner expects the use of assert");
                  expect(res).to.have.status(400);
                  expect(res.text).to.equal("incorrect thread_id");
                  done();
                });
            });
        });
      });
    });

    test("incorrect delete_password", done => {
      const board = "general5";
      const text = "this text is what we'll use";
      const delete_password = "this delete password5";
      const incorrectString = "incorrect";
      connection.dropCollection("threads", (err, results) => {
        new Thread({
          board,
          text,
          delete_password
        }).save((err, newThread) => {
          const thread_id = newThread._id;
          chai
            .request(server)
            .delete(`/api/threads/${board}`)
            .send({ thread_id, delete_password: incorrectString })
            .end((err, res) => {
              assert.ok(true, "test runner expects the use of assert");
              expect(res).to.have.status(400);
              expect(res.text).to.equal("incorrect delete_password");

              done();
            });
        });
      });
    });

    test("missing thread_id", done => {
      const board = "general5";
      const text = "this text is what we'll use";
      const delete_password = "this delete password5";
      connection.dropCollection("threads", (err, results) => {
        new Thread({
          board,
          text,
          delete_password
        }).save((err, newThread) => {
          const thread_id = newThread._id;
          chai
            .request(server)
            .delete(`/api/threads/${board}`)
            .send({ delete_password })
            .end((err, res) => {
              assert.ok(true, "test runner expects the use of assert");
              expect(res).to.have.status(400);
              expect(res.text).to.equal(
                "thread_id and delete_password are required"
              );

              done();
            });
        });
      });
    });

    test("missing delete_password", done => {
      const board = "general5";
      const text = "this text is what we'll use";
      const delete_password = "this delete password5";
      connection.dropCollection("threads", (err, results) => {
        new Thread({
          board,
          text,
          delete_password
        }).save((err, newThread) => {
          const thread_id = newThread._id;
          chai
            .request(server)
            .delete(`/api/threads/${board}`)
            .send({ thread_id })
            .end((err, res) => {
              assert.ok(true, "test runner expects the use of assert");
              expect(res).to.have.status(400);
              expect(res.text).to.equal(
                "thread_id and delete_password are required"
              );

              done();
            });
        });
      });
    });
  });

  suite("PUT", () => {
    test("correct info", done => {
      const board = "general6";
      const text = "some rando text6";
      const delete_password = "my delete password6";
      connection.dropCollection("threads", (err, results) => {
        new Thread({
          board,
          text,
          delete_password
        }).save((err, newThread) => {
          const thread_id = newThread._id;
          chai
            .request(server)
            .put(`/api/threads/${board}`)
            .send({
              thread_id
            })
            .end((err, res) => {
              assert.ok(true, "test runner expects the use of assert");
              expect(res).to.have.status(200);
              expect(res.text).to.equal("success");
              Thread.findById(thread_id, (err, retrievedThread) => {
                expect(retrievedThread.reported).to.be.true;
                done();
              });
            });
        });
      });
    });

    test("incorrect board", done => {
      const correctBoard = "general6";
      const incorrectBoard = "general5";
      const text = "some rando text6";
      const delete_password = "my delete password6";
      connection.dropCollection("threads", (err, results) => {
        new Thread({
          board: correctBoard,
          text,
          delete_password
        }).save((err, newThread) => {
          const thread_id = newThread._id;
          chai
            .request(server)
            .put(`/api/threads/${incorrectBoard}`)
            .send({
              thread_id
            })
            .end((err, res) => {
              assert.ok(true, "test runner expects the use of assert");
              expect(res).to.have.status(400);
              expect(res.text).to.equal("thread not found");

              done();
            });
        });
      });
    });

    test("incorrect thread_id", done => {
      const correctBoard = "general6";
      const incorrectBoard = "general5";
      const text = "some rando text6";
      const delete_password = "my delete password6";
      connection.dropCollection("threads", (err, results) => {
        new Thread({
          board: correctBoard,
          text,
          delete_password
        }).save((err, newThread) => {
          const incorrectThreadId = mongoose.Types.ObjectId();
          chai
            .request(server)
            .put(`/api/threads/${incorrectBoard}`)
            .send({
              thread_id: incorrectThreadId
            })
            .end((err, res) => {
              assert.ok(true, "test runner expects the use of assert");
              expect(res).to.have.status(400);
              expect(res.text).to.equal("thread not found");

              done();
            });
        });
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", () => {
    suite("POST", () => {
      test("all required info", done => {
        const board = "general3";
        const text = "some rando text";
        const delete_password = "my delete password";
        connection.dropCollection("threads", (err, results) => {
          new Thread({
            board,
            text,
            delete_password
          }).save((err, newThread) => {
            const thread_id = newThread._id;
            const redirectRegex = new RegExp(`^.*\\/b\\/${board}/${thread_id}`);

            chai
              .request(server)
              .post(`/api/replies/${board}`)
              .send({
                text,
                delete_password,
                thread_id
              })
              .end((err, res) => {
                assert.ok(true, "test runner expects the use of assert");
                expect(res).to.redirectTo(redirectRegex);
                Thread.findById(thread_id, (err, retrievedThread) => {
                  expect(retrievedThread.board).to.equal(board);
                  expect(retrievedThread.text).to.equal(text);
                  expect(retrievedThread.created_on).to.be.a.dateString();
                  expect(
                    retrievedThread.created_on.getTime()
                  ).to.be.approximately(new Date().getTime(), 5000);
                  expect(
                    new Date(retrievedThread.bumped_on).getTime()
                  ).to.be.above(new Date(retrievedThread.created_on).getTime());
                  expect(retrievedThread.reported).to.be.false;
                  expect(retrievedThread.delete_password).to.equal(
                    delete_password
                  );
                  expect(retrievedThread.replies).to.be.array();
                  expect(retrievedThread.replies.length).to.equal(1);
                  done();
                });
              });
          });
        });
      });
      test("incorrect thread id", done => {
        const invalidId = mongoose.Types.ObjectId();
        const board = "general3";
        const text = "some rando text";
        const delete_password = "my delete password";
        chai
          .request(server)
          .post(`/api/replies/${board}`)
          .send({
            text,
            delete_password,
            thread_id: invalidId
          })
          .end((err, res) => {
            assert.ok(true, "test runner expects the use of assert");
            expect(res).to.have.status(400);
            expect(res.text).to.equal("invalid thread_id");
          });
        done();
      });

      test("missing info", done => {
        const invalidId = mongoose.Types.ObjectId();
        const board = "general3";
        const text = "some rando text";
        const delete_password = "my delete password";
        chai
          .request(server)
          .post(`/api/replies/${board}`)
          .send({
            delete_password,
            thread_id: invalidId
          })
          .end((err, res) => {
            assert.ok(true, "test runner expects the use of assert");
            expect(res).to.have.status(400);
            expect(res.text).to.equal(
              "thread_id, text, and delete_password are all required fields"
            );
          });
        chai
          .request(server)
          .post(`/api/replies/${board}`)
          .send({
            text,
            delete_password
          })
          .end((err, res) => {
            assert.ok(true, "test runner expects the use of assert");
            expect(res).to.have.status(400);
            expect(res.text).to.equal(
              "thread_id, text, and delete_password are all required fields"
            );
          });
        chai
          .request(server)
          .post(`/api/replies/${board}`)
          .send({
            text,
            thread_id: invalidId
          })
          .end((err, res) => {
            assert.ok(true, "test runner expects the use of assert");
            expect(res).to.have.status(400);
            expect(res.text).to.equal(
              "thread_id, text, and delete_password are all required fields"
            );
            done();
          });
      });
    });

    suite("GET", () => {
      test("valid thread_id", done => {
        const board = "general4";
        const text = "this text is what we'll use";
        const delete_password = "this delete password";
        connection.dropCollection("threads", (err, results) => {
          new Thread({
            board,
            text,
            delete_password,
            replies: [
              new Reply({
                text: "reply1",
                delete_password: "delete pwd 1"
              }),
              new Reply({
                text: "reply2",
                delete_password: "delete pwd 2"
              }),
              new Reply({
                text: "reply3",
                delete_password: "delete pwd 3"
              }),
              new Reply({
                text: "reply4",
                delete_password: "delete pwd 4"
              }),
              new Reply({
                text: "reply5",
                delete_password: "delete pwd 5"
              })
            ]
          }).save((err, newThread) => {
            const thread_id = newThread._id;
            chai
              .request(server)
              .get(`/api/replies/${board}?thread_id=${thread_id}`)
              .end((err, res) => {
                assert.ok(true, "test runner expects the use of assert");
                const thread = res.body;
                expect(thread).to.not.have.property("reported");
                expect(thread).to.not.have.property("delete_password");
                expect(thread.created_on).to.be.a.dateString();
                expect(thread.bumped_on).to.be.a.dateString();
                expect(thread.replies).to.be.array();
                expect(thread.replies.length).to.equal(5);
                expect(thread.replies).to.be.descendingBy("created_on");
                expect(thread.text).to.equal(text);
                thread.replies.forEach(reply => {
                  expect(reply).to.not.have.property("delete_password");
                  expect(reply).to.not.have.property("reported");
                });

                done();
              });
          });
        });
      });

      test("invalid thread_id", done => {
        const invalidId = mongoose.Types.ObjectId();
        const board = "general4";
        connection.dropCollection("threads", (err, results) => {
          chai
            .request(server)
            .get(`/api/replies/${board}?thread_id=${invalidId}`)
            .end((err, res) => {
              assert.ok(true, "test runner expects the use of assert");
              expect(res).to.have.status(400);
              expect(res.text).to.equal("invalid thread_id");
              done();
            });
        });
      });

      test("missing thread_id", done => {
        const board = "general4";
        connection.dropCollection("threads", (err, results) => {
          chai
            .request(server)
            .get(`/api/replies/${board}`)
            .end((err, res) => {
              assert.ok(true, "test runner expects the use of assert");
              expect(res).to.have.status(400);
              expect(res.text).to.equal("invalid thread_id");
              done();
            });
        });
      });
    });

    suite("PUT", () => {
      test("correct info", done => {
        connection.dropCollection("threads", (err, results) => {
          const board = "general7";
          const text = "this text is what we'll use7";
          const delete_password = "this delete password7";
          const reply_delete = "reply delete pwd7";
          const newReply = new Reply({
            text: "this is a reply",
            delete_password: reply_delete
          });
          new Thread({
            board,
            text,
            delete_password,
            replies: [newReply]
          }).save((err, newThread) => {
            const thread_id = newThread._id;
            chai
              .request(server)
              .put(`/api/replies/${board}`)
              .send({
                thread_id,
                reply_id: newReply._id
              })
              .end((err, res) => {
                assert.ok(true, "test runner expects the use of assert");
                expect(res).to.have.status(200);
                expect(res.text).to.equal("success");
                Thread.findOne(
                  { "replies._id": newReply._id },
                  (err, retrievedThread) => {
                    expect(retrievedThread.replies[0].reported).to.be.true;
                    done();
                  }
                );
              });
          });
        });
      });

      test("missing reply_id or thread_id", done => {
        connection.dropCollection("threads", (err, results) => {
          const board = "general7";
          const text = "this text is what we'll use7";
          const delete_password = "this delete password7";
          const reply_delete = "reply delete pwd7";
          const newReply = new Reply({
            text: "this is a reply",
            delete_password: reply_delete
          });
          new Thread({
            board,
            text,
            delete_password,
            replies: [newReply]
          }).save((err, newThread) => {
            const thread_id = newThread._id;
            chai
              .request(server)
              .put(`/api/replies/${board}`)
              .send({
                reply_id: newReply._id
              })
              .end((err, res) => {
                assert.ok(true, "test runner expects the use of assert");
                expect(res).to.have.status(400);
                expect(res.text).to.equal(
                  "thread_id and reply_id are both required"
                );
                chai
                  .request(server)
                  .put(`/api/replies/${board}`)
                  .send({
                    thread_id
                  })
                  .end((err, res) => {
                    assert.ok(true, "test runner expects the use of assert");
                    expect(res).to.have.status(400);
                    expect(res.text).to.equal(
                      "thread_id and reply_id are both required"
                    );
                    done();
                  });
              });
          });
        });
      });

      test("incorrect thread_id or reply_id", done => {
        connection.dropCollection("threads", (err, results) => {
          const incorrectId = mongoose.Types.ObjectId();
          const board = "general7";
          const text = "this text is what we'll use7";
          const delete_password = "this delete password7";
          const reply_delete = "reply delete pwd7";
          const newReply = new Reply({
            text: "this is a reply",
            delete_password: reply_delete
          });
          new Thread({
            board,
            text,
            delete_password,
            replies: [newReply]
          }).save((err, newThread) => {
            const thread_id = newThread._id;
            chai
              .request(server)
              .put(`/api/replies/${board}`)
              .send({
                thread_id: incorrectId,
                reply_id: newReply._id
              })
              .end((err, res) => {
                assert.ok(true, "test runner expects the use of assert");
                expect(res).to.have.status(400);
                expect(res.text).to.equal("incorrect thread_id or reply_id");
                done();
              });
          });
        });
      });
    });

    suite("DELETE", () => {
      test("correct info", done => {
        connection.dropCollection("threads", (err, results) => {
          const board = "general6";
          const text = "this text is what we'll use6";
          const delete_password = "this delete password6";
          const reply_delete = "reply delete pwd";
          const newReply = new Reply({
            text: "this is a reply",
            delete_password: reply_delete
          });
          new Thread({
            board,
            text,
            delete_password,
            replies: [newReply]
          }).save((err, newThread) => {
            const thread_id = newThread._id;
            chai
              .request(server)
              .delete(`/api/replies/${board}`)
              .send({
                thread_id,
                reply_id: newReply._id,
                delete_password: reply_delete
              })
              .end((err, res) => {
                assert.ok(true, "test runner expects the use of assert");
                expect(res).to.have.status(200);
                expect(res.text).to.equal("success");
                Thread.findById(thread_id, (err, retrievedThread) => {
                  expect(retrievedThread.replies[0].text).to.equal("[deleted]");
                  done();
                });
              });
          });
        });
      });

      test("missing info", done => {
        connection.dropCollection("threads", (err, results) => {
          const board = "general6";
          const text = "this text is what we'll use6";
          const delete_password = "this delete password6";
          const reply_delete = "reply delete pwd";
          const newReply = new Reply({
            text: "this is a reply",
            delete_password: reply_delete
          });
          new Thread({
            board,
            text,
            delete_password,
            replies: [newReply]
          }).save((err, newThread) => {
            const thread_id = newThread._id;
            chai
              .request(server)
              .delete(`/api/replies/${board}`)
              .send({
                reply_id: newReply._id,
                delete_password: reply_delete
              })
              .end((err, res) => {
                assert.ok(true, "test runner expects the use of assert");
                expect(res).to.have.status(400);
                expect(res.text).to.equal(
                  "thread_id, reply_id, and delete_password are all required"
                );
                chai
                  .request(server)
                  .delete(`/api/replies/${board}`)
                  .send({
                    thread_id,
                    delete_password: reply_delete
                  })
                  .end((err, res) => {
                    assert.ok(true, "test runner expects the use of assert");
                    expect(res).to.have.status(400);
                    expect(res.text).to.equal(
                      "thread_id, reply_id, and delete_password are all required"
                    );
                    chai
                      .request(server)
                      .delete(`/api/replies/${board}`)
                      .send({
                        thread_id,
                        reply_id: newReply._id
                      })
                      .end((err, res) => {
                        assert.ok(
                          true,
                          "test runner expects the use of assert"
                        );
                        expect(res).to.have.status(400);
                        expect(res.text).to.equal(
                          "thread_id, reply_id, and delete_password are all required"
                        );

                        done();
                      });
                  });
              });
          });
        });
      });

      test("incorrect thread_id", done => {
        connection.dropCollection("threads", (err, results) => {
          const board = "general6";
          const text = "this text is what we'll use6";
          const delete_password = "this delete password6";
          const reply_delete = "reply delete pwd";
          const incorrectString = "incorrect";
          const newReply = new Reply({
            text: "this is a reply",
            delete_password: reply_delete
          });
          new Thread({
            board,
            text,
            delete_password,
            replies: [newReply]
          }).save((err, newThread) => {
            const thread_id = newThread._id;
            chai
              .request(server)
              .delete(`/api/replies/${board}`)
              .send({
                thread_id: incorrectString,
                reply_id: newReply._id,
                delete_password: reply_delete
              })
              .end((err, res) => {
                assert.ok(true, "test runner expects the use of assert");
                expect(res).to.have.status(400);
                expect(res.text).to.equal("invalid thread_id");
                done();
              });
          });
        });
      });

      test("incorrect reply_id", done => {
        connection.dropCollection("threads", (err, results) => {
          const board = "general6";
          const text = "this text is what we'll use6";
          const delete_password = "this delete password6";
          const reply_delete = "reply delete pwd";
          const incorrectString = "incorrect";
          const newReply = new Reply({
            text: "this is a reply",
            delete_password: reply_delete
          });
          new Thread({
            board,
            text,
            delete_password,
            replies: [newReply]
          }).save((err, newThread) => {
            const thread_id = newThread._id;

            chai
              .request(server)
              .delete(`/api/replies/${board}`)
              .send({
                thread_id,
                reply_id: incorrectString,
                delete_password: reply_delete
              })
              .end((err, res) => {
                assert.ok(true, "test runner expects the use of assert");
                expect(res).to.have.status(400);
                expect(res.text).to.equal("invalid reply_id");

                done();
              });
          });
        });
      });

      test("incorrect delete_password", done => {
        connection.dropCollection("threads", (err, results) => {
          const board = "general6";
          const text = "this text is what we'll use6";
          const delete_password = "this delete password6";
          const reply_delete = "reply delete pwd";
          const incorrectString = "incorrect";
          const newReply = new Reply({
            text: "this is a reply",
            delete_password: reply_delete
          });
          new Thread({
            board,
            text,
            delete_password,
            replies: [newReply]
          }).save((err, newThread) => {
            const thread_id = newThread._id;

            chai
              .request(server)
              .delete(`/api/replies/${board}`)
              .send({
                thread_id,
                reply_id: newReply._id,
                delete_password: incorrectString
              })
              .end((err, res) => {
                assert.ok(true, "test runner expects the use of assert");
                expect(res).to.have.status(400);
                expect(res.text).to.equal("incorrect delete_password");

                done();
              });
          });
        });
      });
    });
  });
});
