import {Token, TokenKind} from './Token'
import {Expr} from './Node'

class Parser {
    index: number
    tokens: Token[] = []

    static readonly INFIX_OPS: TokenKind[] = [
        TokenKind.Plus,
        TokenKind.Minus,
        TokenKind.Mul,
        TokenKind.Div,
        TokenKind.Eq,
        TokenKind.LT,
        TokenKind.GT,
    ]

    static readonly PREFIX_OPS: TokenKind[] = [
        TokenKind.Minus,
        TokenKind.Head,
        TokenKind.Tail,
    ]

    static readonly PREC_TABLE: (TokenKind[] | 'prefix')[] = [
        [TokenKind.Eq, TokenKind.LT, TokenKind.GT],
        [TokenKind.Plus, TokenKind.Minus],
        [TokenKind.Mul, TokenKind.Div],
        'prefix',
    ]

    constructor() {
        this.index = 0
    }

    private peek(): Token {
        return this.tokens[this.index]
    }

    private advance(): Token {
        const cur = this.peek()
        this.index++
        return cur
    }

    private eof() {
        return this.peek().kind === TokenKind.Eof
    }

    private is(kind: TokenKind) {
        return this.peek().kind === kind
    }

    public parse(tokens: Token[]): Expr {
        this.tokens = tokens

        return this.parseExpr()
    }

    private parseExpr(): Expr {
        return this.precParse(0)
    }

    private precParse(precIndex: number = 0): Expr {
        const parser = Parser.PREC_TABLE[precIndex]
        if (parser === 'prefix') {
            return this.parsePrefix()
        }

        const lhs = this.precParse(precIndex + 1)

        if (Parser.INFIX_OPS.includes(this.peek().kind)) {
            const op = this.advance().kind
            const rhs = this.precParse(precIndex + 1)
            return {kind: 'Infix', lhs, op, rhs}
        }

        return lhs
    }

    private parsePrefix(): Expr {
        if (Parser.PREFIX_OPS.includes(this.peek().kind)) {
            const op = this.advance().kind
            const rhs = this.parseExpr()
            return {kind: 'Prefix', op, rhs}
        }

        return this.parsePostfix()
    }

    private parsePostfix(): Expr {
        const lhs = this.parseExpr()
        const arg = this.parseExpr()
        return {kind: 'App', lhs, arg}
    }

    private parsePrimary(): Expr {
        if (this.is(TokenKind.Ident)) {
            const tok = this.advance().val
            return {kind: 'Var', tok}
        }

        if (this.is(TokenKind.IntLit)) {
            const tok = this.advance().val
            return {kind: 'IntLit', tok}
        }

        if (this.is(TokenKind.True) || this.is(TokenKind.False)) {
            const True = this.advance().kind === TokenKind.True
            return {kind: 'BoolLit', True}
        }

        if (this.is(TokenKind.LBrace)) {
            // todo
        }

        if (this.is(TokenKind.LParen)) {
            // todo
        }

        throw new Error(`Unexpected token '${this.peek()}'`)
    }
}

export default Parser
