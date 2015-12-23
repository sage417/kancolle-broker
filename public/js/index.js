(function(){
    function loadIframe(url){
        if($("#redirect-r").prop('checked')){
            window.location.replace(url);
        }else{
            $("iframe").removeClass("hidden").attr("src", url);
            $("form").hide();
            $("footer").hide();
        }
    }

    lsSupported = "localStorage" in window;
    if(lsSupported){
        $("#remember-box").removeClass("hidden");
        cookie = window.localStorage.getItem('cookie');
        if(cookie){
            $("#remember").prop('checked', true);
            $.ajax({
                type: "POST",
                url: "login",
                data: {
                    cookie: cookie
                },
                success:function (res) {
                    loadIframe(res.url);
                },
                error:function(type){
                    alert("Login Failed.");
                    console.log(type);
                    $("#remember").prop('checked', false);
                },
                beforeSend:function(){
                    $(':input').prop('disabled', true);
                },
                complete:function(){
                    $(':input').prop('disabled', false);
                }
            })
        }
        $("#remember").on("change", function(e){
            checked = $(e.target).prop('checked');
            if(!checked){
                window.localStorage.clear();
            }
        });

        redirect = window.localStorage.getItem('redirect');
        if(redirect == 'redirect' || /Chrome/.test(window.navigator.userAgent)){
            $("#redirect-r").prop('checked', true);
        }else{
            $("#redirect-i").prop('checked', true);
        }

        $("#redirect-i").on("change", function(){
            window.localStorage.setItem('redirect','iframe');
        })
        $("#redirect-r").on("change", function(){
            window.localStorage.setItem('redirect','redirect');
        })
    }
    $("form").on("submit", function (e) {
        e.preventDefault();

        uname = $("#login_id").val();
        pass = $("#password").val();
        data = $('form').serialize();
        remember = $("#remember").prop('checked') && lsSupported;
        $.ajax({
            type: "POST",
            url: "login",
            data: data,
            success:function (res,status) {
                if(status === 200){
                    if(remember){
                        window.localStorage.setItem('cookie', res.cookie);
                    }
                    loadIframe(res.url);
                }
            },
            error:function(data,status,error){
                console.log(error);
                alert("Login Failed.");
                location.reload();
                //$("#remember").prop('checked', false);
            },
            beforeSend:function(){
                $(':input').prop('disabled', true);
            },
            complete:function(){
                $(':input').prop('disabled', false);
            }
        })
    })
})();