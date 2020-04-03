//jshint esversion: 9

$(document).ready(function() {

  $('.dark-theme-toggle-holder').on('click', function() {
    var darkThemeId = "dark-theme-stylesheets";
    var footer = document.querySelectorAll("body")[0];
    var link = document.createElement('link');
    link.id = darkThemeId;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = '/css/dark-theme.css';
    link.media = 'all';
    if ($(this).hasClass('on')) {
      $(this).toggleClass('on');
      $(this).toggleClass('off');
      let darkThemeStylesheet = document.getElementById(darkThemeId);
      darkThemeStylesheet.parentNode.removeChild(darkThemeStylesheet);
    } else if ($(this).hasClass('off')) {
      $(this).toggleClass('on');
      $(this).toggleClass('off');
      if (!document.getElementById(darkThemeId)){
        footer.appendChild(link);
      }
    } else {
      $(this).addClass('on');
    }
  });

  console.log(localStorage.getItem('sidenavExpanded'));
  console.log(localStorage.getItem("sidenavExpanded") != undefined);
  if(localStorage.getItem("sidenavExpanded") != undefined){
    let oppositeValue;
    if(localStorage.getItem('sidenavExpanded') == 'true'){
      oppositeValue = 'false';
    } else {
      oppositeValue = 'true';
    }
    localStorage.removeItem('sidenavExpanded');
    localStorage.setItem('sidenavExpanded', oppositeValue);
  } else {
    localStorage.setItem("sidenavExpanded", false);
  }
  function toggleSidenav(){
      if(localStorage.getItem("sidenavExpanded") == "true"){
        $(".sidenav").css("width", "4%");
        $(".home-content").css("width", "96%");
        $(".sidebar-text").css("display", "none");
        $(".sidenav-option").css("text-align", "center");
        $(".sidebar-collapse-btn").removeClass("fa-arrow-left");
        $(".sidebar-collapse-btn").addClass("fa-arrow-right");
        localStorage.removeItem('sidenavExpanded');
        localStorage.setItem('sidenavExpanded', false);
      } else {
        $(".sidenav").css("width", "");
        $(".home-content").css("width", "");
        $(".sidebar-text").css("display", "");
        $(".sidenav-option").css("text-align", "");
        $(".sidebar-collapse-btn").removeClass("fa-arrow-right");
        $(".sidebar-collapse-btn").addClass("fa-arrow-left");
        localStorage.removeItem('sidenavExpanded');
        localStorage.setItem('sidenavExpanded', true);
      }
  }
  toggleSidenav();
  $(".sidebar-collapse-btn-div").on('click', function(){
    toggleSidenav();
    // alert(localStorage.sidenavExpanded);
  });

});
