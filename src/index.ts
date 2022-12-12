import { clsx, ClassValue } from "clsx";
import merge from "deepmerge";

type ClassNames = ClassValue | Array<ClassValue>;

type Variants = Record<
  string,
  Record<string, ClassNames | ((props?: Record<string, any>) => ClassNames)>
>;

type VariantOptions<T extends Variants> = {
  [K in keyof T]: Extract<keyof T, "true" | "false"> extends never
    ? keyof T[K]
    : keyof T[K] | boolean;
};

type AssemblerOptions<V extends Variants = {}> = {
  css: ClassNames;
  variants: V;
  defaultVariants: Partial<VariantOptions<V>>;
};

function compile(value: any, props: Record<string, any> = {}): string {
  return typeof value === "function" ? clsx(value(props)) : clsx(value);
}

function defaults(): AssemblerOptions {
  return {
    css: "",
    variants: {},
    defaultVariants: {},
  };
}

function pick<T extends object>(subject: T, keys: Array<keyof T>) {
  return keys.reduce((carry, key) => {
    return {
      ...carry,
      [key]: subject[key],
    };
  }, {});
}

function assembler<V extends Variants>(options: Partial<AssemblerOptions<V>>) {
  const { css, variants, defaultVariants } = merge(defaults(), options ?? {});

  return <T extends VariantOptions<V>>(props: Partial<T> = {}): string => {
    const mergedProps = merge(
      { ...defaultVariants },
      pick(props, Object.keys(variants))
    );
    const composers = [css];

    for (const variantName in mergedProps) {
      // @ts-ignore
      let variant: string | boolean | undefined = mergedProps[variantName];

      // Skip variants that were not provided or do not have defaults.
      if (variant === undefined) {
        continue;
      }

      // Handle boolean variants using string keys
      if (variant === true) variant = "true";
      if (variant === false) variant = "false";

      // Collect all applied variants
      // @ts-ignore
      if (variantName in variants && variant in variants[variantName]) {
        // @ts-ignore
        composers.push(variants[variantName][variant]);
      }
    }

    return composers
      .map((item) => compile(item, props))
      .join(" ")
      .replace(/\s+/, " ");
  };
}

export default assembler;
