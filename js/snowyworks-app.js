/*
  SNOWYWORKS.COM
  Drew D. Lenhart

  JS functions

*/

function loadComicCatalog(resultsDiv = "results", debug = false, loader){
  let stagingArea = $("#" + resultsDiv);
  let turnOffLoader = $("#" + loader);

  var ts = new Date().getTime();
  var data = {_: ts};

  turnOffLoader.hide();

  $.getJSON('data/comic-data.json', function(data) {
    if(debug) { console.log(Object.keys(data).length); }
    $.each(data, function(key, value) {
      let content = '';
      if(debug) { console.log("Title: " + value.title); }
      if(debug) { console.log("ID: " + value.id); }

      content += "<div class=\"col-md-3 text-center\">";
      content += "<img src=\"images/" + value.image + "\" alt=\"\" class=\"compImg shadowImg\" /><br />";
      content += "<button class=\"btn btn-primary btn-spacing open-comicDialog\" data-title=\"" + value.title + "\" data-id=\"" + value.id + "\" data-toggle=\"modal\" data-target=\"#fsModal\">" + value.label + "</button>";
      content += "</div>";
      stagingArea.append(content);
    });
  });
}
