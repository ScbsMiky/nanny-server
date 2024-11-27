import fs from "fs";

const path = `${process.cwd( )}\\.env`;
const items: Record<string, string> = { };

if(fs.existsSync(path)) {
  fs.readFileSync(path, "utf-8").replace(/(.+?)=(.+?)(\r\n|$)/g, (_, key, value) => {
    items[key] = value;

    return "";
  });
};

export function toString(item: any) {
  switch(typeof item) {
    case "object": return JSON.stringify(item);
    default: return `${item}`;
  };
};

export class DotEnvItem {
  public Key;
  public Value;

  constructor(key: string, value: string) {
    this.Key = key;
    this.Value = value;
  };

  ToString( ) {
    return this.Value
  };

  ToInt( ) {
    return Math.floor(this.ToNumber( ));
  };

  ToNumber( ) {
    if(Number.isNaN(this.Value)) {
      throw `'${this.Key}' is not a number`;
    };

    return Number(this.Value);
  };

  ToArray( ) {
    if(this.Value[0] !== "[" || this.Value[this.Value.length - 1] !== "]") {
      throw `'${this.Key}' is not a Array`;
    };

    return JSON.parse(this.Value) as any[ ];
  };
  
  ToObject( ) {
    if(this.Value[0] !== "{" || this.Value[this.Value.length - 1] !== "}") {
      throw `'${this.Key}' is not a Object`;
    };

    return JSON.parse(this.Value) as Record<string, any>;
  };

  ToBoolean( ) {
    return !(this.Value == "" || this.Value == " " || this.Value == "0" || this.Value == "False" || this.Value == "false");
  };
};

export default {
  Path: path,
  Items: items,

  Has(key: string) {
    return Object.hasOwn(this.Items, key);
  },

  Get(key: string) {
    return this.Has(key) ? new DotEnvItem(key, this.Items[key]) : undefined;
  },

  Set(key: string, value: any) {
    this.Items[key] = toString(value);
    return this.Get(key)!;
  },

  Default(key: string, value: any) {
    return this.Get(key) || new DotEnvItem(key, toString(value));
  },

  Required(key: string, error?: string) {
    if(!this.Has(key)) {
      throw error || `'${key}' is required`;
    };

    return this.Get(key)!;
  },

  ToString( ) {
    return Object.keys(this.Items).map((key) => `${key}=${toString(this.Items[key])}`).join("\n");
  }
};