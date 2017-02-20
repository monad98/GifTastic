"use strict";
var Observable_1 = require("rxjs/Observable");
var $ = require("jquery");
require("rxjs/add/observable/fromEventPattern");
require("rxjs/add/observable/fromEvent");
require("rxjs/add/operator/map");
$(document).ready(function () {
    var btnClick = Observable_1.Observable.fromEventPattern(function (handler) { return $("body").on("click", ".animal-btn", handler); });
    var addAnimal = Observable_1.Observable
        .fromEvent($("#add-animal"), "click")
        .map(function () { return $("input#animal-input").val(); });
    btnClick.subscribe(function () {
        console.log("clicked!");
    });
});
//# sourceMappingURL=app.js.map