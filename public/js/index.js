$("#new_room_button").click(function() {
    $.ajax({
        url:"/new_room",
        type: "GET",
        success: function(res) {
            window.location.pathname = res;
        }
   });
});


