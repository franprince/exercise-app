const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const cors = require("cors");

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const uri =
  "mongodb+srv://freecodecamp:ICN4xUb82gDjesq1@cluster0-stpfb.mongodb.net/fran?retryWrites=true&w=majority";

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const userSchema = new Schema({
  username: { type: String, required: true },
});
const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date },
});
var User = mongoose.model("User", userSchema);

var Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/exercise/new-user", (req, res) => {
  const userName = req.body.username;
  console.log(req.body);
  User.find({ username: userName }, "username", (err, result) => {
    if (result.length) {
      res.send("El usuario ya existe!" + result);
    } else if (err) {
      console.err("Error!: " + err);
    } else {
      const newUser = new User({
        username: userName,
      });
      newUser.save((err, result) => {
        if (err) {
          console.error(err);
        }
        console.log(result);
        res.send(result);
      });
    }
  });
});

app.get("/api/exercise/users", (req, res) => {
  User.find({}, (err, result) => {
    if (err) {
      console.error(err);
    }
    res.json(result);
  });
});

app.get("/api/exercise/remove", (req, res) => {
  Exercise.deleteMany({}, (err, response) => {
    if (err) {
      console.error(err);
    }
    res.json(response);
  });
});

app.get("/api/exercise/log", (req, res) => {
  const queryUserId = req.query.userId;
  const queryFrom = new Date(req.query.from);
  const queryTo = new Date(req.query.to);
  const queryLimit = req.query.limit;
  console.log(req.body);
  const findQuery = (queryUserId, queryFrom, queryTo) => {
    if (queryTo == "Invalid Date" || queryFrom == "Invalid Date") {
      return { userId: queryUserId };
    } else {
      return { userId: queryUserId, date: { $gte: queryFrom, $lt: queryTo } };
    }
  };
  User.findById(queryUserId, "username", (err, userInfo) => {
    if (err) {
      console.error("Error: " + err);
    }
    Exercise.find(findQuery(queryUserId, queryFrom, queryTo))
      .limit(Number(queryLimit))
      .exec((err, listaEjecicios) => {
        if (err) {
          console.error(err);
        }
        res.json({
          _id: queryUserId,
          username: userInfo.username,
          count: listaEjecicios.length,
          log: listaEjecicios.map((ejercicio) => ({
            description: ejercicio.description,
            duration: ejercicio.duration,
            date: ejercicio.date.toDateString(),
          })),
        });
      });
  });
});

app.post("/api/exercise/add", (req, res) => {
  const userId = req.body.userId;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date;
  const createDate = (date) => {
    console.log(req.body);
    if (date !== undefined) {
      if (new Date(date) == "Invalid Date") {
        return new Date();
      } else {
        return new Date(date);
      }
    } else {
      return new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate()
      );
    }
  };

  const newExercise = new Exercise({
    userId: userId,
    description: description,
    duration: duration,
    date: createDate(date),
  });

  newExercise.save((err, exerciseInfo) => {
    if (err) {
      console.error(err);
    }
    User.findById(exerciseInfo.userId, (err, userInfo) => {
      if (err) {
        console.error(err);
      }
      res.json({
        _id: exerciseInfo._id,
        username: userInfo.username,
        date: exerciseInfo.date.toDateString(),
        duration: exerciseInfo.duration,
        description: exerciseInfo.description,
      });
    });
  });
});

process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
  // application specific logging, throwing an error, or other logic here
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
