import {Span, Token, TokenKind} from './Token'
import {astToString, Expr} from './Node'
import { Settings } from '../settings'
import { Source } from './Source'

class Parser {
    index: number
    tokens: Token[] = []
    settings: Settings
    source?: Source

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
        [TokenKind.ColCol],
        [TokenKind.Plus, TokenKind.Minus],
        [TokenKind.Mul, TokenKind.Div],
        'prefix',
    ]

    static readonly PRIMARIES_FIRST: TokenKind[] = [
        TokenKind.Ident,
        TokenKind.IntLit,
        TokenKind.True,
        TokenKind.False,
        TokenKind.LBracket,
        TokenKind.LParen,
    ]

    constructor(settings: Settings) {
        this.index = 0
        this.settings = settings
    }

    private peek(): Token {
        return this.tokens[this.index]
    }

    private prev(): Token {
        return this.tokens[this.index - 1]
    }

    private advance(): Token {
        const cur = this.peek()
        this.index++
        return cur
    }

    private eof() {
        return this.index >= this.tokens.length
    }

    private is(kind: TokenKind): boolean {
        if (!this.peek()) {
            return false
        }
        return this.peek().kind === kind
    }

    private isPrimaryFirst() {
        return Parser.PRIMARIES_FIRST.includes(this.peek().kind)
    }

    private skip(kind: TokenKind): Token {
        if (!this.is(kind)) {
            this.error(`Expected '${Token.kindStr(kind)}', got '${this.peek()}'`)
        }

        return this.advance()
    }

    public parse(tokens: Token[], source: Source): Expr {
        this.tokens = tokens
        this.index = 0
        this.source = source

        const expr = this.parseExpr()

        this.skip(TokenKind.Eof)

        if (this.settings.debug) {
            console.log('=== AST ===')
            console.log(astToString(expr))
        }

        return expr
    }

    private parseExpr(): Expr {
        let lhs: Expr | null = null

        const begin = this.peek().span

        if (this.is(TokenKind.Func)) {
            lhs = this.parseFunc()
        } else if (this.is(TokenKind.Let)) {
            lhs = this.parseLet()
        } else if (this.is(TokenKind.If)) {
            lhs = this.parseIf()
        } else {
            lhs = this.precParse(0)
        }

        if (lhs && this.isPrimaryFirst()) {
            const arg = this.parsePrimary()

            if (arg) {
                lhs = {kind: 'App', lhs: lhs!, arg: arg!, span: this.closeSpan(begin)}
            }
        }

        return lhs!
    }

    private parseFunc(): Expr {
        const begin = this.peek().span

        this.skip(TokenKind.Func)

        const param = this.skip(TokenKind.Ident).val

        this.skip(TokenKind.Arrow)

        const body = this.parseExpr()

        return {kind: 'Func', param, body, span: this.closeSpan(begin)}
    }

    private parseLet(): Expr {
        const begin = this.peek().span

        this.skip(TokenKind.Let)

        if (this.is(TokenKind.Rec)) {
            this.skip(TokenKind.Rec)

            const func = this.skip(TokenKind.Ident).val
            const name = this.skip(TokenKind.Ident).val

            this.skip(TokenKind.Eq)

            const val = this.parseExpr()

            this.skip(TokenKind.In)

            const body = this.parseExpr()

            return {kind: 'LetRec', func, name, val, body, span: this.closeSpan(begin)}
        }

        const name = this.skip(TokenKind.Ident).val

        this.skip(TokenKind.Eq)

        const val = this.parseExpr()

        this.skip(TokenKind.In)

        const body = this.parseExpr()

        return {kind: 'Let', name, val, body, span: this.closeSpan(begin)}
    }

    private parseIf(): Expr {
        const begin = this.peek().span

        this.skip(TokenKind.If)

        const cond = this.parseExpr()

        this.skip(TokenKind.Then)

        const ifBranch = this.parseExpr()

        let elseBranch = null
        if (this.is(TokenKind.Else)) {
            this.skip(TokenKind.Else)
            elseBranch = this.parseExpr()
        }

        return {kind: 'If', cond, ifBranch, elseBranch, span: this.closeSpan(begin)}
    }

    private precParse(precIndex = 0): Expr {
        const begin = this.peek().span

        const parser = Parser.PREC_TABLE[precIndex]
        if (parser === 'prefix') {
            return this.parsePrefix()
        }

        if (precIndex >= Parser.PREC_TABLE.length) {
            return this.parsePrimary()!
        }

        let lhs = this.precParse(precIndex + 1)

        while (parser.includes(this.peek().kind)) {
            const op = this.advance()
            const rhs = this.precParse(precIndex + 1)
            lhs = {kind: 'Infix', lhs, op, rhs, span: this.closeSpan(begin)}
        }

        return lhs
    }

    private parsePrefix(): Expr {

        if (Parser.PREFIX_OPS.includes(this.peek().kind)) {
            const begin = this.peek().span

            const op = this.advance()
            const rhs = this.parsePrefix()
            return {kind: 'Prefix', op, rhs, span: this.closeSpan(begin)}
        }

        return this.parsePrimary()
    }

    private parseDelim(begin: TokenKind, end: TokenKind, allowTrailing: boolean, delim: TokenKind = TokenKind.Comma): {elements: Expr[], trailingComma: boolean} {
        this.skip(begin)

        const elements: Expr[] = []
        let first = true
        let trailingComma = false

        while (!this.eof()) {
            if (this.is(end)) {
                break
            }

            if (first) {
                first = false
            } else {
                this.skip(delim)
            }

            if (allowTrailing && this.is(end)) {
                trailingComma = true
                break
            }

            elements.push(this.parseExpr())
        }

        this.skip(end)

        return {elements, trailingComma}
    }

    private parsePrimary(): Expr {
        if (this.is(TokenKind.Ident)) {
            const tok = this.advance()
            return {kind: 'Var', tok, span: tok.span}
        }

        if (this.is(TokenKind.IntLit)) {
            const tok = this.advance()
            return {kind: 'IntLit', tok, span: tok.span}
        }

        if (this.is(TokenKind.True) || this.is(TokenKind.False)) {
            const span = this.peek().span
            const True = this.advance().kind === TokenKind.True
            return {kind: 'BoolLit', True, span}
        }

        const begin = this.peek().span

        if (this.is(TokenKind.LBracket)) {
            const {elements} = this.parseDelim(TokenKind.LBracket, TokenKind.RBracket, true)

            return {kind: 'List', elements, span: this.closeSpan(begin)}
        }

        if (this.is(TokenKind.LParen)) {
            const begin = this.peek().span
            const {elements, trailingComma} = this.parseDelim(TokenKind.LParen, TokenKind.RParen, true)

            if (elements.length === 0) {
                return {kind: 'Unit', span: this.closeSpan(begin)}
            } else if (trailingComma || elements.length > 1) {
                return {kind: 'Tuple', elements, span: this.closeSpan(begin)}
            }

            return {kind: 'Paren', expr: elements[0], span: this.closeSpan(begin)}
        }

        this.error(`Unexpected token ${this.peek()}`)
    }

    // private parseOptPrimary(): Expr | null {
    //     if (this.isPrimaryFirst()) {
    //         return this.parsePrimary()
    //     }
    //     return null
    // }

    private closeSpan(begin: Span): Span {
        return begin.to(this.prev().span)
    }

    private error(msg: string): never {
        throw new Error(`${this.source?.getPointerLine(msg, this.peek().span)}`)
    }
}

export default Parser
