$(document).ready(function(){
  $("#menu-toggle").click(function(e){
    e.preventDefault();
    $("#wrapper").toggleClass("menuDisplayed");
    //$("#page-content-wrapper").toggleClass("menuDisplayed");

  });
});
