import { join } from "path";

export type CompletelyPartial<T extends Record<string, any>> = {
  [K in keyof T]?: T[K] extends Object ? CompletelyPartial<T[K]> : T[K];
};

export function getRandomRange(max = 1, min = 0, float = true) {
  max = Math.random( ) * (max - min) + min;
  
  return float ? max : Math.floor(max);
};

export function getFilePath(path: string) {
  path = join(path);

  const [, folder = "", filename = ""] = (path.match(/(.+?)([^\\]+)$/) || [ ]);
  const [, name = "", extension = ""] = (filename.match(/(.+?)([^\.]+)$/) || [ ]);

  return {
    path,
    extension,

    name: name.endsWith(".") ? name.slice(0, name.length - 1) : "",
    folder: folder.endsWith("\\") ? folder.slice(0, folder.length - 1) : "",
  };
};

export function isObject(item: any) {
  return item && typeof item == "object" && Array.isArray(item) == false;
};

export function clone<T extends Object | Array<any>>(item: T): T {
  return JSON.parse(JSON.stringify(item));
};

export function merge<T extends Record<string, any>>(target: T, ...source: any[ ]) {
  if(source.length == 0) return target;

  const item = source.shift( );

  if(isObject(item)) {    
    for(const key in item) {
      if(isObject(item[key])) {
        if(Object.hasOwn(target, key) == false) {
          Object.assign(target, { [key]: { } });
        };

        merge(target[key], item[key]);

        continue;
      };

      Object.assign(target, { [key]: item[key] });
    };
  };

  return merge(target, ...source);
};

function putKeys(content: any, keys: string, put: boolean) {
  return `${put ? keys[0] : ""}${content}${put ? keys[1] : ""}`;
};

export function stringify(item: any, first = true): string {
  switch(typeof item) {
    case "object": {
      if(Array.isArray(item)) {
        return putKeys(item.map((item) => stringify(item, false)).join(","), "()", !first);
      };

      return putKeys(Object.keys(item).map((key) => `${key}=${stringify(item[key], false)}`).join(","), "{}", !first);
    };

    case "string": return `"${item}"`;

    default: return `${item}`;
  };
};

export function aikaStringify(item: Record<string, any>) {
  return Object.keys(item).map((key) => `${key}=${stringify(item[key], false)}`).join("\n");
};