"use strict";
function LoadDataFromGallica() {
    var list = new Array();
    $(".notice p strong").each(function (i, e) {
        var record = {
            Name: $(e).text().replace(/[\s|:]+/, ""),
            Value: $(e).parent().clone().children().remove().end().text()
        };
        list.push(record);
    });
    if (list.length > 0) {
        for (n = 0; n < list.length; n++) {
            var record = list[n];
            switch (record.Name) {
                case "Titre":
                    alert(record.Value);
                    break;
            }
        }
    }
}


