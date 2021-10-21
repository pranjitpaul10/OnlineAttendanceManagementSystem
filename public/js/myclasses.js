function subform(param){
    postdata("/mystudents",{name : param});
}
function postdata(path, params, method = 'post') {
    const form = document.createElement('form');
    form.method = method;
    form.action = path;

    for (const key in params) {
        if (params.hasOwnProperty(key)) {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = key;
            hiddenField.value = params[key];

            form.appendChild(hiddenField);
        }
    }

    document.body.appendChild(form);
    form.submit();
}
$('#add_click').click(function(){
  $('.add_class').toggleClass("active_add_class");
  if($('.add_class').hasClass("active_add_class"))  $('#add_click').html('x');
  else $('#add_click').html('+');
})
$('#form').submit( function(e) {
    e.preventDefault();
    var form = $(this);
    var url = form.attr('action');
    $.ajax({
        url: '/addclass',
        type: 'POST',
        data: form.serialize(),
        success: function(data,textStatus,xhr) {
                if(xhr.status==201){
                    console.log(data);
                    $('.row').append(`<div class="class_card"><h2 class="key">${data.classname}</h2><p class="value">Total Students = 20 <br><a class="btn btn-light" style="font-size: 1.3rem;" href="/myclasses/class?id=${data.ind}">Show Students list</a></p></div>`)
                }              
            },
        error : function(e){
            console.log(e);
        }
    });
});