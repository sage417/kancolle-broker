(function () {
    function loadIframe(url) {
        if ($("#redirect-r").prop('checked')) {
            window.location.replace(url);
        } else {
            $("iframe").removeClass("hidden").attr("src", url);
            $("form").hide();
            $("footer").hide();
        }
    }

    var localStorageSupport = "localStorage" in window;

    if (localStorageSupport) {
        $("#remember-box").removeClass("hidden");
        var cookie = window.localStorage.getItem('cookie');
        if (cookie) {
            $("#remember").prop('checked', true);
            $.ajax({
                type: "POST",
                url: "login",
                data: {
                    cookie: cookie
                },
                success: function (res) {
                    loadIframe(res.url);
                },
                error: function (type) {
                    alert("Login Failed.");
                    console.log(type);
                    $("#remember").prop('checked', false);
                },
                beforeSend: function () {
                    $(':input').prop('disabled', true);
                },
                complete: function () {
                    $(':input').prop('disabled', false);
                }
            })
        }
        $("#remember").on("change", function (e) {
            var checked = $(e.target).prop('checked');
            if (!checked) {
                window.localStorage.clear();
            }
        });

        var redirect = window.localStorage.getItem('redirect');
        if (redirect == 'redirect' || /Chrome/.test(window.navigator.userAgent)) {
            $("#redirect-r").prop('checked', true);
        } else {
            $("#redirect-i").prop('checked', true);
        }

        $("#redirect-i").on("change", function () {
            window.localStorage.setItem('redirect', 'iframe');
        })
        $("#redirect-r").on("change", function () {
            window.localStorage.setItem('redirect', 'redirect');
        })
    }

    $("form").on("submit", function (e) {
        e.preventDefault();

        //var uname = $("#login_id").val();
        //var pass = $("#password").val();
        //var data = $('form').serialize();
        //var remember = $("#remember").prop('checked') && localStorageSupport;
        $.ajax({
            type: "POST",
            url: "login",
            data: $('form').serialize(),
            dataType:'json',
            cache:false,
            success: function (res, status) {
                if (res.success() === false) {
                    alert(res.message);
                    return;
                }
                if ($("#remember").prop('checked') && localStorageSupport) {
                    window.localStorage.setItem('cookie', res.cookie);
                }
                loadIframe(res.url);
            },
            error: function (XMLHttpRequest , status, error) {
                console.log(status);
                console.log(error);
                alert("Login Failed.");
                $("#remember").prop('checked', false);
            },
            beforeSend: function () {
                $(':input').prop('disabled', true);
            },
            complete: function () {
                $(':input').prop('disabled', false);
            }
        })
    })
})();