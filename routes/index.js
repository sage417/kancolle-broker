var config = require('../bin/config.json')
var express = require('express');
var router = express.Router();

var validator = require('validator');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');

router.get('/', function (req, res) {
    res.render('index');
});

router.post('/login', function (req, res) {
    var login_id = req.body.login_id + '';
    var password = req.body.password + '';

    async.waterfall([
        function(callback) {
            console.info('login url');
            request(config.DMM_LOGIN_URL, function (error, response, htmlbody) {
                callback(error, response, htmlbody)
            });
        },
        function(response, htmlbody, callback) {
            if (response.statusCode === 200) {
                console.info('login page');
                var dmm_token = htmlbody.split(/DMM_TOKEN.*?"([a-z0-9]{32})"/)[1];
                var post_data = htmlbody.split(/token.*?"([a-z0-9]{32})"/)[3];

                var $ = cheerio.load(htmlbody);
                var id_token = $('input#id_token').val();

                request({
                    url: config.DMM_LOGIN_AJAX_TOKEN_URL,
                    method: 'POST',
                    headers: {
                        'DMM_TOKEN': dmm_token,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    form: {
                        "token": post_data
                    }
                }, function (error, response, xhrbody) {
                    callback(error, response, xhrbody)
                });
            } else {
                callback('error on visit DMM_LOGIN_URL');
            }
        },
        function(response, xhrbody, callback) {
            console.info("parse and post...");
            xhrbody = JSON.parse(xhrbody);
            var login_id_token = xhrbody['login_id'];
            var login_password_token = xhrbody['password'];
            var login_formdata = {
                "token": xhrbody.token,
                "login_id": login_id,
                "save_login_id": 0,
                "password": password,
                "use_auto_login": 0
            };
            login_formdata[login_id_token] = login_id;
            login_formdata[login_password_token] = password;
            request({
                url: config.DMM_AUTH_URL,
                method: 'POST',
                form: login_formdata
            }, function (error, response, logindata) {
                callback(error, response, logindata)
            });
        },
        function(response, logindata, callback) {
            console.info("get login result");
            if (response.statusCode === 302) {
                var cookie = '';
                response.headers['set-cookie'].forEach(function (cookieString) {
                    cookie += cookieString.split(';')[0] + ';';
                });
                request({
                    url: config.KANCOLLE_GAME_URL,
                    headers: {
                        'Cookie': cookie
                    }
                }, function (error, response, htmlbody,cookie) {
                    callback(error, response, htmlbody,cookie)
                });
            } else if (response.statusCode === 200) {
                    callback('error when login DMM');
            } else {
                callback('error when login DMM');
            }
        }], function (error, response,htmlbody,cookie) {
        if (error) {
            return res.status(500).send(error);
        }
        $ = cheerio.load(htmlbody);
        var link = $('iframe#game_frame').attr('src');
        res.json({
            cookie: cookie,
            url: link
        })
    });
});

module.exports = router;
