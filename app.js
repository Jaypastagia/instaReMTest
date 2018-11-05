var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');


var app = express();
var router = express.Router();
const mongoose = require('mongoose');
const csvtojson = require("csvtojson");

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: "jaypastagia"
}));


mongoose.connect('mongodb://localhost:27017/instaReM');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;


const battleSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    battle_number: {
        type: Number,
        required: true,
        unique: true
    },
    attacker_king: String,
    defender_king: String,
    attacker_1: String,
    attacker_2: String,
    attacker_3: String,
    attacker_4: String,
    defender_1: String,
    defender_2: String,
    defender_3: String,
    defender_4: String,
    attacker_outcome: String,
    battle_type: String,
    major_death: Number,
    major_capture: Number,
    attacker_size: Number,
    defender_size: Number,
    attacker_commander: String,
    defender_commander: String,
    summer: Number,
    location: String,
    region: String,
    note: String
});

const Battles = mongoose.model('Battles', battleSchema);

const csvFilePath = 'public/battles.csv';
const csv = require('csvtojson');

const checkToken = (req, res, next) => {
    const header = req.headers['authorization'];

    if (typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];

        req.token = token;
        next();
    } else {
        res.sendStatus(403);
    }
}


csv().fromFile(csvFilePath).then((jsonObj) => {
    console.log(jsonObj[0]);
    console.log(Object.keys(jsonObj[0]).length);

    Battles.init().then(function() {
        Battles.create(jsonObj, function(error) {

        });
    });

});


app.get('/list', function(req, res, next) {
    Battles.distinct("location", {
        "location": {
            $ne: ""
        }
    }, function(error, locations) {
        console.log(locations);
        return res.json(locations);
    });
});

app.get('/count', function(req, res, next) {
    Battles.count({}, function(error, count) {
        console.log(count);
        return res.json({
            'total battle': count
        });
    });
});

app.get('/stats', function(req, res, next) {
    let result = {};

    most_active('attacker_king', (attackerKing) => {

        most_active('defender_king', (defenderKing) => {

            most_active('region', (region) => {

                most_active('name', (name) => {

                    console.log('attackerKing');
                    console.log(attackerKing);
                    result.most_active = {
                        attacker_king: attackerKing,
                        defender_king: defenderKing,
                        region: region,
                        name: name
                    };

                    Battles.aggregate([{
                            $match: {
                                "battle_type": {
                                    $ne: ""
                                }
                            }
                        },
                        {
                            $group: {
                                _id: "$attacker_outcome",
                                number: {
                                    $sum: 1
                                }
                            }
                        }
                    ]).exec((err, attackerOutcome) => {

                        Battles.aggregate([{
                            $group: {
                                _id: {},
                                min: {
                                    $min: "$defender_size"
                                },
                                max: {
                                    $max: "$defender_size"
                                },
                                average: {
                                    $avg: "$defender_size"
                                }
                            }
                        }]).exec((err, defenderSize) => {

                            delete defenderSize[0]._id;
                            console.log(err);
                            console.log(defenderSize);

                            result.defender_size = defenderSize[0];
                            Battles.distinct("battle_type", {
                                "battle_type": {
                                    $ne: ""
                                }
                            }, function(error, battleType) {
                                console.log(battleType);
                                result.battle_type = battleType;

                                let obj = {};
                                for (a in attackerOutcome) {
                                    obj[attackerOutcome[a]._id] = attackerOutcome[a].number;
                                }
                                result.attacker_outcome = obj;
                                return res.json(result);
                            });
                        });
                    });
                });
            });
        });
    });
});

function most_active(param, cb) {

    Battles.aggregate([{
        "$group": {
            _id: "$" + param,
            count: {
                "$sum": 1
            }
        }
    }, {
        "$sort": {
            count: -1
        }
    }], function(err, result) {
        cb(result[0]._id);
    });

}

app.get('/search', function(req, res, next) {
    let king = req.query.king;
    let location = req.query.location;
    let type = req.query.type;


    let searchQuery = {}

    if (king) {
        searchQuery['$or'] = [{
            'attacker_king': king
        }, {
            'defender_king': king
        }]
    }

    if (location) {
        searchQuery.location = location;
    }

    if (type) {
        searchQuery.battle_type = type;
    }

    Battles.find(searchQuery).exec((err, searchResult) => {

        console.log(searchResult.length);
        return res.json(searchResult);
    });
});



app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


module.exports = app;