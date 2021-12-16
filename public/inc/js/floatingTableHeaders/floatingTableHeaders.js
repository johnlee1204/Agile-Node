//Requires jQuery
//TODO: Update to support just sending it a table. Have the jquery do all the magic of splitting out the table headers.


function initFloatingTableHeaders(navTableId,tableId){
    var nav = $('#'+navTableId);
    var mainTable = $("#"+tableId);

    var startingNavHeight = nav.position().top;

    checkToStickyNav();
    adjustNavWidths();
    $(window).scroll(function(){
        checkToStickyNav();
    });
    $( window ).resize(function(){
        adjustNavWidths();
    });


    function adjustNavWidths(){
        nav.css('width',mainTable.css('width'));

        var headColumns = nav.find("tr:first").children();
        var dataColumns = mainTable.find("tr:first").children();

        for(var i=0,il=headColumns.length;i<il;i++){

            $(headColumns[i]).css('width',$(dataColumns[i]).css('width'));
        }

        //console.log(headColumns);
        //console.log(dataColumns);

    }

    function checkToStickyNav(){
        if ($(window).scrollTop() > startingNavHeight) {
            nav.addClass("floatingTableHeader");
            nav.css('top',$(window).scrollTop());
        } else {
            nav.removeClass("floatingTableHeader");
        }
    }
}