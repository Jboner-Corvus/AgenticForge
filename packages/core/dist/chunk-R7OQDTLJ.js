import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  FinishToolSignal
} from "./chunk-CZQPSXPM.js";
import {
  SessionManager
} from "./chunk-VXD37PNH.js";
import {
  summarizeTool
} from "./chunk-4LH7YAUH.js";
import {
  LlmError,
  LlmKeyManager,
  getLlmProvider
} from "./chunk-LMV4O5WI.js";
import {
  getTools
} from "./chunk-IWE6TWGQ.js";
import {
  AppError,
  UserError,
  getErrDetails,
  toolRegistry
} from "./chunk-SJT2WBJG.js";
import {
  getRedisClientInstance
} from "./chunk-2TWFUMQU.js";
import {
  getLoggerInstance
} from "./chunk-5JE7E5SU.js";
import {
  config,
  loadConfig
} from "./chunk-DVHMHG4X.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/worker.ts
init_esm_shims();
import { Queue, Worker } from "bullmq";
import { spawn as _spawn } from "child_process";
import { Client as PgClient } from "pg";

// src/modules/agent/agent.ts
init_esm_shims();

// src/modules/agent/orchestrator.prompt.ts
init_esm_shims();
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// src/modules/agent/responseSchema.ts
init_esm_shims();
import { z } from "zod";

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/index.js
init_esm_shims();

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/Options.js
init_esm_shims();
var ignoreOverride = Symbol("Let zodToJsonSchema decide on which parser to use");
var defaultOptions = {
  name: void 0,
  $refStrategy: "root",
  basePath: ["#"],
  effectStrategy: "input",
  pipeStrategy: "all",
  dateStrategy: "format:date-time",
  mapStrategy: "entries",
  removeAdditionalStrategy: "passthrough",
  allowedAdditionalProperties: true,
  rejectedAdditionalProperties: false,
  definitionPath: "definitions",
  target: "jsonSchema7",
  strictUnions: false,
  definitions: {},
  errorMessages: false,
  markdownDescription: false,
  patternStrategy: "escape",
  applyRegexFlags: false,
  emailStrategy: "format:email",
  base64Strategy: "contentEncoding:base64",
  nameStrategy: "ref",
  openAiAnyTypeName: "OpenAiAnyType"
};
var getDefaultOptions = (options) => typeof options === "string" ? {
  ...defaultOptions,
  name: options
} : {
  ...defaultOptions,
  ...options
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/Refs.js
init_esm_shims();
var getRefs = (options) => {
  const _options = getDefaultOptions(options);
  const currentPath = _options.name !== void 0 ? [..._options.basePath, _options.definitionPath, _options.name] : _options.basePath;
  return {
    ..._options,
    flags: { hasReferencedOpenAiAnyType: false },
    currentPath,
    propertyPath: void 0,
    seen: new Map(Object.entries(_options.definitions).map(([name, def]) => [
      def._def,
      {
        def: def._def,
        path: [..._options.basePath, _options.definitionPath, name],
        // Resolution of references will be forced even though seen, so it's ok that the schema is undefined here for now.
        jsonSchema: void 0
      }
    ]))
  };
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/errorMessages.js
init_esm_shims();
function addErrorMessage(res, key, errorMessage, refs) {
  if (!refs?.errorMessages)
    return;
  if (errorMessage) {
    res.errorMessage = {
      ...res.errorMessage,
      [key]: errorMessage
    };
  }
}
function setResponseValueAndErrors(res, key, value, errorMessage, refs) {
  res[key] = value;
  addErrorMessage(res, key, errorMessage, refs);
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/getRelativePath.js
init_esm_shims();
var getRelativePath = (pathA, pathB) => {
  let i = 0;
  for (; i < pathA.length && i < pathB.length; i++) {
    if (pathA[i] !== pathB[i])
      break;
  }
  return [(pathA.length - i).toString(), ...pathB.slice(i)].join("/");
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parseDef.js
init_esm_shims();

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/selectParser.js
init_esm_shims();
import { ZodFirstPartyTypeKind as ZodFirstPartyTypeKind3 } from "zod";

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/any.js
init_esm_shims();
function parseAnyDef(refs) {
  if (refs.target !== "openAi") {
    return {};
  }
  const anyDefinitionPath = [
    ...refs.basePath,
    refs.definitionPath,
    refs.openAiAnyTypeName
  ];
  refs.flags.hasReferencedOpenAiAnyType = true;
  return {
    $ref: refs.$refStrategy === "relative" ? getRelativePath(anyDefinitionPath, refs.currentPath) : anyDefinitionPath.join("/")
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/array.js
init_esm_shims();
import { ZodFirstPartyTypeKind } from "zod";
function parseArrayDef(def, refs) {
  const res = {
    type: "array"
  };
  if (def.type?._def && def.type?._def?.typeName !== ZodFirstPartyTypeKind.ZodAny) {
    res.items = parseDef(def.type._def, {
      ...refs,
      currentPath: [...refs.currentPath, "items"]
    });
  }
  if (def.minLength) {
    setResponseValueAndErrors(res, "minItems", def.minLength.value, def.minLength.message, refs);
  }
  if (def.maxLength) {
    setResponseValueAndErrors(res, "maxItems", def.maxLength.value, def.maxLength.message, refs);
  }
  if (def.exactLength) {
    setResponseValueAndErrors(res, "minItems", def.exactLength.value, def.exactLength.message, refs);
    setResponseValueAndErrors(res, "maxItems", def.exactLength.value, def.exactLength.message, refs);
  }
  return res;
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/bigint.js
init_esm_shims();
function parseBigintDef(def, refs) {
  const res = {
    type: "integer",
    format: "int64"
  };
  if (!def.checks)
    return res;
  for (const check of def.checks) {
    switch (check.kind) {
      case "min":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMinimum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMinimum = true;
          }
          setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
        }
        break;
      case "max":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMaximum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMaximum = true;
          }
          setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
        }
        break;
      case "multipleOf":
        setResponseValueAndErrors(res, "multipleOf", check.value, check.message, refs);
        break;
    }
  }
  return res;
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/boolean.js
init_esm_shims();
function parseBooleanDef() {
  return {
    type: "boolean"
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/branded.js
init_esm_shims();
function parseBrandedDef(_def, refs) {
  return parseDef(_def.type._def, refs);
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/catch.js
init_esm_shims();
var parseCatchDef = (def, refs) => {
  return parseDef(def.innerType._def, refs);
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/date.js
init_esm_shims();
function parseDateDef(def, refs, overrideDateStrategy) {
  const strategy = overrideDateStrategy ?? refs.dateStrategy;
  if (Array.isArray(strategy)) {
    return {
      anyOf: strategy.map((item, i) => parseDateDef(def, refs, item))
    };
  }
  switch (strategy) {
    case "string":
    case "format:date-time":
      return {
        type: "string",
        format: "date-time"
      };
    case "format:date":
      return {
        type: "string",
        format: "date"
      };
    case "integer":
      return integerDateParser(def, refs);
  }
}
var integerDateParser = (def, refs) => {
  const res = {
    type: "integer",
    format: "unix-time"
  };
  if (refs.target === "openApi3") {
    return res;
  }
  for (const check of def.checks) {
    switch (check.kind) {
      case "min":
        setResponseValueAndErrors(
          res,
          "minimum",
          check.value,
          // This is in milliseconds
          check.message,
          refs
        );
        break;
      case "max":
        setResponseValueAndErrors(
          res,
          "maximum",
          check.value,
          // This is in milliseconds
          check.message,
          refs
        );
        break;
    }
  }
  return res;
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/default.js
init_esm_shims();
function parseDefaultDef(_def, refs) {
  return {
    ...parseDef(_def.innerType._def, refs),
    default: _def.defaultValue()
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/effects.js
init_esm_shims();
function parseEffectsDef(_def, refs) {
  return refs.effectStrategy === "input" ? parseDef(_def.schema._def, refs) : parseAnyDef(refs);
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/enum.js
init_esm_shims();
function parseEnumDef(def) {
  return {
    type: "string",
    enum: Array.from(def.values)
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/intersection.js
init_esm_shims();
var isJsonSchema7AllOfType = (type) => {
  if ("type" in type && type.type === "string")
    return false;
  return "allOf" in type;
};
function parseIntersectionDef(def, refs) {
  const allOf = [
    parseDef(def.left._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "0"]
    }),
    parseDef(def.right._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "1"]
    })
  ].filter((x) => !!x);
  let unevaluatedProperties = refs.target === "jsonSchema2019-09" ? { unevaluatedProperties: false } : void 0;
  const mergedAllOf = [];
  allOf.forEach((schema) => {
    if (isJsonSchema7AllOfType(schema)) {
      mergedAllOf.push(...schema.allOf);
      if (schema.unevaluatedProperties === void 0) {
        unevaluatedProperties = void 0;
      }
    } else {
      let nestedSchema = schema;
      if ("additionalProperties" in schema && schema.additionalProperties === false) {
        const { additionalProperties, ...rest } = schema;
        nestedSchema = rest;
      } else {
        unevaluatedProperties = void 0;
      }
      mergedAllOf.push(nestedSchema);
    }
  });
  return mergedAllOf.length ? {
    allOf: mergedAllOf,
    ...unevaluatedProperties
  } : void 0;
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/literal.js
init_esm_shims();
function parseLiteralDef(def, refs) {
  const parsedType = typeof def.value;
  if (parsedType !== "bigint" && parsedType !== "number" && parsedType !== "boolean" && parsedType !== "string") {
    return {
      type: Array.isArray(def.value) ? "array" : "object"
    };
  }
  if (refs.target === "openApi3") {
    return {
      type: parsedType === "bigint" ? "integer" : parsedType,
      enum: [def.value]
    };
  }
  return {
    type: parsedType === "bigint" ? "integer" : parsedType,
    const: def.value
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/map.js
init_esm_shims();

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/record.js
init_esm_shims();
import { ZodFirstPartyTypeKind as ZodFirstPartyTypeKind2 } from "zod";

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/string.js
init_esm_shims();
var emojiRegex = void 0;
var zodPatterns = {
  /**
   * `c` was changed to `[cC]` to replicate /i flag
   */
  cuid: /^[cC][^\s-]{8,}$/,
  cuid2: /^[0-9a-z]+$/,
  ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
  /**
   * `a-z` was added to replicate /i flag
   */
  email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
  /**
   * Constructed a valid Unicode RegExp
   *
   * Lazily instantiate since this type of regex isn't supported
   * in all envs (e.g. React Native).
   *
   * See:
   * https://github.com/colinhacks/zod/issues/2433
   * Fix in Zod:
   * https://github.com/colinhacks/zod/commit/9340fd51e48576a75adc919bff65dbc4a5d4c99b
   */
  emoji: () => {
    if (emojiRegex === void 0) {
      emojiRegex = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u");
    }
    return emojiRegex;
  },
  /**
   * Unused
   */
  uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
  /**
   * Unused
   */
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
  /**
   * Unused
   */
  ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
  ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
  base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
  nanoid: /^[a-zA-Z0-9_-]{21}$/,
  jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
};
function parseStringDef(def, refs) {
  const res = {
    type: "string"
  };
  if (def.checks) {
    for (const check of def.checks) {
      switch (check.kind) {
        case "min":
          setResponseValueAndErrors(res, "minLength", typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value, check.message, refs);
          break;
        case "max":
          setResponseValueAndErrors(res, "maxLength", typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value, check.message, refs);
          break;
        case "email":
          switch (refs.emailStrategy) {
            case "format:email":
              addFormat(res, "email", check.message, refs);
              break;
            case "format:idn-email":
              addFormat(res, "idn-email", check.message, refs);
              break;
            case "pattern:zod":
              addPattern(res, zodPatterns.email, check.message, refs);
              break;
          }
          break;
        case "url":
          addFormat(res, "uri", check.message, refs);
          break;
        case "uuid":
          addFormat(res, "uuid", check.message, refs);
          break;
        case "regex":
          addPattern(res, check.regex, check.message, refs);
          break;
        case "cuid":
          addPattern(res, zodPatterns.cuid, check.message, refs);
          break;
        case "cuid2":
          addPattern(res, zodPatterns.cuid2, check.message, refs);
          break;
        case "startsWith":
          addPattern(res, RegExp(`^${escapeLiteralCheckValue(check.value, refs)}`), check.message, refs);
          break;
        case "endsWith":
          addPattern(res, RegExp(`${escapeLiteralCheckValue(check.value, refs)}$`), check.message, refs);
          break;
        case "datetime":
          addFormat(res, "date-time", check.message, refs);
          break;
        case "date":
          addFormat(res, "date", check.message, refs);
          break;
        case "time":
          addFormat(res, "time", check.message, refs);
          break;
        case "duration":
          addFormat(res, "duration", check.message, refs);
          break;
        case "length":
          setResponseValueAndErrors(res, "minLength", typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value, check.message, refs);
          setResponseValueAndErrors(res, "maxLength", typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value, check.message, refs);
          break;
        case "includes": {
          addPattern(res, RegExp(escapeLiteralCheckValue(check.value, refs)), check.message, refs);
          break;
        }
        case "ip": {
          if (check.version !== "v6") {
            addFormat(res, "ipv4", check.message, refs);
          }
          if (check.version !== "v4") {
            addFormat(res, "ipv6", check.message, refs);
          }
          break;
        }
        case "base64url":
          addPattern(res, zodPatterns.base64url, check.message, refs);
          break;
        case "jwt":
          addPattern(res, zodPatterns.jwt, check.message, refs);
          break;
        case "cidr": {
          if (check.version !== "v6") {
            addPattern(res, zodPatterns.ipv4Cidr, check.message, refs);
          }
          if (check.version !== "v4") {
            addPattern(res, zodPatterns.ipv6Cidr, check.message, refs);
          }
          break;
        }
        case "emoji":
          addPattern(res, zodPatterns.emoji(), check.message, refs);
          break;
        case "ulid": {
          addPattern(res, zodPatterns.ulid, check.message, refs);
          break;
        }
        case "base64": {
          switch (refs.base64Strategy) {
            case "format:binary": {
              addFormat(res, "binary", check.message, refs);
              break;
            }
            case "contentEncoding:base64": {
              setResponseValueAndErrors(res, "contentEncoding", "base64", check.message, refs);
              break;
            }
            case "pattern:zod": {
              addPattern(res, zodPatterns.base64, check.message, refs);
              break;
            }
          }
          break;
        }
        case "nanoid": {
          addPattern(res, zodPatterns.nanoid, check.message, refs);
        }
        case "toLowerCase":
        case "toUpperCase":
        case "trim":
          break;
        default:
          /* @__PURE__ */ ((_) => {
          })(check);
      }
    }
  }
  return res;
}
function escapeLiteralCheckValue(literal, refs) {
  return refs.patternStrategy === "escape" ? escapeNonAlphaNumeric(literal) : literal;
}
var ALPHA_NUMERIC = new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function escapeNonAlphaNumeric(source) {
  let result = "";
  for (let i = 0; i < source.length; i++) {
    if (!ALPHA_NUMERIC.has(source[i])) {
      result += "\\";
    }
    result += source[i];
  }
  return result;
}
function addFormat(schema, value, message, refs) {
  if (schema.format || schema.anyOf?.some((x) => x.format)) {
    if (!schema.anyOf) {
      schema.anyOf = [];
    }
    if (schema.format) {
      schema.anyOf.push({
        format: schema.format,
        ...schema.errorMessage && refs.errorMessages && {
          errorMessage: { format: schema.errorMessage.format }
        }
      });
      delete schema.format;
      if (schema.errorMessage) {
        delete schema.errorMessage.format;
        if (Object.keys(schema.errorMessage).length === 0) {
          delete schema.errorMessage;
        }
      }
    }
    schema.anyOf.push({
      format: value,
      ...message && refs.errorMessages && { errorMessage: { format: message } }
    });
  } else {
    setResponseValueAndErrors(schema, "format", value, message, refs);
  }
}
function addPattern(schema, regex, message, refs) {
  if (schema.pattern || schema.allOf?.some((x) => x.pattern)) {
    if (!schema.allOf) {
      schema.allOf = [];
    }
    if (schema.pattern) {
      schema.allOf.push({
        pattern: schema.pattern,
        ...schema.errorMessage && refs.errorMessages && {
          errorMessage: { pattern: schema.errorMessage.pattern }
        }
      });
      delete schema.pattern;
      if (schema.errorMessage) {
        delete schema.errorMessage.pattern;
        if (Object.keys(schema.errorMessage).length === 0) {
          delete schema.errorMessage;
        }
      }
    }
    schema.allOf.push({
      pattern: stringifyRegExpWithFlags(regex, refs),
      ...message && refs.errorMessages && { errorMessage: { pattern: message } }
    });
  } else {
    setResponseValueAndErrors(schema, "pattern", stringifyRegExpWithFlags(regex, refs), message, refs);
  }
}
function stringifyRegExpWithFlags(regex, refs) {
  if (!refs.applyRegexFlags || !regex.flags) {
    return regex.source;
  }
  const flags = {
    i: regex.flags.includes("i"),
    m: regex.flags.includes("m"),
    s: regex.flags.includes("s")
    // `.` matches newlines
  };
  const source = flags.i ? regex.source.toLowerCase() : regex.source;
  let pattern = "";
  let isEscaped = false;
  let inCharGroup = false;
  let inCharRange = false;
  for (let i = 0; i < source.length; i++) {
    if (isEscaped) {
      pattern += source[i];
      isEscaped = false;
      continue;
    }
    if (flags.i) {
      if (inCharGroup) {
        if (source[i].match(/[a-z]/)) {
          if (inCharRange) {
            pattern += source[i];
            pattern += `${source[i - 2]}-${source[i]}`.toUpperCase();
            inCharRange = false;
          } else if (source[i + 1] === "-" && source[i + 2]?.match(/[a-z]/)) {
            pattern += source[i];
            inCharRange = true;
          } else {
            pattern += `${source[i]}${source[i].toUpperCase()}`;
          }
          continue;
        }
      } else if (source[i].match(/[a-z]/)) {
        pattern += `[${source[i]}${source[i].toUpperCase()}]`;
        continue;
      }
    }
    if (flags.m) {
      if (source[i] === "^") {
        pattern += `(^|(?<=[\r
]))`;
        continue;
      } else if (source[i] === "$") {
        pattern += `($|(?=[\r
]))`;
        continue;
      }
    }
    if (flags.s && source[i] === ".") {
      pattern += inCharGroup ? `${source[i]}\r
` : `[${source[i]}\r
]`;
      continue;
    }
    pattern += source[i];
    if (source[i] === "\\") {
      isEscaped = true;
    } else if (inCharGroup && source[i] === "]") {
      inCharGroup = false;
    } else if (!inCharGroup && source[i] === "[") {
      inCharGroup = true;
    }
  }
  try {
    new RegExp(pattern);
  } catch {
    console.warn(`Could not convert regex pattern at ${refs.currentPath.join("/")} to a flag-independent form! Falling back to the flag-ignorant source`);
    return regex.source;
  }
  return pattern;
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/record.js
function parseRecordDef(def, refs) {
  if (refs.target === "openAi") {
    console.warn("Warning: OpenAI may not support records in schemas! Try an array of key-value pairs instead.");
  }
  if (refs.target === "openApi3" && def.keyType?._def.typeName === ZodFirstPartyTypeKind2.ZodEnum) {
    return {
      type: "object",
      required: def.keyType._def.values,
      properties: def.keyType._def.values.reduce((acc, key) => ({
        ...acc,
        [key]: parseDef(def.valueType._def, {
          ...refs,
          currentPath: [...refs.currentPath, "properties", key]
        }) ?? parseAnyDef(refs)
      }), {}),
      additionalProperties: refs.rejectedAdditionalProperties
    };
  }
  const schema = {
    type: "object",
    additionalProperties: parseDef(def.valueType._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    }) ?? refs.allowedAdditionalProperties
  };
  if (refs.target === "openApi3") {
    return schema;
  }
  if (def.keyType?._def.typeName === ZodFirstPartyTypeKind2.ZodString && def.keyType._def.checks?.length) {
    const { type, ...keyType } = parseStringDef(def.keyType._def, refs);
    return {
      ...schema,
      propertyNames: keyType
    };
  } else if (def.keyType?._def.typeName === ZodFirstPartyTypeKind2.ZodEnum) {
    return {
      ...schema,
      propertyNames: {
        enum: def.keyType._def.values
      }
    };
  } else if (def.keyType?._def.typeName === ZodFirstPartyTypeKind2.ZodBranded && def.keyType._def.type._def.typeName === ZodFirstPartyTypeKind2.ZodString && def.keyType._def.type._def.checks?.length) {
    const { type, ...keyType } = parseBrandedDef(def.keyType._def, refs);
    return {
      ...schema,
      propertyNames: keyType
    };
  }
  return schema;
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/map.js
function parseMapDef(def, refs) {
  if (refs.mapStrategy === "record") {
    return parseRecordDef(def, refs);
  }
  const keys = parseDef(def.keyType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "0"]
  }) || parseAnyDef(refs);
  const values = parseDef(def.valueType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "1"]
  }) || parseAnyDef(refs);
  return {
    type: "array",
    maxItems: 125,
    items: {
      type: "array",
      items: [keys, values],
      minItems: 2,
      maxItems: 2
    }
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/nativeEnum.js
init_esm_shims();
function parseNativeEnumDef(def) {
  const object = def.values;
  const actualKeys = Object.keys(def.values).filter((key) => {
    return typeof object[object[key]] !== "number";
  });
  const actualValues = actualKeys.map((key) => object[key]);
  const parsedTypes = Array.from(new Set(actualValues.map((values) => typeof values)));
  return {
    type: parsedTypes.length === 1 ? parsedTypes[0] === "string" ? "string" : "number" : ["string", "number"],
    enum: actualValues
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/never.js
init_esm_shims();
function parseNeverDef(refs) {
  return refs.target === "openAi" ? void 0 : {
    not: parseAnyDef({
      ...refs,
      currentPath: [...refs.currentPath, "not"]
    })
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/null.js
init_esm_shims();
function parseNullDef(refs) {
  return refs.target === "openApi3" ? {
    enum: ["null"],
    nullable: true
  } : {
    type: "null"
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/nullable.js
init_esm_shims();

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/union.js
init_esm_shims();
var primitiveMappings = {
  ZodString: "string",
  ZodNumber: "number",
  ZodBigInt: "integer",
  ZodBoolean: "boolean",
  ZodNull: "null"
};
function parseUnionDef(def, refs) {
  if (refs.target === "openApi3")
    return asAnyOf(def, refs);
  const options = def.options instanceof Map ? Array.from(def.options.values()) : def.options;
  if (options.every((x) => x._def.typeName in primitiveMappings && (!x._def.checks || !x._def.checks.length))) {
    const types = options.reduce((types2, x) => {
      const type = primitiveMappings[x._def.typeName];
      return type && !types2.includes(type) ? [...types2, type] : types2;
    }, []);
    return {
      type: types.length > 1 ? types : types[0]
    };
  } else if (options.every((x) => x._def.typeName === "ZodLiteral" && !x.description)) {
    const types = options.reduce((acc, x) => {
      const type = typeof x._def.value;
      switch (type) {
        case "string":
        case "number":
        case "boolean":
          return [...acc, type];
        case "bigint":
          return [...acc, "integer"];
        case "object":
          if (x._def.value === null)
            return [...acc, "null"];
        case "symbol":
        case "undefined":
        case "function":
        default:
          return acc;
      }
    }, []);
    if (types.length === options.length) {
      const uniqueTypes = types.filter((x, i, a) => a.indexOf(x) === i);
      return {
        type: uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes[0],
        enum: options.reduce((acc, x) => {
          return acc.includes(x._def.value) ? acc : [...acc, x._def.value];
        }, [])
      };
    }
  } else if (options.every((x) => x._def.typeName === "ZodEnum")) {
    return {
      type: "string",
      enum: options.reduce((acc, x) => [
        ...acc,
        ...x._def.values.filter((x2) => !acc.includes(x2))
      ], [])
    };
  }
  return asAnyOf(def, refs);
}
var asAnyOf = (def, refs) => {
  const anyOf = (def.options instanceof Map ? Array.from(def.options.values()) : def.options).map((x, i) => parseDef(x._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", `${i}`]
  })).filter((x) => !!x && (!refs.strictUnions || typeof x === "object" && Object.keys(x).length > 0));
  return anyOf.length ? { anyOf } : void 0;
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/nullable.js
function parseNullableDef(def, refs) {
  if (["ZodString", "ZodNumber", "ZodBigInt", "ZodBoolean", "ZodNull"].includes(def.innerType._def.typeName) && (!def.innerType._def.checks || !def.innerType._def.checks.length)) {
    if (refs.target === "openApi3") {
      return {
        type: primitiveMappings[def.innerType._def.typeName],
        nullable: true
      };
    }
    return {
      type: [
        primitiveMappings[def.innerType._def.typeName],
        "null"
      ]
    };
  }
  if (refs.target === "openApi3") {
    const base2 = parseDef(def.innerType._def, {
      ...refs,
      currentPath: [...refs.currentPath]
    });
    if (base2 && "$ref" in base2)
      return { allOf: [base2], nullable: true };
    return base2 && { ...base2, nullable: true };
  }
  const base = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", "0"]
  });
  return base && { anyOf: [base, { type: "null" }] };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/number.js
init_esm_shims();
function parseNumberDef(def, refs) {
  const res = {
    type: "number"
  };
  if (!def.checks)
    return res;
  for (const check of def.checks) {
    switch (check.kind) {
      case "int":
        res.type = "integer";
        addErrorMessage(res, "type", check.message, refs);
        break;
      case "min":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMinimum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMinimum = true;
          }
          setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
        }
        break;
      case "max":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMaximum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMaximum = true;
          }
          setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
        }
        break;
      case "multipleOf":
        setResponseValueAndErrors(res, "multipleOf", check.value, check.message, refs);
        break;
    }
  }
  return res;
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/object.js
init_esm_shims();
function parseObjectDef(def, refs) {
  const forceOptionalIntoNullable = refs.target === "openAi";
  const result = {
    type: "object",
    properties: {}
  };
  const required = [];
  const shape = def.shape();
  for (const propName in shape) {
    let propDef = shape[propName];
    if (propDef === void 0 || propDef._def === void 0) {
      continue;
    }
    let propOptional = safeIsOptional(propDef);
    if (propOptional && forceOptionalIntoNullable) {
      if (propDef._def.typeName === "ZodOptional") {
        propDef = propDef._def.innerType;
      }
      if (!propDef.isNullable()) {
        propDef = propDef.nullable();
      }
      propOptional = false;
    }
    const parsedDef = parseDef(propDef._def, {
      ...refs,
      currentPath: [...refs.currentPath, "properties", propName],
      propertyPath: [...refs.currentPath, "properties", propName]
    });
    if (parsedDef === void 0) {
      continue;
    }
    result.properties[propName] = parsedDef;
    if (!propOptional) {
      required.push(propName);
    }
  }
  if (required.length) {
    result.required = required;
  }
  const additionalProperties = decideAdditionalProperties(def, refs);
  if (additionalProperties !== void 0) {
    result.additionalProperties = additionalProperties;
  }
  return result;
}
function decideAdditionalProperties(def, refs) {
  if (def.catchall._def.typeName !== "ZodNever") {
    return parseDef(def.catchall._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    });
  }
  switch (def.unknownKeys) {
    case "passthrough":
      return refs.allowedAdditionalProperties;
    case "strict":
      return refs.rejectedAdditionalProperties;
    case "strip":
      return refs.removeAdditionalStrategy === "strict" ? refs.allowedAdditionalProperties : refs.rejectedAdditionalProperties;
  }
}
function safeIsOptional(schema) {
  try {
    return schema.isOptional();
  } catch {
    return true;
  }
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/optional.js
init_esm_shims();
var parseOptionalDef = (def, refs) => {
  if (refs.currentPath.toString() === refs.propertyPath?.toString()) {
    return parseDef(def.innerType._def, refs);
  }
  const innerSchema = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", "1"]
  });
  return innerSchema ? {
    anyOf: [
      {
        not: parseAnyDef(refs)
      },
      innerSchema
    ]
  } : parseAnyDef(refs);
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/pipeline.js
init_esm_shims();
var parsePipelineDef = (def, refs) => {
  if (refs.pipeStrategy === "input") {
    return parseDef(def.in._def, refs);
  } else if (refs.pipeStrategy === "output") {
    return parseDef(def.out._def, refs);
  }
  const a = parseDef(def.in._def, {
    ...refs,
    currentPath: [...refs.currentPath, "allOf", "0"]
  });
  const b = parseDef(def.out._def, {
    ...refs,
    currentPath: [...refs.currentPath, "allOf", a ? "1" : "0"]
  });
  return {
    allOf: [a, b].filter((x) => x !== void 0)
  };
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/promise.js
init_esm_shims();
function parsePromiseDef(def, refs) {
  return parseDef(def.type._def, refs);
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/set.js
init_esm_shims();
function parseSetDef(def, refs) {
  const items = parseDef(def.valueType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items"]
  });
  const schema = {
    type: "array",
    uniqueItems: true,
    items
  };
  if (def.minSize) {
    setResponseValueAndErrors(schema, "minItems", def.minSize.value, def.minSize.message, refs);
  }
  if (def.maxSize) {
    setResponseValueAndErrors(schema, "maxItems", def.maxSize.value, def.maxSize.message, refs);
  }
  return schema;
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/tuple.js
init_esm_shims();
function parseTupleDef(def, refs) {
  if (def.rest) {
    return {
      type: "array",
      minItems: def.items.length,
      items: def.items.map((x, i) => parseDef(x._def, {
        ...refs,
        currentPath: [...refs.currentPath, "items", `${i}`]
      })).reduce((acc, x) => x === void 0 ? acc : [...acc, x], []),
      additionalItems: parseDef(def.rest._def, {
        ...refs,
        currentPath: [...refs.currentPath, "additionalItems"]
      })
    };
  } else {
    return {
      type: "array",
      minItems: def.items.length,
      maxItems: def.items.length,
      items: def.items.map((x, i) => parseDef(x._def, {
        ...refs,
        currentPath: [...refs.currentPath, "items", `${i}`]
      })).reduce((acc, x) => x === void 0 ? acc : [...acc, x], [])
    };
  }
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/undefined.js
init_esm_shims();
function parseUndefinedDef(refs) {
  return {
    not: parseAnyDef(refs)
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/unknown.js
init_esm_shims();
function parseUnknownDef(refs) {
  return parseAnyDef(refs);
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/readonly.js
init_esm_shims();
var parseReadonlyDef = (def, refs) => {
  return parseDef(def.innerType._def, refs);
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/selectParser.js
var selectParser = (def, typeName, refs) => {
  switch (typeName) {
    case ZodFirstPartyTypeKind3.ZodString:
      return parseStringDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodNumber:
      return parseNumberDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodObject:
      return parseObjectDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodBigInt:
      return parseBigintDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodBoolean:
      return parseBooleanDef();
    case ZodFirstPartyTypeKind3.ZodDate:
      return parseDateDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodUndefined:
      return parseUndefinedDef(refs);
    case ZodFirstPartyTypeKind3.ZodNull:
      return parseNullDef(refs);
    case ZodFirstPartyTypeKind3.ZodArray:
      return parseArrayDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodUnion:
    case ZodFirstPartyTypeKind3.ZodDiscriminatedUnion:
      return parseUnionDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodIntersection:
      return parseIntersectionDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodTuple:
      return parseTupleDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodRecord:
      return parseRecordDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodLiteral:
      return parseLiteralDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodEnum:
      return parseEnumDef(def);
    case ZodFirstPartyTypeKind3.ZodNativeEnum:
      return parseNativeEnumDef(def);
    case ZodFirstPartyTypeKind3.ZodNullable:
      return parseNullableDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodOptional:
      return parseOptionalDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodMap:
      return parseMapDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodSet:
      return parseSetDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodLazy:
      return () => def.getter()._def;
    case ZodFirstPartyTypeKind3.ZodPromise:
      return parsePromiseDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodNaN:
    case ZodFirstPartyTypeKind3.ZodNever:
      return parseNeverDef(refs);
    case ZodFirstPartyTypeKind3.ZodEffects:
      return parseEffectsDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodAny:
      return parseAnyDef(refs);
    case ZodFirstPartyTypeKind3.ZodUnknown:
      return parseUnknownDef(refs);
    case ZodFirstPartyTypeKind3.ZodDefault:
      return parseDefaultDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodBranded:
      return parseBrandedDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodReadonly:
      return parseReadonlyDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodCatch:
      return parseCatchDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodPipeline:
      return parsePipelineDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodFunction:
    case ZodFirstPartyTypeKind3.ZodVoid:
    case ZodFirstPartyTypeKind3.ZodSymbol:
      return void 0;
    default:
      return /* @__PURE__ */ ((_) => void 0)(typeName);
  }
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parseDef.js
function parseDef(def, refs, forceResolution = false) {
  const seenItem = refs.seen.get(def);
  if (refs.override) {
    const overrideResult = refs.override?.(def, refs, seenItem, forceResolution);
    if (overrideResult !== ignoreOverride) {
      return overrideResult;
    }
  }
  if (seenItem && !forceResolution) {
    const seenSchema = get$ref(seenItem, refs);
    if (seenSchema !== void 0) {
      return seenSchema;
    }
  }
  const newItem = { def, path: refs.currentPath, jsonSchema: void 0 };
  refs.seen.set(def, newItem);
  const jsonSchemaOrGetter = selectParser(def, def.typeName, refs);
  const jsonSchema = typeof jsonSchemaOrGetter === "function" ? parseDef(jsonSchemaOrGetter(), refs) : jsonSchemaOrGetter;
  if (jsonSchema) {
    addMeta(def, refs, jsonSchema);
  }
  if (refs.postProcess) {
    const postProcessResult = refs.postProcess(jsonSchema, def, refs);
    newItem.jsonSchema = jsonSchema;
    return postProcessResult;
  }
  newItem.jsonSchema = jsonSchema;
  return jsonSchema;
}
var get$ref = (item, refs) => {
  switch (refs.$refStrategy) {
    case "root":
      return { $ref: item.path.join("/") };
    case "relative":
      return { $ref: getRelativePath(refs.currentPath, item.path) };
    case "none":
    case "seen": {
      if (item.path.length < refs.currentPath.length && item.path.every((value, index) => refs.currentPath[index] === value)) {
        console.warn(`Recursive reference detected at ${refs.currentPath.join("/")}! Defaulting to any`);
        return parseAnyDef(refs);
      }
      return refs.$refStrategy === "seen" ? parseAnyDef(refs) : void 0;
    }
  }
};
var addMeta = (def, refs, jsonSchema) => {
  if (def.description) {
    jsonSchema.description = def.description;
    if (refs.markdownDescription) {
      jsonSchema.markdownDescription = def.description;
    }
  }
  return jsonSchema;
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parseTypes.js
init_esm_shims();

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/zodToJsonSchema.js
init_esm_shims();
var zodToJsonSchema = (schema, options) => {
  const refs = getRefs(options);
  let definitions = typeof options === "object" && options.definitions ? Object.entries(options.definitions).reduce((acc, [name2, schema2]) => ({
    ...acc,
    [name2]: parseDef(schema2._def, {
      ...refs,
      currentPath: [...refs.basePath, refs.definitionPath, name2]
    }, true) ?? parseAnyDef(refs)
  }), {}) : void 0;
  const name = typeof options === "string" ? options : options?.nameStrategy === "title" ? void 0 : options?.name;
  const main = parseDef(schema._def, name === void 0 ? refs : {
    ...refs,
    currentPath: [...refs.basePath, refs.definitionPath, name]
  }, false) ?? parseAnyDef(refs);
  const title = typeof options === "object" && options.name !== void 0 && options.nameStrategy === "title" ? options.name : void 0;
  if (title !== void 0) {
    main.title = title;
  }
  if (refs.flags.hasReferencedOpenAiAnyType) {
    if (!definitions) {
      definitions = {};
    }
    if (!definitions[refs.openAiAnyTypeName]) {
      definitions[refs.openAiAnyTypeName] = {
        // Skipping "object" as no properties can be defined and additionalProperties must be "false"
        type: ["string", "number", "integer", "boolean", "array", "null"],
        items: {
          $ref: refs.$refStrategy === "relative" ? "1" : [
            ...refs.basePath,
            refs.definitionPath,
            refs.openAiAnyTypeName
          ].join("/")
        }
      };
    }
  }
  const combined = name === void 0 ? definitions ? {
    ...main,
    [refs.definitionPath]: definitions
  } : main : {
    $ref: [
      ...refs.$refStrategy === "relative" ? [] : refs.basePath,
      refs.definitionPath,
      name
    ].join("/"),
    [refs.definitionPath]: {
      ...definitions,
      [name]: main
    }
  };
  if (refs.target === "jsonSchema7") {
    combined.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (refs.target === "jsonSchema2019-09" || refs.target === "openAi") {
    combined.$schema = "https://json-schema.org/draft/2019-09/schema#";
  }
  if (refs.target === "openAi" && ("anyOf" in combined || "oneOf" in combined || "allOf" in combined || "type" in combined && Array.isArray(combined.type))) {
    console.warn("Warning: OpenAI may not support schemas with unions as roots! Try wrapping it in an object property.");
  }
  return combined;
};

// src/modules/agent/responseSchema.ts
var llmResponseSchema = z.object({
  answer: z.string().optional().describe(
    "The final answer to the user's request. Use this when you have completed the task and are ready to respond to the user."
  ),
  canvas: z.object({
    content: z.string().describe(
      "The content to display on the canvas. Can be HTML, Markdown, or just text."
    ),
    contentType: z.enum(["html", "markdown", "text", "url"]).describe("The content type of the canvas content.")
  }).optional().describe(
    "The canvas is a visual workspace. Use it to display rich content to the user, like charts, tables, or interactive elements."
  ),
  command: z.object({
    name: z.string().describe("The name of the tool to execute."),
    params: z.record(z.string(), z.any()).optional().describe("The parameters for the tool, as a JSON object.")
  }).optional().describe("The command to execute. Use this to call a tool."),
  thought: z.string().optional().describe(
    "Your internal monologue and reasoning. Use it to think through problems, explain your approach, and communicate your thought process. This appears as a chat bubble in the conversation flow for the user to see your reasoning."
  )
});
function getResponseJsonSchema() {
  return zodToJsonSchema(llmResponseSchema, {
    $refStrategy: "none"
  });
}

// src/modules/agent/orchestrator.prompt.ts
var __filename2 = fileURLToPath(import.meta.url);
var __dirname2 = path.dirname(__filename2);
var promptFilePath = path.resolve(__dirname2, "system.prompt.md");
var PREAMBLE_CONTENT = readFileSync(promptFilePath, "utf-8").replace(
  /`/g,
  "`"
);
var getPreamble = () => {
  const schema = JSON.stringify(getResponseJsonSchema(), null, 2);
  return PREAMBLE_CONTENT.replace("{{RESPONSE_JSON_SCHEMA}}", schema);
};
var TOOLS_SECTION_HEADER = "## Available Tools:";
var HISTORY_SECTION_HEADER = "## Conversation History:";
var WORKING_CONTEXT_HEADER = "## Working Context:";
var zodToJsonSchema2 = (_schema) => {
  if (!_schema || !_schema._def || !_schema._def.typeName) {
    throw new Error(
      `Invalid Zod schema provided for JSON schema conversion: ${JSON.stringify(_schema)}`
    );
  }
  const jsonSchema = {};
  if (_schema.description) {
    jsonSchema.description = _schema.description;
  }
  switch (_schema._def.typeName) {
    case "ZodAny":
      jsonSchema.type = [
        "string",
        "number",
        "boolean",
        "object",
        "array",
        "null"
      ];
      jsonSchema.description = "Accepts any type of value";
      break;
    case "ZodArray":
      jsonSchema.type = "array";
      jsonSchema.items = zodToJsonSchema2(_schema._def.type);
      break;
    case "ZodBoolean":
      jsonSchema.type = "boolean";
      break;
    case "ZodDefault": {
      const innerSchema = zodToJsonSchema2(_schema._def.innerType);
      innerSchema.default = _schema._def.defaultValue();
      return innerSchema;
    }
    case "ZodEffects": {
      return zodToJsonSchema2(_schema._def.schema);
    }
    case "ZodEnum":
      jsonSchema.type = "string";
      jsonSchema.enum = _schema._def.values;
      break;
    case "ZodLiteral": {
      const literalValue = _schema._def.value;
      jsonSchema.type = typeof literalValue;
      jsonSchema.const = literalValue;
      break;
    }
    case "ZodNullable":
    case "ZodOptional":
      return zodToJsonSchema2(_schema._def.innerType);
    case "ZodNumber":
      jsonSchema.type = "number";
      break;
    case "ZodObject": {
      jsonSchema.type = "object";
      jsonSchema.properties = {};
      jsonSchema.$schema = "http://json-schema.org/draft-07/schema#";
      jsonSchema.additionalProperties = false;
      const required = [];
      for (const key in _schema.shape) {
        const field = _schema.shape[key];
        jsonSchema.properties[key] = zodToJsonSchema2(field);
        if (!field.isOptional() && !field.isNullable()) {
          required.push(key);
        }
      }
      if (required.length > 0) {
        jsonSchema.required = required;
      }
      break;
    }
    case "ZodRecord":
      jsonSchema.type = "object";
      jsonSchema.additionalProperties = _schema._def.valueType ? zodToJsonSchema2(_schema._def.valueType) : { type: ["string", "number", "boolean", "object", "array", "null"] };
      break;
    case "ZodString":
      jsonSchema.type = "string";
      break;
    case "ZodUnion":
      jsonSchema.anyOf = _schema._def.options.map(
        (option) => zodToJsonSchema2(option)
      );
      break;
    case "ZodUnknown":
      jsonSchema.type = [
        "string",
        "number",
        "boolean",
        "object",
        "array",
        "null"
      ];
      jsonSchema.description = "Accepts unknown type of value";
      break;
    default:
      throw new Error(
        `Unsupported Zod type for JSON schema conversion: ${_schema._def.typeName}`
      );
  }
  return jsonSchema;
};
var formatToolForPrompt = (tool) => {
  if (!tool.parameters) {
    return `### ${tool.name}
Description: ${tool.description}
Parameters: None
`;
  }
  if (typeof tool.parameters !== "object" || !("_def" in tool.parameters)) {
    throw new Error("Invalid Zod schema provided");
  }
  if (!("shape" in tool.parameters) || Object.keys(tool.parameters.shape).length === 0) {
    return `### ${tool.name}
Description: ${tool.description}
Parameters: None
`;
  }
  const params = JSON.stringify(zodToJsonSchema2(tool.parameters), null, 2);
  return `### ${tool.name}
Description: ${tool.description}
Parameters (JSON Schema):
${params}
`;
};
var formatHistoryMessage = (message) => {
  let role;
  let content;
  switch (message.type) {
    case "agent_canvas_output":
      role = "ASSISTANT";
      content = `Canvas Output (${message.contentType}):
${message.content}`;
      break;
    case "agent_response":
      role = "ASSISTANT";
      content = message.content;
      break;
    case "agent_thought":
      role = "ASSISTANT";
      content = `Thought: ${message.content}`;
      break;
    case "error":
      role = "SYSTEM";
      content = `Error: ${message.content}`;
      break;
    case "tool_call":
      role = "ASSISTANT";
      content = `Tool Call: ${message.toolName}(${JSON.stringify(message.params, null, 2)})`;
      break;
    case "tool_result":
      role = "OBSERVATION";
      content = `Tool Result from ${message.toolName}: ${JSON.stringify(message.result, null, 2)}`;
      break;
    case "user":
      role = "USER";
      content = message.content;
      break;
    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
  const MAX_CONTENT_LENGTH = 5e3;
  if (content.length > MAX_CONTENT_LENGTH) {
    content = `${content.substring(0, MAX_CONTENT_LENGTH)}... (truncated)`;
  }
  return `${role}:
${content}`;
};
var getMasterPrompt = (session, tools) => {
  let workingContextSection = "";
  if (session.data.workingContext) {
    workingContextSection = `${WORKING_CONTEXT_HEADER}
${JSON.stringify(
      session.data.workingContext,
      null,
      2
    )}

`;
  }
  const formattedTools = tools.map(formatToolForPrompt).join("\n");
  const toolsSection = `${TOOLS_SECTION_HEADER}
${formattedTools}`;
  const formattedHistory = (session.data.history || []).map(formatHistoryMessage).join("\n\n");
  const historySection = formattedHistory.length > 0 ? `${HISTORY_SECTION_HEADER}
${formattedHistory}` : "";
  return `${getPreamble()}

${workingContextSection}${toolsSection}

${historySection}

ASSISTANT's turn. Your response:`;
};

// src/modules/agent/agent.ts
var Agent = class {
  constructor(job, session, taskQueue, tools, activeLlmProvider, sessionManager, apiKey, llmModelName, llmApiKey) {
    this.llmModelName = llmModelName;
    this.llmApiKey = llmApiKey;
    this.job = job;
    this.session = session;
    this.log = getLoggerInstance().child({
      jobId: job.id,
      sessionId: session.id
    });
    this.taskQueue = taskQueue;
    this.tools = tools ?? [];
    this.activeLlmProvider = activeLlmProvider;
    this.session.activeLlmProvider = activeLlmProvider;
    this.sessionManager = sessionManager;
    this.apiKey = apiKey;
    this.behaviorHistory = [];
    this.loopDetectionThreshold = 3;
  }
  activeLlmProvider;
  // New property
  apiKey;
  // New property
  // Loop detection properties
  behaviorHistory = [];
  commandHistory = [];
  interrupted = false;
  job;
  log;
  loopCounter = 0;
  loopDetectionThreshold = 3;
  // Detect loops after 3 repetitions
  malformedResponseCounter = 0;
  maxBehaviorHistory = 10;
  // Keep track of last 10 behaviors
  session;
  sessionManager;
  // New property
  subscriber;
  taskQueue;
  tools;
  async run() {
    this.log.info("Agent starting...");
    await this.setupInterruptListener();
    try {
      const jobData = this.job.data;
      const { prompt } = jobData;
      const newUserMessage = {
        content: prompt,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: "user"
      };
      this.session.history.push(newUserMessage);
      let iterations = 0;
      const MAX_ITERATIONS = config.AGENT_MAX_ITERATIONS ?? 10;
      while (iterations < MAX_ITERATIONS) {
        if (this.interrupted) {
          this.log.info("Job has been interrupted.");
          break;
        }
        if (await this.job.isFailed()) {
          this.log.info("Job has failed.");
          this.interrupted = true;
          break;
        }
        iterations++;
        const iterationLog = this.log.child({ iteration: iterations });
        iterationLog.info(`Agent iteration starting`);
        const thinkingMessage = {
          content: `The agent is thinking... (iteration ${iterations})`,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: "agent_thought"
        };
        this.session.history.push(thinkingMessage);
        this.publishToChannel(thinkingMessage);
        try {
          const orchestratorPrompt = getMasterPrompt(
            { data: this.session, id: String(this.session.id) },
            this.tools
          );
          const messagesForLlm = this.session.history.map((message) => {
            switch (message.type) {
              case "agent_canvas_output":
                return null;
              case "agent_response":
              case "agent_thought":
                const agentMessage = message;
                if (typeof agentMessage.content === "string") {
                  return {
                    parts: [{ text: agentMessage.content }],
                    role: "model"
                  };
                }
                return null;
              case "error":
                const errorMessage = message;
                return {
                  parts: [{ text: `Error: ${errorMessage.content}` }],
                  role: "tool"
                };
              case "tool_call":
                const toolCallMessage = message;
                return {
                  parts: [
                    {
                      text: `Tool Call: ${toolCallMessage.toolName} with params ${JSON.stringify(toolCallMessage.params)}`
                    }
                  ],
                  role: "tool"
                };
              case "tool_result":
                const toolResultMessage = message;
                return {
                  parts: [
                    {
                      text: `Tool Result: ${toolResultMessage.toolName} output: ${JSON.stringify(toolResultMessage.result)}`
                    }
                  ],
                  role: "tool"
                };
              case "user":
                if (message.type === "user" && typeof message.content === "string") {
                  return {
                    parts: [{ text: message.content }],
                    role: "user"
                  };
                }
                return null;
              default:
                return null;
            }
          }).filter((m) => m !== null);
          let llmResponse;
          let currentProviderIndex = config.LLM_PROVIDER_HIERARCHY.indexOf(
            this.activeLlmProvider
          );
          if (currentProviderIndex === -1) {
            currentProviderIndex = 0;
          }
          let qwenTimeoutRetries = 0;
          const MAX_QWEN_TIMEOUT_RETRIES = 8;
          const INITIAL_RETRIES_WITHOUT_DELAY = 4;
          for (let i = 0; i < config.LLM_PROVIDER_HIERARCHY.length; i++) {
            const providerToTry = config.LLM_PROVIDER_HIERARCHY[(currentProviderIndex + i) % config.LLM_PROVIDER_HIERARCHY.length];
            this.log.info(
              `Attempting LLM call with provider: ${providerToTry}`
            );
            try {
              if (!await LlmKeyManager.hasAvailableKeys(providerToTry)) {
                this.log.warn(
                  `No available keys for provider ${providerToTry}. Skipping.`
                );
                continue;
              }
              if (providerToTry === "qwen" && qwenTimeoutRetries >= INITIAL_RETRIES_WITHOUT_DELAY) {
                const delayMs = 2e3 + (qwenTimeoutRetries - INITIAL_RETRIES_WITHOUT_DELAY) * 1e3;
                this.log.info(
                  `Adding delay of ${delayMs}ms before Qwen API call (retry ${qwenTimeoutRetries + 1})`
                );
                await new Promise((resolve) => setTimeout(resolve, delayMs));
              }
              llmResponse = await getLlmProvider(providerToTry).getLlmResponse(
                messagesForLlm,
                orchestratorPrompt,
                this.llmApiKey || this.apiKey,
                this.llmModelName
              );
              this.activeLlmProvider = providerToTry;
              this.session.activeLlmProvider = providerToTry;
              await this.sessionManager.saveSession(
                this.session,
                this.job,
                this.taskQueue
              );
              this.log.info(
                { llmResponse, provider: providerToTry },
                "Raw LLM response"
              );
              break;
            } catch (llmError) {
              if (llmError instanceof LlmError && providerToTry === "qwen" && (llmError.message.includes(
                "Qwen API request failed with status 504"
              ) && llmError.message.includes("stream timeout") || llmError.message.includes(
                "Qwen API request failed with status 502"
              ))) {
                qwenTimeoutRetries++;
                this.log.warn(
                  `Qwen API error encountered (${qwenTimeoutRetries}/${MAX_QWEN_TIMEOUT_RETRIES}): ${llmError.message}`
                );
                if (qwenTimeoutRetries < MAX_QWEN_TIMEOUT_RETRIES) {
                  if (qwenTimeoutRetries >= INITIAL_RETRIES_WITHOUT_DELAY) {
                    const delayMs = 2e3 + (qwenTimeoutRetries - INITIAL_RETRIES_WITHOUT_DELAY) * 1e3;
                    this.log.info(
                      `Adding delay of ${delayMs}ms before retrying Qwen API call (retry ${qwenTimeoutRetries + 1})`
                    );
                    await new Promise(
                      (resolve) => setTimeout(resolve, delayMs)
                    );
                  }
                  i--;
                  continue;
                } else {
                  this.log.error(
                    `Max Qwen retries (${MAX_QWEN_TIMEOUT_RETRIES}) reached. Moving to next provider.`
                  );
                  qwenTimeoutRetries = 0;
                  continue;
                }
              } else if (llmError instanceof LlmError && llmError.message.includes("No LLM API key available")) {
                this.log.warn(
                  `No LLM API key available for ${providerToTry}. Trying next provider in hierarchy.`
                );
                continue;
              } else {
                throw llmError;
              }
            }
          }
          if (llmResponse === void 0) {
            throw new LlmError(
              "No LLM provider in the hierarchy could provide a response."
            );
          }
          if (this.interrupted) {
            this.log.info("Job has been interrupted.");
            break;
          }
          if (typeof llmResponse !== "string" || llmResponse.trim() === "") {
            this.log.error(
              { llmResponse, type: typeof llmResponse },
              "The `generate` tool did not return a string as expected or returned an empty string."
            );
            this.session.history.push({
              content: "Error: The `generate` tool returned an unexpected non-string or empty response.",
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: "error"
            });
            this.malformedResponseCounter++;
            if (this.malformedResponseCounter > 2) {
              this.log.error("Malformed response limit reached. Breaking.");
              return "Agent stopped due to persistent malformed responses.";
            }
            continue;
          }
          this.malformedResponseCounter = 0;
          const parsedResponse = this.parseLlmResponse(
            llmResponse,
            iterationLog
          );
          this.log.debug(
            { parsedResponse },
            "Parsed LLM response before answer check"
          );
          const { answer, canvas, command, thought } = parsedResponse;
          if (answer) {
            this.session.history.push({
              content: answer,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: "agent_response"
            });
            iterationLog.info({ answer }, "Agent final answer");
            this.publishToChannel({ content: answer, type: "agent_response" });
            return answer;
          }
          if (this.detectLoop(thought, command)) {
            this.log.error(
              "Loop detected in agent behavior. Stopping execution."
            );
            return "Agent stopped due to detected loop in behavior.";
          }
          if (thought) {
            this.session.history.push({
              content: thought,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: "agent_thought"
            });
          }
          if (command) {
            this.session.history.push({
              id: crypto.randomUUID(),
              params: command.params || {},
              timestamp: Date.now(),
              toolName: command.name,
              type: "tool_call"
            });
          }
          if (canvas) {
            this.session.history.push({
              content: canvas.content,
              contentType: canvas.contentType,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: "agent_canvas_output"
            });
          }
          if (this.interrupted) {
            this.log.info("Job has been interrupted.");
            break;
          }
          if (thought) {
            iterationLog.info({ thought }, "Agent thought");
            this.publishToChannel({ content: thought, type: "agent_thought" });
          }
          if (canvas) {
            iterationLog.info({ canvas }, "Agent canvas output");
            this.publishToChannel({
              content: canvas.content,
              contentType: canvas.contentType,
              type: "agent_canvas_output"
            });
            if (!command) {
              this.publishToChannel({ type: "agent_canvas_close" });
              return "Agent displayed content on the canvas.";
            }
          }
          if (answer) {
            iterationLog.info({ answer }, "Agent final answer");
            this.publishToChannel({ content: answer, type: "agent_response" });
            return answer;
          }
          if (command && command.name === "finish") {
            try {
              const finishResult = await this.executeTool(
                command,
                iterationLog
              );
              if (typeof finishResult === "object" && finishResult !== null && "answer" in finishResult && typeof finishResult.answer === "string") {
                const finalAnswer = finishResult.answer;
                iterationLog.info(
                  { finalAnswer },
                  "Agent finished via finish tool"
                );
                this.publishToChannel({
                  content: finalAnswer,
                  type: "agent_response"
                });
                this.session.history.push({
                  id: crypto.randomUUID(),
                  result: finishResult,
                  timestamp: Date.now(),
                  toolName: "finish",
                  type: "tool_result"
                });
                return finalAnswer;
              } else {
                const errorMessage = `Finish tool did not return a valid answer object: ${JSON.stringify(finishResult)}`;
                iterationLog.error(errorMessage);
                this.session.history.push({
                  content: `Error: ${errorMessage}`,
                  id: crypto.randomUUID(),
                  timestamp: Date.now(),
                  type: "error"
                });
                return errorMessage;
              }
            } catch (_error) {
              if (_error instanceof FinishToolSignal) {
                const finalAnswer = _error.message;
                iterationLog.info(
                  { finalAnswer },
                  "Agent finished via finish tool signal"
                );
                this.publishToChannel({
                  content: finalAnswer,
                  type: "agent_response"
                });
                this.session.history.push({
                  content: finalAnswer,
                  id: crypto.randomUUID(),
                  timestamp: Date.now(),
                  type: "agent_response"
                });
                return finalAnswer;
              } else {
                throw _error;
              }
            }
          } else if (command) {
            this.commandHistory.push(command);
            if (this.commandHistory.length > 5) {
              this.commandHistory.shift();
            }
            const lastTwoCommands = this.commandHistory.slice(-2);
            if (this.commandHistory.length > 1 && JSON.stringify(lastTwoCommands[0]) === JSON.stringify(lastTwoCommands[1])) {
              this.loopCounter++;
            } else {
              this.loopCounter = 0;
            }
            if (this.loopCounter > 2) {
              this.log.warn("Loop detected. Breaking.");
              return "Agent stuck in a loop.";
            }
            const toolResult = await this.executeTool(command, iterationLog);
            this.session.history.push({
              id: crypto.randomUUID(),
              result: toolResult,
              timestamp: Date.now(),
              toolName: command.name,
              type: "tool_result"
            });
            if (typeof toolResult === "string" && toolResult.startsWith("Error executing tool")) {
              this.session.history.push({
                content: `The tool execution failed with the following error: ${toolResult}. Please analyze the error and try a different approach. You can use another tool, or try to fix the problem with the previous tool.`,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type: "error"
              });
            }
          } else if (!thought && !canvas) {
            this.session.history.push({
              content: "You must provide a command, a thought, a canvas output, or a final answer.",
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: "error"
            });
          }
        } catch (_error) {
          if (_error instanceof FinishToolSignal) {
            this.log.info(
              { answer: _error.message },
              "Agent finished by tool signal."
            );
            this.publishToChannel({
              content: _error.message,
              type: "agent_response"
            });
            return _error.message;
          }
          let errorMessage;
          if (_error instanceof Error) {
            errorMessage = _error.message;
          } else {
            errorMessage = String(_error);
          }
          iterationLog.error(
            {
              error: _error instanceof Error ? _error : new Error(String(_error))
            },
            `Error in agent iteration: ${errorMessage}`
          );
          if (errorMessage.includes("Failed to parse LLM response")) {
            this.session.history.push({
              content: "I was unable to parse your last response. Please ensure your response is a valid JSON object with the expected properties (`thought`, `command`, `canvas`, or `answer`). Check for syntax errors, missing commas, or unclosed brackets.",
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: "error"
            });
            continue;
          } else if (errorMessage.includes("Error executing tool")) {
            continue;
          } else {
            this.session.history.push({
              content: `An unexpected error occurred: ${errorMessage}`,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: "error"
            });
            this.interrupted = true;
            return `Error in agent iteration: ${errorMessage}`;
          }
        }
      }
      if (this.interrupted) {
        return "Agent execution interrupted.";
      }
      if (iterations >= MAX_ITERATIONS) {
        return "Agent reached maximum iterations without a final answer.";
      }
      return "Agent reached maximum iterations without a final answer.";
    } catch (_error) {
      if (_error instanceof FinishToolSignal) {
        this.log.info(
          { answer: _error.message },
          "Agent finished by tool signal."
        );
        this.publishToChannel({
          content: _error.message,
          type: "agent_response"
        });
        return _error.message;
      }
      let errorMessage;
      if (_error instanceof Error) {
        errorMessage = _error.message;
      } else {
        errorMessage = String(_error);
      }
      this.log.error(
        {
          error: _error instanceof Error ? _error : new Error(String(_error))
        },
        `Agent run failed: ${errorMessage}`
      );
      return `Agent run failed: ${errorMessage}`;
    } finally {
      try {
        const redisClient = getRedisClientInstance();
        await redisClient.incr("leaderboard:successfulRuns");
        this.log.info("Successfully incremented successfulRuns counter");
      } catch (error) {
        this.log.error(
          { err: error },
          "Failed to increment successfulRuns in Redis"
        );
      }
      await this.cleanup();
    }
  }
  calculateTextSimilarity(text1, text2) {
    const set1 = new Set(text1.toLowerCase().split(/\s+/));
    const set2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = /* @__PURE__ */ new Set([...set1, ...set2]);
    return union.size === 0 ? 1 : intersection.size / union.size;
  }
  async cleanup() {
    if (this.subscriber) {
      const channel = `job:${this.job.id}:interrupt`;
      await this.subscriber.unsubscribe(channel);
      await this.subscriber.quit();
    }
  }
  /**
   * Converts plain text responses to valid JSON format
   * This handles cases where the LLM responds with plain text instead of JSON
   */
  convertPlainTextToValidJson(text) {
    const cleanText = text.trim();
    try {
      JSON.parse(cleanText);
      return cleanText;
    } catch {
    }
    const toolCallMatch = cleanText.match(/Tool Call:\s*(\w+)\s*with\s*params\s*(\{.*?\}(?:\s*$|\n|Tool Result:))/is);
    if (toolCallMatch) {
      const toolName = toolCallMatch[1];
      let params = {};
      let jsonStr = toolCallMatch[2].trim();
      const jsonEndMatch = jsonStr.match(/^(\{.*?\})(?:\s*(?:Tool Result:|$|\n))/s);
      if (jsonEndMatch) {
        jsonStr = jsonEndMatch[1];
      }
      try {
        params = JSON.parse(jsonStr);
      } catch (e) {
        let braceCount = 0;
        let jsonEnd = 0;
        for (let i = 0; i < jsonStr.length; i++) {
          if (jsonStr[i] === "{") braceCount++;
          if (jsonStr[i] === "}") braceCount--;
          if (braceCount === 0 && jsonStr[i] === "}") {
            jsonEnd = i + 1;
            break;
          }
        }
        if (jsonEnd > 0) {
          try {
            params = JSON.parse(jsonStr.substring(0, jsonEnd));
          } catch (e2) {
            const responseMatch = cleanText.match(/"response":\s*"([^"]+)"/);
            if (responseMatch && toolName.toLowerCase() === "finish") {
              params = { response: responseMatch[1] };
            }
          }
        }
      }
      const thoughtMatch = cleanText.match(/^(.*?)Tool Call:/s);
      const thought2 = thoughtMatch ? thoughtMatch[1].trim() : `Appel de l'outil ${toolName}`;
      return JSON.stringify({
        thought: thought2,
        command: {
          name: toolName.toLowerCase(),
          params
        }
      });
    }
    const lowerText = cleanText.toLowerCase();
    const canvasKeywords = [
      "canvas",
      "display",
      "show",
      "demo",
      "afficher",
      "montrer",
      "visual"
    ];
    const isCanvasRequest = canvasKeywords.some(
      (keyword) => lowerText.includes(keyword)
    );
    const thoughtKeywords = [
      "think",
      "thought",
      "reason",
      "plan",
      "approach",
      "next step",
      "r\xE9flexion",
      "pens\xE9e",
      "raisonnement",
      "prochaine \xE9tape",
      "je vais",
      "l'utilisateur souhaite"
    ];
    const isThoughtContent = thoughtKeywords.some(
      (keyword) => lowerText.includes(keyword)
    );
    const todoKeywords = [
      "todo",
      "task",
      "list",
      "step",
      "plan",
      "workflow",
      "t\xE2che",
      "\xE9tape"
    ];
    const isTodoRequest = todoKeywords.some(
      (keyword) => lowerText.includes(keyword)
    );
    const creationKeywords = [
      "create",
      "build",
      "make",
      "generate",
      "develop",
      "implement",
      "write",
      "game",
      "website",
      "app",
      "cr\xE9er",
      "construire",
      "faire",
      "g\xE9n\xE9rer",
      "d\xE9velopper",
      "impl\xE9menter",
      "\xE9crire"
    ];
    const isCreationRequest = creationKeywords.some(
      (keyword) => lowerText.includes(keyword)
    );
    let command;
    let thought;
    const isTruncated = this.isResponseTruncated(cleanText);
    if (isTruncated) {
      thought = "La r\xE9ponse de l'IA semble incompl\xE8te. Je vais demander une r\xE9ponse plus claire.";
      command = {
        name: "agent_thought",
        params: {
          thought: "La r\xE9ponse pr\xE9c\xE9dente de l'IA \xE9tait incompl\xE8te. Je vais reformuler ma demande pour obtenir une r\xE9ponse plus claire et compl\xE8te."
        }
      };
    } else if (isThoughtContent && !isCanvasRequest) {
      thought = cleanText;
      command = {
        name: "agent_thought",
        params: {
          thought: cleanText
        }
      };
    } else if (isCanvasRequest && !isThoughtContent) {
      thought = "L'utilisateur veut afficher quelque chose dans le canvas.";
      let filteredContent = cleanText;
      try {
        const parsed = JSON.parse(cleanText);
        if (parsed.thought || parsed.command) {
          filteredContent = "<div style='padding: 20px; text-align: center;'><h2>Content filtered</h2><p>Internal agent debugging information was filtered out for security.</p></div>";
        }
      } catch {
        if (cleanText.includes('"thought"') || cleanText.includes("```json")) {
          filteredContent = "<div style='padding: 20px; text-align: center;'><h2>Content filtered</h2><p>Internal agent debugging information was filtered out for security.</p></div>";
        }
      }
      command = {
        name: "display_canvas",
        params: {
          content: cleanText.includes("helloworld") ? "<div style='display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 48px; font-weight: bold;'>helloworld</div>" : filteredContent,
          // Use filteredContent directly instead of wrapping it
          contentType: "html"
        }
      };
    } else if (isCreationRequest && isTodoRequest) {
      thought = "L'utilisateur demande de cr\xE9er quelque chose. Je dois d'abord cr\xE9er une todo list pour organiser le travail.";
      command = {
        name: "manage_todo_list",
        params: {
          action: "create",
          title: "Projet de cr\xE9ation",
          todos: [
            {
              category: "planning",
              content: "Analyser la demande et planifier l'approche",
              id: "1",
              priority: "high",
              status: "pending"
            },
            {
              category: "development",
              content: "Commencer l'impl\xE9mentation",
              id: "2",
              priority: "high",
              status: "pending"
            }
          ]
        }
      };
    } else if (isTodoRequest) {
      thought = "L'utilisateur veut utiliser la todo list. Je vais afficher ou g\xE9rer la todo list.";
      command = {
        name: "manage_todo_list",
        params: {
          action: "display"
        }
      };
    } else if (isCreationRequest) {
      const recentCommands = this.commandHistory.slice(-3);
      const hasRecentTodoList = recentCommands.some(
        (cmd) => cmd.name === "manage_todo_list" && cmd.params && (cmd.params.action === "create" || cmd.params.action === "display")
      );
      if (hasRecentTodoList) {
        thought = "J'ai d\xE9j\xE0 cr\xE9\xE9 une todo list r\xE9cemment. Je vais utiliser une approche diff\xE9rente pour r\xE9pondre \xE0 la demande de cr\xE9ation.";
        command = {
          name: "agent_thought",
          params: {
            thought: "L'utilisateur demande de cr\xE9er quelque chose, mais j'ai d\xE9j\xE0 cr\xE9\xE9 une todo list r\xE9cemment. Je vais formuler une r\xE9ponse directe plut\xF4t que de cr\xE9er une autre liste."
          }
        };
      } else {
        thought = "L'utilisateur demande de cr\xE9er quelque chose. Je dois d'abord cr\xE9er une todo list pour organiser le travail.";
        command = {
          name: "manage_todo_list",
          params: {
            action: "create",
            title: "Projet de cr\xE9ation",
            todos: [
              {
                category: "planning",
                content: "Analyser la demande et planifier l'approche",
                id: "1",
                priority: "high",
                status: "pending"
              },
              {
                category: "development",
                content: "Commencer l'impl\xE9mentation",
                id: "2",
                priority: "high",
                status: "pending"
              }
            ]
          }
        };
      }
    } else {
      thought = "L'utilisateur a r\xE9pondu avec du texte brut. Je vais convertir cela en format JSON valide.";
      command = {
        name: "finish",
        params: {
          response: cleanText
        }
      };
    }
    const jsonObject = { command, thought };
    return JSON.stringify(jsonObject);
  }
  /**
   * Check if a response appears to be truncated or incomplete
   */
  isResponseTruncated(text) {
    const truncationIndicators = [
      "\\",
      // Escaped characters at end
      "{",
      // Unclosed object
      "[",
      // Unclosed array
      '"',
      // Unclosed string
      ":",
      // Incomplete key-value pair
      ","
      // Trailing comma
    ];
    const trimmed = text.trim();
    if (truncationIndicators.some((indicator) => trimmed.endsWith(indicator))) {
      return true;
    }
    const codeBlockPatterns = [
      "```javascript",
      "```html",
      "```json",
      "function",
      "const ",
      "let ",
      "var ",
      "if (",
      "for (",
      "while ("
    ];
    if (codeBlockPatterns.some((pattern) => trimmed.includes(pattern) && !trimmed.includes("```") && trimmed.length > 100)) {
      return true;
    }
    if (trimmed.length < 50 && (trimmed.includes("Tool Call:") || trimmed.includes("Tool Result:"))) {
      return true;
    }
    if (trimmed.length > 100 && (trimmed.endsWith(".") || trimmed.endsWith("}") || trimmed.endsWith("]")) && !trimmed.includes('"command"') && !trimmed.includes('"thought"') && !trimmed.includes('"answer"')) {
      return true;
    }
    return false;
  }
  detectLoop(thought, command) {
    const now = Date.now();
    this.behaviorHistory.push({
      command,
      thought,
      timestamp: now
    });
    if (this.behaviorHistory.length > this.maxBehaviorHistory) {
      this.behaviorHistory.shift();
    }
    if (this.behaviorHistory.length >= this.loopDetectionThreshold) {
      if (command) {
        const recentCommands = this.behaviorHistory.slice(
          -this.loopDetectionThreshold
        );
        const allSameCommand = recentCommands.every(
          (behavior) => behavior.command && behavior.command.name === command.name && JSON.stringify(behavior.command.params) === JSON.stringify(command.params)
        );
        if (allSameCommand) {
          this.log.warn(
            `Loop detected: Same command '${command.name}' repeated ${this.loopDetectionThreshold} times`
          );
          return true;
        }
      }
      if (thought && !command) {
        const recentThoughts = this.behaviorHistory.slice(
          -this.loopDetectionThreshold
        );
        const allSimilarThoughts = recentThoughts.every(
          (behavior, index, arr) => behavior.thought && this.calculateTextSimilarity(behavior.thought, thought) > 0.8
        );
        if (allSimilarThoughts) {
          this.log.warn(
            `Loop detected: Similar thoughts repeated ${this.loopDetectionThreshold} times`
          );
          return true;
        }
      }
    }
    return false;
  }
  async executeTool(command, log) {
    try {
      this.publishToChannel({
        data: { args: command.params, name: command.name },
        type: "tool.start"
      });
      let result;
      if (command.name === "ls -la") {
        result = await toolRegistry.execute(
          "simpleList",
          { detailed: true },
          {
            job: this.job,
            llm: getLlmProvider(this.activeLlmProvider),
            log,
            reportProgress: async (data) => {
              this.job.updateProgress(data);
            },
            session: this.session,
            streamContent: async (data) => {
              this.publishToChannel({
                content: data,
                toolName: command.name,
                type: "tool_stream"
              });
            },
            taskQueue: this.taskQueue
          }
        );
      } else {
        result = await toolRegistry.execute(command.name, command.params, {
          job: this.job,
          llm: getLlmProvider(this.activeLlmProvider),
          log,
          reportProgress: async (data) => {
            this.job.updateProgress(data);
          },
          session: this.session,
          streamContent: async (data) => {
            this.publishToChannel({
              content: data,
              toolName: command.name,
              type: "tool_stream"
            });
          },
          taskQueue: this.taskQueue
        });
      }
      this.publishToChannel({
        result,
        // Removed 'as unknown'
        toolName: command.name,
        type: "tool_result"
      });
      if (command.name === "agent_thought" && result && typeof result === "object") {
        const thoughtResult = result;
        if (thoughtResult.thought) {
          this.publishToChannel({
            content: thoughtResult.thought,
            type: "agent_thought"
          });
          log.info("Published agent thought to channel");
        }
      }
      return result;
    } catch (_error) {
      if (_error instanceof FinishToolSignal) {
        throw _error;
      }
      const errorDetails = _error instanceof Error ? {
        message: _error.message,
        name: _error.name,
        stack: _error.stack
      } : {
        message: String(_error),
        name: "UnknownError",
        stack: ""
      };
      log.error(
        {
          error: errorDetails,
          params: command.params,
          tool: command.name
        },
        `Error executing tool ${command.name}`
      );
      this.publishToChannel({
        result: { error: errorDetails },
        toolName: command.name,
        type: "tool_result"
      });
      return `Error executing tool ${command.name}: ${errorDetails.message}`;
    }
  }
  extractJsonFromMarkdown(text) {
    const match = text.match(/```(?:json)?\s*\n([\s\S]+?)\n```/);
    if (match && match[1]) {
      try {
        JSON.parse(match[1]);
        return match[1];
      } catch (error) {
        throw new Error(
          `Invalid JSON in markdown: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
    return text.trim();
  }
  parseLlmResponse(llmResponse, log) {
    const jsonText = this.extractJsonFromMarkdown(llmResponse);
    log.debug({ jsonText }, "Attempting to parse LLM response");
    try {
      const parsed = JSON.parse(jsonText);
      log.debug({ parsed }, "Successfully parsed LLM response");
      return llmResponseSchema.parse(parsed);
    } catch (error) {
      log.error(
        { error, llmResponse: jsonText },
        "Failed to parse LLM response"
      );
      try {
        const convertedResponse = this.convertPlainTextToValidJson(jsonText);
        const convertedParsed = JSON.parse(convertedResponse);
        log.debug(
          { convertedParsed },
          "Successfully converted plain text to valid JSON"
        );
        return llmResponseSchema.parse(convertedParsed);
      } catch (conversionError) {
        log.error(
          { conversionError, originalError: error },
          "Failed to convert plain text to valid JSON"
        );
      }
      throw new Error(`Failed to parse LLM response: ${jsonText}`);
    }
  }
  publishToChannel(data) {
    const channel = `job:${this.job.id}:events`;
    const message = JSON.stringify(data);
    this.log.info(
      { channel, dataType: data.type, message },
      "[PUBLISH] Publishing message to Redis channel"
    );
    getRedisClientInstance().publish(channel, message);
    this.log.info("[PUBLISH] Message published to Redis successfully");
    const progressData = { ...data };
    if (progressData.type === "tool.start") {
      delete progressData.data.args;
    }
    this.job.updateProgress(progressData);
  }
  async setupInterruptListener() {
    const channel = `job:${this.job.id}:interrupt`;
    this.subscriber = getRedisClientInstance().duplicate();
    const messageHandler = (messageChannel, message) => {
      if (messageChannel === channel) {
        this.log.warn(`Interrupting job ${this.job.id}: ${message}`);
        this.interrupted = true;
      }
    };
    this.subscriber.on("message", messageHandler);
    await this.subscriber.subscribe(
      channel,
      (err, count) => {
        if (err) {
          this.log.error(err, `Error subscribing to ${channel}`);
          return;
        }
        this.log.info(
          `Subscribed to ${channel}. Total subscriptions: ${count}`
        );
      }
    );
  }
};

// src/worker.ts
getLoggerInstance().debug("[WORKER-STARTUP] process.cwd():", process.cwd());
getLoggerInstance().debug(
  "[WORKER-STARTUP] process.env.PATH:",
  process.env.PATH
);
async function initializeWorker(redisConnection, pgClient) {
  getLoggerInstance().info(
    { path: process.env.PATH },
    "Worker process.env.PATH at startup:"
  );
  const tools = await getTools();
  getLoggerInstance().info(`${tools.length} tools detected at startup`);
  const _jobQueue = new Queue("tasks", { connection: redisConnection });
  const sessionManager = await SessionManager.create(pgClient);
  const worker = new Worker(
    "tasks",
    async (_job) => {
      if (_job.name === "process-message") {
        return processJob(_job, _jobQueue, sessionManager, redisConnection);
      }
      if (_job.name === "execute-shell-command-detached") {
        const { command, notificationChannel } = _job.data;
        const log = getLoggerInstance().child({
          jobId: _job.id,
          originalJobId: _job.data.jobId
        });
        log.info(`Executing detached shell command: ${command}`);
        return new Promise((resolve, reject) => {
          const env = {
            ...process.env,
            PATH: process.env.HOST_SYSTEM_PATH || process.env.PATH
          };
          getLoggerInstance().debug(
            `[WORKER-SPAWN-DEBUG] Spawning command: ${command}`
          );
          getLoggerInstance().debug(
            `[WORKER-SPAWN-DEBUG] With shell: /usr/bin/env bash`
          );
          getLoggerInstance().debug(
            `[WORKER-SPAWN-DEBUG] With cwd: ${config.WORKSPACE_PATH}`
          );
          getLoggerInstance().debug(
            `[WORKER-SPAWN-DEBUG] With env.PATH: ${env.PATH}`
          );
          const child = _spawn(command, {
            cwd: config.WORKSPACE_PATH,
            detached: false,
            env,
            // Utiliser l'environnement corrigé
            shell: "/bin/sh",
            // Utiliser sh directement
            stdio: "pipe"
          });
          const streamToFrontend = (type, content, toolName) => {
            const data = {
              data: { content, type },
              toolName,
              type: "tool_stream"
            };
            redisConnection.publish(notificationChannel, JSON.stringify(data));
          };
          child.stdout.on("data", (data) => {
            const chunk = data.toString();
            log.info(`[stdout] ${chunk}`);
            streamToFrontend("stdout", chunk, "executeShellCommand");
          });
          child.stderr.on("data", (data) => {
            const chunk = data.toString();
            log.error(`[stderr] ${chunk}`);
            streamToFrontend("stderr", chunk, "executeShellCommand");
          });
          child.on("error", (error) => {
            log.error(
              { err: error },
              `Failed to start detached shell command: ${command}`
            );
            redisConnection.publish(
              notificationChannel,
              JSON.stringify({
                message: `Failed to start command: ${error.message}`,
                type: "error"
              })
            );
            reject(error);
          });
          child.on("close", (code) => {
            const finalMessage = `--- DETACHED COMMAND FINISHED ---
Command: ${command}
Exit Code: ${code}`;
            log.info(finalMessage);
            streamToFrontend(
              "stdout",
              `
${finalMessage}`,
              "executeShellCommand"
            );
            resolve(`Detached command finished with code ${code}`);
          });
        });
      }
    },
    {
      autorun: true,
      concurrency: config.WORKER_CONCURRENCY,
      connection: redisConnection,
      maxStalledCount: config.WORKER_MAX_STALLED_COUNT,
      stalledInterval: config.WORKER_STALLED_INTERVAL_MS
    }
  );
  worker.on("completed", (_job) => {
    getLoggerInstance().info(`Job ${_job.id} termin\xE9 avec succ\xE8s.`);
  });
  worker.on("failed", (_job, err) => {
    getLoggerInstance().error({ err }, `Le job ${_job?.id} a \xE9chou\xE9`);
  });
  worker.on("error", (err) => {
    getLoggerInstance().error({ err }, "Worker error");
  });
  console.log("Worker initialis\xE9 et pr\xEAt \xE0 traiter les jobs.");
  getLoggerInstance().info("Worker initialis\xE9 et pr\xEAt \xE0 traiter les jobs.");
  return worker;
}
async function processJob(_job, _jobQueue, _sessionManager, redisConnection) {
  const log = getLoggerInstance().child({
    jobId: _job.id,
    sessionId: _job.data.sessionId
  });
  log.info(`Traitement du job ${_job.id}`);
  const channel = `job:${_job.id}:events`;
  await new Promise((resolve) => setTimeout(resolve, 100));
  log.info(`Job ${_job.id} starting after synchronization delay`);
  try {
    const tools = await getTools();
    const session = await _sessionManager.getSession(_job.data.sessionId);
    const activeLlmProvider = session.activeLlmProvider || config.LLM_PROVIDER;
    const { llmApiKey, llmModelName, llmProvider } = _job.data;
    log.info(`Agent starting with ${tools.length} tools available`);
    const agent = new Agent(
      _job,
      session,
      _jobQueue,
      tools,
      llmProvider || activeLlmProvider,
      _sessionManager,
      llmApiKey,
      llmModelName
    );
    log.info(`Agent execution starting...`);
    const finalResponse = await agent.run();
    log.info(`Agent execution completed successfully`);
    session.history.push({
      content: finalResponse,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: "agent_response"
    });
    if (session.history.length > config.HISTORY_MAX_LENGTH) {
      const summarizedHistory = await summarizeTool.execute(
        {
          text: session.history.map((m) => "content" in m ? m.content : "").join("\n")
        },
        {
          job: _job,
          llm: null,
          log,
          reportProgress: async () => {
          },
          session,
          streamContent: async (data) => {
            if (data.type === "tool_code_image") {
              redisConnection.publish(
                channel,
                JSON.stringify({
                  content: data.content,
                  type: "tool_code_image"
                })
              );
            } else {
              redisConnection.publish(
                channel,
                JSON.stringify({
                  content: data.content,
                  type: "tool_code"
                })
              );
            }
          },
          taskQueue: _jobQueue
        }
      );
      session.history = [
        {
          content: summarizedHistory,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: "agent_response"
        }
      ];
    }
    await _sessionManager.saveSession(session, _job, _jobQueue);
    return finalResponse;
  } catch (error) {
    const errDetails = getErrDetails(error);
    log.error({ err: errDetails }, "Erreur dans l'ex\xE9cution de l'agent");
    let errorMessage = errDetails.message;
    let eventType = "error";
    if (error instanceof AppError || error instanceof UserError) {
      if (errorMessage.includes("Quota exceeded")) {
        errorMessage = "Quota API d\xE9pass\xE9. Veuillez r\xE9essayer plus tard.";
        eventType = "quota_exceeded";
      } else if (errorMessage.includes("Gemini API request failed with status 500")) {
        errorMessage = "Une erreur interne est survenue avec l'API du LLM. Veuillez r\xE9essayer plus tard ou v\xE9rifier votre cl\xE9 API.";
      } else if (errorMessage.includes("is not found for API version v1")) {
        errorMessage = "Le mod\xE8le de LLM sp\xE9cifi\xE9 n'a pas \xE9t\xE9 trouv\xE9 ou n'est pas support\xE9. Veuillez v\xE9rifier votre LLM_MODEL_NAME dans le fichier .env.";
      }
    }
    redisConnection.publish(
      channel,
      JSON.stringify({ message: errorMessage, type: eventType })
    );
    throw error;
  } finally {
    redisConnection.publish(
      channel,
      JSON.stringify({ content: "Stream termin\xE9.", type: "close" })
    );
    log.info(`Traitement du job ${_job.id} termin\xE9`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
if (process.env.NODE_ENV !== "test") {
  await loadConfig();
  if (config.LLM_API_KEY && config.LLM_PROVIDER && config.LLM_MODEL_NAME) {
    await LlmKeyManager.addKey(
      config.LLM_PROVIDER,
      config.LLM_API_KEY,
      config.LLM_MODEL_NAME
    );
    getLoggerInstance().info(
      `LLM API key for ${config.LLM_PROVIDER} added to KeyManager.`
    );
  } else {
    getLoggerInstance().warn(
      `LLM_API_KEY, LLM_PROVIDER, or LLM_MODEL_NAME not fully configured in .env. LLM functionality may be limited.`
    );
  }
  getLoggerInstance().info(
    `[INIT LLM] LLM API key management is now handled dynamically.`
  );
  getLoggerInstance().info(
    `PostgreSQL Host for Worker: ${config.POSTGRES_HOST}`
  );
  const connectionString = `postgresql://${config.POSTGRES_USER}:${config.POSTGRES_PASSWORD}@${config.POSTGRES_HOST}:${config.POSTGRES_PORT}/${config.POSTGRES_DB}`;
  const redisConnection = getRedisClientInstance();
  const pgClient = new PgClient({
    connectionString
  });
  pgClient.on("error", (err) => {
    getLoggerInstance().error(
      { err },
      "PostgreSQL connection error, attempting to reconnect..."
    );
    setTimeout(() => {
      pgClient.connect().catch((connectErr) => {
        getLoggerInstance().error(
          { err: connectErr },
          "Failed to reconnect to PostgreSQL"
        );
      });
    }, 5e3);
  });
  pgClient.on("end", () => {
    getLoggerInstance().info(
      "PostgreSQL connection ended, attempting to reconnect..."
    );
    setTimeout(() => {
      pgClient.connect().catch((connectErr) => {
        getLoggerInstance().error(
          { err: connectErr },
          "Failed to reconnect to PostgreSQL"
        );
      });
    }, 2e3);
  });
  try {
    await pgClient.connect();
    getLoggerInstance().info("PostgreSQL connected successfully");
  } catch (err) {
    getLoggerInstance().error(
      { err },
      "Failed to connect to PostgreSQL initially"
    );
    process.exit(1);
  }
  initializeWorker(redisConnection, pgClient).catch((err) => {
    getLoggerInstance().error({ err }, "\xC9chec de l'initialisation du worker");
    process.exit(1);
  });
}

export {
  getMasterPrompt,
  Agent,
  initializeWorker,
  processJob
};
