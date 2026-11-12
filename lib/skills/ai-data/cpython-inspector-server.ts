/**
 * lib/skills/ai-data/cpython-inspector-server.ts
 * 
 * Server-only module for CPython native AST, token, and bytecode reflection.
 * Must only be imported in Next.js Route Handlers / API endpoints.
 */

import { spawn } from "child_process";
import { CPythonInstruction, CPythonAstNode, CPythonReflectionResult } from "./visual-diagram-engine";

const OP_EXPLANATIONS: Record<string, string> = {
  LOAD_CONST: "Pushes a literal constant value onto the Python evaluation stack.",
  LOAD_NAME: "Looks up variable name in current scope and pushes reference onto stack.",
  LOAD_FAST: "Pushes local variable onto stack via indexed C-array (fastest lookup).",
  STORE_NAME: "Pops top-of-stack reference and binds it to name in current namespace.",
  STORE_FAST: "Pops top-of-stack reference and stores into local array slot.",
  BINARY_OP: "Pops right and left operands, invokes C __add__ / __sub__, pushes result.",
  BUILD_LIST: "Allocates a new PyListObject on the heap with top N stack items.",
  BUILD_MAP: "Allocates a new PyDictObject on the heap.",
  CALL: "Invokes callable object with pushed positional & keyword arguments.",
  LOAD_METHOD: "Optimized lookup for method bound to object.",
  CALL_METHOD: "Executes method bypassing intermediate bound-method allocation.",
  RETURN_VALUE: "Pops top of stack and returns it to caller frame."
};

export async function inspectCpythonMechanics(code: string): Promise<CPythonReflectionResult> {
  const safeCode = code.trim() || "x = 42\ny = x + 10";

  const pythonScript = `
import ast, dis, tokenize, io, json, sys

code = ${JSON.stringify(safeCode)}

try:
    tokens = []
    readline = io.StringIO(code).readline
    for tok in tokenize.generate_tokens(readline):
        tokens.append({
            "type": tokenize.tok_name.get(tok.type, str(tok.type)),
            "string": tok.string,
            "start": tok.start,
            "end": tok.end
        })

    instructions = []
    for instr in dis.get_instructions(code):
        instructions.append({
            "opname": instr.opname,
            "argval": str(instr.argval) if instr.argval is not None else "",
            "offset": instr.offset,
            "startsLine": instr.starts_line,
            "description": ""
        })

    def node_to_dict(node, counter=[0]):
        counter[0] += 1
        node_id = f"node_{counter[0]}"
        node_type = type(node).__name__
        lineno = getattr(node, "lineno", 1)
        col = getattr(node, "col_offset", 0)
        
        children = []
        for child in ast.iter_child_nodes(node):
            children.append(node_to_dict(child, counter))
            
        summary = node_type
        if isinstance(node, ast.Name):
            summary = f"Name('{node.id}')"
        elif isinstance(node, ast.Constant):
            summary = f"Constant({repr(node.value)})"
        elif isinstance(node, ast.Assign):
            summary = "Assign (=)"
        elif isinstance(node, ast.BinOp):
            summary = f"BinOp ({type(node.op).__name__})"
        elif isinstance(node, ast.Call):
            summary = "Function Call"
            
        return {
            "id": node_id,
            "type": node_type,
            "lineno": lineno,
            "colOffset": col,
            "children": children,
            "summary": summary
        }

    parsed = ast.parse(code)
    ast_tree = node_to_dict(parsed)

    print(json.dumps({
        "success": True,
        "tokens": tokens[:50],
        "ast": ast_tree,
        "bytecode": instructions[:40]
    }))
except Exception as e:
    print(json.dumps({
        "success": False,
        "error": str(e)
    }))
`;

  return new Promise<CPythonReflectionResult>((resolve) => {
    const proc = spawn("python3", ["-c", pythonScript]);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => { stdout += data.toString(); });
    proc.stderr.on("data", (data) => { stderr += data.toString(); });

    proc.on("close", () => {
      try {
        const parsed = JSON.parse(stdout.trim());
        if (!parsed.success) {
          resolve({
            success: false,
            code: safeCode,
            tokens: [],
            ast: null,
            bytecode: [],
            stackTraceSteps: [],
            error: parsed.error || stderr
          });
          return;
        }

        const bytecodeWithDesc: CPythonInstruction[] = parsed.bytecode.map((b: any) => ({
          ...b,
          description: OP_EXPLANATIONS[b.opname] || `Executes CPython internal opcode ${b.opname}.`
        }));

        const simulatedStack: string[] = [];
        const stackSteps = bytecodeWithDesc.map((instr, idx) => {
          if (instr.opname.startsWith("LOAD_CONST") || instr.opname.startsWith("LOAD_FAST") || instr.opname.startsWith("LOAD_NAME")) {
            simulatedStack.push(instr.argval || "val");
          } else if (instr.opname.startsWith("STORE_")) {
            simulatedStack.pop();
          } else if (instr.opname.startsWith("BINARY_OP")) {
            simulatedStack.pop();
            simulatedStack.pop();
            simulatedStack.push(`result`);
          } else if (instr.opname === "BUILD_LIST") {
            const count = parseInt(instr.argval) || 2;
            for (let i = 0; i < count; i++) simulatedStack.pop();
            simulatedStack.push(`PyListObject[${count}]`);
          }

          return {
            step: idx + 1,
            instruction: instr,
            stack: [...simulatedStack],
            explanation: instr.description
          };
        });

        resolve({
          success: true,
          code: safeCode,
          tokens: parsed.tokens,
          ast: parsed.ast,
          bytecode: bytecodeWithDesc,
          stackTraceSteps: stackSteps
        });
      } catch (err: any) {
        resolve({
          success: false,
          code: safeCode,
          tokens: [],
          ast: null,
          bytecode: [],
          stackTraceSteps: [],
          error: err.message || stderr || "Failed to parse Python reflection JSON"
        });
      }
    });
  });
}

