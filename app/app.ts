import * as $ from "jquery";
import topics from "./pokemon"
import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/fromEventPattern";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/observable/from";
import "rxjs/add/observable/dom/ajax";
import "rxjs/add/observable/of";
import "rxjs/add/operator/map";
import "rxjs/add/operator/switch";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/catch";
import "rxjs/add/operator/startWith";
import "rxjs/add/operator/concat";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/do";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/share";

interface Handler {
  (eventObject: JQueryEventObject, ...args: any[]): any;
}
interface Gif {
  rating: string;
  images: {
    fixed_height: {
      url: string
    },
    fixed_height_still: {
      url: string
    }
  }
}

$(document).ready(() => {
  const API_KEY = "dc6zaTOxFJmzC";
  const URL = "https://api.giphy.com/v1/gifs/search?";

  const randomIndex = topics.length - 20 > 0 ? Math.floor(Math.random() * (topics.length - 20)) : 0;
  const selectedPokemons = topics.splice(randomIndex, 20); // select 20 random pokemons

  /**
   * jQuery object (prepended $ in front of each variable name)
   */
  const $buttonsBox = $("#buttons");
  const $images = $("div#images");
  const $pokemonInput = $("input#pokemon-input");
  const $addPokemonBtn = $("button#add-pokemon");
  const $dataList = $("datalist#pokemon-list");

  /**
   * Observables
   */
    //Pokemon button click stream
  const pokemonBtnClick$ =
      Observable
        .fromEventPattern((handler: Handler) => $buttonsBox.on("click", ".pokemon-btn", handler))
        .map((ev: Event) => $(ev.target).text())
        .switchMap((text: string) =>
          Observable
            .ajax({
              url: URL + $.param({"q": text, "api_key": API_KEY, "limit": 10}),
              method: "GET"
            })
            .map(ajaxRes => ajaxRes.response.data)
        );

  //use input stream for remove children of datalist element
  const pokemonInput$ =
    Observable.fromEvent($pokemonInput, "keyup")
      .map((ev: Event) => $(ev.target).val())
      .debounceTime(300) // delay auto completion of user input by 500ms
      .distinctUntilChanged() // only when the input text changed
      .share();


  //pokemon add input stream for autocomplete
  const autoComplete$ =
    pokemonInput$
      .filter(inputText => inputText.length >= 3)
      .scan((acc, inputText) => {
        // if user has already typed more than or equal to 3 characters, filtering is needed.
        if(acc.previousInput.length > 3 && inputText.startsWith(acc.previousInput)) { // We already have filtered pokemons because currentInput = previousInput + SOME_TEXT
          const previousInput = inputText;
          const pokemons = acc.pokemons.filter((pokemonName: string) => new RegExp("^" + inputText, "i").test(pokemonName));
          const changeType = "increase";
          return {pokemons, previousInput, changeType};
        } else { // This is a new pokemon or user deleted text and typed same text
          const previousInput = inputText;
          const pokemons = topics.filter((pokemonName: string) => new RegExp("^" + inputText, "i").test(pokemonName));
          const changeType = "new";
          return {pokemons, previousInput, changeType};
        }
      }, {pokemons: topics, previousInput: "", changeType: "new"});


  //Add-Pokemon button click stream
  const addPokemonClick$ =
    Observable.fromEvent($addPokemonBtn, "click")
      .map(() => $pokemonInput.val())
      .filter((pokemonName: string) => pokemonName.length > 2) // shortest name: "Muk"...
      .do(pokemonName => { //side effect to manipulate selectedPokemons array and topics array
        $pokemonInput.val("");
        pokemonName = pokemonName[0].toUpperCase() + pokemonName.toLowerCase().substring(1);
        const index = topics.indexOf(pokemonName);
        // We don't need update selectedPokemons array, it's just homework requirement
        selectedPokemons.push(pokemonName);
        //if pokemonName exists in topics array, add this name to selected pokemons and delete from topics array
        if(index > -1) {
          // We need to update topics array for auto completion feature
          topics.splice(index, 1);
        }
      });

  //Pokemons stream
  const pokemons$ =
    Observable.from(selectedPokemons)
      .concat(addPokemonClick$);

  //Pokemon gif click stream
  const pokemonGifClick$ =
    Observable
      .fromEventPattern((handler: Handler) => $images.on("click", ".pokemon-box", handler))
      .map((ev: Event) => ({ // Due to rating ribbon, listen click event of parent div and find img element
        isAnimating: $(ev.target).closest(".pokemon-box").find(".pokemon-gif").data("animating"),
        imgElem: $(ev.target).closest(".pokemon-box").find(".pokemon-gif")
      }));



  /**
   * Subscribe stream
   */
  //subscribe selectedPokemons stream
  pokemons$
    .subscribe(pokemon => {
      $("<button>").addClass("pokemon-btn btn btn-primary btn-space").text(pokemon).appendTo($buttonsBox)
    });


  //subscribe user input stream to update view
  pokemonInput$
    .subscribe(inputText => {
      if(inputText.length < 3 && $dataList.children().length) $dataList.empty();
    });



  //subscribe pokemonInput stream
  autoComplete$
    .subscribe(({pokemons, changeType}) => {
      // user added characters to previous input text
      if(changeType === "increase") {
        $dataList.children().each(function (idx: number, elem: Element) {
          // remove if this pokemon name is not matched anymore
          if(!pokemons.includes($(elem).attr("value"))) $(elem).remove();
        });
      }
      //user deleted characters from previous input text or totally different input text!
      else {
        $dataList.empty();
        pokemons.forEach((pokemonName: string) => $dataList.append($("<option>").attr("value", pokemonName)));
      }
    });


  //subscribe pokemon button click stream
  pokemonBtnClick$
    .subscribe((gifs: Gif[]) => {
      //remove existing gifs
      $images.empty();


      //if there is no gif image found
      if(!gifs.length) {
        $images.append($("<h2>").text("This Pokemon is one of the most UNPOPULAR Pokemons! No Gif image found!"))
      }


      gifs.forEach(gif => {

        //set rating ribbon color
        let ribbonColor: string;
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
          .append(
            /** create rating ribbon element and <img> element => append to div.pokemon-box ==> append to div#images

             <div class="pokemon-box">
             <div class="ribbon-wrapper"><div class="ribbon"></div></div>
             <img class="pokemon-gif">
             </div>
             */
            $("<div>")
              .addClass("pokemon-box")
              .append(
                $("<div>").addClass("ribbon-wrapper")
                  .append(
                    $("<div>").addClass("ribbon")
                      .addClass(ribbonColor)
                      .text("Rating: " + gif.rating)
                  )
              )
              .append(
                $("<img>").addClass("pokemon-gif")
                  .attr("src", gif.images.fixed_height_still.url)
                  .data("animating", false)
                  .data("url", {animating: gif.images.fixed_height.url, still: gif.images.fixed_height_still.url})
              )
          );
      });
    });

  //subscribe pokemon gif image click
  pokemonGifClick$
    .subscribe(obj => {
      if(obj.isAnimating) {
        $(obj.imgElem).attr("src", $(obj.imgElem).data("url").still);
        $(obj.imgElem).data("animating", false)
      }
      else {
        $(obj.imgElem).attr("src", $(obj.imgElem).data("url").animating);
        $(obj.imgElem).data("animating", true)
      }
    })


});