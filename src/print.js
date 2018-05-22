const {
  align, concat, dedent, group, hardline, indent, join, line, literalline, markAsRoot
} = require("prettier").doc.builders;

const concatBody = (path, print) => concat(path.map(print, "body"));
const literalBody = (path, print) => path.getValue().body;

const nodes = {
  "@const": literalBody,
  "@ident": literalBody,
  "@int": literalBody,
  "@ivar": literalBody,
  "@kw": literalBody,
  "@tstring_content": literalBody,
  alias: (path, print) => concat(["alias ", join(" ", path.map(print, "body"))]),
  args_add_block: (path, print) => {
    const [_, block] = path.getValue().body;
    const parts = [join(", ", path.map(print, "body", 0))];

    if (block) {
      parts.push(path.map(print, "body", 1));
    }

    return group(concat(parts));
  },
  assign: (path, print) => join(" = ", path.map(print, "body")),
  binary: (path, print) => join(` ${path.getValue().body[1]} `, [
    path.call(print, "body", 0),
    path.call(print, "body", 2)
  ]),
  bodystmt: (path, print) => join(line, path.map(print, "body", 0)),
  call: (path, print) => join(path.getValue().body[1], [
    path.call(print, "body", 0),
    path.call(print, "body", 2)
  ]),
  class: (path, print) => {
    const parts = ["class ", path.call(print, "body", 0)];

    if (path.getValue().body[1]) {
      parts.push(" < ", path.call(print, "body", 1));
    }

    return concat([
      group(concat(parts)),
      indent(path.call(print, "body", 2)),
      group(concat([hardline, "end"])),
      literalline
    ]);
  },
  command: (path, print) => join(" ", path.map(print, "body")),
  const_ref: (path, print) => path.call(print, "body", 0),
  def: (path, print) => concat([
    group(concat([hardline, "def ", path.call(print, "body", 0), path.call(print, "body", 1)])),
    indent(concat([hardline, path.call(print, "body", 2)])),
    group(concat([hardline, "end"]))
  ]),
  module: (path, print) => concat([
    group(concat([literalline, "module ", path.call(print, "body", 0)])),
    indent(path.call(print, "body", 1)),
    dedent(concat(["end", literalline]))
  ]),
  params: (path, print) => {
    const [req, opt, ...rest] = path.getValue().body;
    let parts = [];

    if (req) {
      parts = parts.concat(path.map(print, "body", 0));
    }

    if (opt) {
      parts.push(...opt.map((name, index) => {
        return concat([
          path.call(print, "body", 1, index, 0),
          " = ",
          path.call(print, "body", 1, index, 1)
        ]);
      }));
    }

    return join(", ", parts);
  },
  paren: (path, print) => (
    concat(["(", ...path.getValue().body.reduce((parts, part, index) => {
      if (Array.isArray(part)) {
        return parts.concat(path.map(print, "body", index));
      }
      return [...parts, path.call(print, "body", index)];
    }, []), ")"])
  ),
  program: (path, print) => markAsRoot(join(hardline, path.map(print, "body", 0))),
  string_content: (path, print) => {
    const delim = path.getValue().body.some(({ type }) => type === "string_embexpr") ? "\"" : "'";
    return concat([delim, ...path.map(print, "body"), delim]);
  },
  string_embexpr: (path, print) => concat(["#{", ...path.map(print, "body", 0), "}"]),
  string_literal: concatBody,
  symbol: (path, print) => concat([":", ...path.map(print, "body")]),
  symbol_literal: concatBody,
  var_field: concatBody,
  var_ref: (path, print) => path.call(print, "body", 0),
  vcall: concatBody,
  void_stmt: (path, print) => ""
};

const debugNode = (path, print) => {
  console.log("=== UNSUPPORTED NODE ===");
  console.log(path.getValue());
  console.log("========================");
  return "";
};

const genericPrint = (path, options, print) => {
  const { type } = path.getValue();
  return (nodes[type] || debugNode)(path, print);
};

module.exports = genericPrint;
