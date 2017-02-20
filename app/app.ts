import {Observable} from "rxjs/Observable";
import * as $ from "jquery";

import "rxjs/add/observable/fromEventPattern";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/operator/map";

interface Handler {
  (eventObject: JQueryEventObject, ...args: any[]):any;
}

$(document).ready(() => {

  const btnClick = Observable.fromEventPattern((handler: Handler) => $("body").on("click", ".animal-btn", handler));
  const addAnimal
    = Observable
    .fromEvent($("#add-animal"), "click")
    .map(() => $("input#animal-input").val());


  btnClick.subscribe(() => {
    console.log("clicked!");
  })



});