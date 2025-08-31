import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getDevelopmentPreferencesTool
} from "../../../../../chunk-R7G5NPWH.js";
import {
  setDevelopmentPreferencesTool
} from "../../../../../chunk-OWOI4XID.js";
import {
  beforeEach,
  describe,
  globalExpect,
  it,
  vi
} from "../../../../../chunk-AQKYZ7X3.js";
import {
  init_esm_shims
} from "../../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/system/__tests__/developmentPreferences.test.ts
init_esm_shims();
describe("Development Preferences Tools", () => {
  const mockContext = {
    session: {
      metadata: {}
    },
    log: {
      info: vi.fn(),
      error: vi.fn()
    }
  };
  beforeEach(() => {
    mockContext.session.metadata = {};
    vi.clearAllMocks();
  });
  it("should set development preferences successfully", async () => {
    const params = {
      projectType: "game",
      preferredTechnologies: {
        framework: "PixiJS",
        language: "TypeScript"
      },
      instructions: "Use modern game development practices"
    };
    const result = await setDevelopmentPreferencesTool.execute(
      params,
      mockContext
    );
    globalExpect(result).toEqual({
      success: true,
      message: "Pr\xE9f\xE9rences de d\xE9veloppement enregistr\xE9es pour les projets de type game"
    });
    globalExpect(mockContext.session.metadata.developmentPreferences).toBeDefined();
    const storedPreferences = mockContext.session.metadata.developmentPreferences.game;
    globalExpect(storedPreferences.preferredTechnologies).toEqual({
      framework: "PixiJS",
      language: "TypeScript"
    });
    globalExpect(storedPreferences.instructions).toBe(
      "Use modern game development practices"
    );
    globalExpect(storedPreferences.updatedAt).toBeDefined();
  });
  it("should get development preferences successfully", async () => {
    const setParams = {
      projectType: "website",
      preferredTechnologies: {
        framework: "React",
        language: "TypeScript",
        styling: "Tailwind CSS"
      }
    };
    await setDevelopmentPreferencesTool.execute(setParams, mockContext);
    const getParams = {
      projectType: "website"
    };
    const result = await getDevelopmentPreferencesTool.execute(
      getParams,
      mockContext
    );
    globalExpect(result.success).toBe(true);
    globalExpect(result.preferences).toBeDefined();
    globalExpect(result.preferences.website).toBeDefined();
    globalExpect(result.preferences.website.preferredTechnologies).toEqual({
      framework: "React",
      language: "TypeScript",
      styling: "Tailwind CSS"
    });
    globalExpect(result.preferences.website.updatedAt).toBeDefined();
  });
  it("should handle getting preferences when none are set", async () => {
    const params = {
      projectType: "game"
    };
    const result = await getDevelopmentPreferencesTool.execute(
      params,
      mockContext
    );
    globalExpect(result).toEqual({
      success: true,
      message: "Aucune pr\xE9f\xE9rence de d\xE9veloppement d\xE9finie"
    });
  });
});
