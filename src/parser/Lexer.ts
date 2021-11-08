import { Settings } from '../settings'
import { Source } from './Source'
import {Span, Token, TokenKind, TokenVal} from './Token'

class Lexer {
    private index: number
    private source: string | null = null
    private tokens: Token[] = []

    private settings: Settings
    private sourceLines: string[] = []
    private linesPositions: number[] = []

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

    private isNl(): boolean {
        return /\n/.test(this.peek())
    }

    private addTokenSym(kind: TokenKind, len: number) {
        this.tokens.push(new Token(kind, '', new Span(this.index, len)))
    }

    private addToken(kind: TokenKind, val: TokenVal) {
        this.tokens.push(new Token(kind, val, new Span(this.index, val.length)))
    }

    // Shortcut for operators with `advance` offset
    private addTokenAdv(kind: TokenKind, offset = 1) {
        this.addTokenSym(kind, offset)
        this.advance(offset)
    }

    public lex(source: string): {tokens: Token[], source: Source} {
        this.tokens = []
        this.source = source
        this.sourceLines = []
        this.linesPositions = [0]
        this.index = 0

        let lastIndex = 0
        while (!this.eof()) {
            if (this.isNl()) {
                this.sourceLines.push(source.slice(lastIndex, this.index))
                this.advance()
                lastIndex = this.index
                this.linesPositions.push(this.index)
                continue
            }

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

        this.addTokenSym(TokenKind.Eof, 1)

        if (this.settings.debug) {
            console.log('=== TOKENS ===')
            for (const tok of this.tokens) {
                console.log(tok.toString())
            }

            console.log('source lines:\n', this.sourceLines)
        }

        return {tokens: this.tokens, source: new Source(source, this.sourceLines, this.linesPositions, source.length)}
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
            this.addToken(maybeKw!, ident)
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
            this.addTokenAdv(TokenKind.RParen)
            break
        }
        case '[': {
            this.addTokenAdv(TokenKind.LBracket)
            break
        }
        case ']': {
            this.addTokenAdv(TokenKind.RBracket)
            break
        }
        case '|': {
            this.addTokenAdv(TokenKind.VBar)
            break
        }
        case ',': {
            this.addTokenAdv(TokenKind.Comma)
            break
        }
        default: {
            this.error(`Unexpected token '${this.peek()}'`)
        }
        }
    }

    private error(msg: string) {
        let leftIndex = 0
        let rightIndex = 0

        for (let i = 0; i < this.source!.length; i++) {
            if (this.source![i] !== '\n') {
                continue
            }

            if (i < this.index) {
                leftIndex = i
            }

            if (i > this.index) {
                rightIndex = i
            }
        }

        const indent = ' '.repeat(this.index - leftIndex)

        throw new Error(`\n${this.source!.slice(leftIndex, rightIndex)}\n${indent}^ ${msg}`)
    }
}

export default Lexer
