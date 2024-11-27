import lexer from "./lexer";
import analyzer from "./analyzer";

export default new class PrettyPrinter {
  public colors = {
    true: "green",
    false: "red",
    
    number: "blue",
    string: "white",
    symbol: "cyan",
    
    function: "magenta",

    null: "gray",
    undefined: "gray"
  };

  private parseErrorStack(stack: string) {
    return stack.split("\n").slice(1)
      .map((stack) => `<cyan>|</cyan> ${stack.trim( ).replace(/\((.+?)\)/g, "<cyan>(<magenta>$1</magenta>)</cyan>")}`)
      .join("\n");
  };

  private applyColor(content: string, name: keyof typeof this.colors) {
    return `<${this.colors[name]}>${content}</${this.colors[name]}>`;
  };

  private applyAnyColor(content: any) {
    if(content instanceof Error) {
      return `<red>${content.name}</red>: ${content.message}${content.cause ? ` (reason: <cyan>${content.cause}</cyan>)` : ""}${content.stack ? `\n${this.parseErrorStack(content.stack)}` : ""}`;
    };

    switch(typeof content) {
      case "object": return JSON.stringify(content);
      
      case "number":
      case "bigint": return this.applyColor(`${content}`, "number");
      case "symbol": return this.applyColor(`${content.toString( )}`, "symbol");
      
      case "boolean": return this.applyColor(`${content}`, content == true ? "true" : "false");
      
      case "string": return this.applyColor(`${content}` , "string");
      case "function": return this.applyColor(`${content}`, "function");

      case "undefined": return this.applyColor(`${content}`, "undefined");
    };
  };

  public table(data: any[ ][ ], properties?: Partial<{ }>) {
    let output = "";
    let offset = 0;

    data.forEach((row, y) => row.forEach((col, x) => {
      data[y][x] = this.parse(data[y][x]);
      
      if(offset < data[y][x].length) {
        offset = data[y][x].length;
      };
    }));

    for(let y = 0; y < data.length; y ++) {
      for(let x = 0; x < data[y].length; x ++) {
        output += data[y][x] + " ".repeat(offset - data[y][x].length);
        
        if((x + 1) < data[y].length) {
          output += " | ";
        };
      };

      if((y + 1) < data.length) {
        output += "\n";
      };
    };

    console.log(output);
  };

  public log(...text: any[ ]) {
    return console.log(this.parse(...text));
  };

  public warn(...text: any[ ]) {
    return console.log(this.parse(...text));
  };

  public Log(...text: any[ ]) {
    return this.log(...text);
  };

  public parse(...text: any[ ]) {
    return text.reduce((list, item, index) => {
      return list + `${index != 0 ? " " : ""}${analyzer.Parse(lexer.Parse(this.applyAnyColor(item)))}`;
    }, "");
  };
};