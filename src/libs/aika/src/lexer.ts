export enum EToken {
  Comma = "Comma",
  Equal = "Equal",

  Number = "Number",
  String = "String",
  Boolean = "Boolean",
  Identifier = "Identifier",

  OpenParen = "OpenParen",
  CloseParen = "CloseParen",
  OpenBracket = "OpenBracket",
  CloseBracket = "CloseBracket",
};

export interface IToken {
  row: number;
  col: number;

  token: EToken;
  value: string;
};

export default new class Lexer {
  private code = "";

  private row = 0;
  private col = 0;
  private index = 0;

  private bounds = {
    zero: "0".charCodeAt(0),
    nine: "9".charCodeAt(0)
  };

  private tokens: IToken[ ] = [ ];

  private addToken(token: EToken, value: string) {
    this.tokens.push({
      token,
      value,
      row: this.row,
      col: this.col
    });
    
    return this.tokens[this.tokens.length - 1];
  };

  // 

  private hasNext( ) {
    return (this.index + 1) <= this.code.length;
  };

  // GETTERS //

  private next( ) {
    this.row ++;
    
    return this.code[this.index ++];
  };

  private getNext(len = 1) {
    return this.code.slice(this.index, this.index + len);
  };

  private isNumber(char = this.current( )) {
    let code = char.charCodeAt(0);

    return code >= this.bounds.zero && code <= this.bounds.nine;
  };

  private isIdentifier(char = this.current( )) {
    return char.toLowerCase( ) !== char.toUpperCase( )
        || char == "_";
  };
  
  private current( ) {
    return this.code[this.index];
  };

  private parseNumber( ) {
    let num = "";

    if(this.current( ) == "-") {
      num += this.next( );
    };

    while(this.hasNext( )) {
      if(this.isNumber( ) == false) {
        if(this.current( ) == ".") {
          if(num.includes(".")) {
            throw "Malformated number";
          };

          num += this.next( );

          continue;
        };

        break;
      };

      num += this.next( );
    };

    return num;
  };

  private parseString( ) {
    let str = "";

    this.next( );

    while(this.hasNext( )) {
      if(this.current( ) == "\"") {
        this.next( );
        break;
      };

      str += this.next( );
    };

    return str;
  };

  private parseIdentifier( ) {
    let idn = "";

    while(this.hasNext( )) {
      if(this.isIdentifier( ) == false) {
        if(this.isNumber( ) && idn.length !== 0) {
          idn += this.next( );
          continue;
        };

        break;
      };

      idn += this.next( );
    };

    return idn;
  };

  public parse(code: string) {
    this.code = code;

    this.row = 0;
    this.col = 0;
    this.index = 0;
    
    this.tokens = [ ];

    while(this.hasNext( )) {
      switch(this.current( )) {
        case "\n": case "\r\n": {
          this.next( );
          
          this.row = 0;
          this.col ++;

          break;
        };

        case " ": case "\r": {
          this.next( );
          break;
        };

        case "-": {
          this.addToken(EToken.Number, this.parseNumber( ));;
          break;
        };

        case "=": {
          this.addToken(EToken.Equal, this.next( ));;
          break;
        };
          
        case ",": {
          this.addToken(EToken.Comma, this.next( ));;
          break;
        };

        case "(": {
          this.addToken(EToken.OpenParen, this.next( ));
          break;
        };
          
        case ")": {
          this.addToken(EToken.CloseParen, this.next( ));
          break;
        };
          
        case "{": {
          this.addToken(EToken.OpenBracket, this.next( ));
          break;
        };
          
        case "}": {
          this.addToken(EToken.CloseBracket, this.next( ));
          break;
        };

        case "\"": {
          this.addToken(EToken.String, this.parseString( ));;
          break;
        };

        default: {
          if(this.isNumber( )) {
            this.addToken(EToken.Number, this.parseNumber( ));
            break;
          };

          if(this.isIdentifier( )) {
            let identifier = this.parseIdentifier( );

            if(identifier == "true" || identifier == "false") {
              this.addToken(EToken.Boolean, identifier);
              break;
            };

            this.addToken(EToken.Identifier, identifier);
            break;
          };

          throw `Unexpected value '${this.current( )}'`;
        };
      };
    };

    return this.tokens.slice(0);
  };
};