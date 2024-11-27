import color, { type Color } from "colors";
import { EToken, type IToken } from "./lexer";

export default new class Analyzer {
  private Tokens: IToken[ ] = [ ];

  private Index = 0;

  private Next( ) {
    return this.Tokens[this.Index ++];
  };

  private GetNext(len = 1) {
    return this.Tokens[this.Index + len];
  };

  private Current( ) {
    return this.Tokens[this.Index];
  };

  private HasNext( ) {
    return (this.Index + 1) <= this.Tokens.length;
  };

  private IsTag( ) {
    return this.Current( ).token == EToken.Left
        && this.GetNext(1).token == EToken.Content
        && this.GetNext(2).token == EToken.Right;
  };

  private IsClose(name: string) {
    return this.Current( ).token == EToken.Close
        && this.GetNext(1).token == EToken.Content
        && this.GetNext(2).token == EToken.Right
        && this.GetNext(1).value == name;
  };

  private ParseTagHeader( ) {
    let name = this.GetNext(1).value;

    while(this.HasNext( )) {
      if(this.Current( ).token == EToken.Right) {
        this.Next( );
        break;
      };

      this.Next( );
    };

    return name;
  };

  private ParseTagContent(name: string) {
    let content = "";

    while(this.HasNext( )) {
      if(this.IsTag( )) {
        content += this.ParseTag( );
        continue;
      };

      if(this.IsClose(name)) {
        this.ParseTagFooter(name);
        break;
      };

      content += this.Next( ).value;
    };

    return content;
  };

  private ParseTagFooter(name: string) {
    while(this.HasNext( )) {
      if(this.Current( ).token == EToken.Right) {
        this.Next( );
        break;
      };

      this.Next( );
    };
  };

  private ParseTag( ) {
    let name = this.ParseTagHeader( );

    return (color[name as keyof Color] || color["white"])(this.ParseTagContent(name));
  };

  public Parse(tokens: IToken[ ]) {
    this.Index = 0;
    
    this.Tokens = tokens;

    let output = "";

    while(this.HasNext( )) {
      if(this.IsTag( )) {
        output += this.ParseTag( );
        continue;
      };

      output += this.Next( ).value;
    };

    return output;
  };
};