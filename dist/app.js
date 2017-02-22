"use strict";
var $ = require("jquery");
var pokemon_1 = require("./pokemon");
var Observable_1 = require("rxjs/Observable");
require("rxjs/add/observable/fromEventPattern");
require("rxjs/add/observable/fromEvent");
require("rxjs/add/observable/from");
require("rxjs/add/observable/dom/ajax");
require("rxjs/add/observable/of");
require("rxjs/add/operator/map");
require("rxjs/add/operator/switch");
require("rxjs/add/operator/switchMap");
require("rxjs/add/operator/catch");
require("rxjs/add/operator/startWith");
require("rxjs/add/operator/concat");
require("rxjs/add/operator/filter");
require("rxjs/add/operator/debounceTime");
require("rxjs/add/operator/distinctUntilChanged");
require("rxjs/add/operator/do");
$(document).ready(function () {
    var API_KEY = "dc6zaTOxFJmzC";
    var URL = "http://api.giphy.com/v1/gifs/search?";
    var randomIndex = pokemon_1.default.length - 20 > 0 ? Math.floor(Math.random() * (pokemon_1.default.length - 20)) : 0;
    var selectedPokemons = pokemon_1.default.splice(randomIndex, 20);
    var $buttonsBox = $("#buttons");
    var $images = $("div#images");
    var $pokemonInput = $("input#pokemon-input");
    var $addPokemonBtn = $("button#add-pokemon");
    var $dataList = $("datalist#pokemon-list");
    var pokemonBtnClick$ = Observable_1.Observable
        .fromEventPattern(function (handler) { return $buttonsBox.on("click", ".pokemon-btn", handler); })
        .map(function (ev) { return $(ev.target).text(); })
        .switchMap(function (text) {
        return Observable_1.Observable
            .ajax({
            url: URL + $.param({ "q": text, "api_key": API_KEY, "limit": 10 }),
            method: "GET"
        })
            .map(function (ajaxRes) { return ajaxRes.response.data; });
    });
    var pokemonInput$ = Observable_1.Observable.fromEvent($pokemonInput, "keyup")
        .map(function (ev) { return $(ev.target).val(); })
        .filter(function (text) {
        return text.length >= 3;
    })
        .debounceTime(300)
        .distinctUntilChanged()
        .switchMap(function (text) { return Observable_1.Observable.of(text); });
    var addPokemonClick$ = Observable_1.Observable.fromEvent($addPokemonBtn, "click")
        .map(function () { return $pokemonInput.val(); })
        .filter(function (pokemonName) { return pokemonName.length > 2; })
        .do(function (pokemonName) {
        $pokemonInput.val("");
        pokemonName = pokemonName[0].toUpperCase() + pokemonName.toLowerCase().substring(1);
        var index = pokemon_1.default.indexOf(pokemonName);
        selectedPokemons.push(pokemonName);
        if (index > -1) {
            pokemon_1.default.splice(index, 1);
        }
    });
    var pokemons$ = Observable_1.Observable.from(selectedPokemons)
        .concat(addPokemonClick$);
    var pokemonGifClick$ = Observable_1.Observable
        .fromEventPattern(function (handler) { return $images.on("click", ".pokemon-box", handler); })
        .map(function (ev) { return ({
        isAnimating: $(ev.target).closest(".pokemon-box").find(".pokemon-gif").data("animating"),
        imgElem: $(ev.target).closest(".pokemon-box").find(".pokemon-gif")
    }); });
    pokemons$
        .subscribe(function (pokemon) {
        $("<button>").addClass("pokemon-btn btn btn-primary btn-space").text(pokemon).appendTo($buttonsBox);
    });
    pokemonInput$
        .subscribe(function (inputText) {
        $dataList.empty();
        pokemon_1.default.forEach(function (pokemonName) {
            if (new RegExp("^" + inputText, "i").test(pokemonName)) {
                $dataList.append($("<option>").attr("value", pokemonName));
            }
        });
    });
    pokemonBtnClick$
        .subscribe(function (gifs) {
        $(".pokemon-box").remove();
        gifs.forEach(function (gif) {
            var ribbonColor;
            switch (gif.rating) {
                case "y":
                case "g":
                    ribbonColor = "primary";
                    break;
                case "pg":
                    ribbonColor = "success";
                    break;
                case "pg-13":
                    ribbonColor = "warning";
                    break;
                case "r":
                    ribbonColor = "danger";
                    break;
            }
            $images
                .append($("<div>")
                .addClass("pokemon-box")
                .append($("<div>").addClass("ribbon-wrapper")
                .append($("<div>").addClass("ribbon")
                .addClass(ribbonColor)
                .text("Rating: " + gif.rating)))
                .append($("<img>").addClass("pokemon-gif")
                .attr("src", gif.images.fixed_height_still.url)
                .data("animating", false)
                .data("url", { animating: gif.images.fixed_height.url, still: gif.images.fixed_height_still.url })));
        });
    });
    pokemonGifClick$
        .subscribe(function (obj) {
        if (obj.isAnimating) {
            $(obj.imgElem).attr("src", $(obj.imgElem).data("url").still);
            $(obj.imgElem).data("animating", false);
        }
        else {
            $(obj.imgElem).attr("src", $(obj.imgElem).data("url").animating);
            $(obj.imgElem).data("animating", true);
        }
    });
});
//# sourceMappingURL=app.js.map