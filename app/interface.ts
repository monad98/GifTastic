/**
 * Created by monad on 2/23/17.
 */
export interface Handler {
  (eventObject: JQueryEventObject, ...args: any[]): any;
}
export interface Gif {
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
