export enum TokenKind {
    Eof,

    Ident,

    Number,
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

    constructor(kind: TokenKind, val: TokenVal) {
        this.kind = kind
        this.val = val
    }
}

