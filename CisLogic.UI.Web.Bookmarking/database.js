"use strict";
var LiteratureDB = new (function () {
    var dbname = "LiteratureDB";
    var size = 4 * 1024 * 1024;
    var version = "1.0";
    var that = this;
    var _db = null;
    var textTypeList;

    this.GetPublicationRecord = function GetPublicationRecord(values) {
        var record = {
            PubId: "",
            PubTitle: "",
            PubPageUrl: "",
            PubUrl: "",
            PubFirstName: "",
            PubLastName: "",
            PubPublisher: "",
            PubPlaceOfPublishing: "",
            PubYearOfPublishing: null,
            PubAlias: "",
            PubDate: null,
            PubCollection: "",
            PubEdition: "",
            PubIndexDescriptive: "",
            PubNarrativePattern: "",
            PubFactualOrFictitious: null,
            PubHeresyComment: "",
            PubOrthodoxyComment: "",
            IsGallica: function () {
                if (this.PubUrl != null && this.PubUrl.indexOf("://gallica.bnf.fr") >= 0) {
                    return true;
                }
                else {
                    return false;
                }
            },
            IsArchiveOrg: function () {
                if (this.PubUrl != null && this.PubUrl.indexOf("://archive.org/") >= 0) {
                    return true;
                }
                else {
                    return false;
                }
            },
            GetKey: function () {
                if (this.IsGallica()) {
                    var pos = this.PubUrl.lastIndexOf("/");
                    if (pos > 0) {
                        return this.PubUrl.substr(0, pos);
                    }
                    else {
                        return this.PubUrl;
                    }
                }
                else if (this.IsArchiveOrg()) {
                    var pos = this.PubUrl.indexOf("#");
                    if (pos > 0) {
                        return this.PubUrl.substr(0, pos);
                    }
                    else {
                        return this.PubUrl;
                    }
                }
                else {
                    return this.PubUrl;
                }
            }
        }
        return $.extend(record, values);
    }

    this.GetPublicationList = function GetPublicationList(callback) {
        GetTable("Publication", null, null, that.GetPublicationRecord, null, callback, false);
    }

    this.GetParaTextList = function GetParaTextList(callback) {
        GetTable("ParaText", null, null, that.GetParaTextRecord, null, callback, false);
    }

    this.GetExportTables = function GetExportTables(callback) {
        that.GetTextTypeList(function (textTypes) {
            that.GetPublicationList(function (publications) {
                that.GetParaTextList(function (paraTextList) {
                    that.GetFacFicList(function (facFicList) {
                        callback(publications, paraTextList, textTypes, facFicList);
                    })
                })
            })
        });
    }

    this.GetExportData = function GetExportData(callback) {
        that.GetExportTables(function (pubList, parList, ttyList, facFicList) {
            ProcessExportData(callback, pubList, parList, ttyList, facFicList);
        });
    }

    function ProcessExportData(callback, pubList, parList, ttyList, facFicList) {
        var result = "";
        var rowCount = 0;
        result += ParseTextColumn("Name");
        result += ParseTextColumn("Vorname");
        result += ParseTextColumn("Pseudonym");
        result += ParseTextColumn("Titel");
        result += ParseTextColumn("Sammlung");
        result += ParseTextColumn("Auflage");
        result += ParseTextColumn("Verlagsort");
        result += ParseTextColumn("Verlag");
        result += ParseTextColumn("Publikationsjahr");
        result += ParseTextColumn("FakFik");
        result += ParseTextColumn("Gliederung deskriptiv");
        result += ParseTextColumn("Erzählmuster");
        result += ParseTextColumn("Orthodoxie");
        result += ParseTextColumn("Häresie");
        for (var n = 0; n < ttyList.length; n++) {
            result += ParseTextColumn(ttyList[n].TtyName);
        }
        for (var n = 0; n < pubList.length; n++) {
            rowCount++;
            result += "\n";
            result += ParseTextColumn(pubList[n].PubLastName);
            result += ParseTextColumn(pubList[n].PubFirstName);
            result += ParseTextColumn(pubList[n].PubAlias);
            result += ParseTextColumn(pubList[n].PubTitle);
            result += ParseTextColumn(pubList[n].PubCollection);
            result += ParseTextColumn(pubList[n].PubEdition);
            result += ParseTextColumn(pubList[n].PubPlaceOfPublishing);
            result += ParseTextColumn(pubList[n].PubPublisher);
            result += ParseTextColumn(pubList[n].PubYearOfPublishing);
            result += ParseTextColumn(ParseFacFic(pubList[n].PubFactualOrFictitious, facFicList));
            result += ParseTextColumn(pubList[n].PubIndexDescriptive);
            result += ParseTextColumn(pubList[n].PubNarrativePattern);
            result += ParseTextColumn(pubList[n].PubOrthodoxyComment);
            result += ParseTextColumn(pubList[n].PubHeresyComment);
            var parRecords = FilterParListByPubId(parList, pubList[n].PubId);
            for (var m = 0; m < ttyList.length; m++) {
                result += ParseColumn(CheckIfHasTextType(parRecords, ttyList[m].TtyId));
            }
        }
        callback(result);
    }

    function CheckIfHasTextType(parRecords, ttyId) {
        var result = 0;
        for (var n = 0; n < parRecords.length; n++) {
            if (parRecords[n].TtyId == ttyId) {
                result++;
            }
        }
        if (result > 0) {
            return "" + result;
        }
        else {
            return "";
        }
    }

    function FilterParListByPubId(parList, pubId) {
        var result = new Array();
        for (var n = 0; n < parList.length; n++) {
            if (parList[n].PubId == pubId) {
                result.push(parList[n]);
            }
        }
        return result;
    }

    function FilterParListByTtyId(parList, ttyId) {
        var result = new Array();
        for (var n = 0; n < parList.length; n++) {
            if (parList[n].TtyId == ttyId) {
                result.push(parList[n]);
            }
        }
        return result;
    }

    function ParseFacFic(id, facFicList) {
        for (var n = 0 ; n < facFicList.length; n++) {
            if (facFicList[n].FofId == id) {
                return facFicList[n].FofName;
            }
        }
        return "";
    }

    function ParseColumn(text) {
        if (text != null) {
            //text = text.replace(/;/, ",");
            text = text.replace(/\n/g, " ");
            text = text.replace(/\r/g, " ");
        }
        text += ";";
        return text;
    }

    function ParseTextColumn(text) {
        if (text != null) {
            //text = text.replace(/;/, ",");
            text = text.replace(/\n/g, " ");
            text = text.replace(/\r/g, " ");
            text = text.replace(/"/g, "'");
        }
        return "\"" + text + "\";";
    }


    this.GetTextTypeRecord = function GetTextTypeRecord(values) {
        var record = {
            TtyId: 0,
            TtyName: ""
        }
        return $.extend(record, values);
    }

    this.GetFacFicRecord = function GetFacFicRecord(values) {
        var record = {
            FofId: 0,
            FofName: ""
        }
        return $.extend(record, values);
    }

    this.GetParaTextRecord = function GetParaTextRecord(values) {
        var record = {
            ParId: null,
            PubId: null,
            TtyId: null,
            ParUrl: null,
            TtyName: ""
        }
        return $.extend(record, values);
    }

    this.GetDB = DB;


    function DB() {
        if (_db == null) {
            _db = openDatabase(dbname, "", 'Literature DB', size);
            that.PatchDB(_db);
        }
        return _db;
    }

    this.PatchDB = function (db) {
        var curVersion = db.version == "" ? 0 : JSON.parse(db.version);
        var lastVersion = curVersion;
        var newPatches = new Array();
        for (var n = 0 ; n < DBPatches.length; n++) {
            var patch = DBPatches[n];
            var version = patch.Version;
            if (lastVersion < version) {
                lastVersion = version;
            }
            if (patch.Version > curVersion) {
                newPatches.push(patch);
            }
        }
        DoNextPatch(db, newPatches);
    }

    function DoNextPatch(db, patches) {
        var curVersion = db.version == "" ? 0 : JSON.parse(db.version);
        if (patches.length > 0) {
            var patch = patches[0];
            db.transaction(function (tx) {
                tx.executeSql(patch.Patch,
                    [],
                    function (trans, results) {
                        if (curVersion < patch.Version) {
                            db.changeVersion(db.version, patch.Version);
                            console.log("Changed DB-Version from " + curVersion + " to " + patch.Version);
                        }
                        patches.shift();
                        DoNextPatch(db, patches);
                    },
                    function (trans, error) {
                        ErrorHandler(trans, error, "Error while processing db-patch " + patch.Version);
                    });
            });
        }
    }

    this.InsertBookmark = function (values, onSuccess) {
        var record = this.GetPublicationRecord(values);
        DB().transaction(function (tx) {
            tx.executeSql("INSERT INTO Publication (PubId, PubKey, PubFirstName, PubLastName, PubUrl, PubTitle, PubPublisher, PubPlaceOfPublishing, \
                PubYearOfPublishing, PubAlias, PubDate, PubCollection, PubEdition, PubIndexDescriptive, PubNarrativePattern, PubFactualOrFictitious, PubHeresyComment, PubOrthodoxyComment) \
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                [UUID().toString(), record.GetKey(), record.PubFirstName, record.PubLastName, record.PubUrl, record.PubTitle,
                record.PubPublisher, record.PubPlaceOfPublishing, record.PubYearOfPublishing, record.PubAlias, (new Date()).toJSON(),
                record.PubCollection, record.PubEdition, record.PubIndexDescriptive, record.PubNarrativePattern, record.PubFactualOrFictitious,
                record.PubHeresyComment, record.PubOrthodoxyComment],
                onSuccess,
                function (trans, error) { ErrorHandler(trans, error, "Error while inserting record in Publication") })
        });
    };

    this.UpdateBookmark = function (values, onSuccess) {
        var record = this.GetPublicationRecord(values);
        var date = (new Date()).toJSON();
        DB().transaction(function (tx) {
            tx.executeSql("UPDATE Publication SET PubFirstName = ?, PubLastName = ?, PubUrl = ?, PubTitle = ?, PubPublisher = ?, PubPlaceOfPublishing = ?, PubYearOfPublishing = ?, PubAlias = ?, PubChangedOn = ?, \
                PubCollection = ?, PubEdition = ?, PubIndexDescriptive = ?, PubNarrativePattern = ?, PubFactualOrFictitious = ?, PubHeresyComment = ?, PubOrthodoxyComment = ? WHERE PubId = ?",
                [record.PubFirstName, record.PubLastName, record.PubUrl, record.PubTitle,
                record.PubPublisher, record.PubPlaceOfPublishing, record.PubYearOfPublishing, record.PubAlias, date,
                record.PubCollection, record.PubEdition, record.PubIndexDescriptive, record.PubNarrativePattern, record.PubFactualOrFictitious, record.PubHeresyComment, record.PubOrthodoxyComment,
                record.PubId],
                onSuccess,
                function (trans, error) { ErrorHandler(trans, error, "Error while updating record in Publication") });
        });
    };

    this.InsertParaText = function (values, onSuccess) {
        var record = this.GetParaTextRecord(values);
        DB().transaction(function (tx) {
            tx.executeSql("INSERT INTO ParaText (ParId, TtyId, PubId, ParUrl) VALUES(?,?,?,?)",
                [UUID().toString(), record.TtyId, record.PubId, record.ParUrl],
                onSuccess,
                function (trans, error) { ErrorHandler(trans, error, "Error while inserting record in ParaText") });
        });
    };



    function ErrorHandler(transaction, error, message) {
        alert("Error processing SQL: " + error + "\r\n" + message);
        return true;
    }

    function NullDataHandler(transaction, results) { }


    function UUID() {
        var uuid = (function () {
            var i,
                c = "89ab",
                u = [];
            for (i = 0; i < 36; i += 1) {
                u[i] = (Math.random() * 16 | 0).toString(16);
            }
            u[8] = u[13] = u[18] = u[23] = "-";
            u[14] = "4";
            u[19] = c.charAt(Math.random() * 4 | 0);
            return u.join("");
        })();
        return {
            toString: function () {
                return uuid;
            },
            valueOf: function () {
                return uuid;
            }
        };
    }

    this.DeletePublication = function (key, callback) {
        DB().transaction(function (tx) {
            tx.executeSql('DELETE FROM Publication WHERE PubId=?',
                [key],
                function (tx, results) {
                    callback(tx, results);
                },
                ErrorHandler
                );
        })
    }

    this.DeleteParaText = function (key, callback) {
        DB().transaction(function (tx) {
            tx.executeSql('DELETE FROM ParaText WHERE ParId=?',
                [key],
                function (tx, results) {
                    callback(tx, results);
                },
                ErrorHandler
                );
        })
    }
    this.GetBookarkList = function (callback) {
        DB().transaction(function (tx) {
            tx.executeSql('SELECT * FROM Publication',
                [],
                function (tx, results) {
                    var len = results.rows.length;
                    var recordSet = new Array();
                    for (var i = 0; i < len; i++) {
                        var record = results.rows.item(i);
                        var rec = that.GetPublicationRecord(record);
                        recordSet.push(rec);
                    }
                    if (typeof (callback) != "undefined") {
                        callback(recordSet);
                    }
                },
                function (trans, error) {
                    ErrorHandler(trans, error, "SQL-Error in GetBookarkList");
                }
           );
        });
    }


    this.GetPublicationByDocURL = function (docUrl, callback) {
        GetTable("Publication", " PubURL = ?", [docUrl], that.GetPublicationRecord, null, callback, true);
    }

    this.GetPublicationById = function (pubId, callback) {
        GetTable("Publication", " PubId = ?", [pubId], that.GetPublicationRecord, null, callback, true);
    }

    this.GetParaTextByPubId = function (pubId, callback) {
        if (pubId == "") {
            pubId = "0";
        }
        GetTable("ParaText",
            "PubId = ?",
            [pubId],
            that.GetParaTextRecord,
            BindTextType,
            callback);
    }

    this.GetParaTextByPubIdAndUrl = function (pubId, url, callback) {
        GetTable("ParaText",
            "PubId = ? AND ParUrl = ?",
            [pubId, url],
            that.GetParaTextRecord,
            BindTextType,
            callback);
    }

    function BindTextType(result) {
        if (result != null && result.length != null) {
            for (var n = 0 ; n < result.length; n++) {
                var row = result[n];
                row.TtyName = GetTtyNameById(row.TtyId);
            }
        }
    };

    function GetTtyNameById(ttyId) {
        for (var n = 0; n < textTypeList.length; n++) {
            var item = textTypeList[n];
            if (item.TtyId == ttyId) {
                return item.TtyName;
            }
        }
        return "";
    }

    this.GetTextTypeList = function (callback) {
        if (textTypeList == null) {
            GetTable("TextType",
                null,
                [],
                that.GetTextTypeRecord,
                function (result) {
                    textTypeList = result;
                    callback(result);
                });
        }
        else {
            callback(textTypeList);
            return textTypeList;
        }
    }

    this.GetFacFicList = function (callback) {
        GetTable("FactualOrFictitious", null, [], that.GetFacFicRecord, null, callback);
    }

    function GetTable(tableName, condition, args, getRecord, bindingCallback, callback, singleRecord) {
        if (condition != null && condition.length > 0) {
            condition = " WHERE " + condition;
        }
        else {
            condition = "";
        }

        DB().transaction(function (tx) {
            tx.executeSql("SELECT * FROM " + tableName + condition, args, function (tx, results) {
                var len = results.rows.length;
                var recordSet = new Array();
                for (var i = 0; i < len; i++) {
                    var record = results.rows.item(i);
                    var rec = getRecord(record);
                    recordSet.push(rec);
                }
                if (typeof (bindingCallback) != "undefined" && bindingCallback != null) {
                    if (singleRecord) {
                        if (recordSet.length > 0) {
                            bindingCallback(recordSet[0]);
                        }
                        else {
                            bindingCallback(null);
                        }
                    }
                    else {
                        bindingCallback(recordSet);
                    }
                }
                if (typeof (callback) != "undefined" && callback != null) {
                    if (singleRecord) {
                        if (recordSet.length > 0) {
                            callback(recordSet[0]);
                        }
                        else {
                            callback(null);
                        }
                    }
                    else {
                        callback(recordSet);
                    }
                }
            },
            function (trans, error) {
                ErrorHandler(trans, error, "SQL-Error while getting data for " + tableName);
            });
        });
    }

})();



