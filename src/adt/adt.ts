export type MakeADT<Tag extends string, T extends Record<string, unknown>> = {
    [K in keyof T]: Record<Tag, K> & T[K];
}[keyof T]

export type ADT<T extends Record<string, unknown>> = MakeADT<'_tag', T>;
