var config = require('../bin/config.json');
var express = require('express');
var router = express.Router();

var validator = require('validator');
var request = require('request');

var cheerio = require('cheerio');
var async = require('async');


var userAgent = config.USER_AGENT;

var requestOptions = {
    followRedirect: false
};

var timeout = config.REQUEST_TIMEOUT;
if (Number.isInteger(timeout)) {
    requestOptions['timeout'] = timeout;
}
if (config.REQUEST_GZIP) {
    requestOptions['gzip'] = true;
}

var defaultRequest = request.defaults(requestOptions);

router.post('/login', function (req, res) {
    var login_id = req.body.login_id + '';

    if (!validator.isEmail(login_id)) {
        return res.send(400);
    }
    var password = req.body.password + '';

    async.waterfall([
        function (callback) {
            defaultRequest(config.DMM_LOGIN_URL, callback);
        },
        function (response, htmlbody, callback) {
            if (response.statusCode === 200) {
                var dmm_token = htmlbody.split(/(['"])DMM_TOKEN\1\s*,\s*"([a-z0-9]{32})"/)[1];
                var post_data = htmlbody.split(/(['"])token\1\s*:\s*"([a-z0-9]{32})"/)[3];

                var $ = cheerio.load(htmlbody);
                var id_token = $('input#id_token').val();

                defaultRequest({
                    url: config.DMM_LOGIN_AJAX_TOKEN_URL,
                    method: 'POST',
                    headers: {
                        'User-Agent': userAgent,
                        'DMM_TOKEN': dmm_token,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    form: {
                        "token": post_data
                    }
                }, callback);
            } else {
                callback('error on visit DMM_LOGIN_URL', response, htmlbody);
            }
        },
        function (response, xhrbody, callback) {
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
            defaultRequest({
                url: config.DMM_AUTH_URL,
                method: 'POST',
                headers: {
                    'User-Agent': userAgent
                },
                form: login_formdata
            }, callback);
        },
        function (response, logindata, callback) {
            if (response.statusCode === 302) {
                var cookie = '';
                response.headers['set-cookie'].forEach(function (cookieString) {
                    cookie += cookieString.split(';')[0] + ';';
                });
                defaultRequest({
                    url: config.KANCOLLE_GAME_URL,
                    headers: {
                        'User-Agent': userAgent,
                        'Cookie': cookie
                    }
                }, callback);
            } else if (response.statusCode === 200) {
                callback('Login Error - Username Or Password InCorrect.', response, logindata);
            } else {
                callback('Login Error - Unknown Reason.', response, logindata);
            }
        }], function (error, response, htmlbody) {
        if (error || response.statusCode !== 200) {
            return res.status(500).send(error || 'Error return Status Code:' + response.statusCode);
        }
        var cookie = response.request.headers['Cookie'];
        var $ = cheerio.load(htmlbody);
        var link = $('iframe#game_frame').attr('src');
        res.json({
            cookie: cookie,
            url: link
        })
    });
});

module.exports = router;
