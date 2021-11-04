import { Settings } from '../settings'
import {Token, TokenKind, TokenVal} from './Token'

class Lexer {
    private index: number
    private source: string | null = null
    private tokens: Token[] = []

    private settings: Settings

    last: string = ''

    constructor(settings: Settings) {
        this.index = 0
        this.source = null
        this.settings = settings
    }

    private eof() {
        return this.index >= this.source!.length
    }

    private peek(): string {
        return this.source![this.index]
    }

    private advance(offset = 1): string {
        const cur = this.peek()
        this.index += offset
        return cur
    }

    private lookup(): string {
        return this.source![this.index + 1]
    }

    private isDigit(): boolean {
        return /[0-9]/.test(this.peek())
    }

    private isAlpha(): boolean {
        return /[a-zA-Z]/.test(this.peek())
    }

    private isSkippable(): boolean {
        return /\s/.test(this.peek())
    }

    private addToken(kind: TokenKind, val: TokenVal = '') {
        this.tokens.push(new Token(kind, val))
    }

    // Shortcut for operators with `advance` offset
    private addTokenAdv(kind: TokenKind, offset = 1) {
        this.addToken(kind)
        this.advance(offset)
    }

    public lex(source: string) {
        this.tokens = []
        this.source = source
        this.index = 0

        while (!this.eof()) {
            if (this.isDigit()) {
                this.lexNumber()
            } else if (this.isAlpha()) {
                this.lexIdent()
            } else if (this.isSkippable()) {
                this.advance()
            } else {
                this.lexMisc()
            }
        }

        this.addToken(TokenKind.Eof)

        if (this.settings.debug) {
            console.log('=== TOKENS ===')
            for (const tok of this.tokens) {
                console.log(tok.toString());
            }
        }

        return this.tokens
    }

    private lexNumber() {
        let num = ''

        while (this.isDigit()) {
            num += this.advance()
        }

        this.addToken(TokenKind.IntLit, num)
    }

    private lexIdent() {
        let ident = ''

        while (this.isAlpha()) {
            ident += this.advance()
        }

        const maybeKw = Token.KW_STR[ident]
        if (maybeKw) {
            this.addToken(maybeKw!)
        } else {
            this.addToken(TokenKind.Ident, ident)
        }
    }

    private lexMisc() {
        switch (this.peek()) {
        case '+': {
            this.addTokenAdv(TokenKind.Plus)
            break
        }
        case '-': {
            if (this.lookup() === '>') {
                this.addTokenAdv(TokenKind.Arrow, 2)
            } else {
                this.addTokenAdv(TokenKind.Minus)
            }
            break
        }
        case '*': {
            this.addTokenAdv(TokenKind.Mul)
            break
        }
        case '/': {
            this.addTokenAdv(TokenKind.Div)
            break
        }
        case '=': {
            this.addTokenAdv(TokenKind.Eq)
            break
        }
        case '<': {
            this.addTokenAdv(TokenKind.LT)
            break
        }
        case '>': {
            this.addTokenAdv(TokenKind.GT)
            break
        }
        case ':': {
            if (this.lookup() === ':') {
                this.addTokenAdv(TokenKind.ColCol, 2)
            } else {
                this.addTokenAdv(TokenKind.Col)
            }
            break
        }
        case '(': {
            this.addTokenAdv(TokenKind.LParen)
            break
        }
        case ')': {
            this.addTokenAdv(TokenKind.LParen)
            break
        }
        case '[': {
            this.addTokenAdv(TokenKind.LBrace)
            break
        }
        case ']': {
            this.addTokenAdv(TokenKind.RBrace)
            break
        }
        case '|': {
            this.addTokenAdv(TokenKind.VBar)
            break
        }
        default: {
            throw new Error(`Unexpected token \'${this.peek()}\' at ${this.index}`)
        }
        }
    }
}

export default Lexer
