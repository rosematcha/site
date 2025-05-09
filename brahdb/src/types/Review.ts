export type Restaurant = 
  | 'Arbys' | 'AW' | 'BurgerKing' | 'ChickFilA' | 'Chipotle' | 'Culvers'
  | 'DairyQueen' | 'DelTaco' | 'Dominos' | 'Dunkin' | 'FiveGuys' | 'Hardees'
  | 'JackInTheBox' | 'JimmyJohns' | 'KFC' | 'KrispyKreme' | 'LittleCaesars'
  | 'McDonalds' | 'MrBeastBurger' | 'PandaExpress' | 'PaneraBread' | 'PapaJohns' | 'PDQ' | 'PizzaHut'
  | 'Popeyes' | 'RedBaron' | 'Sonic' | 'Starbucks' | 'Subway' | 'TacoBell' | 'Wendys'
  | 'Wingstop' | 'Applebees' | 'BuffaloWildWings' | 'Coke' | 'Dennys' | 'ShakeShack' | 'Zaxbys'
  | 'JellO' | 'HebrewNational' | 'DiGiorno' | 'CaliPizzaKitchen' | 'SteakNShake' | 'Freschetta'
  | 'Gerber' | 'Disney' | 'CheckersRallys' | 'Publix' | 'Sbarro' | 'HungryHowies' | 'WhiteCastle' | 'Oreo' | 'MunchPak'
  | 'CookOut' | 'Bojangles' | 'InNOut' | 'ChipsAhoy' | 'M&Ms' | 'Nathans' | 'LongJohnSilvers' | 'BostonMarket' | 'Pepsi' | 'MtnDew' | 'Soylent' | 'Hooters' | 'Krystal' | 'Biscuitville'
  | 'Other';

export interface Review {
  restaurant: Restaurant;
  itemName: string;
  rating: number;
  reviewDate: string;
  reviewLink: string;
}