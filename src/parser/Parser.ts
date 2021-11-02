import {Token, TokenKind} from './Token'

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

    constructor() {
        this.index = 0
    }

    private peek() {
        return this.tokens[this.index]
    }

    private eof() {
        return this.peek().kind === TokenKind.Eof
    }

    public parse(tokens: Token[]) {
        this.tokens = tokens

    }

    private parseExpr() {
        const lhs = this.parseExpr()

        if (Parser.INFIX_OPS.includes(this.peek().kind)) {
            const op = this.peek()
        }
    }
}

export default Parser
