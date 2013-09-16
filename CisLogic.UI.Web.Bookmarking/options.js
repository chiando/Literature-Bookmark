function readOption(key, defaultVal) {
    return (key in localStorage) ? localStorage[key] : defaultVal;
}

$(function () {
    $("#TbServer").val(readOption("ServerAddress", "http://www.cislogic.com"));
});