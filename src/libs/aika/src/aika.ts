import fs from "fs";

import lexer from "./lexer";
import AikaItem from "./item";
import translator from "./translator";

import { aikaStringify, clone, getFilePath, getRandomRange, merge, type CompletelyPartial } from "./util";

export type AikaCallback<T, K = any> = (item: T, index: number, list: T[ ]) => K;

export default class Aika<T extends Record<string, any>> {
  private lastTransactionPath?: ReturnType<typeof getFilePath>;

  public path;
  public schema;

  public cache: Record<string, T> = { };

  constructor(path: string, schema: T) {
    this.path = getFilePath(path);

    this.schema = clone(schema);

    if(!fs.existsSync(path)) {
      fs.writeFileSync(path, "");
    };

    this.cache = translator.parse(lexer.parse(fs.readFileSync(path, "utf-8")));
  };

  public get<K extends CompletelyPartial<T> | undefined>(key: string, value?: K) {
    return (this.has(key) ? new AikaItem(this, key) : value ? this.set(key, value) : undefined) as (K extends undefined ? AikaItem<T> | undefined : AikaItem<T>);
  };

  public has(key: string) {
    return Object.hasOwn(this.cache, key);
  };

  public set(key: string, value: CompletelyPartial<T>) {
    this.cache[key] = merge(clone(this.schema), value);

    return new AikaItem(this, key);
  };

  public create(value: CompletelyPartial<T>) {
    return this.set(getRandomRange(999_999_999_999, 100_000_000_000, false).toString( ), value);
  };

  public delete(key: string) {
    delete this.cache[key];

    return this;
  };

  public save( ) {
    fs.writeFileSync(this.path.path, aikaStringify(this.cache));

    return this;
  };

  public find(callback: AikaCallback<AikaItem<T>>) {
    return this.toArray(true).find(callback);
  };

  public filter(callback: AikaCallback<AikaItem<T>>) {
    return this.toArray(true).filter(callback);
  };

  public transaction(callback: (model: Aika<T>) => void) {
    this.lastTransactionPath = this.lastTransactionPath || getFilePath(`${this.path.folder}/${this.path.name}_transaction.${this.path.extension}`);

    const model = new Aika(this.lastTransactionPath.path, this.schema);

    model.closeTransaction = this.closeTransaction.bind(this);

    callback(model);

    return this;
  };

  public closeTransaction(save = true) {
    if(this.lastTransactionPath) {
      let tempModel: undefined | Aika<T> = new Aika(this.lastTransactionPath.path, this.schema);

      tempModel.transpose(this)
      tempModel = undefined;

      if(save) {
        this.save( );
      };

      fs.unlinkSync(this.lastTransactionPath.path);

      this.lastTransactionPath = undefined;
    };

    return this;
  };

  public transpose(model: Aika<T>) {
    Object.keys(this.cache).forEach((key) => model.set(key, this.cache[key]));

    return this;
  };

  public toString( ) {
    return JSON.stringify(this.cache);
  };

  public toAikaString( ) {
    return aikaStringify(this.cache);
  };

  public toArray<B extends boolean = false>(convertToItem?: B) {
    return Object
      .keys(this.cache)
      .map((key) => convertToItem ? new AikaItem(this, key) : this.cache[key]) as (B extends true ? AikaItem<T>[ ] : T[ ]);
  };
};