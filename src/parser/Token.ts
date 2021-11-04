export enum TokenKind {
    Eof,

    Ident,

    IntLit,
    String,

    Plus,   // +
    Minus,  // -
    Mul,    // *
    Div,    // /
    Eq,     // =
    LT,     // <
    GT,     // >

    Col,    // :
    ColCol, // ::

    LParen, // (
    RParen, // )
    LBrace, // [
    RBrace, // ]

    Arrow,  // ->
    VBar,    // |

    // Keywords //
    True,
    False,
    Func,
    Let,
    Rec,
    In,
    If,
    Then,
    Else,
    Match,
    With,
    Head,
    Tail,
}

export type TokenVal = string

export class Token {
    kind: TokenKind
    val: TokenVal

    static readonly KW_STR: Record<string, TokenKind> = {
        'true': TokenKind.True,
        'false': TokenKind.False,
        'func': TokenKind.Func,
        'let': TokenKind.Let,
        'rec': TokenKind.Rec,
        'in': TokenKind.In,
        'if': TokenKind.If,
        'then': TokenKind.Then,
        'else': TokenKind.Else,
        'match': TokenKind.Match,
        'with': TokenKind.With,
        'head': TokenKind.Head,
        'tail': TokenKind.Tail,
    }

    static readonly KIND_STR: Record<TokenKind, string> = {
        [TokenKind.Eof]: '[EOF]',
    
        [TokenKind.Ident]: 'identifier',

        [TokenKind.IntLit]: 'integer',
        [TokenKind.String]: 'string',
    
        [TokenKind.Plus]: '+',   // +
        [TokenKind.Minus]: '-',  // -
        [TokenKind.Mul]: '*',    // *
        [TokenKind.Div]: '/',    // /
        [TokenKind.Eq]: '=',     // =
        [TokenKind.LT]: '<',     // <
        [TokenKind.GT]: '>',     // >
    
        [TokenKind.Col]: ':',    // :
        [TokenKind.ColCol]: '::', // ::
    
        [TokenKind.LParen]: '(', // (
        [TokenKind.RParen]: ')', // )
        [TokenKind.LBrace]: '[', // [
        [TokenKind.RBrace]: ']', // ]
    
        [TokenKind.Arrow]: '->',  // ->
        [TokenKind.VBar]: '|',    // |
    
        // Keywords //
        [TokenKind.True]: 'true',
        [TokenKind.False]: 'false',
        [TokenKind.Func]: 'func',
        [TokenKind.Let]: 'let',
        [TokenKind.Rec]: 'rec',
        [TokenKind.In]: 'in',
        [TokenKind.If]: 'if',
        [TokenKind.Then]: 'then',
        [TokenKind.Else]: 'else',
        [TokenKind.Match]: 'match',
        [TokenKind.With]: 'with',
        [TokenKind.Head]: 'head',
        [TokenKind.Tail]: 'tail',
    }

    constructor(kind: TokenKind, val: TokenVal) {
        this.kind = kind
        this.val = val
    }

    public static kindStr(kind: TokenKind): string {
        return Token.KIND_STR[kind]
    }

    public toString = (): string => {
        switch (this.kind) {
        case TokenKind.Ident:
        case TokenKind.IntLit:
        case TokenKind.String: {
            return this.val
        }
        }
        return Token.KIND_STR[this.kind]
    }
}

