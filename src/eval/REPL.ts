import repl, { REPLServer, REPLWriter } from 'repl'
import { Context } from 'vm'
import Lexer from '../parser/Lexer'
import Parser from '../parser/Parser'
import { TokenKind } from '../parser/Token'
import { Settings } from '../settings'
import { analyze, TypeEnv } from '../typeck/typeck'
import { Env, Interpreter, Value, valueDisplay, valueStr } from './Interpreter'

export class REPL {
    env: Env

    lexer: Lexer
    parser: Parser
    inter: Interpreter
    settings: Settings = {
        debug: false,
    }

    replServer?: REPLServer

    constructor() {
        if (process.argv.includes('-d')) {
            this.settings.debug = true
            console.log('[running in debug mode]')
        }

        this.env = {}
        this.lexer = new Lexer(this.settings)
        this.parser = new Parser(this.settings)
        this.inter = new Interpreter({})
    }

    public run() {
        // Custom writer gives output without quotes
        this.replServer = repl.start({
            prompt: '> ',
            eval: this.loop.bind(this),
            writer: obj => obj,
        })
    }

    private loop(input: string, ctx: Context, filename: string, cb: (err: Error | null, result: any) => void) {
        try {
            if (!input.length) {
                return cb(null, '')
            }
            const {tokens, source} = this.lexer.lex(input)

            if (tokens[0].kind === TokenKind.Eof) {
                cb(null, '')
                return
            }

            const expr = this.parser.parse(tokens, source)

            const ty = analyze(expr, new TypeEnv({}), new Set())

            const result = this.inter.interpretTopLevel(expr, source)

            if (this.settings.debug) {
                console.log('=== env ===')
                for (const [k, v] of Object.entries(this.inter.envStack[this.inter.envStack.length - 1])) {
                    console.log(k, v)
                }
            }

            cb(null, `${result ? valueDisplay(result) : ''}: ${ty.pruned}`)
        } catch (e) {
            this.replServer!.clearBufferedCommand()
            console.error('\u001b[31m' + (e as Error).message + '\u001b[0m')
            cb(null, undefined)
        }
    }
}
