const bcrypt = require('bcrypt');
const cors = require('cors');
const db = require('../database/db');
const express = require('express');
const users = express.Router();
const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const User = require('../models/User');

users.use(cors());

process.env.SECRET_KEY = 'secret';

//getall users and display json to localhost:8080/users
users.get('/', (req, res) => {
 User.findAll()
    .then(users => res.json({
      users
    }))
    .catch(err => console.log(err))
  });
//Create user row in table.
users.post('/', (req, res) => {
  const today = new Date();
  const userData = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    created: today,
  };

  User.findOne({
    where: {
      email: req.body.email,
    },
  })
    // bcrypt
    .then(user => {
      if (!user) {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          userData.password = hash;
          User.create(userData)
            .then(user => {
              res.json({ status: user.email + ' Registered!' });
            })
            .catch(err => {
              res.send('error: ' + err);
            });
        });
      } else {
        res.json({ error: 'User already exists' });
      }
    })
    .catch(err => {
      res.send('error: ' + err);
    });
});

users.post('/', (req, res) => {
  User.findOne({
    where: {
      email: req.body.email,
    },
  })
    .then(user => {
      if (user) {
        if (bcrypt.compareSync(req.body.password, user.password)) {
          let token = jwt.sign(user.dataValues, process.env.SECRET_KEY, {
            expiresIn: 9000,
          });
          console.log(token)
          res.json({ jwt: token })
          res.send(token);
        }
      } else {
        res.status(400).json({ error: 'User does not exist' });
      }
    })
    .catch(err => {
      res.status(400).json({ error: err });
    });
});

users.get('/:id', (req, res) => {
  var decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);

  User.findOne({
    where: {
      id: decoded.id,
    },
  })
    .then(user => {
      if (user) {
        res.json(user);
      } else {
        res.send('User does not exist');
      }
    })
    .catch(err => {
      res.send('error: ' + err);
    });
});


module.exports = users;
