import dotenv from "../dotenv/index";

import { createCipheriv, createDecipheriv, createHash, type Encoding, type BinaryToTextEncoding } from "crypto";

export type CipherData = string | { [key: string]: CipherData };

export type ResolveCipherData<T extends CipherData> =
  T extends { [key: string]: CipherData }
  ? { [K in keyof T]: ResolveCipherData<T[K]> }
  : string;

export default new class Cipher {
  public Settings = {
    hash: {
      input: dotenv.Required("hash_input").ToString( ) as Encoding,
      output: dotenv.Required("hash_output") .ToString( ) as BinaryToTextEncoding
    },

    cipher: {
      input: dotenv.Required("cipher_input").ToString( ) as Encoding,
      output: dotenv.Required("cipher_output") .ToString( ) as Encoding,
      password: dotenv.Required("cipher_password").ToString( ),
      algorithm: dotenv.Required("cipher_algorithm").ToString( ),
    }
  };

  private resolveCipherData<T extends CipherData>(data: T, callback: (data: string) => string) {
    if(typeof data == "object") {
      return Object.keys(data).reduce((object, key) => {
        object[key as keyof typeof object] = this.resolveCipherData(data[key as keyof typeof object], callback);

        return object;
      }, { } as { [K in keyof T]: CipherData }) as ResolveCipherData<T>;
    };

    return callback(data) as ResolveCipherData<T>;
  };

  public hash<T extends CipherData>(data: T) {
    return this.resolveCipherData(data, (item) => {
      return createHash("sha512")
        .update(item, this.Settings.hash.input)
        .digest(this.Settings.hash.output);
    });
  };

  public decrypt<T extends CipherData>(data: T) {
    return this.resolveCipherData(data, (item) => {
      const cipher = createDecipheriv(this.Settings.cipher.algorithm, this.Settings.cipher.password, null);

      return cipher
        .update(item, this.Settings.cipher.output, this.Settings.cipher.input)
        .concat(cipher.final(this.Settings.cipher.input));
    });
  };

  public encrypt<T extends CipherData>(data: T) {
    return this.resolveCipherData(data, (item) => {
      const cipher = createCipheriv(this.Settings.cipher.algorithm, this.Settings.cipher.password, null);

      return cipher
        .update(item, this.Settings.cipher.input, this.Settings.cipher.output)
        .concat(cipher.final(this.Settings.cipher.output));
    });
  };
};