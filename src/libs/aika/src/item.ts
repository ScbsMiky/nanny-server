import type Aika from "./aika";
import { aikaStringify, clone, merge, type CompletelyPartial } from "./util";

export default class AikaItem<T extends Record<string, any>> {
  public key;
  public model;
  public cache;

  constructor(model: Aika<T>, key: string) {
    this.key = key;
    this.model = model;
    this.cache = model.cache[key];
  };

  public get<K extends keyof T>(key: K) {
    return this.cache[key];
  };
  
  public set<K extends keyof T>(key: K, value: CompletelyPartial<T[K]>) {
    this.cache[key] = typeof value == "object" ? merge(clone(this.cache[key]), value) : value;

    return this;
  };

  public delete( ) {
    return this;
  };
  
  public save( ) {
    return this.model.save( );
  };

  public toString( ) {
    return JSON.stringify(this.cache);
  };
  
  public toAikaString( ) {
    return aikaStringify(this.cache);
  };
};