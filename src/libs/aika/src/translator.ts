import { EToken, type IToken } from "./lexer";

export default new class Translator {
  private index = 0;
  
  private tokens: IToken[ ] = [ ];

  private next( ) {
    return this.tokens[this.index ++];
  };

  private hasNext( ) {
    return (this.index + 1) <= this.tokens.length;
  };

  private expecting(token: EToken | EToken[ ], error = "") {
    token = Array.isArray(token) ? token : [token];

    let found = this.next( );
    
    if(!found || token.find((token) => found.token == token) == undefined) {
      throw `Parser error${error ? `: ${error}`: ""}\nExpecting: ${token.join(" | ")}\nProvided: ${found ? found.token : "Unknown"}`;
    };

    return found;
  };

  private is(token: EToken) {
    return this.current( ).token == token;
  };

  private current( ) {
    return this.tokens[this.index];
  };

  private parseList( ) {
    const list: any[ ] = [ ];

    this.next( );

    while(this.hasNext( ) && !this.is(EToken.CloseParen)) {
      list.push(this.parseItem( ));

      if(this.is(EToken.Comma)) {
        this.next( );
        continue;
      };

      if(!this.is(EToken.CloseParen)) {
        throw "Malformated dict";
      };
    };

    this.expecting(EToken.CloseParen);

    return list;
  };

  private parseDict( ) {
    const dict: Record<string, any> = { };

    this.next( );

    while(this.hasNext( ) && !this.is(EToken.CloseBracket)) {
      const key = this.expecting([EToken.Identifier, EToken.Number]).value;

      this.expecting(EToken.Equal);

      dict[key] = this.parseItem( );

      if(this.is(EToken.Comma)) {
        this.next( );
        continue;
      };

      if(!this.is(EToken.CloseBracket)) {
        throw "Malformated dict";
      };
    };

    this.expecting(EToken.CloseBracket);

    return dict;
  };

  private parseItem( ) {
    switch(this.current( ).token) {
      case EToken.String:
        return this.next( ).value;

      case EToken.Number:
        return Number(this.next( ).value);

      case EToken.Boolean:
        return this.next( ).value == "true";  

      case EToken.OpenParen:
        return this.parseList( );

      case EToken.OpenBracket:
        return this.parseDict( );

      default:
        throw `Unexpected token '${this.current( ).token}'`;
    };
  };

  public parse(tokens: IToken[ ]) {
    this.index = 0;
    this.tokens = tokens;

    const translated: Record<string, any> = { };

    while(this.hasNext( )) {
      const key = this.expecting([EToken.Identifier, EToken.Number]).value;

      this.expecting(EToken.Equal);

      translated[key] = this.parseItem( );
    };

    return translated;
  };
};