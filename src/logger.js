import fs from "fs";

export class Logger {
  constructor() {
    // Ensure log file exists
    try {
      fs.writeFileSync("./debug.log", "", { flag: "a" });
    } catch (error) {
      console.error("Failed to create log file:", error);
    }
  }

  log(...args) {
    try {
      const message = args.map(arg => this.formatValue(arg, 0)).join(" ");
      fs.appendFileSync("./debug.log", message + "\n");
    } catch (error) {
      console.error("Logger error:", error);
    }
  }

  formatValue(value, depth) {
    if (Array.isArray(value)) {
      if (value.length === 0) return "[]";
      
      // Check if this array contains only two-digit number tuples
      const isAllTwoDigitNumberTuples = value.every(item => 
        Array.isArray(item) && 
        item.length === 2 && 
        typeof item[0] === "number" && 
        typeof item[1] === "number" &&
        item[0] >= 0 && item[0] <= 99 &&
        item[1] >= 0 && item[1] <= 99
      );
      
      // Check if this array contains any nested arrays (excluding two-digit tuples)
      const hasNonTupleNestedArrays = value.some(item => 
        Array.isArray(item) && !(
          item.length === 2 && 
          typeof item[0] === "number" && 
          typeof item[1] === "number" &&
          item[0] >= 0 && item[0] <= 99 &&
          item[1] >= 0 && item[1] <= 99
        )
      );
      
      // If array contains non-tuple nested arrays, use newlines
      if (hasNonTupleNestedArrays) {
        const items = value.map(item => 
          `  ${this.formatValue(item, depth + 1)}`
        ).join(",\n");
        return `[\n${items}\n]`;
      }
      
      // If array contains only two-digit number tuples, print inline
      if (isAllTwoDigitNumberTuples) {
        const items = value.map(item => `[${item[0]}, ${item[1]}]`);
        return `[${items.join(", ")}]`;
      }
      
      // Otherwise, print inline for simple arrays
      const items = value.map(item => this.formatValue(item, depth + 1));
      return `[${items.join(", ")}]`;
      
    } else if (typeof value === "object" && value !== null) {
      const entries = Object.entries(value);
      if (entries.length === 0) return "{}";
      
      const indent = "  ".repeat(depth);
      const properties = entries
        .map(([key, val]) => 
          `${indent}  "${key}": ${this.formatValue(val, depth + 1)}`
        )
        .join(",\n");

      return `{\n${properties}\n${indent}}`;
      
    } else if (typeof value === "string") {
      return `"${value}"`;
    } else {
      return String(value);
    }
  }
}