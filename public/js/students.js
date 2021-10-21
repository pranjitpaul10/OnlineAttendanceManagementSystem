$('#submitButton').click( function() {
    const params = new URLSearchParams(window.location.search);
    const info = "id="+params.get('id')+"&name="+$('#name').val()+"&roll="+$('#roll').val();
    $.ajax({
        url: '/addstudent',
        type: 'post',
        dataType: 'json',
        data: info,
        success: function(data,textStatus,xhr) {
                if(xhr.status==201){
                    console.log(data);
                    $('.mess').html('student added');
                    $('.roll_no .table_body').append(`<p class="values">${data.rollno}</p>`);
                    $('.name .table_body').append(`<p class="values">${data.name}</p>`);
                }              
            },
        error : function(e){
            $('.mess').html('Roll number cannot be same');
        }
    });
});

$('#add_click').click(function(){
    $('.add_class').toggleClass("active_add_class");
    if($('.add_class').hasClass("active_add_class"))  $('#add_click').html('x');
    else $('#add_click').html('+');
  })