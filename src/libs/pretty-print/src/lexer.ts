export enum EToken {
  Left = "Left",
  Right = "Right",
  Close = "Close",
  Content = "Content"
};

export interface IToken {
  token: EToken;
  value: string;
};

export default new class Lexer {
  private Code = "";

  private Index = 0;

  private Next(len = 1) {
    if(len !== 1) {
      let next = this.Code.slice(this.Index, this.Index + len);
      
      this.Index += len;

      return next;
    };

    return this.Code[this.Index ++];
  };

  private GetNext(len = 1) {
    return this.Code[this.Index + len];
  };

  private Current( ) {
    return this.Code[this.Index];
  };

  private HasNext( ) {
    return (this.Index + 1) <= this.Code.length;
  };

  public Parse(code: string) {
    this.Index = 0;
    
    this.Code = code;

    const tokens: IToken[ ] = [ ];

    while(this.HasNext( )) {
      if(this.Current( ) == "<") {
        if(this.GetNext( ) == "/") {
          tokens.push({ token: EToken.Close, value: this.Next(2) });
          continue;
        };

        tokens.push({ token: EToken.Left, value: this.Next( ) });
        continue;
      };

      if(this.Current( ) == ">") {
        tokens.push({ token: EToken.Right, value: this.Next( ) });
        continue;
      };

      let content = "";

      while(this.HasNext( ) && this.Current( ) !== "<" && this.Current( ) !== ">") {
        content += this.Next( );
      };

      tokens.push({ token: EToken.Content, value: content });
    };

    return tokens;
  };
};