var DBPatches = [
    {
        Version: 1.00,
        Patch: "CREATE TABLE IF NOT EXISTS Publication (PubId unique, PubKey, PubFirstName, PubLastName, PubUrl, PubTitle, PubPublisher, PubPlaceOfPublishing, PubYearOfPublishing, PubHeresy, PubHeresyComment, PubOrthodoxy, PubOrthodoxyComment, PubIndexDescriptive, PubFactualOrFictitious)"
    },
    {
        Version: 1.01,
        Patch: "CREATE TABLE IF NOT EXISTS TextType (TtyId unique, TtyName)"
    },
    {
        Version: 1.02,
        Patch: "CREATE TABLE IF NOT EXISTS ParaText (ParId unique, TtyId, PubId)"
    },
    {
        Version: 1.03,
        Patch: "INSERT INTO TextType (TtyId,TtyName) VALUES (1,'Widmung')"
    },
    {
        Version: 1.03,
        Patch: "INSERT INTO TextType(TtyId,TtyName) VALUES (2, 'Motto')"
    },
    {
        Version: 1.03,
        Patch: "INSERT INTO TextType(TtyId,TtyName) VALUES (3, 'Vorwort')"
    },
    {
        Version: 1.03,
        Patch: "INSERT INTO TextType(TtyId,TtyName) VALUES(4, 'Zwischentitel')"
    },
    {
        Version: 1.03,
        Patch: "INSERT INTO TextType(TtyId,TtyName) VALUES(5, 'Zitat')"
    },
    {
        Version: 1.03,
        Patch: "INSERT INTO TextType(TtyId,TtyName) VALUES(6, 'Anmerkung')"
    },
    {
        Version: 1.03,
        Patch: "INSERT INTO TextType(TtyId,TtyName) VALUES(7, 'Nachwort')"
    },
    {
        Version: 1.03,
        Patch: "INSERT INTO TextType(TtyId,TtyName) VALUES(8, 'Anhang Dokument')"
    },
    {
        Version: 1.03,
        Patch: "INSERT INTO TextType(TtyId,TtyName) VALUES(9, 'Anhange Quelle')"
    },
    {
        Version: 1.03,
        Patch: "INSERT INTO TextType(TtyId,TtyName) VALUES(10, 'Epitext')"
    },
    {
        Version: 1.03,
        Patch: "INSERT INTO TextType(TtyId,TtyName) VALUES(12, 'Erzählerposition untergeordnet')"
    },
    {
        Version: 1.03,
        Patch: "INSERT INTO TextType(TtyId,TtyName) VALUES(13, 'Gliederung Inhalt')"
    },
    {
        Version: 1.04,
        Patch: "ALTER TABLE ParaText ADD ParUrl"
    },
    {
        Version: 1.06,
        Patch: "CREATE TABLE FactualOrFictitious (FofId unique, FofName)"
    },
    {
        Version: 1.07,
        Patch: "INSERT INTO FactualOrFictitious (FofId, FofName) VALUES (1, 'Faktisch')"
    },
    {
        Version: 1.07,
        Patch: "INSERT INTO FactualOrFictitious (FofId, FofName) VALUES (2, 'Fiktiv')"
    },
    {
        Version: 1.08,
        Patch: "INSERT INTO TextType(TtyId,TtyName) VALUES(14, 'Erzählerposition dominant')"
    },
    {
        Version: 1.09,
        Patch: "ALTER TABLE Publication ADD PubAlias"
    },
    {
        Version: 1.10,
        Patch: "ALTER TABLE Publication ADD PubCollection"
    },
    {
        Version: 1.11,
        Patch: "ALTER TABLE Publication ADD PubDate"
    },
    {
        Version: 1.12,
        Patch: "ALTER TABLE Publication ADD PubEdition"
    },
    {
        Version: 1.13,
        Patch: "ALTER TABLE Publication ADD PubNarrativePattern"
    },
    {
        Version: 1.14,
        Patch: "ALTER TABLE Publication ADD PubChangedOn"
    },
    {
        Version: 1.15,
        Patch: "INSERT INTO FactualOrFictitious (FofId, FofName) VALUES (3, 'Hybrid')"
    },
    {
        Version: 1.16,
        Patch: "UPDATE FactualOrFictitious SET FofName = 'Historie' WHERE FofId = 1"
    },
    {
        Version: 1.17,
        Patch: "UPDATE FactualOrFictitious SET FofName = 'Fiktion' WHERE FofId = 2"
    },
    {
        Version: 1.18,
        Patch: "INSERT INTO TextType(TtyId,TtyName) SELECT 1,'Widmung' WHERE NOT EXISTS (SELECT 1 FROM TextType WHERE TtyId = 1)"
    },
    {
        Version: 1.19,
        Patch: "INSERT INTO TextType(TtyId,TtyName) SELECT 2, 'Motto' WHERE NOT EXISTS (SELECT 1 FROM TextType WHERE TtyId = 2)"
    },
    {
        Version: 1.20,
        Patch: "INSERT INTO TextType(TtyId,TtyName) SELECT 3, 'Vorwort' WHERE NOT EXISTS (SELECT 1 FROM TextType WHERE TtyId = 3)"
    },
    {
        Version: 1.21,
        Patch: "INSERT INTO TextType(TtyId,TtyName) SELECT 4, 'Zwischentitel' WHERE NOT EXISTS (SELECT 1 FROM TextType WHERE TtyId = 4)"
    },
    {
        Version: 1.22,
        Patch: "INSERT INTO TextType(TtyId,TtyName) SELECT 5, 'Zitat' WHERE NOT EXISTS (SELECT 1 FROM TextType WHERE TtyId = 5)"
    },
    {
        Version: 1.23,
        Patch: "INSERT INTO TextType(TtyId,TtyName) SELECT 6, 'Anmerkung' WHERE NOT EXISTS (SELECT 1 FROM TextType WHERE TtyId = 6)"
    },
    {
        Version: 1.24,
        Patch: "INSERT INTO TextType(TtyId,TtyName) SELECT 7, 'Nachwort' WHERE NOT EXISTS (SELECT 1 FROM TextType WHERE TtyId = 7)"
    },
    {
        Version: 1.25,
        Patch: "INSERT INTO TextType(TtyId,TtyName) SELECT 8, 'Anhang Dokument' WHERE NOT EXISTS (SELECT 1 FROM TextType WHERE TtyId = 8)"
    },
    {
        Version: 1.26,
        Patch: "INSERT INTO TextType(TtyId,TtyName) SELECT 9, 'Anhange Quelle' WHERE NOT EXISTS (SELECT 1 FROM TextType WHERE TtyId = 9)"
    },
    {
        Version: 1.27,
        Patch: "INSERT INTO TextType(TtyId,TtyName) SELECT 10, 'Epitext' WHERE NOT EXISTS (SELECT 1 FROM TextType WHERE TtyId = 10)"
    },
    {
        Version: 1.28,
        Patch: "INSERT INTO TextType(TtyId,TtyName) SELECT 12, 'Erzählerposition untergeordnet' WHERE NOT EXISTS (SELECT 1 FROM TextType WHERE TtyId = 12)"
    },
    {
        Version: 1.29,
        Patch: "INSERT INTO TextType(TtyId,TtyName) SELECT 13, 'Gliederung Inhalt' WHERE NOT EXISTS (SELECT 1 FROM TextType WHERE TtyId = 13)"
    },
    {
        Version: 1.30,
        Patch: "ALTER TABLE Publication ADD PubTemp"
    },
    {
        Version: 1.31,
        Patch: "UPDATE Publication SET PubTemp = PubHeresyComment"
    },
    {
        Version: 1.32,
        Patch: "UPDATE Publication SET PubHeresyComment = PubOrthodoxyComment"
    },
    {
        Version: 1.33,
        Patch: "UPDATE Publication SET PubOrthodoxyComment = PubTemp"
    }
]