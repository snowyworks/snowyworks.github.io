/*
  SNOWYWORKS.COM
  Drew D. Lenhart

  JS functions

*/

function loadComicCatalog(resultsDiv = "results", debug = false, loader, type){
  let stagingArea = $("#" + resultsDiv);
  let turnOffLoader = $("#" + loader);

  const catalogueConfig = {
    full: {
      catalogueFile: "../data/comic-data-full.json",
      imagePath: "../images/"
    },
    books: {
      catalogueFile: "data/comic-data-books.json",
      imagePath: "images/"
    },
    default: {
      catalogueFile: "data/comic-data-home.json",
      imagePath: "images/"
    }
  };

  const config = catalogueConfig[type] || catalogueConfig.default;
  const { catalogueFile, imagePath } = config;

  var ts = new Date().getTime();
  var data = {_: ts};

  turnOffLoader.hide();

  $.getJSON(catalogueFile, function(data) {
    if(debug) { console.log(Object.keys(data).length); }
    $.each(data, function(key, value) {
      let content = '';
      if(debug) { console.log("Title: " + value.title); }
      if(debug) { console.log("ID: " + value.id); }

      content += "<div class=\"col-md-3 text-center\">";
      content += "<a href=\"\" class=\"open-comicDialog\" data-title=\"" + value.title + "\" data-id=\"" + value.id + "\" data-toggle=\"modal\" data-target=\"#fsModal\">";
      content += "<img src=\"" + imagePath + value.image + "\" alt=\"\" class=\"compImg shadowImg\" />";
      content += "</a><br />";
      content += "<button class=\"btn btn-primary btn-spacing open-comicDialog\" data-title=\"" + value.title + "\" data-id=\"" + value.id + "\" data-toggle=\"modal\" data-target=\"#fsModal\">" + value.label + "</button>";
      content += "</div>";
      stagingArea.append(content);
    });
  });
}
