"use strict"; //
$(function () {
    $("button").button();
    $(".accordion").accordion({ heightStyle: "content" });
    LiteratureManager.LoadTable();
    $(".chzn-select").chosen({ allow_single_deselect: true });
    $(".tabs").tabs();
    $("#BtExportLitList").click(LiteratureManager.ShowExportDialog);
    $("#PopupDownloadFile").dialog({
        title: "Liste exportieren",
        autoOpen: false,
        modal: true,
        closeOnEscape: true,
        buttons: [
            {
                text: "Ok",
                click: function () {
                    LiteratureManager.ExportList($("#TbFileName").val());
                }
            },
            {
                text: "Abbrechen",
                click: function () { $(this).dialog("close"); }
            }]
    });
});



var LiteratureManager = new (function () {

    var that = this;
    var initialized = false;
    var tbUrl = "";
    var tbPageUrl = "";
    var tbTitle = "";
    var tbLastName = "";
    var tbFirstName = "";
    var tbPublisher = "";
    var tbPlaceOfPublishing = "";
    var tbYearOfPublishing = 0;
    var tbAlias = "";
    var tbDate = null;
    var tbCollection = "";
    var tbEdition = "";
    var tbIndexDescriptive = "";
    var tbNarrativePattern = "";
    var tbHeresyComment = "";
    var tbOrthodoxyComment = "";
    var cbParaTextType = null;
    var cbFacFic = null;
    var paraTextTableInitilized = false;
    var literatureTableInitilized = false;

    this.IsGallica = false;
    this.IsArchiveOrg = false;
    this.Record;
    this.URL = "";


    this.LoadTable = function () {
        LiteratureDB.GetBookarkList(LoadLiteratureTable);
    }



    function LoadLiteratureTable(list) {
        var table;
        if (literatureTableInitilized) {
            table = $('#LitTable').dataTable();
            table.fnClearTable();
            table.fnDraw();
            for (var n = 0; n < list.length ; n++) {
                var row = list[n];
                table.fnAddData(row);
            }
        }
        else {
            table = $('#LitTable').dataTable({
                "sDom": "Rlfrtip",
                "aaData": list,
                "aoColumns": [
                    {
                        sTitle: "Aktion", mData: "PubUrl", sClass: "ColURL",
                        mRender: function (data, type, row) {
                            var text = "";
                            if (data != null && data.length > 0) {
                                text = "<a href='" + data + "' target='_blank'>Link</a>";
                                text += "<br/><a href='#' class='aOpenPub' key='" + row.PubId + "'>Öffnen</a>";
                            }
                            text += "<br/><a href='#' class='aDeletePub' key='" + row.PubId + "'>Löschen</a>";
                            if (that.Record != null && row.PubUrl == that.Record.PubUrl) {
                                return "<b>" + text + "</b>";
                            }
                            else {
                                return text;
                            }
                        },
                    },
                    { "sTitle": "Title", "mData": "PubTitle" },
                    { "sTitle": "Nachname", "mData": "PubLastName" },
                    { "sTitle": "Vorname", "mData": "PubFirstName" },
                ]
            });
        }
        $(table.fnGetNodes()).find("a.aDeletePub").click(function (e) {
            var pubId = $(this).attr("key");
            $.msgBox({
                title: "Lesezeichen löschen",
                content: "Wollen Sie das Lesezeichen wirklich löschen?",
                type: "confirm",
                buttons: [{ value: "Ja" }, { value: "Nein" }],
                success: function (list) {
                    if (list == "Ja") {
                        LiteratureDB.DeletePublication(pubId,
                            function () {
                                LiteratureManager.LoadTable();
                            }
                            );
                    }
                }
            });
        });
        $(table.fnGetNodes()).find("a.aOpenPub").click(function (e) {
            var pubId = $(this).attr("key");
            var record = LiteratureDB.GetPublicationRecord();
            record.PubId = pubId;
            FillFormById(record);
            $(".tabs").tabs("option", "active", 0);
        });
        literatureTableInitilized = true;
    }

    this.ExportList = function (fileName) {
        $("#PopupDownloadFile").dialog("close");
        if (fileName.indexOf(".") < 0) {
            fileName += ".csv";
        }
        LiteratureDB.GetExportData(function (result) {
            var blob = new Blob([result], { type: "text/plain;charset=utf-8" });
            saveAs(blob, fileName);
            $.msgBox({
                title: "Dateiexport",
                content: "Die Datei \"" + fileName + "\" wurde im utf-8-Format in das Downloadverzeichnis gespeichert (STR-J um das Verzeichnis zu öffnen)",
                buttons: [{ value: "OK" }]
            });
        })


        
    }

    this.ShowExportDialog = function () {
        $("#PopupDownloadFile").dialog("open");
    }

    function LoadParaTextTable(list) {
        var table;
        if (paraTextTableInitilized) {
            table = $('#ParaTextTable').dataTable();
            table.fnClearTable();
            table.fnDraw();
            for (var n = 0; n < list.length ; n++) {
                var row = list[n];
                table.fnAddData(row);
            }
        }
        else {
            table = $('#ParaTextTable').dataTable({
                "sDom": "Rlfrtip",
                "aaData": list,
                "aoColumns": [
                    {
                        sTitle: "Aktion", mData: "ParUrl", sClass: "ColURL",
                        mRender: function (data, type, row) {
                            var text = "";
                            if (data != null && data.length > 0) {
                                text = "<a href='" + data + "' target='_blank'>Link</a>";
                            }
                            $("#CbParaTextType option:contains('" + row.TtyName + "')").text(row.TtyName + "*");
                            text += "<br/><a href='#' class='aDeletePar' key='" + row.ParId + "'>Löschen</a>";
                            if (that.Record != null && row.ParUrl == that.Record.PubPageUrl) {
                                $("#CbParaTextType").val(row.TtyId).trigger("liszt:updated");
                                return "<b>" + text + "</b>";
                            }
                            else {
                                return text;
                            }
                        },
                    },
                    {
                        sTitle: "Type",
                        mData: "TtyName",
                        mRender: ParaTextRowRenderer
                    },
                    //{ "sTitle": "URL", "mData": "ParUrl" }
                ]
            });
        }
        $(table.fnGetNodes()).find("a.aDeletePar").click(function (e) {
            var parId = $(this).attr("key");
            $.msgBox({
                title: "Lesezeichen löschen",
                content: "Wollen Sie den Paratext wirklich löschen?",
                type: "confirm",
                buttons: [{ value: "Ja" }, { value: "Nein" }],
                success: function (list) {
                    if (list == "Ja") {
                        LiteratureDB.DeleteParaText(parId,
                            function () { LiteratureDB.GetParaTextByPubId(that.Record.PubId, LoadParaTextTable); }
                            );
                    }
                }
            });
        });
        paraTextTableInitilized = true;
    }

    function ParaTextRowRenderer(data, type, row) {
        if (that.Record != null && that.Record.PubPageUrl != null && row.ParUrl == that.Record.PubPageUrl) {
            return "<b>" + data + "</b>";
        }
        else {
            return data;
        }
    }

    this.ReadData = function (html, callback) {
        var record = null;
        if (this.IsGallica) {
            var list = ReadDataFromGallica(html);
            record = GetRecordFromGallica(list);
            FillFormByDocURL(record, callback);
        }
        else if (this.IsArchiveOrg) {
            $.blockUI({ theme: true });
            ReadDataFromArchiveOrg(html, function (result) {
                record = GetRecordFromArchiveOrg(result);
                FillFormByDocURL(record, callback);
                $.unblockUI(); FillCbFacFic
            });
        }
    }

    function FillFormByDocURL(rec, callback) {
        FillForm(rec, LiteratureDB.GetPublicationByDocURL, function (item) { return item.PubUrl }, callback)
    }

    function FillFormById(rec, callback) {
        FillForm(rec, LiteratureDB.GetPublicationById, function (item) { return item.PubId }, callback)
    }

    //Füllt das Hauptformular
    function FillForm(rec, fillAction, idSelector, callback) {
        that.Record = rec;
        if (rec != null && idSelector(rec) != null) {
            fillAction(idSelector(rec), function (record2) {
                if (record2 != null) {
                    that.Record = record2;
                    record2.PubPageUrl = rec.PubPageUrl;
                    ShowData(record2);
                    if (callback != null) {
                        callback(rec);
                    }
                }
                else {
                    that.Record = rec;
                    ShowData(rec);
                }
                FillCbFacFic(that.Record,
                    function () {
                        FillCbExistingSource(that.Record,
                            function () {
                                FillCbParaTextType(that.Record,
                                    function () {
                                        LiteratureDB.GetParaTextByPubId(that.Record.PubId,
                                            function (list) {
                                                LoadParaTextTable(list);
                                                $("#CbParaTextType").trigger("liszt:updated");
                                                if (callback != null) {
                                                    callback(that.Record);
                                                }
                                            }
                                            );
                                    }
                                    );
                            });
                    });


            });
        }
        else {
            FillCbParaTextType(null);
            LoadParaTextTable(null);
        }
    }

    //Füllt das Unterformular "Fundstellen"
    function FillCbExistingSource(record, callback) {
        FillComboBox(
            LiteratureDB.GetBookarkList,
            "#CbExistingSource",
            record,
            function (item) { return item.PubId },
            function (item) { return item.PubTitle },
            function (item, rec) {
                return LiteratureManager.Record != null && item.PubUrl == rec.PubUrl;
            },
            callback
            );
    }

    //Füllt die Combobox Paratext-Typ
    function FillCbParaTextType(record, callback) {
        FillComboBox(
            LiteratureDB.GetTextTypeList,
            "#CbParaTextType",
            record,
            function (item) { return item.TtyId },
            function (item) { return item.TtyName },
            null,
            callback
            );
    }

    //Füllt die Combobox FakFik
    function FillCbFacFic(record, callback) {
        FillComboBox(
            LiteratureDB.GetFacFicList,
            "#CbFacFic",
            record,
            function (item) { return item.FofId },
            function (item) { return item.FofName },
            function (item, rec) {
                return LiteratureManager.Record != null && item.FofId == rec.PubFactualOrFictitious;
            },
            callback
            );
    }


    //Füllt Comboboxen
    function FillComboBox(fillFunction, pattern, record, idSelector, nameSelector, selectionCondition, callback) {
        if (record == null) {
            $(pattern + " option").remove();
        }
        else {
            if (typeof (selectionCondition) == "undefined" || selectionCondition == null || selectionCondition == "") {
                selectionCondition = function () { return false; };
            }
            fillFunction(function (result) {
                result.sort(function (a, b) {
                    if (nameSelector(a) == nameSelector(b)) {
                        return 0;
                    }
                    if (nameSelector(a) > nameSelector(b)) {
                        return 1;
                    }
                    else {
                        return -1;
                    }
                });
                $.map(result, function (item) {
                    if (selectionCondition(item, record)) {
                        $(pattern).append("<option value='" + idSelector(item) + "' selected>" + nameSelector(item) + "</option>");
                    }
                    else {
                        $(pattern).append("<option value='" + idSelector(item) + "'>" + nameSelector(item) + "</option>");
                    }
                    $(pattern).trigger("liszt:updated");
                });
            });
        }
        if (typeof (callback) != "undefined") {
            callback();
        }
    }


    function ReadDataFromArchiveOrg(html, callback) {
        var list = new Array();
        var htmlDom = $(html);
        var adom = $('<div id="body-mock">' + html.replace(/^[\s\S]*<span id="BRreturn".*?>|<\/span>[\s\S]*/g, '') + '</div>');
        var link = adom.find("a").attr("href");
        list.push({
            Name: "DocURL",
            Value: htmlDom.find("#booklink").val()
        });
        list.push({
            Name: "PageURL",
            Value: that.URL
        });
        $("<div></div>").load(link, function (responseText, textStatus, XMLHttpRequest) {
            var arc = $(responseText);
            list.push({
                Name: "Title",
                Value: arc.find("span[class='x-archive-meta-title']").text()
            });
            arc.find("span[class=key]").each(function (i, e) {
                var record = {
                    Name: $(e).text().replace(/[\s|:]+/g, ""),
                    Value: $(e).next().text()
                };
                list.push(record);
            });
            if (typeof (callback) != undefined) {
                callback(list);
            }
        });
    }

    function ReadDataFromGallica(html) {
        var list = new Array();
        var body = ParseDOM(html);
        list.push({
            Name: "DocURL",
            Value: body.find("#PermalinkDoc").val()
        });
        list.push({
            Name: "PageURL",
            Value: body.find("#PermalinkPage").val()
        });
        body.find(".notice p strong").each(function (i, e) {
            var record = {
                Name: $(e).text().replace(/[\s|:]+/g, ""),
                Value: $(e).parent().clone().children().remove().end().text()
            };
            list.push(record);
        });
        return list;
    }

    function ShowData(record) {
        InitVars();
        tbUrl.val(record.PubUrl);
        tbPageUrl.val(record.PubPageUrl);
        tbTitle.val(record.PubTitle);
        tbLastName.val(record.PubLastName);
        tbFirstName.val(record.PubFirstName);
        tbPublisher.val(record.PubPublisher);
        tbPlaceOfPublishing.val(record.PubPlaceOfPublishing);
        tbYearOfPublishing.val(record.PubYearOfPublishing);
        tbAlias.val(record.PubAlias);
        tbCollection.val(record.PubCollection);
        tbEdition.val(record.PubEdition);
        tbIndexDescriptive.val(record.PubIndexDescriptive);
        tbNarrativePattern.val(record.PubNarrativePattern);
        tbOrthodoxyComment.val(record.PubOrthodoxyComment);
        tbHeresyComment.val(record.PubHeresyComment);
        cbFacFic.val(record.PubFactualOrFictitious);
        cbFacFic.trigger("liszt:updated");
        cbParaTextType.val(record.TtyId);
    }

    function GetRecordFromArchiveOrg(list) {
        var dbRec = LiteratureDB.GetPublicationRecord();
        if (list != null && typeof (list.length) != "undefined") {
            if (list.length > 0) {
                for (var n = 0; n < list.length; n++) {
                    var record = list[n];
                    if (record != null) {
                        switch (record.Name) {
                            case "DocURL":
                                dbRec.PubUrl = record.Value;
                            case "PageURL":
                                dbRec.PubPageUrl = record.Value;
                            case "Title":
                                dbRec.PubTitle = record.Value;
                                break;
                            case "Author":
                                {
                                    var name = record.Value;
                                    var pos1 = name.indexOf(" ");
                                    if (pos1 > 0) {
                                        var lastName = name.substr(0, pos1).trim();
                                        var firstName = name.substr(pos1 + 1).trim();
                                        dbRec.PubLastName = lastName;
                                        dbRec.PubFirstName = firstName;
                                    }
                                    else {
                                        dbRec.PubLastName = record.Value;
                                    }
                                    break;
                                }
                            case "Publisher":
                                {
                                    dbRec.PubPublisher = record.Value;
                                    break;
                                }
                            case "Year":
                                dbRec.PubYearOfPublishing = record.Value;
                                break;
                        }
                    }
                }
            }
        }
        return dbRec;
    }


    function GetRecordFromGallica(list) {
        var dbRec = LiteratureDB.GetPublicationRecord();
        if (list != null && typeof (list.length) != "undefined") {
            if (list.length > 0) {
                for (var n = 0; n < list.length; n++) {
                    var record = list[n];
                    if (record != null) {
                        switch (record.Name) {
                            case "DocURL":
                                dbRec.PubUrl = record.Value;
                            case "PageURL":
                                dbRec.PubPageUrl = record.Value;
                            case "Titre":
                                dbRec.PubTitle = record.Value;
                                break;
                            case "Auteur":
                                {
                                    var name = record.Value;
                                    var pos1 = name.indexOf(",");
                                    if (pos1 > 0) {
                                        var lastName = name.substr(0, pos1).trim();
                                        var firstName = name.substr(pos1 + 1).trim();
                                        dbRec.PubFirstName = firstName;
                                        dbRec.PubLastName = lastName;
                                    }
                                    else {
                                        dbRec.PubLastName = record.Value;
                                    }
                                    break;
                                }
                            case "Éditeur":
                                {
                                    var editorAndPlace = record.Value;
                                    var pos1 = editorAndPlace.indexOf("(");
                                    var pos2 = editorAndPlace.indexOf(")");
                                    if (pos1 > 0 && pos2 > pos1) {
                                        var editor = editorAndPlace.substr(0, pos1 - 1);
                                        var place = editorAndPlace.substr(pos1 + 1, pos2 - pos1 - 1);
                                        dbRec.PubPublisher = editor;
                                        dbRec.PubPlaceOfPublishing = place;
                                    }
                                    else {
                                        dbRec.PubPublisher = editorAndPlace;
                                    }
                                    break;
                                }
                            case "Dated'édition":
                                dbRec.PubYearOfPublishing = record.Value;
                                break;
                        }
                    }
                }
            }
        }
        return dbRec;
    }

    function ParseDOM(html) {
        return $('<div id="body-mock">' + html.replace(/^[\s\S]*<body.*?>|<\/body>[\s\S]*$/g, '') + '</div>');
    }


    function InitVars() {
        if (!initialized) {
            tbUrl = $("#TbURL");
            tbPageUrl = $("#TbPageURL");
            tbTitle = $("#TbTitle");
            tbLastName = $("#TbLastName");
            tbFirstName = $("#TbFirstName");
            tbPublisher = $("#TbPublisher");
            tbPlaceOfPublishing = $("#TbPlaceOfPublishing");
            tbYearOfPublishing = $("#TbYearOfPublishing");
            tbAlias = $("#TbAlias");
            tbCollection = $("#TbCollection");
            tbEdition = $("#TbEdition");
            tbIndexDescriptive = $("#TbIndexDescriptive");
            tbNarrativePattern = $("#TbNarrativePattern");
            tbHeresyComment = $("#TbHeresyComment");
            tbOrthodoxyComment = $("#TbOrthodoxyComment");
            cbFacFic = $("#CbFacFic");
            cbParaTextType = $("#CbParaTextType");
        }
    }


    this.SaveBookmark = function (onSuccess) {
        var pubId = $("#CbExistingSource").val();
        var record = LiteratureDB.GetPublicationRecord(
            {
                PubId: pubId,
                PubUrl: tbUrl.val(),
                PubPageUrl: tbPageUrl.val(),
                PubTitle: tbTitle.val(),
                PubFirstName: tbFirstName.val(),
                PubLastName: tbLastName.val(),
                PubPublisher: tbPublisher.val(),
                PubPlaceOfPublishing: tbPlaceOfPublishing.val(),
                PubYearOfPublishing: tbYearOfPublishing.val(),
                PubAlias: tbAlias.val(),
                PubCollection: tbCollection.val(),
                PubEdition: tbEdition.val(),
                PubIndexDescriptive: tbIndexDescriptive.val(),
                PubNarrativePattern: tbNarrativePattern.val(),
                PubHeresyComment: tbHeresyComment.val(),
                PubOrthodoxyComment: tbOrthodoxyComment.val(),
                PubFactualOrFictitious: cbFacFic.val(),
                TtyId: cbParaTextType.val() == "" ? null : JSON.parse(cbParaTextType.val()),
            });
        if (pubId != null && pubId != "") {
            LiteratureDB.UpdateBookmark(record,
                 function () {
                     InsertParaText(
                         record,
                         function () { LiteratureDB.GetParaTextByPubId(that.Record.PubId, LoadParaTextTable); onSuccess(record); }
                         );
                 }
                );
        }
        else {
            LiteratureDB.InsertBookmark(record,
              function () {
                  InsertParaText(
                      record,
                      function () { LiteratureDB.GetParaTextByPubId(that.Record.PubId, LoadParaTextTable); onSuccess(record); }
                      );
              }
             );
        }
    }

    function InsertParaText(record, onSuccess) {
        if (record != null) {
            if (record.PubId != "") {
                if (record.TtyId > 0) {
                    var par = LiteratureDB.GetParaTextRecord();
                    par.PubId = record.PubId;
                    par.TtyId = record.TtyId;
                    par.ParUrl = record.PubPageUrl;
                    LiteratureDB.InsertParaText(par, function () { onSuccess(record); });
                }
                else {
                    onSuccess(record);
                }
            }
            else {
                LiteratureDB.GetPublicationByDocURL(record.PubUrl,
                    function (result) {
                        result.TtyId = record.TtyId;
                        result.PubPageUrl = record.PubPageUrl;
                        InsertParaText(result, onSuccess);
                    });

            }
        }
    }


    this.ReadMetaData = function () {
        chrome.tabs.getSelected(undefined, function (tab) {
            if (tab.url.indexOf("://gallica.bnf.fr") >= 0) {
                that.IsGallica = true;
            }
            else if (tab.url.indexOf("://archive.org/") >= 0) {
                that.IsArchiveOrg = true;
            }
            chrome.tabs.executeScript(tab.id, { file: "page.js" });
            that.URL = tab.url;
        });
    }
})

document.addEventListener('DOMContentLoaded', LiteratureManager.ReadMetaData);
document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#BtnUpdate').addEventListener('click', function () {
        LiteratureManager.SaveBookmark(function () {
            LiteratureManager.LoadTable();
            $.msgBox({
                title: "Lesezeichen",
                content: "Die Daten wurden erfolgreich gespeichert!"
            });
        });

    });
});

chrome.runtime.onMessage.addListener(
       function (request, sender, sendResponse) {
           LiteratureManager.ReadData(request.dom);
       });

